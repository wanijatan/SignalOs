import os
import secrets
import urllib.parse
import base64

import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from .db import Base, engine, get_db
from .models import (
    Workspace,
    ICP,
    IntentProfile,
    Company,
    Prospect,
    Evidence,
    Campaign,
    Interaction,
    Suppression,
    Connector,
    Job,
)
from .schemas import (
    WorkspaceCreate,
    ICPCreate,
    IntentProfileCreate,
    ScoreRequest,
    SuppressionRequest,
    WebhookEvent,
)
from .scoring import score_breakdown
from .compliance import detects_opt_out
from .integrations import (
    CATALOG,
    all_providers,
    provider,
    pkce_pair,
    authorization_url,
    encrypt,
    decrypt,
    oauth_settings,
    OAUTH,
    now,
)


# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# APPLICATION
# ---------------------------------------------------------

app = FastAPI(
    title="SignalOS AI Prospecting & Outbound OS",
    version="5.0.0",
    description="Private AI Prospecting and Outbound Operating System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")

DEFAULT_WORKSPACE_ID = 1


# ---------------------------------------------------------
# STARTUP
# ---------------------------------------------------------

@app.on_event("startup")
def ensure_default_workspace():
    db = next(get_db())

    try:
        workspace = db.get(Workspace, DEFAULT_WORKSPACE_ID)

        if not workspace:
            workspace = Workspace(
                id=DEFAULT_WORKSPACE_ID,
                name="SignalOS Workspace",
                settings={
                    "onboarding_completed": False,
                    "ai_mode": "copilot",
                    "automation_enabled": False,
                },
            )

            db.add(workspace)
            db.commit()

    finally:
        db.close()


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "5.0.0",
        "service": "SignalOS API",
    }


# ---------------------------------------------------------
# WORKSPACES
# ---------------------------------------------------------

@app.post("/workspaces")
def create_workspace(
    payload: WorkspaceCreate,
    db: Session = Depends(get_db),
):
    obj = Workspace(**payload.model_dump())

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.name,
    }


@app.get("/workspaces/{workspace_id}")
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    return {
        "id": workspace.id,
        "name": workspace.name,
        "settings": workspace.settings or {},
    }


