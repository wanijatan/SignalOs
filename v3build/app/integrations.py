import base64, hashlib, json, os, secrets, urllib.parse
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from .config import settings


def _fernet():
    key = hashlib.sha256(settings.secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))

def encrypt(value):
    return _fernet().encrypt(value.encode()).decode()

def decrypt(value):
    return _fernet().decrypt(value.encode()).decode()

def pkce_pair():
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    return verifier, challenge

def now(): return datetime.now(timezone.utc)

CATALOG = {
  "email": [
    {"id":"resend","name":"Resend","description":"Email sending and delivery","mode":"oauth","oauth_env":"RESEND","scopes":["emails:send"],"recommended":True},
    {"id":"gmail","name":"Gmail / Google Workspace","description":"Send and receive email","mode":"oauth","oauth_env":"GOOGLE","scopes":["https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/gmail.readonly"]},
    {"id":"outlook","name":"Microsoft 365 / Outlook","description":"Send and receive Microsoft email","mode":"oauth","oauth_env":"MICROSOFT","scopes":["Mail.Send","Mail.Read"]},
    {"id":"sendgrid","name":"SendGrid","description":"Transactional and outbound email","mode":"api_key"},
    {"id":"mailgun","name":"Mailgun","description":"Transactional email","mode":"api_key"},
    {"id":"smtp","name":"Custom SMTP","description":"Connect any SMTP mailbox/provider","mode":"manual"}
  ],
  "calendar": [
    {"id":"calendly","name":"Calendly","description":"Booking links, scheduled meetings and webhooks","mode":"oauth","oauth_env":"CALENDLY","scopes":["scheduled_events:read","webhooks:write"],"recommended":True},
    {"id":"google_calendar","name":"Google Calendar","description":"Calendar availability and events","mode":"oauth","oauth_env":"GOOGLE","scopes":["https://www.googleapis.com/auth/calendar.readonly","https://www.googleapis.com/auth/calendar.events"]},
    {"id":"outlook_calendar","name":"Outlook Calendar","description":"Microsoft calendar and meetings","mode":"oauth","oauth_env":"MICROSOFT","scopes":["Calendars.Read","Calendars.ReadWrite"]},
    {"id":"cal_com","name":"Cal.com","description":"Open scheduling and booking","mode":"api_key"}
  ],
  "voice": [
    {"id":"twilio","name":"Twilio","description":"Voice, SMS and WhatsApp through Twilio","mode":"oauth","oauth_env":"TWILIO"},
    {"id":"exotel","name":"Exotel","description":"India and international voice/SMS","mode":"api_key"},
    {"id":"telnyx","name":"Telnyx","description":"Voice, messaging and numbers","mode":"api_key"},
    {"id":"plivo","name":"Plivo","description":"Voice and SMS","mode":"api_key"},
    {"id":"vonage","name":"Vonage","description":"Voice and messaging APIs","mode":"api_key"},
    {"id":"sip","name":"SIP / Custom PBX","description":"Connect a SIP trunk or PBX","mode":"manual"}
  ],
  "messaging": [
    {"id":"whatsapp_meta","name":"WhatsApp Business (Meta)","description":"WhatsApp Cloud API via Embedded Signup","mode":"oauth","oauth_env":"META","scopes":["whatsapp_business_management","whatsapp_business_messaging"],"recommended":True},
    {"id":"whatsapp_twilio","name":"WhatsApp via Twilio","description":"WhatsApp messaging through Twilio","mode":"oauth","oauth_env":"TWILIO"},
    {"id":"sms_twilio","name":"SMS via Twilio","description":"SMS messaging","mode":"oauth","oauth_env":"TWILIO"}
  ],
  "crm": [
    {"id":"hubspot","name":"HubSpot","description":"Contacts, companies, deals and activities","mode":"oauth","oauth_env":"HUBSPOT"},
    {"id":"salesforce","name":"Salesforce","description":"CRM contacts, leads and opportunities","mode":"oauth","oauth_env":"SALESFORCE"},
    {"id":"pipedrive","name":"Pipedrive","description":"People, organizations, deals and activities","mode":"oauth","oauth_env":"PIPEDRIVE"},
    {"id":"zoho","name":"Zoho CRM","description":"CRM records and activities","mode":"oauth","oauth_env":"ZOHO"},
    {"id":"freshsales","name":"Freshsales","description":"CRM contacts and deals","mode":"api_key"}
  ],
  "ai": [
    {"id":"openai","name":"OpenAI","description":"LLM, reasoning and agent intelligence","mode":"api_key","recommended":True},
    {"id":"anthropic","name":"Anthropic / Claude","description":"LLM and agent intelligence","mode":"api_key"},
    {"id":"google_gemini","name":"Google Gemini","description":"Gemini models","mode":"api_key"},
    {"id":"openrouter","name":"OpenRouter","description":"Access multiple model providers","mode":"api_key"},
    {"id":"custom_ai","name":"Custom OpenAI-compatible API","description":"Connect a compatible model endpoint","mode":"manual"}
  ],
  "data": [
    {"id":"apollo","name":"Apollo","description":"B2B prospect and company data","mode":"api_key"},
    {"id":"hunter","name":"Hunter","description":"Email discovery and verification","mode":"api_key"},
    {"id":"peopledatalabs","name":"People Data Labs","description":"People and company enrichment","mode":"api_key"},
    {"id":"crunchbase","name":"Crunchbase","description":"Company and funding intelligence","mode":"api_key"},
    {"id":"custom_enrichment","name":"Custom Enrichment API","description":"Bring your approved data provider","mode":"manual"}
  ],
  "storage": [
    {"id":"google_drive","name":"Google Drive","description":"Store proposals, files and campaign assets","mode":"oauth","oauth_env":"GOOGLE","scopes":["https://www.googleapis.com/auth/drive.file"]},
    {"id":"dropbox","name":"Dropbox","description":"File storage","mode":"oauth","oauth_env":"DROPBOX"},
    {"id":"onedrive","name":"OneDrive","description":"Microsoft file storage","mode":"oauth","oauth_env":"MICROSOFT","scopes":["Files.ReadWrite"]}
  ],
  "notifications": [
    {"id":"slack","name":"Slack","description":"AI alerts and handoffs","mode":"oauth","oauth_env":"SLACK"},
    {"id":"teams","name":"Microsoft Teams","description":"AI alerts and handoffs","mode":"oauth","oauth_env":"MICROSOFT"},
    {"id":"webhook","name":"Custom Webhook","description":"Send events to any HTTPS endpoint","mode":"manual"}
  ]
}

