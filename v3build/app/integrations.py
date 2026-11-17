from __future__ import annotations

import os
import secrets

from urllib.parse import urlencode


PROVIDERS = [

    # ============================================================
    # EMAIL
    # ============================================================

    {
        "id": "gmail",
        "name": "Gmail / Google Workspace",
        "vendor": "Google",
        "category": "Email",
        "auth": "oauth",
        "description": "Send and read email from a Google Workspace mailbox.",
        "logo": "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_32dp.png",
        "scopes": [
            "Send email",
            "Read replies",
            "Delivery events"
        ]
    },

    {
        "id": "microsoft365",
        "name": "Microsoft 365 / Outlook",
        "vendor": "Microsoft",
        "category": "Email",
        "auth": "oauth",
        "description": "Connect Outlook mail and Microsoft 365.",
        "logo": "https://img.icons8.com/color/96/microsoft-outlook-2019.png",
        "scopes": [
            "Send email",
            "Read replies"
        ]
    },

    {
        "id": "resend",
        "name": "Resend",
        "vendor": "Resend",
        "category": "Email",
        "auth": "api_key",
        "description": "Email delivery and event webhooks.",
        "logo": "https://avatars.githubusercontent.com/u/110813679?s=200&v=4",
        "scopes": [
            "Send email",
            "Delivery events"
        ]
    },

    {
        "id": "sendgrid",
        "name": "SendGrid",
        "vendor": "Twilio",
        "category": "Email",
        "auth": "api_key",
        "description": "Email delivery and event processing.",
        "logo": "https://sendgrid.com/favicon.ico",
        "scopes": [
            "Send email",
            "Delivery events"
        ]
    },

    {
        "id": "mailgun",
        "name": "Mailgun",
        "vendor": "Sinch",
        "category": "Email",
        "auth": "api_key",
        "description": "Email delivery and event processing.",
        "logo": "https://www.mailgun.com/favicon.ico",
        "scopes": [
            "Send email",
            "Events"
        ]
    },

    # ============================================================
    # CALENDAR
    # ============================================================

    {
        "id": "google_calendar",
        "name": "Google Calendar",
        "vendor": "Google",
        "category": "Calendar",
        "auth": "oauth",
        "description": "Meetings, availability and booking state.",
        "logo": "https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_32dp.png",
        "scopes": [
            "Read calendar",
            "Create/update events"
        ]
    },

    {
        "id": "outlook_calendar",
        "name": "Outlook Calendar",
        "vendor": "Microsoft",
        "category": "Calendar",
        "auth": "oauth",
        "description": "Microsoft calendar availability and meetings.",
        "logo": "https://img.icons8.com/color/96/microsoft-outlook-2019.png",
        "scopes": [
            "Read calendar",
            "Create/update events"
        ]
    },

    {
        "id": "calendly",
        "name": "Calendly",
        "vendor": "Calendly",
        "category": "Calendar",
        "auth": "oauth",
        "description": "Stop sequences when prospects book meetings.",
        "logo": "https://assets.calendly.com/assets/frontend/media/logo-80b5d6e8.svg",
        "scopes": [
            "Read events",
            "Webhooks"
        ]
    },

    # ============================================================
    # STORAGE
    # ============================================================

    {
        "id": "google_drive",
        "name": "Google Drive",
        "vendor": "Google",
        "category": "Storage",
        "auth": "oauth",
        "description": "Store research files and exports in Drive.",
        "logo": "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
        "scopes": [
            "Read/write files"
        ]
    },

    # ============================================================
    # CRM
    # ============================================================

    {
        "id": "hubspot",
        "name": "HubSpot",
        "vendor": "HubSpot",
        "category": "CRM",
        "auth": "oauth",
        "description": "Sync contacts, companies and CRM activity.",
        "logo": "https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines-the-hubspot-logo.svg",
        "scopes": [
            "Contacts",
            "Companies",
            "CRM activity"
        ]
    },

    {
        "id": "salesforce",
        "name": "Salesforce",
        "vendor": "Salesforce",
        "category": "CRM",
        "auth": "oauth",
        "description": "Sync leads, contacts and accounts.",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
        "scopes": [
            "Leads",
            "Contacts",
            "Accounts"
        ]
    },

    {
        "id": "pipedrive",
        "name": "Pipedrive",
        "vendor": "Pipedrive",
        "category": "CRM",
        "auth": "api_key",
        "description": "Push qualified prospects into your pipeline.",
        "logo": "https://cdn.worldvectorlogo.com/logos/pipedrive.svg",
        "scopes": [
            "Persons",
            "Organizations",
            "Deals"
        ]
    },

    {
        "id": "zoho",
        "name": "Zoho CRM",
        "vendor": "Zoho",
        "category": "CRM",
        "auth": "oauth",
        "description": "Sync leads, contacts and CRM activity.",
        "logo": "https://www.zohowebstatic.com/sites/default/files/zoho-logo.png",
        "scopes": [
            "Leads",
            "Contacts"
        ]
    },

    # ============================================================
    # DATA
    # ============================================================

    {
        "id": "apollo",
        "name": "Apollo",
        "vendor": "Apollo",
        "category": "Data & Enrichment",
        "auth": "api_key",
        "description": "Use your Apollo account for discovery and enrichment.",
        "logo": "https://www.apollo.io/images-v3/logo.svg",
        "scopes": [
            "Search",
            "Enrichment"
        ]
    },

    {
        "id": "hunter",
        "name": "Hunter",
        "vendor": "Hunter",
        "category": "Data & Enrichment",
        "auth": "api_key",
        "description": "Discover and verify professional email addresses.",
        "logo": "https://hunter.io/favicon-32x32.png",
        "scopes": [
            "Email finder",
            "Verification"
        ]
    },

    {
        "id": "peopledatalabs",
        "name": "People Data Labs",
        "vendor": "PDL",
        "category": "Data & Enrichment",
        "auth": "api_key",
        "description": "Person and company enrichment.",
        "logo": "https://www.peopledatalabs.com/favicon.ico",
        "scopes": [
            "Person",
            "Company"
        ]
    },

    {
        "id": "crunchbase",
        "name": "Crunchbase",
        "vendor": "Crunchbase",
        "category": "Data & Enrichment",
        "auth": "api_key",
        "description": "Company and funding intelligence.",
        "logo": "https://www.crunchbase.com/favicon.ico",
        "scopes": [
            "Companies",
            "Funding"
        ]
    },

    # ============================================================
    # AI / LLM
    # ============================================================

    {
        "id": "openai",
        "name": "OpenAI",
        "vendor": "OpenAI",
        "category": "AI / LLM",
        "auth": "api_key",
        "description": "Use OpenAI models for research, scoring and personalization.",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        "scopes": [
            "LLM inference",
            "Model selection"
        ]
    },

    {
        "id": "anthropic",
        "name": "Anthropic / Claude",
        "vendor": "Anthropic",
        "category": "AI / LLM",
        "auth": "api_key",
        "description": "Use Claude for reasoning and research workflows.",
        "logo": "https://www.anthropic.com/favicon.ico",
        "scopes": [
            "LLM inference",
            "Model selection"
        ]
    },

    {
        "id": "gemini",
        "name": "Google Gemini",
        "vendor": "Google",
        "category": "AI / LLM",
        "auth": "api_key",
        "description": "Use Gemini models for intelligence workflows.",
        "logo": "https://www.gstatic.com/lamda/images/gemini_favicon_1c1a01ba6d3f4f5f8d9f.png",
        "scopes": [
            "LLM inference",
            "Model selection"
        ]
    },

    {
        "id": "openrouter",
        "name": "OpenRouter",
        "vendor": "OpenRouter",
        "category": "AI / LLM",
        "auth": "api_key",
        "description": "Route SignalOS to multiple LLM providers through one API.",
        "logo": "https://openrouter.ai/favicon.ico",
        "scopes": [
            "LLM routing",
            "Model selection"
        ]
    },

    # ============================================================
    # VOICE / MESSAGING
    # ============================================================

    {
        "id": "twilio",
        "name": "Twilio",
        "vendor": "Twilio",
        "category": "Voice & Messaging",
        "auth": "api_key",
        "description": "Optional SMS and voice infrastructure.",
        "logo": "https://www.twilio.com/favicon.ico",
        "scopes": [
            "SMS",
            "Voice"
        ]
    },

    {
        "id": "whatsapp",
        "name": "WhatsApp Business",
        "vendor": "Meta",
        "category": "Voice & Messaging",
        "auth": "oauth",
        "description": "Optional WhatsApp Business messaging.",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
        "scopes": [
            "Send messages",
            "Webhooks"
        ]
    },

    # ============================================================
    # NOTIFICATIONS
    # ============================================================

    {
        "id": "slack",
        "name": "Slack",
        "vendor": "Slack",
        "category": "Notifications",
        "auth": "oauth",
        "description": "Internal alerts and handoffs.",
        "logo": "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
        "scopes": [
            "Send messages"
        ]
    },

    {
        "id": "teams",
        "name": "Microsoft Teams",
        "vendor": "Microsoft",
        "category": "Notifications",
        "auth": "oauth",
        "description": "Internal SignalOS notifications and handoffs.",
        "logo": "https://img.icons8.com/color/96/microsoft-teams.png",
        "scopes": [
            "Send messages"
        ]
    },

    {
        "id": "webhook",
        "name": "Custom Webhook",
        "vendor": "SignalOS",
        "category": "Notifications",
        "auth": "api_key",
        "description": "Send SignalOS events to an authorized webhook.",
        "logo": "https://cdn-icons-png.flaticon.com/512/126/126472.png",
        "scopes": [
            "Outbound events"
        ]
    }
]


