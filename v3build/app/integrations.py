from __future__ import annotations

import os
import secrets

from urllib.parse import urlencode


PROVIDERS = [
    {
        "id": "gmail",
        "name": "Gmail",
        "vendor": "Google",
        "category": "Email",
        "auth": "oauth",
        "description": "Send, read and track email from Google Workspace.",
        "logo": "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_32dp.png",
        "scopes": [
            "Send email",
            "Read replies",
            "Delivery events",
        ],
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
            "Read replies",
            "Calendar",
        ],
    },
    {
        "id": "resend",
        "name": "Resend",
        "vendor": "Resend",
        "category": "Email",
        "auth": "api_key",
        "description": "Reliable transactional and outbound email delivery.",
        "logo": "https://avatars.githubusercontent.com/u/110813679?s=200&v=4",
        "scopes": [
            "Send email",
            "Delivery events",
        ],
    },
    {
        "id": "sendgrid",
        "name": "SendGrid",
        "vendor": "Twilio",
        "category": "Email",
        "auth": "api_key",
        "description": "Email delivery and event webhooks.",
        "logo": "https://sendgrid.com/favicon.ico",
        "scopes": [
            "Send email",
            "Delivery events",
        ],
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
            "Events",
        ],
    },
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
            "Create/update events",
        ],
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
            "Create/update events",
        ],
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
            "Webhooks",
        ],
    },
    {
        "id": "google_drive",
        "name": "Google Drive",
        "vendor": "Google",
        "category": "Storage",
        "auth": "oauth",
        "description": "Store research files and exports in Drive.",
        "logo": "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
        "scopes": [
            "Read/write files",
        ],
    },
    {
        "id": "hubspot",
        "name": "HubSpot",
        "vendor": "HubSpot",
        "category": "CRM",
        "auth": "oauth",
        "description": "Sync contacts, companies, lifecycle and activity.",
        "logo": "https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines-the-hubspot-logo.svg",
        "scopes": [
            "Contacts",
            "Companies",
            "CRM activity",
        ],
    },
    {
        "id": "salesforce",
        "name": "Salesforce",
        "vendor": "Salesforce",
        "category": "CRM",
        "auth": "oauth",
        "description": "Sync CRM records and qualified prospects.",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
        "scopes": [
            "Leads",
            "Contacts",
            "Accounts",
        ],
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
            "Deals",
        ],
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
            "Contacts",
        ],
    },
    {
        "id": "apollo",
        "name": "Apollo",
        "vendor": "Apollo",
        "category": "Data & Enrichment",
        "auth": "api_key",
        "description": "Use your Apollo account for prospect discovery and enrichment.",
        "logo": "https://www.apollo.io/images-v3/logo.svg",
        "scopes": [
            "Search",
            "Enrichment",
        ],
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
            "Verification",
        ],
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
            "Company",
        ],
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
            "Funding",
        ],
    },
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
        ],
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
        ],
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
        ],
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
        ],
    },
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
            "Voice",
        ],
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
            "Webhooks",
        ],
    },
    {
        "id": "slack",
        "name": "Slack",
        "vendor": "Slack",
        "category": "Notifications",
        "auth": "oauth",
        "description": "Internal alerts, handoffs and operational notifications.",
        "logo": "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
        "scopes": [
            "Send messages",
        ],
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
            "Send messages",
        ],
    },
    {
        "id": "webhook",
        "name": "Custom Webhook",
        "vendor": "SignalOS",
        "category": "Notifications",
        "auth": "api_key",
        "description": "Send SignalOS events to any authorized webhook.",
        "logo": "https://cdn-icons-png.flaticon.com/512/126/126472.png",
        "scopes": [
            "Outbound events",
        ],
    },
]


def provider_by_id(pid):
    return next(
        (
            provider
            for provider in PROVIDERS
            if provider["id"] == pid
        ),
        None,
    )


def env(*names):
    for name in names:
        if os.getenv(name):
            return os.getenv(name)

    return None


