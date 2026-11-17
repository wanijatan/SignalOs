from __future__ import annotations

import os
import secrets
from urllib.parse import urlencode

PROVIDERS = [
    {"id":"gmail","name":"Gmail / Google Workspace","category":"Email","description":"Send and read email from a Google mailbox","auth":"oauth","logo":"https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_32dp.png","featured":True},
    {"id":"microsoft365","name":"Microsoft 365 / Outlook","category":"Email","description":"Connect Outlook mail and Microsoft 365","auth":"oauth","logo":"https://img.icons8.com/color/96/microsoft-outlook-2019.png","featured":True},
    {"id":"resend","name":"Resend","category":"Email","description":"Transactional and outbound email delivery","auth":"api_key","logo":"https://avatars.githubusercontent.com/u/110813679?s=200&v=4","featured":True},
    {"id":"calendly","name":"Calendly","category":"Calendar","description":"Stop outreach when a prospect books a meeting","auth":"oauth","logo":"https://assets.calendly.com/assets/frontend/media/logo-80b5d6e8.svg","featured":True},
    {"id":"google_calendar","name":"Google Calendar","category":"Calendar","description":"Sync meetings and calendar availability","auth":"oauth","logo":"https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_32dp.png","featured":False},
    {"id":"outlook_calendar","name":"Outlook Calendar","category":"Calendar","description":"Sync Microsoft calendar events","auth":"oauth","logo":"https://img.icons8.com/color/96/microsoft-outlook-2019.png","featured":False},
    {"id":"hubspot","name":"HubSpot","category":"CRM","description":"Sync contacts, companies, deals and activity","auth":"oauth","logo":"https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines-the-hubspot-logo.svg","featured":True},
    {"id":"salesforce","name":"Salesforce","category":"CRM","description":"Sync prospects and CRM activity","auth":"oauth","logo":"https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg","featured":False},
    {"id":"pipedrive","name":"Pipedrive","category":"CRM","description":"Push qualified prospects into sales pipelines","auth":"api_key","logo":"https://cdn.worldvectorlogo.com/logos/pipedrive.svg","featured":False},
    {"id":"apollo","name":"Apollo","category":"Data & Enrichment","description":"Use your Apollo account for prospect data","auth":"api_key","logo":"https://www.apollo.io/images-v3/logo.svg","featured":True},
    {"id":"hunter","name":"Hunter","category":"Data & Enrichment","description":"Email discovery and verification","auth":"api_key","logo":"https://hunter.io/favicon-32x32.png","featured":False},
    {"id":"openai","name":"OpenAI","category":"AI","description":"Use your own OpenAI API key for AI agents","auth":"api_key","logo":"https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg","featured":True},
    {"id":"anthropic","name":"Anthropic / Claude","category":"AI","description":"Use Claude for research and personalization","auth":"api_key","logo":"https://www.anthropic.com/favicon.ico","featured":False},
    {"id":"gemini","name":"Google Gemini","category":"AI","description":"Use Gemini for prospect intelligence","auth":"api_key","logo":"https://www.gstatic.com/lamda/images/gemini_favicon_1c1a01ba6d3f4f5f8d9f.png","featured":False},
    {"id":"twilio","name":"Twilio","category":"Voice & Messaging","description":"Optional calling and SMS infrastructure","auth":"api_key","logo":"https://www.twilio.com/favicon.ico","featured":False},
    {"id":"whatsapp","name":"WhatsApp Business","category":"Voice & Messaging","description":"Optional WhatsApp Business messaging","auth":"oauth","logo":"https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg","featured":False},
    {"id":"slack","name":"Slack","category":"Notifications","description":"Send internal alerts and handoff notifications","auth":"oauth","logo":"https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png","featured":False},
]


def provider_by_id(provider_id: str):
    return next((p for p in PROVIDERS if p["id"] == provider_id), None)


def env_first(*keys):
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def require_env(provider_id: str, *keys):
    value = env_first(*keys)
    if not value:
        raise ValueError(f"{provider_by_id(provider_id)['name']} is not configured yet. Add the provider developer credentials in Render first.")
    return value


def build_authorization_url(provider_id: str):
    state = secrets.token_urlsafe(32)
    if provider_id == "gmail":
        client = require_env("gmail", "GOOGLE_CLIENT_ID")
        redirect = require_env("gmail", "GOOGLE_GMAIL_REDIRECT_URI", "GOOGLE_REDIRECT_URI")
        params = {
            "client_id": client,
            "redirect_uri": redirect,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": "openid email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
            "state": state,
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    if provider_id == "google_calendar":
        client = require_env("google_calendar", "GOOGLE_CLIENT_ID")
        redirect = require_env("google_calendar", "GOOGLE_CALENDAR_REDIRECT_URI", "GOOGLE_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"response_type":"code","access_type":"offline","prompt":"consent","scope":"openid email https://www.googleapis.com/auth/calendar","state":state}
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    if provider_id == "microsoft365":
        client = require_env("microsoft365", "MICROSOFT_CLIENT_ID")
        redirect = require_env("microsoft365", "MICROSOFT_OUTLOOK_REDIRECT_URI", "MICROSOFT_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"response_type":"code","response_mode":"query","scope":"openid email offline_access Mail.Read Mail.Send","state":state}
        return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + urlencode(params)
    if provider_id == "outlook_calendar":
        client = require_env("outlook_calendar", "MICROSOFT_CLIENT_ID")
        redirect = require_env("outlook_calendar", "MICROSOFT_CALENDAR_REDIRECT_URI", "MICROSOFT_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"response_type":"code","response_mode":"query","scope":"openid email offline_access Calendars.ReadWrite","state":state}
        return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + urlencode(params)
    if provider_id == "hubspot":
        client = require_env("hubspot", "HUBSPOT_CLIENT_ID")
        redirect = require_env("hubspot", "HUBSPOT_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"scope":"crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.companies.write","state":state}
        return "https://app.hubspot.com/oauth/authorize?" + urlencode(params)
    if provider_id == "calendly":
        client = require_env("calendly", "CALENDLY_CLIENT_ID")
        redirect = require_env("calendly", "CALENDLY_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"response_type":"code","state":state}
        return "https://auth.calendly.com/oauth/authorize?" + urlencode(params)
    if provider_id == "whatsapp":
        app_id = require_env("whatsapp", "META_APP_ID", "META_CLIENT_ID")
        redirect = require_env("whatsapp", "META_REDIRECT_URI")
        params = {"client_id":app_id,"redirect_uri":redirect,"response_type":"code","state":state}
        return "https://www.facebook.com/v23.0/dialog/oauth?" + urlencode(params)
    if provider_id == "slack":
        client = require_env("slack", "SLACK_CLIENT_ID")
        redirect = require_env("slack", "SLACK_REDIRECT_URI")
        params = {"client_id":client,"redirect_uri":redirect,"scope":"chat:write,channels:read","state":state}
        return "https://slack.com/oauth/v2/authorize?" + urlencode(params)
    raise ValueError(f"{provider_by_id(provider_id)['name']} uses API-key configuration. Click Configure instead.")