@app.patch("/workspaces/{workspace_id}")
def update_workspace(
    workspace_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    settings = dict(workspace.settings or {})

    if "name" in payload:
        workspace.name = str(payload["name"]).strip() or workspace.name

    if isinstance(payload.get("settings"), dict):
        settings.update(payload["settings"])

    workspace.settings = settings

    db.commit()
    db.refresh(workspace)

    return {
        "id": workspace.id,
        "name": workspace.name,
        "settings": workspace.settings,
    }


# ---------------------------------------------------------
# ONBOARDING / AI MODE / AUTOMATION
# ---------------------------------------------------------

@app.get("/workspaces/{workspace_id}/onboarding")
def get_onboarding(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    settings = workspace.settings or {}

    return {
        "completed": bool(settings.get("onboarding_completed", False)),
        "ai_mode": settings.get("ai_mode", "copilot"),
        "automation_enabled": bool(
            settings.get("automation_enabled", False)
        ),
    }


@app.post("/workspaces/{workspace_id}/onboarding/complete")
def complete_onboarding(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    settings = dict(workspace.settings or {})
    settings["onboarding_completed"] = True

    workspace.settings = settings

    db.commit()

    return {
        "status": "completed",
    }


@app.patch("/workspaces/{workspace_id}/automation")
def update_automation(
    workspace_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    settings = dict(workspace.settings or {})

    if "enabled" in payload:
        settings["automation_enabled"] = bool(
            payload["enabled"]
        )

    if "ai_mode" in payload:
        mode = str(payload["ai_mode"]).lower()

        if mode not in {
            "manual",
            "copilot",
            "autopilot",
        }:
            raise HTTPException(
                400,
                "AI mode must be manual, copilot, or autopilot",
            )

        settings["ai_mode"] = mode

    workspace.settings = settings

    db.commit()

    return {
        "ai_mode": settings.get("ai_mode", "copilot"),
        "automation_enabled": settings.get(
            "automation_enabled",
            False,
        ),
    }


# ---------------------------------------------------------
# ICP
# ---------------------------------------------------------

@app.post("/workspaces/{workspace_id}/icps")
def create_icp(
    workspace_id: int,
    payload: ICPCreate,
    db: Session = Depends(get_db),
):
    if payload.workspace_id != workspace_id:
        raise HTTPException(
            400,
            "workspace mismatch",
        )

    obj = ICP(**payload.model_dump())

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.name,
    }


# ---------------------------------------------------------
# INTENT
# ---------------------------------------------------------

@app.post("/workspaces/{workspace_id}/intent-profiles")
def create_intent(
    workspace_id: int,
    payload: IntentProfileCreate,
    db: Session = Depends(get_db),
):
    if payload.workspace_id != workspace_id:
        raise HTTPException(
            400,
            "workspace mismatch",
        )

    obj = IntentProfile(
        **payload.model_dump()
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.name,
    }


# ---------------------------------------------------------
# SCORING
# ---------------------------------------------------------

@app.post("/score")
def score(payload: ScoreRequest):
    return score_breakdown(
        **payload.model_dump()
    )


# ---------------------------------------------------------
# SUPPRESSION / DNC
# ---------------------------------------------------------

@app.post("/workspaces/{workspace_id}/suppressions")
def suppress(
    workspace_id: int,
    payload: SuppressionRequest,
    db: Session = Depends(get_db),
):
    if payload.workspace_id not in (
        None,
        workspace_id,
    ):
        raise HTTPException(
            400,
            "workspace mismatch",
        )

    obj = Suppression(
        **payload.model_dump(
            exclude_none=False
        )
    )

    obj.workspace_id = workspace_id

    db.add(obj)
    db.commit()

    return {
        "status": "suppressed",
        "id": obj.id,
    }


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@app.get("/workspaces/{workspace_id}/dashboard")
def dashboard(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    def count(model):
        return (
            db.scalar(
                select(func.count())
                .select_from(model)
                .where(
                    model.workspace_id
                    == workspace_id
                )
            )
            or 0
        )

    return {
        "prospects": count(Prospect),
        "evidence": count(Evidence),
        "campaigns": count(Campaign),
        "interactions": count(Interaction),
        "jobs": count(Job),
        "suppressions": count(Suppression),
        "connected_integrations": db.scalar(
            select(func.count())
            .select_from(Connector)
            .where(
                Connector.workspace_id
                == workspace_id,
                Connector.status
                == "CONNECTED",
            )
        ) or 0,
    }


# ---------------------------------------------------------
# EMAIL WEBHOOK
# ---------------------------------------------------------

@app.post("/webhooks/email")
def email_webhook(
    event: WebhookEvent,
    db: Session = Depends(get_db),
):
    text = str(
        event.payload.get(
            "text",
            "",
        )
        or ""
    )

    if detects_opt_out(
        text
    ) and event.email:

        db.add(
            Suppression(
                email=event.email.lower(),
                reason="OPT_OUT",
            )
        )

        db.commit()

        return {
            "action": "SUPPRESS_AND_STOP"
        }

    return {
        "action": "PROCESS_REPLY",
        "event_type": event.event_type,
    }


# ---------------------------------------------------------
# CALENDAR WEBHOOK
# ---------------------------------------------------------

@app.post("/webhooks/calendar")
def calendar_webhook(
    event: WebhookEvent,
):
    if event.event_type in {
        "scheduled",
        "meeting.scheduled",
    }:
        return {
            "action": "MEETING_BOOKED",
            "stop_outreach": True,
        }

    if event.event_type in {
        "canceled",
        "meeting.canceled",
    }:
        return {
            "action": "MEETING_CANCELED",
            "restore_followup": True,
        }

    return {
        "action": "IGNORED"
    }


# =========================================================
# INTEGRATIONS
# =========================================================

@app.get("/providers")
def providers():
    return {
        "categories": CATALOG,
        "providers": all_providers(),
    }


@app.get(
    "/workspaces/{workspace_id}/connectors"
)
def list_connectors(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Connector).where(
            Connector.workspace_id
            == workspace_id
        )
    ).all()

    connected = {
        row.provider: row
        for row in rows
    }

    output = []

    # Return the COMPLETE marketplace.
    # The frontend can therefore show every
    # available integration even when it is
    # not connected yet.

    for p in all_providers():

        row = connected.get(
            p["id"]
        )

        config = (
            row.config
            if row
            else {}
        ) or {}

        output.append(
            {
                "provider": p["id"],
                "name": p["name"],
                "description": p.get(
                    "description"
                ),
                "category": p.get(
                    "category"
                ),
                "mode": p.get(
                    "mode"
                ),
                "logo": p.get(
                    "logo"
                ),
                "docs": p.get(
                    "docs"
                ),
                "recommended": p.get(
                    "recommended",
                    False,
                ),
                "status": (
                    row.status
                    if row
                    else "AVAILABLE"
                ),
                "enabled": (
                    bool(
                        config.get(
                            "enabled",
                            True,
                        )
                    )
                    if row
                    else False
                ),
                "connected_at": (
                    row.connected_at
                    if row
                    else None
                ),
                "scopes": (
                    row.scopes
                    if row
                    else p.get(
                        "scopes",
                        [],
                    )
                ),
            }
        )

    return output


@app.post(
    "/workspaces/{workspace_id}/connectors/{provider_id}/connect"
)
def connect_provider(
    workspace_id: int,
    provider_id: str,
    db: Session = Depends(get_db),
):
    p = provider(provider_id)

    if not p:
        raise HTTPException(
            404,
            "Unknown provider",
        )

    row = db.scalar(
        select(Connector).where(
            Connector.workspace_id
            == workspace_id,
            Connector.provider
            == provider_id,
        )
    )

    if not row:
        row = Connector(
            workspace_id=workspace_id,
            kind=p["category"],
            provider=provider_id,
            status="DISCONNECTED",
            config={
                "enabled": True
            },
            scopes=[],
        )

        db.add(row)
        db.commit()
        db.refresh(row)

    if p["mode"] == "oauth":

        try:
            verifier, challenge = pkce_pair()

            state = secrets.token_urlsafe(
                32
            )

            url = authorization_url(
                provider_id,
                state,
                (
                    verifier,
                    challenge,
                ),
            )

        except RuntimeError as e:

            return {
                "status": "CONFIG_REQUIRED",
                "provider": provider_id,
                "message": str(e),
                "mode": "oauth",
            }

        row.status = "AUTHORIZING"

        row.config = {
            **(row.config or {}),
            "oauth_state": encrypt(
                state
            ),
            "pkce_verifier": encrypt(
                verifier
            ),
            "enabled": True,
        }

        db.commit()

        return {
            "status": "REDIRECT",
            "url": url,
            "provider": provider_id,
        }

    row.status = "CONFIG_REQUIRED"

    db.commit()

    return {
        "status": "CONFIG_REQUIRED",
        "provider": provider_id,
        "mode": p["mode"],
        "fields": p.get(
            "fields",
            [],
        ),
    }


# ---------------------------------------------------------
# OAUTH CALLBACK
# ---------------------------------------------------------

@app.get(
    "/oauth/callback/{provider_id}"
)
async def oauth_callback(
    provider_id: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    fail = (
        f"{FRONTEND_URL}/?oauth_error="
    )

    if error:
        return RedirectResponse(
            fail
            + urllib.parse.quote(
                error
            )
        )

    if not code or not state:
        raise HTTPException(
            400,
            "Missing OAuth code/state",
        )

    rows = db.scalars(
        select(Connector).where(
            Connector.provider
            == provider_id,
            Connector.status
            == "AUTHORIZING",
        )
    ).all()

    row = None

    for r in rows:
        try:
            stored_state = decrypt(
                r.config.get(
                    "oauth_state",
                    "",
                )
            )

            if stored_state == state:
                row = r
                break

        except Exception:
            continue

    if not row:
        raise HTTPException(
            400,
            "Invalid or expired OAuth state",
        )

    p = provider(provider_id)

    cfg = oauth_settings(
        provider_id
    )

    if not cfg:
        raise HTTPException(
            400,
            "OAuth configuration missing",
        )

    env = (
        p.get("oauth_env", "")
        .lower()
        if p
        else ""
    )

    endpoint = (
        OAUTH.get(
            env,
            {},
        ).get("token")
        or OAUTH.get(
            provider_id,
            {},
        ).get("token")
        or os.getenv(
            f"{(p.get('oauth_env') or '').upper()}_TOKEN_URL",
            "",
        )
    )

    if not endpoint:
        raise HTTPException(
            400,
            "Token endpoint not configured",
        )

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": cfg[
            "redirect_uri"
        ],
        "client_id": cfg[
            "client_id"
        ],
        "code_verifier": decrypt(
            row.config[
                "pkce_verifier"
            ]
        ),
    }

    if cfg.get("client_secret"):
        data[
            "client_secret"
        ] = cfg[
            "client_secret"
        ]

    headers = {
        "Content-Type":
            "application/x-www-form-urlencoded"
    }

    if (
        provider_id
        == "twilio"
        and cfg.get("client_secret")
    ):
        basic = base64.b64encode(
            (
                cfg["client_id"]
                + ":"
                + cfg["client_secret"]
            ).encode()
        ).decode()

        headers[
            "Authorization"
        ] = "Basic " + basic

        data.pop(
            "client_secret",
            None,
        )

    async with httpx.AsyncClient(
        timeout=25
    ) as client:

        resp = await client.post(
            endpoint,
            data=data,
            headers=headers,
        )

    if resp.status_code >= 400:
        raise HTTPException(
            resp.status_code,
            "OAuth token exchange failed: "
            + resp.text[:700],
        )

    token = resp.json()

    old_config = dict(
        row.config or {}
    )

    row.status = "CONNECTED"

    row.scopes = (
        token.get(
            "scope",
            "",
        ).split()
        if isinstance(
            token.get("scope"),
            str,
        )
        else (
            p.get("scopes")
            or []
        )
    )

    row.connected_at = now()

    row.config = {
        "access_token": encrypt(
            token.get(
                "access_token",
                "",
            )
        ),
        "refresh_token": (
            encrypt(
                token.get(
                    "refresh_token"
                )
            )
            if token.get(
                "refresh_token"
            )
            else ""
        ),
        "token_type": token.get(
            "token_type",
            "Bearer",
        ),
        "expires_in": token.get(
            "expires_in"
        ),
        "provider_account": token.get(
            "user"
        )
        or token.get(
            "user_id"
        ),
        "enabled": old_config.get(
            "enabled",
            True,
        ),
    }

    db.commit()

    return RedirectResponse(
        f"{FRONTEND_URL}/?oauth_connected="
        + urllib.parse.quote(
            provider_id
        )
    )


# ---------------------------------------------------------
# MANUAL / API-KEY CONFIGURATION
# ---------------------------------------------------------

@app.post(
    "/workspaces/{workspace_id}/connectors/{provider_id}/configure"
)
def configure_provider(
    workspace_id: int,
    provider_id: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    p = provider(provider_id)

    if not p:
        raise HTTPException(
            404,
            "Unknown provider",
        )

    row = db.scalar(
        select(Connector).where(
            Connector.workspace_id
            == workspace_id,
            Connector.provider
            == provider_id,
        )
    )

    if not row:

        row = Connector(
            workspace_id=workspace_id,
            kind=p["category"],
            provider=provider_id,
            config={
                "enabled": True
            },
            scopes=[],
        )

        db.add(row)

    allowed = {
        x["name"]
        for x in p.get(
            "fields",
            [],
        )
    }

    clean = {
        k: v
        for k, v in payload.items()
        if k in allowed
    }

    secret_names = {
        x["name"]
        for x in p.get(
            "fields",
            [])
        if x.get("secret")
    }

    old_config = dict(
        row.config or {}
    )

    new_config = {}

    for key, value in clean.items():

        if key in secret_names:
            new_config[key] = encrypt(
                str(value)
            )
        else:
            new_config[key] = value

    # Preserve existing settings.
    new_config["enabled"] = old_config.get(
        "enabled",
        True,
    )

    row.config = new_config

    row.status = "CONNECTED"

    row.scopes = p.get(
        "scopes",
        [],
    )

    row.connected_at = now()

    db.commit()
    db.refresh(row)

    return {
        "status": "CONNECTED",
        "provider": provider_id,
        "enabled": bool(
            row.config.get(
                "enabled",
                True,
            )
        ),
    }


# ---------------------------------------------------------
# ENABLE / DISABLE INTEGRATION
# ---------------------------------------------------------

@app.patch(
    "/workspaces/{workspace_id}/connectors/{provider_id}/toggle"
)
def toggle_provider(
    workspace_id: int,
    provider_id: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    p = provider(provider_id)

    if not p:
        raise HTTPException(
            404,
            "Unknown provider",
        )

    row = db.scalar(
        select(Connector).where(
            Connector.workspace_id
            == workspace_id,
            Connector.provider
            == provider_id,
        )
    )

    if not row:
        raise HTTPException(
            404,
            "Integration is not connected",
        )

    enabled = bool(
        payload.get(
            "enabled",
            True,
        )
    )

    config = dict(
        row.config or {}
    )

    config["enabled"] = enabled

    row.config = config

    db.commit()
    db.refresh(row)

    return {
        "provider": provider_id,
        "status": row.status,
        "enabled": enabled,
    }


# ---------------------------------------------------------
# DISCONNECT
# ---------------------------------------------------------

@app.delete(
    "/workspaces/{workspace_id}/connectors/{provider_id}"
)
def disconnect_provider(
    workspace_id: int,
    provider_id: str,
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(Connector).where(
            Connector.workspace_id
            == workspace_id,
            Connector.provider
            == provider_id,
        )
    )

    if not row:
        return {
            "status": "DISCONNECTED"
        }

    row.status = "DISCONNECTED"

    row.config = {}

    row.scopes = []

    row.connected_at = None

    db.commit()

    return {
        "status": "DISCONNECTED",
        "provider": provider_id,
    }


# =========================================================
# CAMPAIGNS
# =========================================================

@app.get(
    "/workspaces/{workspace_id}/campaigns"
)
def list_campaigns(
    workspace_id: int,
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Campaign)
        .where(
            Campaign.workspace_id
            == workspace_id
        )
        .order_by(
            Campaign.id.desc()
        )
    ).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "status": r.status,
            "channel": r.channel,
            "config": r.config,
        }
        for r in rows
    ]


@app.post(
    "/workspaces/{workspace_id}/campaigns"
)
def create_campaign(
    workspace_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    name = str(
        payload.get(
            "name",
            "",
        )
    ).strip()

    if not name:
        raise HTTPException(
            400,
            "Campaign name is required",
        )

    channel = str(
        payload.get(
            "channel",
            "email",
        )
    ).lower()

    obj = Campaign(
        workspace_id=workspace_id,
        name=name,
        status="DRAFT",
        channel=channel,
        config=payload,
    )

    db.add(obj)

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.name,
        "status": obj.status,
        "channel": obj.channel,
        "config": obj.config,
    }


@app.patch(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}"
)
def update_campaign(
    workspace_id: int,
    campaign_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    obj = db.scalar(
        select(Campaign).where(
            Campaign.id
            == campaign_id,
            Campaign.workspace_id
            == workspace_id,
        )
    )

    if not obj:
        raise HTTPException(
            404,
            "Campaign not found",
        )

    if "name" in payload:
        obj.name = (
            str(
                payload["name"]
            ).strip()
            or obj.name
        )

    if "status" in payload:
        status = str(
            payload["status"]
        ).upper()

        allowed_statuses = {
            "DRAFT",
            "ACTIVE",
            "PAUSED",
            "COMPLETED",
            "ARCHIVED",
        }

        if status not in allowed_statuses:
            raise HTTPException(
                400,
                "Invalid campaign status",
            )

        obj.status = status

    if "channel" in payload:
        obj.channel = str(
            payload["channel"]
        ).lower()

    obj.config = {
        **(obj.config or {}),
        **payload,
    }

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.name,
        "status": obj.status,
        "channel": obj.channel,
        "config": obj.config,
    }


