from __future__ import annotations

import json
import os
import secrets
import hashlib
import base64
from urllib.parse import urlparse, parse_qs
from urllib.request import Request as URLRequest, urlopen
from urllib.error import HTTPError
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import inspect, func
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Workspace, ICP, IntentProfile, Company, Prospect, Campaign,
    Interaction, Suppression, Connector, Job, AuditEvent,
)
from integrations import PROVIDERS, provider_by_id, build_authorization_url

APP_URL = os.getenv("APP_URL", "https://signalos-api-15va.onrender.com").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://signal-os-git.vercel.app").rstrip("/")

app = FastAPI(title="SignalOS API", version="5.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now():
    return datetime.now(timezone.utc)


def columns(model):
    return {c.key for c in inspect(model).columns}


def set_existing(obj, data: dict[str, Any], aliases: dict[str, str] | None = None):
    cols = columns(type(obj))
    aliases = aliases or {}
    for key, value in data.items():
        key = aliases.get(key, key)
        if key in cols and key != "id" and value is not None:
            setattr(obj, key, value)
    return obj


def serialize(obj):
    if obj is None:
        return None
    result = {}
    for c in inspect(obj.__class__).columns:
        value = getattr(obj, c.key, None)
        if isinstance(value, datetime):
            value = value.isoformat()
        result[c.key] = value
    return result


def ensure_workspace(db: Session, workspace_id: int = 1):
    ws = db.get(Workspace, workspace_id)
    if not ws:
        data = {"id": workspace_id, "name": "SignalOS Workspace"}
        if "settings" in columns(Workspace):
            data["settings"] = {
                "onboarding_completed": False,
                "ai_mode": "copilot",
                "automation_enabled": False,
            }
        ws = Workspace(**{k: v for k, v in data.items() if k in columns(Workspace)})
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws


@app.on_event("startup")
def startup():
    db = next(get_db())
    try:
        ensure_workspace(db, 1)
    finally:
        db.close()


@app.get("/")
def root():
    return {"name": "SignalOS API", "version": "5.2.0", "status": "online", "docs": "/docs"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        ensure_workspace(db, 1)
        return {"ok": True, "database": "connected", "api": "online"}
    except Exception as e:
        return {"ok": False, "database": "error", "error": str(e)}


@app.get("/providers")
def providers():
    return {"providers": PROVIDERS}


@app.get("/workspaces/{workspace_id}/connectors")
def connectors(workspace_id: int, db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    rows = db.query(Connector).filter(Connector.workspace_id == workspace_id).all()
    by_provider = {r.provider: r for r in rows}
    output = []
    for p in PROVIDERS:
        row = by_provider.get(p["id"])
        item = dict(p)
        item["status"] = getattr(row, "status", "AVAILABLE") if row else "AVAILABLE"
        item["enabled"] = bool(getattr(row, "config", {}).get("enabled", True)) if row else False
        item["connected_at"] = getattr(row, "connected_at", None)
        item["configured"] = bool(row)
        output.append(item)
    return {"connectors": output}


@app.post("/workspaces/{workspace_id}/connectors/{provider_id}/connect")
def connect_provider(workspace_id: int, provider_id: str, db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    provider = provider_by_id(provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")

    row = db.query(Connector).filter(
        Connector.workspace_id == workspace_id,
        Connector.provider == provider_id,
    ).first()
    if not row:
        row = Connector(workspace_id=workspace_id, provider=provider_id, status="AUTHORIZING", config={})
        db.add(row)
    else:
        row.status = "AUTHORIZING"
    db.commit()

    try:
        auth_url = build_authorization_url(provider_id)
        parsed = parse_qs(urlparse(auth_url).query)
        state = parsed.get("state", [None])[0]
        cfg = dict(getattr(row, "config", {}) or {})
        if state:
            cfg["oauth_state"] = state
        cfg["enabled"] = True
        row.config = cfg
        db.commit()
    except Exception as e:
        row.status = "AVAILABLE"
        db.commit()
        raise HTTPException(400, str(e))

    return {"ok": True, "provider": provider_id, "authorization_url": auth_url}


@app.get("/oauth/callback/{provider_id}")
def oauth_callback(provider_id: str, request: Request, db: Session = Depends(get_db)):
    provider = provider_by_id(provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    state = request.query_params.get("state")

    row = None
    candidates = db.query(Connector).filter(Connector.provider == provider_id).all()
    for c in candidates:
        cfg = getattr(c, "config", {}) or {}
        if state and cfg.get("oauth_state") == state:
            row = c
            break
    if not row:
        row = db.query(Connector).filter(
            Connector.provider == provider_id,
            Connector.status == "AUTHORIZING",
        ).order_by(Connector.id.desc()).first()

    if error:
        if row:
            row.status = "AVAILABLE"
            db.commit()
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=cancelled&provider={provider_id}")

    if not code:
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=missing_code&provider={provider_id}")
    if not row:
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=not_found&provider={provider_id}")

    try:
        token = exchange_code(provider_id, code)
        cfg = dict(getattr(row, "config", {}) or {})
        cfg.pop("oauth_state", None)
        cfg["enabled"] = True
        cfg["token"] = encrypt_secret(json.dumps(token))
        cfg["token_type"] = "encrypted_oauth_token"
        row.config = cfg
        row.status = "CONNECTED"
        if "connected_at" in columns(Connector):
            row.connected_at = now()
        db.commit()
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=connected&provider={provider_id}")
    except Exception as exc:
        row.status = "ERROR"
        cfg = dict(getattr(row, "config", {}) or {})
        cfg["last_error"] = str(exc)
        row.config = cfg
        db.commit()
        return RedirectResponse(f"{FRONTEND_URL}/?oauth=error&provider={provider_id}&message={urlencode({'m':str(exc)})[2:]}")


def encrypt_secret(value: str) -> str:
    try:
        from cryptography.fernet import Fernet
        key = base64.urlsafe_b64encode(hashlib.sha256(os.getenv("SECRET_KEY", "signalos-dev-secret").encode()).digest())
        return Fernet(key).encrypt(value.encode()).decode()
    except Exception:
        # The application still works if cryptography is temporarily unavailable;
        # add cryptography to requirements for production encrypted storage.
        return base64.urlsafe_b64encode(value.encode()).decode()


def exchange_code(provider_id: str, code: str) -> dict:
    if provider_id == "gmail":
        return token_post("https://oauth2.googleapis.com/token", {
            "code": code,
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "redirect_uri": os.getenv("GOOGLE_GMAIL_REDIRECT_URI") or os.environ["GOOGLE_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    if provider_id == "google_calendar":
        return token_post("https://oauth2.googleapis.com/token", {
            "code": code,
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "redirect_uri": os.getenv("GOOGLE_CALENDAR_REDIRECT_URI") or os.environ["GOOGLE_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    if provider_id == "microsoft365":
        return token_post("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            "code": code,
            "client_id": os.environ["MICROSOFT_CLIENT_ID"],
            "client_secret": os.environ["MICROSOFT_CLIENT_SECRET"],
            "redirect_uri": os.getenv("MICROSOFT_OUTLOOK_REDIRECT_URI") or os.environ["MICROSOFT_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    if provider_id == "outlook_calendar":
        return token_post("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            "code": code,
            "client_id": os.environ["MICROSOFT_CLIENT_ID"],
            "client_secret": os.environ["MICROSOFT_CLIENT_SECRET"],
            "redirect_uri": os.getenv("MICROSOFT_CALENDAR_REDIRECT_URI") or os.environ["MICROSOFT_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    if provider_id == "hubspot":
        return token_post("https://api.hubapi.com/oauth/v1/token", {
            "code": code,
            "client_id": os.environ["HUBSPOT_CLIENT_ID"],
            "client_secret": os.environ["HUBSPOT_CLIENT_SECRET"],
            "redirect_uri": os.environ["HUBSPOT_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    if provider_id == "calendly":
        return token_post("https://auth.calendly.com/oauth/token", {
            "code": code,
            "client_id": os.environ["CALENDLY_CLIENT_ID"],
            "client_secret": os.environ["CALENDLY_CLIENT_SECRET"],
            "redirect_uri": os.environ["CALENDLY_REDIRECT_URI"],
            "grant_type": "authorization_code",
        })
    raise ValueError("This provider is not configured for OAuth token exchange yet.")


def token_post(url: str, payload: dict) -> dict:
    body = urlencode(payload).encode()
    req = URLRequest(url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    try:
        with urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode())
    except HTTPError as exc:
        detail = exc.read().decode(errors="ignore")
        raise ValueError(f"Provider token exchange failed: {detail[:500]}")


@app.post("/workspaces/{workspace_id}/connectors/{provider_id}/configure")
def configure_provider(workspace_id: int, provider_id: str, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    if not provider_by_id(provider_id):
        raise HTTPException(404, "Provider not found")
    row = db.query(Connector).filter(
        Connector.workspace_id == workspace_id,
        Connector.provider == provider_id,
    ).first()
    if not row:
        row = Connector(workspace_id=workspace_id, provider=provider_id, status="CONNECTED", config={})
        db.add(row)
    cfg = dict(getattr(row, "config", {}) or {})
    cfg.update(payload or {})
    cfg["enabled"] = True
    row.config = cfg
    row.status = "CONNECTED"
    if "connected_at" in columns(Connector):
        row.connected_at = now()
    db.commit()
    db.refresh(row)
    return serialize(row)


@app.patch("/workspaces/{workspace_id}/connectors/{provider_id}/toggle")
def toggle_provider(workspace_id: int, provider_id: str, payload: dict[str, Any], db: Session = Depends(get_db)):
    row = db.query(Connector).filter(
        Connector.workspace_id == workspace_id,
        Connector.provider == provider_id,
    ).first()
    if not row:
        raise HTTPException(404, "Integration is not connected yet")
    cfg = dict(getattr(row, "config", {}) or {})
    cfg["enabled"] = bool(payload.get("enabled", True))
    row.config = cfg
    db.commit()
    return {"ok": True, "enabled": cfg["enabled"], "provider": provider_id}


@app.delete("/workspaces/{workspace_id}/connectors/{provider_id}")
def disconnect_provider(workspace_id: int, provider_id: str, db: Session = Depends(get_db)):
    row = db.query(Connector).filter(
        Connector.workspace_id == workspace_id,
        Connector.provider == provider_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


@app.get("/workspaces/{workspace_id}/dashboard")
def dashboard(workspace_id: int, db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    prospects = db.query(Prospect).filter(Prospect.workspace_id == workspace_id).count()
    companies = db.query(Company).filter(Company.workspace_id == workspace_id).count()
    campaigns = db.query(Campaign).filter(Campaign.workspace_id == workspace_id).count()
    interactions = db.query(Interaction).filter(Interaction.workspace_id == workspace_id).count()
    connected = db.query(Connector).filter(Connector.workspace_id == workspace_id, Connector.status == "CONNECTED").count()
    return {
        "workspace_id": workspace_id,
        "metrics": {
            "prospects": prospects,
            "companies": companies,
            "campaigns": campaigns,
            "interactions": interactions,
            "connected_integrations": connected,
        },
        "connected_integrations": connected,
    }


@app.get("/workspaces/{workspace_id}/onboarding")
def onboarding(workspace_id: int, db: Session = Depends(get_db)):
    ws = ensure_workspace(db, workspace_id)
    settings = dict(getattr(ws, "settings", {}) or {})
    return {
        "completed": bool(settings.get("onboarding_completed", False)),
        "ai_mode": settings.get("ai_mode", "copilot"),
        "automation_enabled": bool(settings.get("automation_enabled", False)),
    }


@app.post("/workspaces/{workspace_id}/onboarding/complete")
def complete_onboarding(workspace_id: int, payload: dict[str, Any] | None = None, db: Session = Depends(get_db)):
    ws = ensure_workspace(db, workspace_id)
    settings = dict(getattr(ws, "settings", {}) or {})
    settings["onboarding_completed"] = True
    if payload:
        settings.update({k: v for k, v in payload.items() if k in {"ai_mode", "automation_enabled"}})
    if "settings" in columns(Workspace):
        ws.settings = settings
    db.commit()
    return {"ok": True, "settings": settings}


@app.patch("/workspaces/{workspace_id}/automation")
def automation(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ws = ensure_workspace(db, workspace_id)
    settings = dict(getattr(ws, "settings", {}) or {})
    if "enabled" in payload:
        settings["automation_enabled"] = bool(payload["enabled"])
    if "mode" in payload:
        settings["ai_mode"] = str(payload["mode"])
    if "settings" in columns(Workspace):
        ws.settings = settings
    db.commit()
    return {"ok": True, "ai_mode": settings.get("ai_mode", "copilot"), "enabled": settings.get("automation_enabled", False)}


@app.get("/workspaces/{workspace_id}/campaigns")
def list_campaigns(workspace_id: int, db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    rows = db.query(Campaign).filter(Campaign.workspace_id == workspace_id).order_by(Campaign.id.desc()).all()
    return {"campaigns": [serialize(x) for x in rows]}


@app.post("/workspaces/{workspace_id}/campaigns")
def create_campaign(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    name = (payload.get("name") or "Untitled campaign").strip()
    if not name:
        raise HTTPException(400, "Campaign name is required")
    data = dict(payload)
    data["workspace_id"] = workspace_id
    data.setdefault("status", "DRAFT")
    # Keep the complete wizard payload in config when the model has a config column.
    obj = Campaign(**{k: v for k, v in data.items() if k in columns(Campaign)})
    if "config" in columns(Campaign):
        obj.config = payload
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return serialize(obj)


@app.patch("/workspaces/{workspace_id}/campaigns/{campaign_id}")
def update_campaign(workspace_id: int, campaign_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    obj = db.query(Campaign).filter(Campaign.workspace_id == workspace_id, Campaign.id == campaign_id).first()
    if not obj:
        raise HTTPException(404, "Campaign not found")
    set_existing(obj, payload)
    if "config" in columns(Campaign):
        cfg = dict(getattr(obj, "config", {}) or {})
        cfg.update(payload)
        obj.config = cfg
    db.commit()
    db.refresh(obj)
    return serialize(obj)


@app.get("/workspaces/{workspace_id}/prospects")
def list_prospects(workspace_id: int, db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    rows = db.query(Prospect).filter(Prospect.workspace_id == workspace_id).order_by(Prospect.id.desc()).limit(200).all()
    return {"prospects": [serialize(x) for x in rows]}


@app.post("/workspaces/{workspace_id}/prospects")
def create_prospect(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    data = dict(payload)
    data["workspace_id"] = workspace_id
    obj = Prospect(**{k: v for k, v in data.items() if k in columns(Prospect)})
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return serialize(obj)


@app.get("/workspaces/{workspace_id}/companies")
def list_companies(workspace_id: int, db: Session = Depends(get_db)):
    rows = db.query(Company).filter(Company.workspace_id == workspace_id).order_by(Company.id.desc()).limit(200).all()
    return {"companies": [serialize(x) for x in rows]}


@app.post("/workspaces/{workspace_id}/icps")
def create_icp(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    data = dict(payload); data["workspace_id"] = workspace_id
    obj = ICP(**{k: v for k, v in data.items() if k in columns(ICP)})
    db.add(obj); db.commit(); db.refresh(obj)
    return serialize(obj)


@app.post("/workspaces/{workspace_id}/intent-profiles")
def create_intent(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    data = dict(payload); data["workspace_id"] = workspace_id
    obj = IntentProfile(**{k: v for k, v in data.items() if k in columns(IntentProfile)})
    db.add(obj); db.commit(); db.refresh(obj)
    return serialize(obj)


@app.post("/score")
def score(payload: dict[str, Any]):
    signals = payload.get("signals") or []
    fit = float(payload.get("fit", 0.5))
    intent = min(1.0, len(signals) / 5)
    score_value = round((fit * 0.45 + intent * 0.55) * 100)
    return {"score": score_value, "fit": round(fit * 100), "intent": round(intent * 100)}


@app.post("/workspaces/{workspace_id}/suppression")
def suppress(workspace_id: int, payload: dict[str, Any], db: Session = Depends(get_db)):
    ensure_workspace(db, workspace_id)
    data = dict(payload); data["workspace_id"] = workspace_id
    obj = Suppression(**{k: v for k, v in data.items() if k in columns(Suppression)})
    db.add(obj); db.commit(); db.refresh(obj)
    return serialize(obj)


@app.get("/workspaces/{workspace_id}/jobs")
def jobs(workspace_id: int, db: Session = Depends(get_db)):
    rows = db.query(Job).filter(Job.workspace_id == workspace_id).order_by(Job.id.desc()).limit(100).all()
    return {"jobs": [serialize(x) for x in rows]}


@app.post("/webhooks/email")
def email_webhook(payload: dict[str, Any], db: Session = Depends(get_db)):
    return {"ok": True, "received": payload.get("type") or payload.get("event") or "email_event"}


@app.post("/webhooks/calendly")
def calendly_webhook(payload: dict[str, Any], db: Session = Depends(get_db)):
    return {"ok": True, "received": payload.get("event") or "calendly_event"}
