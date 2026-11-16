import base64
import hashlib
import os
import secrets
import urllib.parse

from datetime import datetime, timezone

from cryptography.fernet import Fernet

from .config import settings


# =========================================================
# SECURITY
# =========================================================

def _fernet():
    key = hashlib.sha256(
        settings.secret_key.encode()
    ).digest()

    return Fernet(
        base64.urlsafe_b64encode(key)
    )


def encrypt(value):
    return _fernet().encrypt(
        str(value).encode()
    ).decode()


def decrypt(value):
    return _fernet().decrypt(
        value.encode()
    ).decode()


# =========================================================
# PKCE
# =========================================================

def pkce_pair():
    verifier = secrets.token_urlsafe(64)

    challenge = (
        base64.urlsafe_b64encode(
            hashlib.sha256(
                verifier.encode()
            ).digest()
        )
        .rstrip(b"=")
        .decode()
    )

    return verifier, challenge


# =========================================================
# TIME
# =========================================================

def now():
    return datetime.now(
        timezone.utc
    )


# =========================================================
# FIELD HELPER
# =========================================================

def field(
    name,
    label,
    secret=False,
    required=True,
    placeholder="",
):
    return {
        "name": name,
        "label": label,
        "secret": secret,
        "required": required,
        "placeholder": placeholder,
    }


# =========================================================
# INTEGRATION MARKETPLACE
# =========================================================