# =========================================================
# PROSPECTS
# =========================================================

@app.get(
    "/workspaces/{workspace_id}/prospects"
)
def list_prospects(
    workspace_id: int,
    db: Session = Depends(get_db),
    limit: int = 100,
):
    rows = db.scalars(
        select(Prospect)
        .where(
            Prospect.workspace_id
            == workspace_id
        )
        .order_by(
            Prospect.total_score.desc()
        )
        .limit(limit)
    ).all()

    companies = {
        c.id: c
        for c in db.scalars(
            select(Company).where(
                Company.workspace_id
                == workspace_id
            )
        ).all()
    }

    return [
        {
            "id": r.id,
            "name": r.full_name,
            "full_name": r.full_name,
            "title": r.title,
            "email": r.email,
            "company": (
                companies.get(
                    r.company_id
                ).name
                if companies.get(
                    r.company_id
                )
                else None
            ),
            "domain": (
                companies.get(
                    r.company_id
                ).domain
                if companies.get(
                    r.company_id
                )
                else None
            ),
            "fit_score": r.fit_score,
            "intent_score": r.intent_score,
            "total_score": r.total_score,
            "status": r.status,
            "email_verified": r.email_verified,
        }
        for r in rows
    ]


@app.post(
    "/workspaces/{workspace_id}/prospects"
)
def create_prospect(
    workspace_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    name = str(
        payload.get(
            "full_name"
        )
        or payload.get(
            "name"
        )
        or ""
    ).strip()

    if not name:
        raise HTTPException(
            400,
            "Prospect name is required",
        )

    company_name = str(
        payload.get(
            "company",
            "",
        )
    ).strip()

    company = None

    if company_name:

        company = db.scalar(
            select(Company).where(
                Company.workspace_id
                == workspace_id,
                Company.name
                == company_name,
            )
        )

        if not company:

            company = Company(
                workspace_id=workspace_id,
                name=company_name,
                domain=payload.get(
                    "domain"
                ),
                country=payload.get(
                    "country"
                ),
                industry=payload.get(
                    "industry"
                ),
            )

            db.add(company)
            db.flush()

    obj = Prospect(
        workspace_id=workspace_id,
        company_id=(
            company.id
            if company
            else None
        ),
        full_name=name,
        title=payload.get(
            "title"
        ),
        email=payload.get(
            "email"
        ),
        email_verified=bool(
            payload.get(
                "email_verified",
                False,
            )
        ),
        fit_score=float(
            payload.get(
                "fit_score",
                0,
            )
            or 0
        ),
        intent_score=float(
            payload.get(
                "intent_score",
                0,
            )
            or 0
        ),
        total_score=float(
            payload.get(
                "total_score",
                payload.get(
                    "score",
                    0,
                ),
            )
            or 0
        ),
        status=str(
            payload.get(
                "status",
                "NEW",
            )
        ).upper(),
        metadata=payload,
    )

    db.add(obj)

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.id,
        "name": obj.full_name,
        "title": obj.title,
        "email": obj.email,
        "company": (
            company.name
            if company
            else None
        ),
        "total_score": obj.total_score,
        "status": obj.status,
    }


# =========================================================
# JOBS
# =========================================================

@app.post(
    "/workspaces/{workspace_id}/jobs"
)
def create_job(
    workspace_id: int,
    type: str,
    db: Session = Depends(get_db),
):
    obj = Job(
        workspace_id=workspace_id,
        type=type,
    )

    db.add(obj)

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.id,
        "status": obj.status,
    }


# =========================================================
# OPERATING MODEL
# =========================================================

@app.get(
    "/docs/operating-model"
)
def operating_model():
    return {
        "loop": [
            "discover",
            "detect_intent",
            "enrich",
            "verify",
            "deduplicate",
            "suppress_check",
            "score",
            "personalize",
            "contact",
            "handle_reply_or_call",
            "qualify",
            "book",
            "stop_outreach",
        ],
        "rules": [
            "Never guess email or phone numbers",
            "Use legitimate and approved data sources",
            "Respect opt-outs and DNC",
            "Do not bypass authentication or platform restrictions",
            "Disclose AI identity when required or asked",
            "Do not fabricate evidence, pricing, clients, or outcomes",
        ],
    }