def provider_by_id(pid: str):
    return next(
        (p for p in PROVIDERS if p["id"] == pid),
        None
    )


def env(*names):
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return None


def oauth_config(pid: str):

    configs = {

        "gmail": (
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_GMAIL_REDIRECT_URI"
        ),

        "google_calendar": (
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_CALENDAR_REDIRECT_URI"
        ),

        "google_drive": (
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_DRIVE_REDIRECT_URI"
        ),

        "microsoft365": (
            "MICROSOFT_CLIENT_ID",
            "MICROSOFT_CLIENT_SECRET",
            "MICROSOFT_OUTLOOK_REDIRECT_URI"
        ),

        "outlook_calendar": (
            "MICROSOFT_CLIENT_ID",
            "MICROSOFT_CLIENT_SECRET",
            "MICROSOFT_CALENDAR_REDIRECT_URI"
        ),

        "teams": (
            "MICROSOFT_CLIENT_ID",
            "MICROSOFT_CLIENT_SECRET",
            "MICROSOFT_TEAMS_REDIRECT_URI"
        ),

        "calendly": (
            "CALENDLY_CLIENT_ID",
            "CALENDLY_CLIENT_SECRET",
            "CALENDLY_REDIRECT_URI"
        ),

        "hubspot": (
            "HUBSPOT_CLIENT_ID",
            "HUBSPOT_CLIENT_SECRET",
            "HUBSPOT_REDIRECT_URI"
        ),

        "salesforce": (
            "SALESFORCE_CLIENT_ID",
            "SALESFORCE_CLIENT_SECRET",
            "SALESFORCE_REDIRECT_URI"
        ),

        "slack": (
            "SLACK_CLIENT_ID",
            "SLACK_CLIENT_SECRET",
            "SLACK_REDIRECT_URI"
        ),

        "whatsapp": (
            "META_CLIENT_ID",
            "META_CLIENT_SECRET",
            "META_REDIRECT_URI"
        ),

        "zoho": (
            "ZOHO_CLIENT_ID",
            "ZOHO_CLIENT_SECRET",
            "ZOHO_REDIRECT_URI"
        )
    }

    if pid not in configs:
        return None

    client_id_name, client_secret_name, redirect_name = configs[pid]

    client_id = env(client_id_name)
    client_secret = env(client_secret_name)
    redirect_uri = env(redirect_name)

    if not client_id or not client_secret or not redirect_uri:
        return None

    token_urls = {

        "gmail": "https://oauth2.googleapis.com/token",

        "google_calendar": "https://oauth2.googleapis.com/token",

        "google_drive": "https://oauth2.googleapis.com/token",

        "microsoft365":
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",

        "outlook_calendar":
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",

        "teams":
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",

        "calendly":
            "https://auth.calendly.com/oauth/token",

        "hubspot":
            "https://api.hubapi.com/oauth/v1/token",

        "salesforce":
            "https://login.salesforce.com/services/oauth2/token",

        "slack":
            "https://slack.com/api/oauth.v2.access",

        "whatsapp":
            "https://graph.facebook.com/v23.0/oauth/access_token",

        "zoho":
            "https://accounts.zoho.com/oauth/v2/token"
    }

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "token_url": token_urls[pid]
    }


