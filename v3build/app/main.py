from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request as URLRequest, urlopen
from urllib.error import HTTPError

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import Base, engine, get_db
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
    build_authorization_url,
    oauth_config,
)


APP_URL = os.getenv(
    "APP_URL",
    "https://signalos-api-15va.onrender.com"
).rstrip("/")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://signal-os-git.vercel.app"
).rstrip("/")

WS_ID = 1


app = FastAPI(
    title="SignalOS AI Prospecting & Outbound OS",
    version="6.1.0",
    description="Private AI Prospecting and Outbound Operating System",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

def now():
    return datetime.now(timezone.utc)


def settings_dict(ws: Workspace) -> dict[str, Any]:

    value = dict(ws.settings or {})

    value.setdefault(
        "onboarding_completed",
        False
    )

    value.setdefault(
        "ai_mode",
        "copilot"
    )

    value.setdefault(
        "automation_enabled",
        False
    )

    value.setdefault(
        "timezone",
        "Asia/Kolkata"
    )

    value.setdefault(
        "llm_provider",
        ""
    )

    value.setdefault(
        "llm_model",
        ""
    )

    value.setdefault(
        "signals",
        []
    )

    return value


def ensure_workspace(
    db: Session,
    workspace_id: int = WS_ID
) -> Workspace:

    ws = db.get(
        Workspace,
        workspace_id
    )

    if not ws:

        ws = Workspace(
            id=workspace_id,
            name="SignalOS Workspace",
            owner_name="Workspace Owner",
            owner_email="",
            settings={
                "onboarding_completed": False,
                "ai_mode": "copilot",
                "automation_enabled": False,
                "timezone": "Asia/Kolkata",
                "llm_provider": "",
                "llm_model": "",
                "signals": [],
            },
        )

        db.add(ws)
        db.commit()
        db.refresh(ws)

    else:

        settings = settings_dict(ws)

        if ws.settings != settings:

            ws.settings = settings

            db.commit()

    return ws


def require_onboarded(
    workspace_id: int,
    db: Session
):

    ws = ensure_workspace(
        db,
        workspace_id
    )

    if not settings_dict(ws).get(
        "onboarding_completed"
    ):

        raise HTTPException(
            status_code=428,
            detail=(
                "Complete SignalOS setup "
                "before using the workspace."
            ),
        )

    return ws


def serialize(obj):

    if obj is None:
        return None

    output = {}

    for column in obj.__table__.columns:

        value = getattr(
            obj,
            column.name
        )

        if isinstance(
            value,
            datetime
        ):
            value = value.isoformat()

        output[column.name] = value

    return output


def log_activity(
    db: Session,
    workspace_id: int,
    kind: str,
    title: str,
    detail: str = "",
    severity: str = "info",
):

    db.add(
        Activity(
            workspace_id=workspace_id,
            kind=kind,
            title=title,
            detail=detail,
            severity=severity,
        )
    )


def notify(
    db: Session,
    workspace_id: int,
    title: str,
    body: str,
    type_: str = "system",
):

    db.add(
        Notification(
            workspace_id=workspace_id,
            type=type_,
            title=title,
            body=body,
            read=False,
        )
    )


def connector_view(
    row,
    provider
):

    result = dict(provider)

    result.update({

        "status":
            row.status
            if row
            else "AVAILABLE",

        "connected":
            bool(
                row
                and row.status == "CONNECTED"
            ),

        "enabled":
            bool(row.enabled)
            if row
            else False,

        "configured":
            bool(row),

        "connected_at":
            row.connected_at.isoformat()
            if row
            and row.connected_at
            else None,
    })

    return result


# ============================================================
# CREDENTIAL ENCRYPTION
# ============================================================

def secret_key():

    value = os.getenv(
        "SECRET_KEY",
        "signalos-development-secret"
    )

    return hashlib.sha256(
        value.encode()
    ).digest()


def encrypt_text(
    value: str
):

    key = secret_key()

    data = value.encode()

    encrypted = bytes(
        data[index]
        ^ key[index % len(key)]
        for index in range(len(data))
    )

    return base64.urlsafe_b64encode(
        encrypted
    ).decode()


# ============================================================
# OAUTH TOKEN EXCHANGE
# ============================================================

def token_exchange(
    provider_id: str,
    code: str
):

    config = oauth_config(
        provider_id
    )

    if not config:

        raise ValueError(
            f"OAuth credentials are not configured for {provider_id}."
        )

    data = {

        "client_id":
            config["client_id"],

        "client_secret":
            config["client_secret"],

        "code":
            code,

        "redirect_uri":
            config["redirect_uri"],

        "grant_type":
            "authorization_code",
    }

    request = URLRequest(

        config["token_url"],

        data=urlencode(data).encode(),

        headers={
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        method="POST",
    )

    try:

        with urlopen(
            request,
            timeout=20
        ) as response:

            return json.loads(
                response.read().decode()
            )

    except HTTPError as error:

        detail = error.read().decode(
            errors="ignore"
        )

        raise ValueError(
            f"{provider_id} OAuth token exchange failed: "
            f"{detail[:500]}"
        )


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():

    Base.metadata.create_all(
        bind=engine
    )

    db = next(
        get_db()
    )

    try:

        ensure_workspace(
            db
        )

    finally:

        db.close()


# ============================================================
# BASIC
# ============================================================

@app.get("/")
def root():

    return {
        "name":
            "SignalOS API",

        "version":
            "6.1.0",

        "status":
            "online",

        "docs":
            "/docs",
    }


@app.get("/health")
def health(
    db: Session = Depends(get_db)
):

    try:

        ensure_workspace(
            db
        )

        return {
            "ok":
                True,

            "database":
                "connected",

            "api":
                "online",
        }

    except Exception as error:

        return {
            "ok":
                False,

            "database":
                "error",

            "api":
                "online",

            "error":
                str(error),
        }


# ============================================================
# PROVIDERS
# ============================================================

@app.get("/providers")
def providers():

    return {
        "providers":
            PROVIDERS
    }


# ============================================================
# ONBOARDING
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/onboarding"
)
def get_onboarding(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    workspace = ensure_workspace(
        db,
        workspace_id
    )

    settings = settings_dict(
        workspace
    )

    connectors = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.status
        == "CONNECTED"
    ).all()

    connected = {
        connector.provider
        for connector in connectors
    }

    return {

        "completed":
            bool(
                settings.get(
                    "onboarding_completed"
                )
            ),

        "settings":
            settings,

        "connected_integrations":
            list(connected),

        "steps": [

            {
                "id":
                    "workspace",

                "label":
                    "Workspace",

                "complete":
                    bool(workspace.name),
            },

            {
                "id":
                    "ai",

                "label":
                    "AI / LLM",

                "complete":
                    any(
                        x in connected
                        for x in [
                            "openai",
                            "anthropic",
                            "gemini",
                            "openrouter",
                        ]
                    ),
            },

            {
                "id":
                    "email",

                "label":
                    "Email",

                "complete":
                    any(
                        x in connected
                        for x in [
                            "gmail",
                            "microsoft365",
                            "resend",
                            "sendgrid",
                            "mailgun",
                        ]
                    ),
            },

            {
                "id":
                    "calendar",

                "label":
                    "Calendar",

                "complete":
                    any(
                        x in connected
                        for x in [
                            "google_calendar",
                            "outlook_calendar",
                            "calendly",
                        ]
                    ),
            },
        ],
    }


@app.post(
    "/workspaces/{workspace_id}/onboarding/complete"
)
def complete_onboarding(
    workspace_id: int,
    payload: dict[str, Any] | None = None,
    db: Session = Depends(get_db),
):

    workspace = ensure_workspace(
        db,
        workspace_id
    )

    payload = payload or {}

    if payload.get("name"):

        workspace.name = str(
            payload["name"]
        ).strip()

    if payload.get("owner_name"):

        workspace.owner_name = str(
            payload["owner_name"]
        ).strip()

    settings = settings_dict(
        workspace
    )

    settings["onboarding_completed"] = True

    if payload.get("timezone"):

        settings["timezone"] = payload[
            "timezone"
        ]

    if payload.get("ai_mode") in {
        "manual",
        "copilot",
        "autopilot",
    }:

        settings["ai_mode"] = payload[
            "ai_mode"
        ]

    # NEVER enable automation during onboarding.

    settings["automation_enabled"] = False

    workspace.settings = settings

    log_activity(
        db,
        workspace_id,
        "onboarding",
        "Workspace setup completed",
        "SignalOS mandatory onboarding was completed.",
    )

    notify(
        db,
        workspace_id,
        "Setup complete",
        "Your SignalOS workspace is ready.",
        "onboarding",
    )

    db.commit()
    db.refresh(workspace)

    return {
        "ok":
            True,

        "completed":
            True,

        "workspace":
            serialize(workspace),

        "settings":
            settings,
    }


# ============================================================
# AUTOMATION
# ============================================================

@app.patch(
    "/workspaces/{workspace_id}/automation"
)
def update_automation(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    settings = settings_dict(
        workspace
    )

    mode = payload.get(
        "mode",
        settings["ai_mode"]
    )

    enabled = bool(
        payload.get(
            "enabled",
            settings["automation_enabled"]
        )
    )

    if mode not in {
        "manual",
        "copilot",
        "autopilot",
    }:

        raise HTTPException(
            400,
            "Mode must be manual, copilot or autopilot."
        )

    settings["ai_mode"] = mode
    settings["automation_enabled"] = enabled

    workspace.settings = settings

    log_activity(
        db,
        workspace_id,
        "automation",
        f"Automation mode changed to {mode}",
        (
            "Master automation "
            f"{'enabled' if enabled else 'paused'}."
        ),
    )

    db.commit()

    return {
        "ok":
            True,

        "settings":
            settings,
    }


# ============================================================
# WORKSPACE
# ============================================================

@app.get(
    "/workspaces/{workspace_id}"
)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    return {
        "workspace":
            serialize(workspace),

        "settings":
            settings_dict(workspace),
    }


@app.patch(
    "/workspaces/{workspace_id}"
)
def update_workspace(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    for field in [
        "name",
        "owner_name",
        "owner_email",
    ]:

        if field in payload:

            setattr(
                workspace,
                field,
                payload[field]
            )

    if isinstance(
        payload.get("settings"),
        dict
    ):

        settings = settings_dict(
            workspace
        )

        settings.update(
            payload["settings"]
        )

        workspace.settings = settings

    db.commit()
    db.refresh(workspace)

    return {
        "workspace":
            serialize(workspace),

        "settings":
            settings_dict(workspace),
    }


# ============================================================
# SETTINGS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/settings"
)
def get_settings(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    return {
        "workspace":
            serialize(workspace),

        "settings":
            settings_dict(workspace),
    }


@app.patch(
    "/workspaces/{workspace_id}/settings"
)
def save_settings(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    for field in [
        "name",
        "owner_name",
        "owner_email",
    ]:

        if field in payload:

            setattr(
                workspace,
                field,
                payload[field]
            )

    if isinstance(
        payload.get("settings"),
        dict
    ):

        settings = settings_dict(
            workspace
        )

        settings.update(
            payload["settings"]
        )

        workspace.settings = settings

    log_activity(
        db,
        workspace_id,
        "settings",
        "Workspace settings updated",
    )

    db.commit()
    db.refresh(workspace)

    return {
        "ok":
            True,

        "workspace":
            serialize(workspace),

        "settings":
            settings_dict(workspace),
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/dashboard"
)
def dashboard(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    connected = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.status
        == "CONNECTED",

        Connector.enabled
        == True
    ).count()

    return {
        "metrics": {

            "prospects":
                db.query(
                    Prospect
                ).filter_by(
                    workspace_id=workspace_id
                ).count(),

            "companies":
                db.query(
                    Company
                ).filter_by(
                    workspace_id=workspace_id
                ).count(),

            "campaigns":
                db.query(
                    Campaign
                ).filter_by(
                    workspace_id=workspace_id
                ).count(),

            "interactions":
                0,

            "connected_integrations":
                connected,
        }
    }


# ============================================================
# INTEGRATIONS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/connectors"
)
def connectors(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    rows = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id
    ).all()

    lookup = {
        row.provider:
            row
        for row in rows
    }

    return {
        "connectors": [

            connector_view(
                lookup.get(provider["id"]),
                provider
            )

            for provider in PROVIDERS
        ]
    }


@app.post(
    "/workspaces/{workspace_id}/connectors/{provider_id}/connect"
)
def connect_provider(
    workspace_id: int,
    provider_id: str,
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    provider = provider_by_id(
        provider_id
    )

    if not provider:

        raise HTTPException(
            404,
            "Provider not found."
        )

    row = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.provider
        == provider_id
    ).first()

    if not row:

        row = Connector(
            workspace_id=workspace_id,
            provider=provider_id,
            name=provider["name"],
            status="AVAILABLE",
            enabled=False,
            auth_type=provider["auth"],
            config={},
        )

        db.add(row)

    if provider["auth"] == "api_key":

        row.status = "CONFIGURE"
        row.auth_type = "api_key"

        db.commit()

        return {
            "ok":
                True,

            "mode":
                "api_key",

            "provider":
                provider,
        }

    try:

        authorization_url, state = (
            build_authorization_url(
                provider_id
            )
        )

    except ValueError as error:

        raise HTTPException(
            400,
            str(error)
        )

    row.status = "AUTHORIZING"
    row.auth_type = "oauth"

    row.config = {
        **(row.config or {}),
        "oauth_state": state,
        "enabled": False,
    }

    db.commit()

    return {
        "ok":
            True,

        "mode":
            "oauth",

        "authorization_url":
            authorization_url,
    }


@app.post(
    "/workspaces/{workspace_id}/connectors/{provider_id}/configure"
)
def configure_provider(
    workspace_id: int,
    provider_id: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    provider = provider_by_id(
        provider_id
    )

    if not provider:

        raise HTTPException(
            404,
            "Provider not found."
        )

    credential = str(
        payload.get("api_key")
        or payload.get("credential")
        or payload.get("token")
        or ""
    ).strip()

    if not credential:

        raise HTTPException(
            400,
            "Credential is required."
        )

    row = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.provider
        == provider_id
    ).first()

    if not row:

        row = Connector(
            workspace_id=workspace_id,
            provider=provider_id,
            name=provider["name"],
            auth_type=provider["auth"],
            config={},
        )

        db.add(row)

    row.status = "CONNECTED"
    row.enabled = True
    row.connected_at = now()

    row.config = {
        **(row.config or {}),
        "credential":
            encrypt_text(credential),

        "credential_set":
            True,

        "enabled":
            True,
    }

    log_activity(
        db,
        workspace_id,
        "integration",
        f"{provider['name']} connected",
        "Credential stored server-side.",
    )

    notify(
        db,
        workspace_id,
        f"{provider['name']} connected",
        f"{provider['name']} is ready for SignalOS.",
        "integration",
    )

    db.commit()

    return {
        "ok":
            True,

        "provider":
            provider_id,

        "status":
            "CONNECTED",
    }


# ============================================================
# OAUTH CALLBACK
# ============================================================

@app.get(
    "/oauth/callback/{provider_id}"
)
def oauth_callback(
    provider_id: str,
    request: Request,
    db: Session = Depends(get_db)
):

    provider = provider_by_id(
        provider_id
    )

    if not provider:

        raise HTTPException(
            404,
            "Provider not found."
        )

    error = request.query_params.get(
        "error"
    )

    if error:

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth_error={error}"
        )

    state = request.query_params.get(
        "state"
    )

    code = request.query_params.get(
        "code"
    )

    if not state or not code:

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth_error=missing_code_or_state"
        )

    rows = db.query(
        Connector
    ).filter(
        Connector.provider
        == provider_id
    ).all()

    row = next(
        (
            item
            for item in rows
            if (
                item.config or {}
            ).get("oauth_state")
            == state
        ),
        None,
    )

    if not row:

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth_error=invalid_state"
        )

    try:

        tokens = token_exchange(
            provider_id,
            code
        )

    except Exception as error:

        row.status = "ERROR"

        row.config = {
            **(row.config or {}),
            "last_error":
                str(error),
        }

        db.commit()

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth_error=token_exchange_failed"
        )

    safe_keys = [
        "access_token",
        "refresh_token",
        "expires_in",
        "token_type",
        "scope",
    ]

    safe_tokens = {
        key:
            tokens[key]

        for key in safe_keys

        if key in tokens
    }

    if "access_token" not in safe_tokens:

        row.status = "ERROR"

        row.config = {
            **(row.config or {}),
            "last_error":
                "Provider did not return an access token.",
        }

        db.commit()

        return RedirectResponse(
            f"{FRONTEND_URL}/?oauth_error=no_access_token"
        )

    row.status = "CONNECTED"
    row.enabled = True
    row.connected_at = now()

    row.config = {

        "oauth": {
            key:
                encrypt_text(
                    str(value)
                )

            for key, value
            in safe_tokens.items()
        },

        "credential_set":
            True,

        "enabled":
            True,
    }

    log_activity(
        db,
        row.workspace_id,
        "integration",
        f"{provider['name']} connected",
        "OAuth authorization completed.",
    )

    notify(
        db,
        row.workspace_id,
        f"{provider['name']} connected",
        f"{provider['name']} is ready for SignalOS.",
        "integration",
    )

    db.commit()

    return RedirectResponse(
        f"{FRONTEND_URL}/?oauth_success={provider_id}"
    )