CATALOG = {

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    "email": [

        {
            "id": "resend",
            "name": "Resend",
            "description":
                "Email sending, domains, delivery and events",
            "mode": "oauth",
            "oauth_env": "RESEND",
            "scopes": ["emails:send"],
            "recommended": True,
            "logo":
                "https://cdn.simpleicons.org/resend",
            "docs":
                "https://resend.com/docs",
        },

        {
            "id": "gmail",
            "name":
                "Gmail / Google Workspace",
            "description":
                "Send and read email from a Google mailbox",
            "mode": "oauth",
            "oauth_env": "GOOGLE",
            "scopes": [
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            "logo":
                "https://cdn.simpleicons.org/gmail",
            "docs":
                "https://developers.google.com/gmail/api/auth/web-server",
        },

        {
            "id": "outlook",
            "name":
                "Microsoft 365 / Outlook",
            "description":
                "Send and read Microsoft 365 email",
            "mode": "oauth",
            "oauth_env": "MICROSOFT",
            "scopes": [
                "Mail.Send",
                "Mail.Read",
            ],
            "logo":
                "https://cdn.simpleicons.org/microsoftoutlook",
            "docs":
                "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
        },

        {
            "id": "sendgrid",
            "name": "SendGrid",
            "description":
                "Transactional and outbound email",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                    True,
                    "SG.xxxxx",
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/twilio",
            "docs":
                "https://docs.sendgrid.com/for-developers/sending-email/api-getting-started",
        },

        {
            "id": "mailgun",
            "name": "Mailgun",
            "description":
                "Transactional email and delivery",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "Private API key",
                    True,
                    True,
                    "key-xxxxx",
                ),
                field(
                    "domain",
                    "Sending domain",
                    False,
                    True,
                    "mg.example.com",
                ),
                field(
                    "region",
                    "Region",
                    False,
                    True,
                    "US",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/mailgun",
            "docs":
                "https://documentation.mailgun.com/docs/mailgun/api-reference",
        },

        {
            "id": "smtp",
            "name": "Custom SMTP",
            "description":
                "Connect any authorized SMTP mailbox/provider",
            "mode": "manual",
            "fields": [
                field(
                    "host",
                    "SMTP host",
                    False,
                    True,
                    "smtp.example.com",
                ),
                field(
                    "port",
                    "Port",
                    False,
                    True,
                    "587",
                ),
                field(
                    "username",
                    "Username",
                ),
                field(
                    "password",
                    "Password",
                    True,
                ),
                field(
                    "from_email",
                    "From email",
                    False,
                    True,
                    "you@example.com",
                ),
                field(
                    "tls",
                    "TLS",
                    False,
                    True,
                    "true",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/maildotru",
            "docs":
                "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol",
        },
    ],

    # -----------------------------------------------------
    # CALENDAR
    # -----------------------------------------------------

    "calendar": [

        {
            "id": "calendly",
            "name": "Calendly",
            "description":
                "Booking links, events and webhook subscriptions",
            "mode": "oauth",
            "oauth_env": "CALENDLY",
            "scopes": [
                "scheduled_events:read",
                "webhooks:write",
            ],
            "recommended": True,
            "logo":
                "https://cdn.simpleicons.org/calendly",
            "docs":
                "https://developer.calendly.com/docs/authentication/creating-an-oauth-app",
        },

        {
            "id": "google_calendar",
            "name": "Google Calendar",
            "description":
                "Availability, events and meeting updates",
            "mode": "oauth",
            "oauth_env": "GOOGLE",
            "scopes": [
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.events",
            ],
            "logo":
                "https://cdn.simpleicons.org/googlecalendar",
            "docs":
                "https://developers.google.com/identity/protocols/oauth2/web-server",
        },

        {
            "id": "outlook_calendar",
            "name": "Outlook Calendar",
            "description":
                "Microsoft calendar availability and events",
            "mode": "oauth",
            "oauth_env": "MICROSOFT",
            "scopes": [
                "Calendars.Read",
                "Calendars.ReadWrite",
            ],
            "logo":
                "https://cdn.simpleicons.org/microsoftoutlook",
            "docs":
                "https://learn.microsoft.com/en-us/graph/auth-v2-user",
        },

        {
            "id": "cal_com",
            "name": "Cal.com",
            "description":
                "Scheduling and booking automation",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/caldotcom",
            "docs":
                "https://cal.com/docs/api-reference",
        },
    ],

    # -----------------------------------------------------
    # VOICE
    # -----------------------------------------------------

    "voice": [

        {
            "id": "twilio",
            "name": "Twilio",
            "description":
                "Voice, SMS and WhatsApp through Twilio",
            "mode": "oauth",
            "oauth_env": "TWILIO",
            "logo":
                "https://cdn.simpleicons.org/twilio",
            "docs":
                "https://www.twilio.com/docs/iam/oauth-apps/overview",
        },

        {
            "id": "exotel",
            "name": "Exotel",
            "description":
                "India and international voice/SMS",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                ),
                field(
                    "api_token",
                    "API token",
                    True,
                ),
                field(
                    "subdomain",
                    "Subdomain",
                    False,
                    True,
                    "api.exotel.com",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/exotel",
            "docs":
                "https://developer.exotel.com/",
        },

        {
            "id": "telnyx",
            "name": "Telnyx",
            "description":
                "Voice, messaging and phone numbers",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/telnyx",
            "docs":
                "https://developers.telnyx.com/",
        },

        {
            "id": "plivo",
            "name": "Plivo",
            "description":
                "Voice and SMS",
            "mode": "api_key",
            "fields": [
                field(
                    "auth_id",
                    "Auth ID",
                ),
                field(
                    "auth_token",
                    "Auth token",
                    True,
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/plivo",
            "docs":
                "https://www.plivo.com/docs/",
        },

        {
            "id": "vonage",
            "name": "Vonage",
            "description":
                "Voice and messaging APIs",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                ),
                field(
                    "api_secret",
                    "API secret",
                    True,
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/vonage",
            "docs":
                "https://developer.vonage.com/",
        },

        {
            "id": "sip",
            "name": "SIP / Custom PBX",
            "description":
                "Connect an authorized SIP trunk or PBX",
            "mode": "manual",
            "fields": [
                field(
                    "host",
                    "SIP host",
                ),
                field(
                    "port",
                    "Port",
                    False,
                    True,
                    "5060",
                ),
                field(
                    "username",
                    "Username",
                ),
                field(
                    "password",
                    "Password",
                    True,
                ),
                field(
                    "from_number",
                    "Caller ID",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/asterisk",
            "docs":
                "https://www.rfc-editor.org/rfc/rfc3261",
        },
    ],

    # -----------------------------------------------------
    # MESSAGING
    # -----------------------------------------------------

    "messaging": [

        {
            "id": "whatsapp_meta",
            "name":
                "WhatsApp Business (Meta)",
            "description":
                "WhatsApp Cloud API through Meta Embedded Signup",
            "mode": "oauth",
            "oauth_env": "META",
            "scopes": [
                "whatsapp_business_management",
                "whatsapp_business_messaging",
            ],
            "recommended": True,
            "logo":
                "https://cdn.simpleicons.org/whatsapp",
            "docs":
                "https://developers.facebook.com/docs/whatsapp/embedded-signup/",
        },

        {
            "id": "whatsapp_twilio",
            "name":
                "WhatsApp via Twilio",
            "description":
                "WhatsApp messaging through Twilio",
            "mode": "oauth",
            "oauth_env": "TWILIO",
            "logo":
                "https://cdn.simpleicons.org/twilio",
            "docs":
                "https://www.twilio.com/docs/whatsapp",
        },

        {
            "id": "sms_twilio",
            "name":
                "SMS via Twilio",
            "description":
                "SMS messaging through Twilio",
            "mode": "oauth",
            "oauth_env": "TWILIO",
            "logo":
                "https://cdn.simpleicons.org/twilio",
            "docs":
                "https://www.twilio.com/docs/messaging",
        },
    ],

    # -----------------------------------------------------
    # CRM
    # -----------------------------------------------------

    "crm": [

        {
            "id": "hubspot",
            "name": "HubSpot",
            "description":
                "Contacts, companies, deals and activities",
            "mode": "oauth",
            "oauth_env": "HUBSPOT",
            "logo":
                "https://cdn.simpleicons.org/hubspot",
            "docs":
                "https://developers.hubspot.com/docs/apps/legacy-apps/authentication/oauth-quickstart",
        },

        {
            "id": "salesforce",
            "name": "Salesforce",
            "description":
                "Leads, contacts, accounts and opportunities",
            "mode": "oauth",
            "oauth_env": "SALESFORCE",
            "logo":
                "https://cdn.simpleicons.org/salesforce",
            "docs":
                "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm",
        },

        {
            "id": "pipedrive",
            "name": "Pipedrive",
            "description":
                "People, organizations, deals and activities",
            "mode": "oauth",
            "oauth_env": "PIPEDRIVE",
            "logo":
                "https://cdn.simpleicons.org/pipedrive",
            "docs":
                "https://developers.pipedrive.com/docs/api/v1/OAuth_2",
        },

        {
            "id": "zoho",
            "name": "Zoho CRM",
            "description":
                "CRM records, leads and activities",
            "mode": "oauth",
            "oauth_env": "ZOHO",
            "logo":
                "https://cdn.simpleicons.org/zoho",
            "docs":
                "https://www.zoho.com/crm/developer/docs/api/v8/oauth-overview.html",
        },

        {
            "id": "freshsales",
            "name": "Freshsales",
            "description":
                "CRM contacts, accounts and deals",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                ),
                field(
                    "domain",
                    "Account domain",
                    False,
                    True,
                    "yourcompany.myfreshworks.com",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/freshworks",
            "docs":
                "https://developers.freshworks.com/crm/api/",
        },
    ],

    # -----------------------------------------------------
    # AI
    # -----------------------------------------------------

    "ai": [

        {
            "id": "openai",
            "name": "OpenAI",
            "description":
                "Reasoning, research, personalization and agents",
            "mode": "api_key",
            "recommended": True,
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                    True,
                    "sk-...",
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/openai",
            "docs":
                "https://platform.openai.com/docs/api-reference",
        },

        {
            "id": "anthropic",
            "name":
                "Anthropic / Claude",
            "description":
                "LLM and agent intelligence",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                    True,
                    "sk-ant-...",
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/anthropic",
            "docs":
                "https://docs.anthropic.com/en/api/getting-started",
        },

        {
            "id": "google_gemini",
            "name": "Google Gemini",
            "description":
                "Gemini models and multimodal reasoning",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/googlegemini",
            "docs":
                "https://ai.google.dev/gemini-api/docs",
        },

        {
            "id": "openrouter",
            "name": "OpenRouter",
            "description":
                "Access multiple model providers through one API",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/openrouter",
            "docs":
                "https://openrouter.ai/docs/api-reference/overview",
        },

        {
            "id": "custom_ai",
            "name":
                "Custom OpenAI-compatible API",
            "description":
                "Connect an approved compatible model endpoint",
            "mode": "manual",
            "fields": [
                field(
                    "base_url",
                    "Base URL",
                    False,
                    True,
                    "https://api.example.com/v1",
                ),
                field(
                    "api_key",
                    "API key",
                    True,
                ),
                field(
                    "model",
                    "Model",
                    False,
                    True,
                    "model-name",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/openai",
            "docs":
                "https://platform.openai.com/docs/api-reference",
        },
    ],

    # -----------------------------------------------------
    # DATA
    # -----------------------------------------------------

    "data": [

        {
            "id": "apollo",
            "name": "Apollo",
            "description":
                "B2B prospect and company data",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/apollo",
            "docs":
                "https://docs.apollo.io/",
        },

        {
            "id": "hunter",
            "name": "Hunter",
            "description":
                "Email discovery and verification",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/hunter",
            "docs":
                "https://hunter.io/api-documentation",
        },

        {
            "id": "peopledatalabs",
            "name":
                "People Data Labs",
            "description":
                "People and company enrichment",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/peopledatalabs",
            "docs":
                "https://docs.peopledatalabs.com/",
        },

        {
            "id": "crunchbase",
            "name": "Crunchbase",
            "description":
                "Company, funding and market intelligence",
            "mode": "api_key",
            "fields": [
                field(
                    "api_key",
                    "API key",
                    True,
                )
            ],
            "logo":
                "https://cdn.simpleicons.org/crunchbase",
            "docs":
                "https://data.crunchbase.com/docs",
        },

        {
            "id": "custom_enrichment",
            "name":
                "Custom Enrichment API",
            "description":
                "Bring your approved enrichment provider",
            "mode": "manual",
            "fields": [
                field(
                    "base_url",
                    "Base URL",
                    False,
                    True,
                    "https://api.example.com",
                ),
                field(
                    "api_key",
                    "API key",
                    True,
                ),
                field(
                    "headers",
                    "Extra headers JSON",
                    False,
                    False,
                    "{}",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/api",
            "docs":
                "https://developer.mozilla.org/en-US/docs/Web/HTTP",
        },
    ],

    # -----------------------------------------------------
    # STORAGE
    # -----------------------------------------------------

    "storage": [

        {
            "id": "google_drive",
            "name": "Google Drive",
            "description":
                "Store proposals, files and campaign assets",
            "mode": "oauth",
            "oauth_env": "GOOGLE",
            "scopes": [
                "https://www.googleapis.com/auth/drive.file"
            ],
            "logo":
                "https://cdn.simpleicons.org/googledrive",
            "docs":
                "https://developers.google.com/drive/api/guides/about-auth",
        },

        {
            "id": "dropbox",
            "name": "Dropbox",
            "description":
                "File storage and campaign assets",
            "mode": "oauth",
            "oauth_env": "DROPBOX",
            "logo":
                "https://cdn.simpleicons.org/dropbox",
            "docs":
                "https://developers.dropbox.com/oauth-guide",
        },

        {
            "id": "onedrive",
            "name": "OneDrive",
            "description":
                "Microsoft file storage",
            "mode": "oauth",
            "oauth_env": "MICROSOFT",
            "scopes": [
                "Files.ReadWrite"
            ],
            "logo":
                "https://cdn.simpleicons.org/microsoftonedrive",
            "docs":
                "https://learn.microsoft.com/en-us/graph/auth-v2-user",
        },
    ],

    # -----------------------------------------------------
    # NOTIFICATIONS
    # -----------------------------------------------------

    "notifications": [

        {
            "id": "slack",
            "name": "Slack",
            "description":
                "AI alerts, handoffs and campaign notifications",
            "mode": "oauth",
            "oauth_env": "SLACK",
            "logo":
                "https://cdn.simpleicons.org/slack",
            "docs":
                "https://api.slack.com/authentication/oauth-v2",
        },

        {
            "id": "teams",
            "name":
                "Microsoft Teams",
            "description":
                "AI alerts and human handoffs",
            "mode": "oauth",
            "oauth_env": "MICROSOFT",
            "logo":
                "https://cdn.simpleicons.org/microsoftteams",
            "docs":
                "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
        },

        {
            "id": "webhook",
            "name": "Custom Webhook",
            "description":
                "Send SignalOS events to any HTTPS endpoint",
            "mode": "manual",
            "fields": [
                field(
                    "url",
                    "Webhook URL",
                    False,
                    True,
                    "https://example.com/webhook",
                ),
                field(
                    "secret",
                    "Signing secret",
                    True,
                    False,
                ),
                field(
                    "events",
                    "Events",
                    False,
                    True,
                    "prospect.created,reply.received,meeting.booked",
                ),
            ],
            "logo":
                "https://cdn.simpleicons.org/webhook",
            "docs":
                "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
        },
    ],
}


# =========================================================
# PROVIDER HELPERS
# =========================================================

def all_providers():

    output = []

    for category, items in CATALOG.items():

        for item in items:

            provider_data = dict(item)

            provider_data[
                "category"
            ] = category

            output.append(
                provider_data
            )

    return output


def provider(provider_id):

    return next(
        (
            item
            for item in all_providers()
            if item["id"]
            == provider_id
        ),
        None,
    )


# =========================================================
# OAUTH PROVIDERS
# =========================================================

OAUTH = {

    "resend": {
        "authorize":
            "https://api.resend.com/oauth/authorize",
        "token":
            "https://api.resend.com/oauth/token",
    },

    "calendly": {
        "authorize":
            "https://auth.calendly.com/oauth/authorize",
        "token":
            "https://auth.calendly.com/oauth/token",
    },

    "twilio": {
        "authorize_env":
            "TWILIO_AUTHORIZATION_URL",
        "token":
            "https://oauth.twilio.com/v2/token",
    },

    "google": {
        "authorize":
            "https://accounts.google.com/o/oauth2/v2/auth",
        "token":
            "https://oauth2.googleapis.com/token",
    },

    "microsoft": {
        "authorize":
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "token":
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    },

    "hubspot": {
        "authorize":
            "https://app.hubspot.com/oauth/authorize",
        "token":
            "https://api.hubapi.com/oauth/v1/token",
    },

    "slack": {
        "authorize":
            "https://slack.com/oauth/v2/authorize",
        "token":
            "https://slack.com/api/oauth.v2.access",
    },

    "salesforce": {
        "authorize":
            "https://login.salesforce.com/services/oauth2/authorize",
        "token":
            "https://login.salesforce.com/services/oauth2/token",
    },

    "pipedrive": {
        "authorize":
            "https://oauth.pipedrive.com/oauth/authorize",
        "token":
            "https://oauth.pipedrive.com/oauth/token",
    },

    "zoho": {
        "authorize":
            "https://accounts.zoho.com/oauth/v2/auth",
        "token":
            "https://accounts.zoho.com/oauth/v2/token",
    },

    "dropbox": {
        "authorize":
            "https://www.dropbox.com/oauth2/authorize",
        "token":
            "https://api.dropboxapi.com/oauth2/token",
    },
}


# =========================================================
# OAUTH SETTINGS
# =========================================================

def oauth_settings(provider_id):

    p = provider(
        provider_id
    )

    env = (
        p.get("oauth_env")
        if p
        else None
    )

    if not env:
        return None

    client_id = os.getenv(
        f"{env}_CLIENT_ID",
        "",
    )

    client_secret = os.getenv(
        f"{env}_CLIENT_SECRET",
        "",
    )

    redirect_uri = (
        os.getenv(
            f"{env}_REDIRECT_URI",
            "",
        )
        or os.getenv(
            "OAUTH_REDIRECT_URI",
            "",
        )
    )

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }


# =========================================================
# OAUTH AUTHORIZATION URL
# =========================================================

def authorization_url(
    provider_id,
    state,
    verifier,
):

    p = provider(
        provider_id
    )

    cfg = oauth_settings(
        provider_id
    )

    if (
        not p
        or p.get("mode")
        != "oauth"
    ):
        raise ValueError(
            "Provider is not OAuth based"
        )

    if (
        not cfg
        or not cfg.get(
            "client_id"
        )
        or not cfg.get(
            "redirect_uri"
        )
    ):
        raise RuntimeError(
            "OAuth app credentials and redirect URI are not configured for this provider"
        )

    key = (
        p.get("oauth_env")
        or ""
    )

    endpoint = (
        OAUTH.get(
            key.lower(),
            {},
        ).get(
            "authorize"
        )
        or OAUTH.get(
            provider_id,
            {},
        ).get(
            "authorize"
        )
    )

    if provider_id == "twilio":
        endpoint = os.getenv(
            "TWILIO_AUTHORIZATION_URL",
            "",
        )

    if not endpoint:
        endpoint = os.getenv(
            f"{(p.get('oauth_env') or '').upper()}_AUTHORIZATION_URL",
            "",
        )

    if not endpoint:
        raise RuntimeError(
            "Authorization endpoint is not configured"
        )

    scope = " ".join(
        p.get(
            "scopes",
            [],
        )
    )

    params = {
        "client_id":
            cfg["client_id"],
        "response_type":
            "code",
        "redirect_uri":
            cfg["redirect_uri"],
        "state":
            state,
        "scope":
            scope,
        "code_challenge":
            verifier[1],
        "code_challenge_method":
            "S256",
    }

    if provider_id == "resend":
        params[
            "scope"
        ] = os.getenv(
            "RESEND_SCOPE",
            "emails:send",
        )

    if provider_id in {
        "google",
        "gmail",
        "google_calendar",
        "google_drive",
    }:
        params.update(
            {
                "access_type":
                    "offline",
                "prompt":
                    "consent",
            }
        )

    if provider_id == "slack":
        params[
            "scope"
        ] = scope

    return (
        endpoint
        + "?"
        + urllib.parse.urlencode(
            {
                k: v
                for k, v
                in params.items()
                if v
            }
        )
    )