def build_authorization_url(pid: str):

    state = secrets.token_urlsafe(32)

    provider = provider_by_id(pid)

    if not provider:
        raise ValueError("Provider not found.")

    if provider["auth"] != "oauth":
        raise ValueError(
            "This provider uses secure API-key configuration."
        )

    config = oauth_config(pid)

    if not config:
        raise ValueError(
            f"{provider['name']} OAuth is not configured on the SignalOS server."
        )

    # ------------------------------------------------------------
    # GOOGLE
    # ------------------------------------------------------------

    if pid in {
        "gmail",
        "google_calendar",
        "google_drive"
    }:

        scopes = {

            "gmail":
                "openid email "
                "https://www.googleapis.com/auth/gmail.send "
                "https://www.googleapis.com/auth/gmail.readonly",

            "google_calendar":
                "openid email "
                "https://www.googleapis.com/auth/calendar",

            "google_drive":
                "openid email "
                "https://www.googleapis.com/auth/drive.file"
        }[pid]

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": scopes,
            "state": state
        }

        return (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # MICROSOFT
    # ------------------------------------------------------------

    if pid in {
        "microsoft365",
        "outlook_calendar",
        "teams"
    }:

        scopes = {

            "microsoft365":
                "openid email offline_access Mail.Read Mail.Send",

            "outlook_calendar":
                "openid email offline_access Calendars.ReadWrite",

            "teams":
                "openid email offline_access User.Read Chat.ReadWrite"
        }[pid]

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "response_mode": "query",
            "scope": scopes,
            "state": state
        }

        return (
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # CALENDLY
    # ------------------------------------------------------------

    if pid == "calendly":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "state": state
        }

        return (
            "https://auth.calendly.com/oauth/authorize?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # HUBSPOT
    # ------------------------------------------------------------

    if pid == "hubspot":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "scope":
                "crm.objects.contacts.read "
                "crm.objects.contacts.write "
                "crm.objects.companies.read "
                "crm.objects.companies.write",
            "state": state
        }

        return (
            "https://app.hubspot.com/oauth/authorize?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # SALESFORCE
    # ------------------------------------------------------------

    if pid == "salesforce":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "state": state
        }

        return (
            "https://login.salesforce.com/services/oauth2/authorize?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # SLACK
    # ------------------------------------------------------------

    if pid == "slack":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "scope": "chat:write,channels:read",
            "state": state
        }

        return (
            "https://slack.com/oauth/v2/authorize?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # WHATSAPP
    # ------------------------------------------------------------

    if pid == "whatsapp":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "state": state
        }

        return (
            "https://www.facebook.com/v23.0/dialog/oauth?"
            + urlencode(query),
            state
        )

    # ------------------------------------------------------------
    # ZOHO
    # ------------------------------------------------------------

    if pid == "zoho":

        query = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "access_type": "offline",
            "scope":
                "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL",
            "state": state
        }

        return (
            "https://accounts.zoho.com/oauth/v2/auth?"
            + urlencode(query),
            state
        )

    raise ValueError(
        f"{provider['name']} OAuth adapter is not enabled."
    )