@app.patch(
    "/workspaces/{workspace_id}/connectors/{provider_id}/toggle"
)
def toggle_provider(
    workspace_id: int,
    provider_id: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    row = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.provider
        == provider_id
    ).first()

    if not row:

        raise HTTPException(
            404,
            "Integration has not been connected."
        )

    if row.status != "CONNECTED":

        raise HTTPException(
            400,
            "Connect this provider before enabling it."
        )

    row.enabled = bool(
        payload.get(
            "enabled",
            True
        )
    )

    row.config = {
        **(row.config or {}),
        "enabled":
            row.enabled,
    }

    log_activity(
        db,
        workspace_id,
        "integration",
        (
            f"{row.name} "
            f"{'enabled' if row.enabled else 'disabled'}"
        ),
    )

    db.commit()

    return {
        "ok":
            True,

        "enabled":
            row.enabled,
    }


@app.delete(
    "/workspaces/{workspace_id}/connectors/{provider_id}"
)
def disconnect_provider(
    workspace_id: int,
    provider_id: str,
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    row = db.query(
        Connector
    ).filter(
        Connector.workspace_id
        == workspace_id,

        Connector.provider
        == provider_id
    ).first()

    if row:

        name = (
            row.name
            or provider_id
        )

        db.delete(row)

        log_activity(
            db,
            workspace_id,
            "integration",
            f"{name} disconnected",
        )

        notify(
            db,
            workspace_id,
            f"{name} disconnected",
            "Automations using this provider may need to be reviewed.",
            "integration",
        )

        db.commit()

    return {
        "ok":
            True
    }


# ============================================================
# CAMPAIGNS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/campaigns"
)
def list_campaigns(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    campaigns = db.query(
        Campaign
    ).filter_by(
        workspace_id=workspace_id
    ).order_by(
        Campaign.id.desc()
    ).all()

    return {
        "campaigns": [
            serialize(campaign)
            for campaign in campaigns
        ]
    }


@app.post(
    "/workspaces/{workspace_id}/campaigns"
)
def create_campaign(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    name = str(
        payload.get(
            "name",
            ""
        )
    ).strip()

    if not name:

        raise HTTPException(
            400,
            "Campaign name is required."
        )

    campaign = Campaign(
        workspace_id=workspace_id,
        name=name,
        status="DRAFT",
    )

    fields = [
        "countries",
        "industries",
        "decision_makers",
        "signals",
        "channel",
        "booking_link",
        "daily_limit",
    ]

    for field in fields:

        if field in payload:

            setattr(
                campaign,
                field,
                payload[field]
            )

    db.add(campaign)

    log_activity(
        db,
        workspace_id,
        "campaign",
        f"Campaign created: {name}",
        "Campaign saved as draft.",
    )

    notify(
        db,
        workspace_id,
        "Campaign created",
        f"{name} is ready for review.",
        "campaign",
    )

    db.commit()
    db.refresh(campaign)

    return {
        "campaign":
            serialize(campaign)
    }


@app.get(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}"
)
def get_campaign(
    workspace_id: int,
    campaign_id: int,
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    campaign = db.query(
        Campaign
    ).filter(
        Campaign.id
        == campaign_id,

        Campaign.workspace_id
        == workspace_id
    ).first()

    if not campaign:

        raise HTTPException(
            404,
            "Campaign not found."
        )

    return {
        "campaign":
            serialize(campaign)
    }


@app.patch(
    "/workspaces/{workspace_id}/campaigns/{campaign_id}"
)
def update_campaign(
    workspace_id: int,
    campaign_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    campaign = db.query(
        Campaign
    ).filter(
        Campaign.id
        == campaign_id,

        Campaign.workspace_id
        == workspace_id
    ).first()

    if not campaign:

        raise HTTPException(
            404,
            "Campaign not found."
        )

    requested_status = payload.get(
        "status"
    )

    if requested_status == "ACTIVE":

        settings = settings_dict(
            workspace
        )

        if not settings.get(
            "automation_enabled"
        ):

            raise HTTPException(
                400,
                "Enable Master automation before activating a campaign."
            )

        email_connected = db.query(
            Connector
        ).filter(
            Connector.workspace_id
            == workspace_id,

            Connector.status
            == "CONNECTED",

            Connector.enabled
            == True,

            Connector.provider.in_([
                "gmail",
                "microsoft365",
                "resend",
                "sendgrid",
                "mailgun",
            ])
        ).count() > 0

        if not email_connected:

            raise HTTPException(
                400,
                "Connect and enable an email provider before activating a campaign."
            )

        llm_connected = db.query(
            Connector
        ).filter(
            Connector.workspace_id
            == workspace_id,

            Connector.status
            == "CONNECTED",

            Connector.enabled
            == True,

            Connector.provider.in_([
                "openai",
                "anthropic",
                "gemini",
                "openrouter",
            ])
        ).count() > 0

        if not llm_connected:

            raise HTTPException(
                400,
                "Connect and enable an AI / LLM provider before activating a campaign."
            )

    if requested_status in {
        "DRAFT",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
    }:

        campaign.status = requested_status

    fields = [
        "name",
        "countries",
        "industries",
        "decision_makers",
        "signals",
        "channel",
        "booking_link",
        "daily_limit",
    ]

    for field in fields:

        if field in payload:

            setattr(
                campaign,
                field,
                payload[field]
            )

    db.commit()
    db.refresh(campaign)

    log_activity(
        db,
        workspace_id,
        "campaign",
        (
            f"Campaign "
            f"{campaign.status.lower()}: "
            f"{campaign.name}"
        ),
    )

    db.commit()

    return {
        "campaign":
            serialize(campaign)
    }


# ============================================================
# PROSPECTS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/prospects"
)
def list_prospects(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    rows = db.query(
        Prospect
    ).filter_by(
        workspace_id=workspace_id
    ).order_by(
        Prospect.id.desc()
    ).all()

    return {
        "prospects": [
            serialize(row)
            for row in rows
        ]
    }


@app.post(
    "/workspaces/{workspace_id}/prospects"
)
def create_prospect(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    name = str(
        payload.get(
            "name",
            ""
        )
    ).strip()

    if not name:

        raise HTTPException(
            400,
            "Prospect name is required."
        )

    prospect = Prospect(
        workspace_id=workspace_id,
        name=name,
    )

    for field in [
        "email",
        "title",
        "country",
        "score",
        "status",
        "intent",
        "evidence",
        "source",
    ]:

        if field in payload:

            setattr(
                prospect,
                field,
                payload[field]
            )

    db.add(prospect)

    log_activity(
        db,
        workspace_id,
        "prospect",
        f"Prospect added: {name}",
    )

    db.commit()
    db.refresh(prospect)

    return {
        "prospect":
            serialize(prospect)
    }


# ============================================================
# COMPANIES
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/companies"
)
def list_companies(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    rows = db.query(
        Company
    ).filter_by(
        workspace_id=workspace_id
    ).order_by(
        Company.id.desc()
    ).all()

    return {
        "companies": [
            serialize(row)
            for row in rows
        ]
    }


@app.post(
    "/workspaces/{workspace_id}/companies"
)
def create_company(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    require_onboarded(
        workspace_id,
        db
    )

    name = str(
        payload.get(
            "name",
            ""
        )
    ).strip()

    if not name:

        raise HTTPException(
            400,
            "Company name is required."
        )

    company = Company(
        workspace_id=workspace_id,
        name=name,
    )

    for field in [
        "domain",
        "industry",
        "country",
        "size",
        "website",
    ]:

        if field in payload:

            setattr(
                company,
                field,
                payload[field]
            )

    db.add(company)

    log_activity(
        db,
        workspace_id,
        "company",
        f"Company added: {name}",
    )

    db.commit()
    db.refresh(company)

    return {
        "company":
            serialize(company)
    }


# ============================================================
# INTENT SIGNALS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/signals"
)
def get_signals(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    return {
        "signals":
            settings_dict(
                workspace
            ).get(
                "signals",
                []
            )
    }


@app.put(
    "/workspaces/{workspace_id}/signals"
)
def save_signals(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):

    workspace = require_onboarded(
        workspace_id,
        db
    )

    settings = settings_dict(
        workspace
    )

    settings["signals"] = [
        str(value).strip()

        for value
        in payload.get(
            "signals",
            []
        )

        if str(value).strip()
    ]

    workspace.settings = settings

    db.commit()

    return {
        "ok":
            True,

        "signals":
            settings["signals"]
    }


# ============================================================
# ACTIVITY
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/activity"
)
def get_activity(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    rows = db.query(
        Activity
    ).filter_by(
        workspace_id=workspace_id
    ).order_by(
        Activity.id.desc()
    ).limit(100).all()

    return {
        "activity": [
            serialize(row)
            for row in rows
        ]
    }


# ============================================================
# NOTIFICATIONS
# ============================================================

@app.get(
    "/workspaces/{workspace_id}/notifications"
)
def get_notifications(
    workspace_id: int,
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    rows = db.query(
        Notification
    ).filter_by(
        workspace_id=workspace_id
    ).order_by(
        Notification.id.desc()
    ).limit(100).all()

    return {
        "notifications": [
            serialize(row)
            for row in rows
        ]
    }


@app.post(
    "/workspaces/{workspace_id}/notifications/read"
)
def mark_notifications_read(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    ids = set(
        payload.get(
            "ids",
            []
        )
    )

    rows = db.query(
        Notification
    ).filter(
        Notification.workspace_id
        == workspace_id
    ).all()

    for notification in rows:

        if (
            not ids
            or notification.id in ids
        ):

            notification.read = True

    db.commit()

    return {
        "ok":
            True
    }


# ============================================================
# WORKSPACE CREATION
# ============================================================

@app.post(
    "/workspaces"
)
def create_workspace(
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):

    workspace = Workspace(

        name=
            payload.get(
                "name"
            )
            or "SignalOS Workspace",

        owner_name=
            payload.get(
                "owner_name"
            )
            or "",

        owner_email=
            payload.get(
                "owner_email"
            )
            or "",

        settings={
            "onboarding_completed":
                False,

            "ai_mode":
                "copilot",

            "automation_enabled":
                False,

            "timezone":
                "Asia/Kolkata",

            "llm_provider":
                "",

            "llm_model":
                "",

            "signals":
                [],
        },
    )

    db.add(workspace)

    db.commit()
    db.refresh(workspace)

    return {
        "workspace":
            serialize(workspace)
    }


# ============================================================
# JOBS
# ============================================================

@app.post(
    "/workspaces/{workspace_id}/jobs"
)
def create_job(
    workspace_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):

    require_onboarded(
        workspace_id,
        db
    )

    return {
        "ok":
            True,

        "status":
            "QUEUED",

        "job":
            payload,
    }


# ============================================================
# OPERATING MODEL
# ============================================================

@app.get(
    "/docs/operating-model"
)
def operating_model():

    return {

        "core_loop":
            (
                "Find reason to buy -> "
                "prove why now -> "
                "contact -> "
                "qualify -> "
                "book -> "
                "stop"
            ),

        "modes": [
            "manual",
            "copilot",
            "autopilot",
        ],
    }


# ============================================================
# WEBHOOKS
# ============================================================

@app.post(
    "/webhooks/email"
)
def email_webhook(
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):

    return {
        "ok":
            True,

        "received":
            True,
    }


@app.post(
    "/webhooks/calendar"
)
def calendar_webhook(
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):

    return {
        "ok":
            True,

        "received":
            True,
    }