def all_providers():
    out=[]
    for category, items in CATALOG.items():
        for item in items:
            x=dict(item); x['category']=category; out.append(x)
    return out

def provider(provider_id):
    return next((x for x in all_providers() if x['id']==provider_id), None)

OAUTH = {
 'resend': {'authorize':'https://api.resend.com/oauth/authorize','token':'https://api.resend.com/oauth/token'},
 'calendly': {'authorize':'https://auth.calendly.com/oauth/authorize','token':'https://auth.calendly.com/oauth/token'},
 'twilio': {'authorize_env':'TWILIO_AUTHORIZATION_URL','token':'https://oauth.twilio.com/v2/token'},
 'google': {'authorize':'https://accounts.google.com/o/oauth2/v2/auth','token':'https://oauth2.googleapis.com/token'},
 'microsoft': {'authorize':'https://login.microsoftonline.com/common/oauth2/v2.0/authorize','token':'https://login.microsoftonline.com/common/oauth2/v2.0/token'},
 'hubspot': {'authorize':'https://app.hubspot.com/oauth/authorize','token':'https://api.hubapi.com/oauth/v1/token'},
 'slack': {'authorize':'https://slack.com/oauth/v2/authorize','token':'https://slack.com/api/oauth.v2.access'},
}

def oauth_settings(provider_id):
    p=provider(provider_id)
    env=p.get('oauth_env') if p else None
    if not env: return None
    cid=os.getenv(f'{env}_CLIENT_ID','')
    secret=os.getenv(f'{env}_CLIENT_SECRET','')
    redirect=os.getenv(f'{env}_REDIRECT_URI','') or os.getenv('OAUTH_REDIRECT_URI','')
    if provider_id=='resend':
        # Resend supports Dynamic Client Registration; a static client can also be supplied.
        cid=os.getenv('RESEND_CLIENT_ID',cid)
        secret=os.getenv('RESEND_CLIENT_SECRET',secret)
    return {'client_id':cid,'client_secret':secret,'redirect_uri':redirect}

def authorization_url(provider_id, state, verifier):
    p=provider(provider_id); cfg=oauth_settings(provider_id)
    if not p or p.get('mode')!='oauth': raise ValueError('Provider is not OAuth based')
    if not cfg or not cfg.get('client_id') or not cfg.get('redirect_uri'):
        raise RuntimeError('OAuth credentials/redirect URI are not configured for this provider')
    key=p.get('oauth_env') or ''
    endpoint=OAUTH.get(key.lower(),{}).get('authorize') or OAUTH.get(provider_id,{}).get('authorize')
    if provider_id=='twilio': endpoint=os.getenv('TWILIO_AUTHORIZATION_URL','')
    if not endpoint: raise RuntimeError('Authorization endpoint is not configured')
    scope=' '.join(p.get('scopes',[]))
    params={'client_id':cfg['client_id'],'response_type':'code','redirect_uri':cfg['redirect_uri'],'state':state,'scope':scope}
    params.update({'code_challenge':verifier[1],'code_challenge_method':'S256'})
    if provider_id=='resend': params['scope']=os.getenv('RESEND_SCOPE','emails:send')
    return endpoint+'?'+urllib.parse.urlencode({k:v for k,v in params.items() if v})