def auth_url(pid):
    state = secrets.token_urlsafe(32)

    provider = provider_by_id(pid)

    if not provider:
        raise ValueError("Provider not found")

    if provider["auth"] != "oauth":
        raise ValueError(
            "This provider uses secure API-key configuration."
        )

    if pid == "gmail":
        client_id = env("GOOGLE_CLIENT_ID")
        redirect = env(
            "GOOGLE_GMAIL_REDIRECT_URI",
            "GOOGLE_REDIRECT_URI",
        )

        if not client_id or not redirect:
            raise ValueError(
                "Google OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": (
                "openid email "
                "https://www.googleapis.com/auth/gmail.send "
                "https://www.googleapis.com/auth/gmail.readonly"
            ),
            "state": state,
        }

        return (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            + urlencode(query),
            state,
        )

    if pid == "google_calendar":
        client_id = env("GOOGLE_CLIENT_ID")
        redirect = env(
            "GOOGLE_CALENDAR_REDIRECT_URI",
            "GOOGLE_REDIRECT_URI",
        )

        if not client_id or not redirect:
            raise ValueError(
                "Google OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": (
                "openid email "
                "https://www.googleapis.com/auth/calendar"
            ),
            "state": state,
        }

        return (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            + urlencode(query),
            state,
        )

    if pid == "microsoft365":
        client_id = env("MICROSOFT_CLIENT_ID")
        redirect = env(
            "MICROSOFT_OUTLOOK_REDIRECT_URI",
            "MICROSOFT_REDIRECT_URI",
        )

        if not client_id or not redirect:
            raise ValueError(
                "Microsoft OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "response_mode": "query",
            "scope": (
                "openid email offline_access "
                "Mail.Read Mail.Send"
            ),
            "state": state,
        }

        return (
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "outlook_calendar":
        client_id = env("MICROSOFT_CLIENT_ID")
        redirect = env(
            "MICROSOFT_CALENDAR_REDIRECT_URI",
            "MICROSOFT_REDIRECT_URI",
        )

        if not client_id or not redirect:
            raise ValueError(
                "Microsoft OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "response_mode": "query",
            "scope": (
                "openid email offline_access "
                "Calendars.ReadWrite"
            ),
            "state": state,
        }

        return (
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "calendly":
        client_id = env("CALENDLY_CLIENT_ID")
        redirect = env("CALENDLY_REDIRECT_URI")

        if not client_id or not redirect:
            raise ValueError(
                "Calendly OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "state": state,
        }

        return (
            "https://auth.calendly.com/oauth/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "hubspot":
        client_id = env("HUBSPOT_CLIENT_ID")
        redirect = env("HUBSPOT_REDIRECT_URI")

        if not client_id or not redirect:
            raise ValueError(
                "HubSpot OAuth is not configured on the SignalOS server."
            )

        scope = (
            "crm.objects.contacts.read "
            "crm.objects.contacts.write "
            "crm.objects.companies.read "
            "crm.objects.companies.write"
        )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "scope": scope,
            "state": state,
        }

        return (
            "https://app.hubspot.com/oauth/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "salesforce":
        client_id = env("SALESFORCE_CLIENT_ID")
        redirect = env("SALESFORCE_REDIRECT_URI")

        if not client_id or not redirect:
            raise ValueError(
                "Salesforce OAuth is not configured on the SignalOS server."
            )

        url = env("SALESFORCE_AUTH_URL")

        if url:
            return url, state

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "state": state,
        }

        return (
            "https://login.salesforce.com/services/oauth2/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "slack":
        client_id = env("SLACK_CLIENT_ID")
        redirect = env("SLACK_REDIRECT_URI")

        if not client_id or not redirect:
            raise ValueError(
                "Slack OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "scope": "chat:write,channels:read",
            "state": state,
        }

        return (
            "https://slack.com/oauth/v2/authorize?"
            + urlencode(query),
            state,
        )

    if pid == "whatsapp":
        client_id = env(
            "META_CLIENT_ID",
            "META_APP_ID",
        )

        redirect = env("META_REDIRECT_URI")

        if not client_id or not redirect:
            raise ValueError(
                "Meta/WhatsApp OAuth is not configured on the SignalOS server."
            )

        query = {
            "client_id": client_id,
            "redirect_uri": redirect,
            "response_type": "code",
            "state": state,
        }

        return (
            "https://www.facebook.com/v23.0/dialog/oauth?"
            + urlencode(query),
            state,
        )

    if pid in (
        "teams",
        "google_drive",
        "zoho",
    ):
        raise ValueError(
            f'{provider["name"]} is listed and ready for provider OAuth credentials, '
            "but its OAuth adapter is not enabled in this deployment."
        )

    raise ValueError(
        f'{provider["name"]} is not configured for OAuth in this deployment.'
    )
