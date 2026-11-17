from __future__ import annotations

import os
import json
import base64
import hashlib
import urllib.request
import urllib.parse

from datetime import datetime, timezone

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from sqlalchemy import text
from sqlalchemy.orm import Session

from database import (
    Base,
    engine,
    get_db,
)

from models import (
    Workspace,
    Company,
    Prospect,
    Campaign,
    Connector,
    Activity,
    Notification,
    Suppression,
    Setting,
)

from integrations import (
    PROVIDERS,
    provider_by_id,
    auth_url,
)


APP_URL = os.getenv(
    "APP_URL",
    "https://signalos-api-15va.onrender.com",
).rstrip("/")


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://signal-os-git.vercel.app",
).rstrip("/")


app = FastAPI(
    title="SignalOS API",
    version="6.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(
        bind=engine,
    )

    db = next(get_db())

    try:
        ensure_workspace(
            db,
            1,
        )
    finally:
        db.close()


def now():
    return datetime.now(timezone.utc)


def ser(obj):
    data = {}

    for column in obj.__table__.columns:
        value = getattr(
            obj,
            column.name,
        )

        if isinstance(
            value,
            datetime,
        ):
            value = value.isoformat()

        data[column.name] = value

    return data


def ensure_workspace(
    db,
    wid=1,
):
    workspace = db.get(
        Workspace,
        wid,
    )

    if not workspace:
        workspace = Workspace(
            id=wid,
            name="SignalOS Workspace",
            owner_name="Workspace Owner",
            settings={
                "onboarding_completed": False,
                "ai_mode": "copilot",
                "automation_enabled": False,
                "timezone": "Asia/Kolkata",
            },
        )

        db.add(workspace)
        db.commit()
        db.refresh(workspace)

    return workspace


def activity(
    db,
    wid,
    title,
    detail="",
    kind="system",
    severity="info",
):
    db.add(
        Activity(
            workspace_id=wid,
            title=title,
            detail=detail,
            kind=kind,
            severity=severity,
        )
    )

    db.commit()


def notification(
    db,
    wid,
    title,
    body="",
    typ="system",
):
    db.add(
        Notification(
            workspace_id=wid,
            title=title,
            body=body,
            type=typ,
        )
    )

    db.commit()


def protect(
    value: str,
) -> str:
    try:
        from cryptography.fernet import Fernet

        key = base64.urlsafe_b64encode(
            hashlib.sha256(
                os.getenv(
                    "SECRET_KEY",
                    "change-me",
                ).encode()
            ).digest()
        )

        return Fernet(key).encrypt(
            value.encode()
        ).decode()

    except Exception:
        return base64.urlsafe_b64encode(
            value.encode()
        ).decode()


@app.get("/")
def root():
    return {
        "name": "SignalOS API",
        "version": "6.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health(
    db: Session = Depends(get_db),
):
    try:
        db.execute(
            text("SELECT 1")
        )

        ensure_workspace(
            db,
            1,
        )

        return {
            "ok": True,
            "database": "connected",
            "api": "online",
            "version": "6.0.0",
        }

    except Exception as exc:
        return {
            "ok": False,
            "database": "error",
            "api": "online",
            "error": str(exc),
        }


@app.get("/workspaces/{wid}/dashboard")
def dashboard(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    return {
        "metrics": {
            "prospects": db.query(Prospect)
            .filter_by(workspace_id=wid)
            .count(),

            "companies": db.query(Company)
            .filter_by(workspace_id=wid)
            .count(),

            "campaigns": db.query(Campaign)
            .filter_by(workspace_id=wid)
            .count(),

            "interactions": db.query(Activity)
            .filter_by(workspace_id=wid)
            .count(),

            "connected_integrations": db.query(Connector)
            .filter_by(
                workspace_id=wid,
                status="CONNECTED",
                enabled=True,
            )
            .count(),
        },

        "workspace": ser(
            db.get(
                Workspace,
                wid,
            )
        ),
    }


@app.get("/workspaces/{wid}/onboarding")
def onboarding(
    wid: int,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    settings = workspace.settings or {}

    return {
        "completed": bool(
            settings.get(
                "onboarding_completed"
            )
        ),
        "ai_mode": settings.get(
            "ai_mode",
            "copilot",
        ),
        "automation_enabled": bool(
            settings.get(
                "automation_enabled",
                False,
            )
        ),
    }


@app.post("/workspaces/{wid}/onboarding/complete")
def onboarding_complete(
    wid: int,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    settings = dict(
        workspace.settings or {}
    )

    settings["onboarding_completed"] = True

    workspace.settings = settings

    db.commit()

    return {
        "ok": True,
    }


@app.patch("/workspaces/{wid}/automation")
def automation(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    settings = dict(
        workspace.settings or {}
    )

    settings["automation_enabled"] = bool(
        payload.get(
            "enabled",
            False,
        )
    )

    settings["ai_mode"] = payload.get(
        "mode",
        settings.get(
            "ai_mode",
            "copilot",
        ),
    )

    workspace.settings = settings

    db.commit()

    activity(
        db,
        wid,
        "Automation settings updated",
        f"Mode: {settings['ai_mode']}; "
        f"enabled: {settings['automation_enabled']}",
        "automation",
    )

    return {
        "ok": True,
        "settings": settings,
    }


@app.get("/workspaces/{wid}/settings")
def settings_get(
    wid: int,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    return {
        "workspace": ser(workspace),
        "settings": workspace.settings or {},
    }


@app.patch("/workspaces/{wid}/settings")
def settings_patch(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    settings = dict(
        workspace.settings or {}
    )

    settings.update(
        payload.get(
            "settings",
            payload,
        )
    )

    workspace.name = settings.pop(
        "workspace_name",
        workspace.name,
    )

    workspace.owner_name = settings.pop(
        "owner_name",
        workspace.owner_name,
    )

    workspace.owner_email = settings.pop(
        "owner_email",
        workspace.owner_email,
    )

    workspace.settings = settings

    db.commit()

    activity(
        db,
        wid,
        "Workspace settings updated",
    )

    return {
        "workspace": ser(workspace),
        "settings": settings,
    }


@app.get("/workspaces/{wid}/notifications")
def notifications(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    rows = (
        db.query(Notification)
        .filter_by(workspace_id=wid)
        .order_by(
            Notification.created_at.desc()
        )
        .limit(100)
        .all()
    )

    return {
        "notifications": [
            ser(row)
            for row in rows
        ]
    }


@app.post("/workspaces/{wid}/notifications/read")
def notifications_read(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Notification)
        .filter_by(workspace_id=wid)
        .all()
    )

    ids = set(
        payload.get(
            "ids",
            [],
        )
    )

    for row in rows:
        if not ids or row.id in ids:
            row.read = True

    db.commit()

    return {
        "ok": True,
    }


@app.get("/workspaces/{wid}/activity")
def activity_list(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    rows = (
        db.query(Activity)
        .filter_by(workspace_id=wid)
        .order_by(
            Activity.created_at.desc()
        )
        .limit(100)
        .all()
    )

    return {
        "activity": [
            ser(row)
            for row in rows
        ]
    }


@app.get("/workspaces/{wid}/prospects")
def prospects(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    rows = (
        db.query(Prospect)
        .filter_by(workspace_id=wid)
        .order_by(
            Prospect.created_at.desc()
        )
        .all()
    )

    return {
        "prospects": [
            ser(row)
            for row in rows
        ]
    }


@app.post("/workspaces/{wid}/prospects")
def prospect_create(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    prospect = Prospect(
        workspace_id=wid,
        name=payload.get(
            "name",
            "Unnamed",
        ),
        email=payload.get(
            "email",
            "",
        ),
        title=payload.get(
            "title",
            "",
        ),
        country=payload.get(
            "country",
            "",
        ),
        score=int(
            payload.get(
                "score",
                0,
            )
        ),
        status=payload.get(
            "status",
            "NEW",
        ),
        intent=payload.get(
            "intent",
            "",
        ),
        evidence=payload.get(
            "evidence",
            "",
        ),
        source=payload.get(
            "source",
            "manual",
        ),
    )

    db.add(prospect)
    db.commit()
    db.refresh(prospect)

    activity(
        db,
        wid,
        "Prospect added",
        prospect.name,
        "prospecting",
    )

    return ser(prospect)


@app.get("/workspaces/{wid}/companies")
def companies(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    return {
        "companies": [
            ser(row)
            for row in (
                db.query(Company)
                .filter_by(workspace_id=wid)
                .order_by(
                    Company.created_at.desc()
                )
                .all()
            )
        ]
    }


@app.post("/workspaces/{wid}/companies")
def company_create(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    company = Company(
        workspace_id=wid,
        name=payload.get(
            "name",
            "Unnamed",
        ),
        domain=payload.get(
            "domain",
            "",
        ),
        industry=payload.get(
            "industry",
            "",
        ),
        country=payload.get(
            "country",
            "",
        ),
        size=payload.get(
            "size",
            "",
        ),
        website=payload.get(
            "website",
            "",
        ),
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    activity(
        db,
        wid,
        "Company added",
        company.name,
        "company",
    )

    return ser(company)


@app.get("/workspaces/{wid}/campaigns")
def campaigns(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    return {
        "campaigns": [
            ser(row)
            for row in (
                db.query(Campaign)
                .filter_by(workspace_id=wid)
                .order_by(
                    Campaign.created_at.desc()
                )
                .all()
            )
        ]
    }


@app.post("/workspaces/{wid}/campaigns")
def campaign_create(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    name = (
        payload.get(
            "name",
            "",
        )
        .strip()
    )

    if not name:
        raise HTTPException(
            422,
            "Campaign name is required",
        )

    campaign = Campaign(
        workspace_id=wid,
        name=name,
        status="DRAFT",
        countries=payload.get(
            "countries",
            "",
        ),
        industries=payload.get(
            "industries",
            "",
        ),
        decision_makers=payload.get(
            "decision_makers",
            "",
        ),
        signals=payload.get(
            "signals",
            "",
        ),
        channel=payload.get(
            "channel",
            "Email",
        ),
        booking_link=payload.get(
            "booking_link",
            "",
        ),
        daily_limit=int(
            payload.get(
                "daily_limit",
                25,
            )
        ),
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    activity(
        db,
        wid,
        "Campaign created",
        name,
        "campaign",
    )

    notification(
        db,
        wid,
        "Campaign created",
        name,
        "campaign",
    )

    return ser(campaign)


@app.patch("/workspaces/{wid}/campaigns/{cid}")
def campaign_patch(
    wid: int,
    cid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter_by(
            id=cid,
            workspace_id=wid,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            404,
            "Campaign not found",
        )

    if "status" in payload:
        campaign.status = payload["status"]

    for key in (
        "name",
        "countries",
        "industries",
        "decision_makers",
        "signals",
        "channel",
        "booking_link",
        "daily_limit",
    ):
        if key in payload:
            setattr(
                campaign,
                key,
                payload[key],
            )

    db.commit()

    activity(
        db,
        wid,
        "Campaign updated",
        campaign.name,
        "campaign",
    )

    return ser(campaign)


@app.get("/workspaces/{wid}/connectors")
def connectors(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    rows = (
        db.query(Connector)
        .filter_by(workspace_id=wid)
        .all()
    )

    mapping = {
        row.provider: row
        for row in rows
    }

    output = []

    for provider in PROVIDERS:
        row = mapping.get(
            provider["id"]
        )

        item = dict(provider)

        item.update(
            {
                "status": (
                    row.status
                    if row
                    else "AVAILABLE"
                ),
                "enabled": (
                    bool(row.enabled)
                    if row
                    else False
                ),
                "configured": bool(row),
                "connected_at": (
                    row.connected_at.isoformat()
                    if row and row.connected_at
                    else None
                ),
                "last_error": (
                    (row.config or {}).get(
                        "last_error"
                    )
                    if row
                    else None
                ),
            }
        )

        output.append(item)

    return {
        "connectors": output
    }


@app.post(
    "/workspaces/{wid}/connectors/{pid}/connect"
)
def connector_connect(
    wid: int,
    pid: str,
    db: Session = Depends(get_db),
):
    provider = provider_by_id(pid)

    if not provider:
        raise HTTPException(
            404,
            "Provider not found",
        )

    row = (
        db.query(Connector)
        .filter_by(
            workspace_id=wid,
            provider=pid,
            name=provider["name"],
        )
        .first()
    )

    if not row:
        row = Connector(
            workspace_id=wid,
            provider=pid,
            name=provider["name"],
            auth_type=provider["auth"],
            status="AVAILABLE",
            enabled=True,
            config={},
        )

        db.add(row)

    if provider["auth"] != "oauth":
        db.commit()

        return {
            "ok": True,
            "mode": "api_key",
            "provider": provider,
        }

    try:
        url, state = auth_url(pid)

    except Exception as exc:
        raise HTTPException(
            400,
            str(exc),
        )

    config = dict(
        row.config or {}
    )

    config["oauth_state"] = state

    row.config = config
    row.status = "AUTHORIZING"
    row.enabled = True

    db.commit()

    return {
        "ok": True,
        "authorization_url": url,
    }


@app.post(
    "/workspaces/{wid}/connectors/{pid}/configure"
)
def connector_configure(
    wid: int,
    pid: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    provider = provider_by_id(pid)

    if not provider:
        raise HTTPException(
            404,
            "Provider not found",
        )

    value = (
        payload.get("api_key")
        or payload.get("key")
        or payload.get("token")
    )

    if not value:
        raise HTTPException(
            422,
            "Credential is required",
        )

    row = (
        db.query(Connector)
        .filter_by(
            workspace_id=wid,
            provider=pid,
            name=provider["name"],
        )
        .first()
    )

    if not row:
        row = Connector(
            workspace_id=wid,
            provider=pid,
            name=provider["name"],
            auth_type=provider["auth"],
            config={},
        )

        db.add(row)

    row.status = "CONNECTED"
    row.enabled = True

    config = dict(
        row.config or {}
    )

    config["credential_set"] = True
    config["secret"] = protect(
        value
    )

    config["secret_ref"] = hashlib.sha256(
        value.encode()
    ).hexdigest()[:16]

    row.config = config
    row.connected_at = now()

    db.commit()

    activity(
        db,
        wid,
        f'{provider["name"]} connected',
        "API credential saved securely on the server",
        "integration",
    )

    notification(
        db,
        wid,
        f'{provider["name"]} connected',
        "Integration is ready",
        "integration",
    )

    return {
        "ok": True
    }


@app.patch(
    "/workspaces/{wid}/connectors/{pid}/toggle"
)
def connector_toggle(
    wid: int,
    pid: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    row = (
        db.query(Connector)
        .filter_by(
            workspace_id=wid,
            provider=pid,
        )
        .first()
    )

    if not row:
        raise HTTPException(
            404,
            "Integration is not connected",
        )

    row.enabled = bool(
        payload.get(
            "enabled"
        )
    )

    db.commit()

    return {
        "ok": True,
        "enabled": row.enabled,
    }


@app.delete(
    "/workspaces/{wid}/connectors/{pid}"
)
def connector_delete(
    wid: int,
    pid: str,
    db: Session = Depends(get_db),
):
    row = (
        db.query(Connector)
        .filter_by(
            workspace_id=wid,
            provider=pid,
        )
        .first()
    )

    if row:
        db.delete(row)
        db.commit()

        activity(
            db,
            wid,
            "Integration disconnected",
            pid,
            "integration",
        )

    return {
        "ok": True
    }


@app.get("/oauth/callback/{pid}")
def oauth_callback(
    pid: str,
    request: Request,
    db: Session = Depends(get_db),
):
    code = request.query_params.get(
        "code"
    )

    state = request.query_params.get(
        "state"
    )

    error = request.query_params.get(
        "error"
    )

    rows = (
        db.query(Connector)
        .filter_by(
            provider=pid,
            status="AUTHORIZING",
        )
        .order_by(
            Connector.id.desc()
        )
        .all()
    )

    row = None

    for connector in rows:
        if (
            connector.config or {}
        ).get("oauth_state") == state:
            row = connector
            break

    if not row and rows:
        row = rows[0]

    if error or not code or not row:
        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth=error&provider={pid}"
        )

    try:
        token_url = None
        data = {}

        if pid in (
            "gmail",
            "google_calendar",
        ):
            token_url = (
                "https://oauth2.googleapis.com/token"
            )

            data = {
                "code": code,
                "client_id": os.environ[
                    "GOOGLE_CLIENT_ID"
                ],
                "client_secret": os.environ[
                    "GOOGLE_CLIENT_SECRET"
                ],
                "redirect_uri": (
                    os.getenv(
                        "GOOGLE_GMAIL_REDIRECT_URI"
                    )
                    if pid == "gmail"
                    else os.getenv(
                        "GOOGLE_CALENDAR_REDIRECT_URI"
                    )
                ),
                "grant_type": "authorization_code",
            }

        elif pid in (
            "microsoft365",
            "outlook_calendar",
        ):
            token_url = (
                "https://login.microsoftonline.com/"
                "common/oauth2/v2.0/token"
            )

            data = {
                "code": code,
                "client_id": os.environ[
                    "MICROSOFT_CLIENT_ID"
                ],
                "client_secret": os.environ[
                    "MICROSOFT_CLIENT_SECRET"
                ],
                "redirect_uri": (
                    os.getenv(
                        "MICROSOFT_OUTLOOK_REDIRECT_URI"
                    )
                    if pid == "microsoft365"
                    else os.getenv(
                        "MICROSOFT_CALENDAR_REDIRECT_URI"
                    )
                ),
                "grant_type": "authorization_code",
            }

        elif pid == "calendly":
            token_url = (
                "https://auth.calendly.com/oauth/token"
            )

            data = {
                "code": code,
                "client_id": os.environ[
                    "CALENDLY_CLIENT_ID"
                ],
                "client_secret": os.environ[
                    "CALENDLY_CLIENT_SECRET"
                ],
                "redirect_uri": os.environ[
                    "CALENDLY_REDIRECT_URI"
                ],
                "grant_type": "authorization_code",
            }

        elif pid == "hubspot":
            token_url = (
                "https://api.hubapi.com/oauth/v1/token"
            )

            data = {
                "code": code,
                "client_id": os.environ[
                    "HUBSPOT_CLIENT_ID"
                ],
                "client_secret": os.environ[
                    "HUBSPOT_CLIENT_SECRET"
                ],
                "redirect_uri": os.environ[
                    "HUBSPOT_REDIRECT_URI"
                ],
                "grant_type": "authorization_code",
            }

        else:
            raise ValueError(
                "OAuth callback is not enabled "
                "for this provider yet."
            )

        body = urllib.parse.urlencode(
            data
        ).encode()

        request_obj = urllib.request.Request(
            token_url,
            body=body,
            headers={
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },
            method="POST",
        )

        with urllib.request.urlopen(
            request_obj,
            timeout=20,
        ) as response:
            token = json.loads(
                response.read().decode()
            )

        config = dict(
            row.config or {}
        )

        config.pop(
            "oauth_state",
            None,
        )

        config["oauth_token"] = protect(
            json.dumps(token)
        )

        config["oauth_token_type"] = "encrypted"

        row.config = config
        row.status = "CONNECTED"
        row.enabled = True
        row.connected_at = now()

        db.commit()

        activity(
            db,
            row.workspace_id,
            f"{row.name} connected",
            "OAuth authorization completed",
            "integration",
        )

        notification(
            db,
            row.workspace_id,
            f"{row.name} connected",
            "OAuth authorization completed",
            "integration",
        )

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth=connected&provider={pid}"
        )

    except Exception as exc:
        config = dict(
            row.config or {}
        )

        config["last_error"] = str(exc)

        row.config = config
        row.status = "ERROR"

        db.commit()

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth=error&provider={pid}"
        )


@app.get("/workspaces/{wid}/conversations")
def conversations(
    wid: int,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Activity)
        .filter_by(
            workspace_id=wid,
            kind="conversation",
        )
        .order_by(
            Activity.created_at.desc()
        )
        .all()
    )

    return {
        "conversations": [
            ser(row)
            for row in rows
        ]
    }


@app.get("/workspaces/{wid}/meetings")
def meetings(
    wid: int,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Activity)
        .filter_by(
            workspace_id=wid,
            kind="meeting",
        )
        .order_by(
            Activity.created_at.desc()
        )
        .all()
    )

    return {
        "meetings": [
            ser(row)
            for row in rows
        ]
    }


@app.get("/workspaces/{wid}/signals")
def signals(
    wid: int,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    return {
        "signals": (
            workspace.settings or {}
        ).get(
            "intent_signals",
            [],
        )
    }


@app.put("/workspaces/{wid}/signals")
def signals_put(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    workspace = ensure_workspace(
        db,
        wid,
    )

    settings = dict(
        workspace.settings or {}
    )

    settings["intent_signals"] = payload.get(
        "signals",
        [],
    )

    workspace.settings = settings

    db.commit()

    activity(
        db,
        wid,
        "Intent signals updated",
    )

    return {
        "signals": settings[
            "intent_signals"
        ]
    }


@app.get("/workspaces/{wid}/suppression")
def suppression(
    wid: int,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Suppression)
        .filter_by(
            workspace_id=wid
        )
        .order_by(
            Suppression.created_at.desc()
        )
        .all()
    )

    return {
        "items": [
            ser(row)
            for row in rows
        ]
    }


@app.post("/workspaces/{wid}/suppression")
def suppression_add(
    wid: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    suppression = Suppression(
        workspace_id=wid,
        value=payload.get(
            "value",
            "",
        ),
        reason=payload.get(
            "reason",
            "",
        ),
    )

    db.add(suppression)
    db.commit()

    return ser(suppression)


@app.post("/workspaces/{wid}/seed-demo")
def seed_demo(
    wid: int,
    db: Session = Depends(get_db),
):
    ensure_workspace(
        db,
        wid,
    )

    if (
        db.query(Company)
        .filter_by(workspace_id=wid)
        .count()
        == 0
    ):
        company = Company(
            workspace_id=wid,
            name="Example SaaS",
            domain="example.com",
            industry="SaaS",
            country="India",
            size="11-50",
        )

        db.add(company)
        db.flush()

        db.add(
            Prospect(
                workspace_id=wid,
                company_id=company.id,
                name="Aarav Mehta",
                email="aarav@example.com",
                title="Founder",
                country="India",
                score=82,
                status="QUALIFIED",
                intent="Hiring + expansion",
                evidence="Example signal record",
            )
        )

    db.commit()

    activity(
        db,
        wid,
        "Demo workspace seeded",
        "Sample data was added intentionally.",
        "system",
    )

    return {
        "ok": True
    }
