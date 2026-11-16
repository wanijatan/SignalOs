# Integration Hub

V3 now includes a multi-tenant Integration Hub. Workspaces can connect providers using OAuth/permission flows where supported, or API-key/manual configuration where the provider requires it.

## Supported categories
Email: Resend, Gmail/Google Workspace, Microsoft 365/Outlook, SendGrid, Mailgun, SMTP.
Calendar: Calendly, Google Calendar, Outlook Calendar, Cal.com.
Voice: Twilio, Exotel, Telnyx, Plivo, Vonage, SIP.
Messaging: Meta WhatsApp Business, WhatsApp via Twilio, SMS via Twilio.
CRM: HubSpot, Salesforce, Pipedrive, Zoho CRM, Freshsales.
AI: OpenAI, Anthropic, Google Gemini, OpenRouter, custom OpenAI-compatible API.
Data: Apollo, Hunter, People Data Labs, Crunchbase, custom enrichment.
Storage: Google Drive, Dropbox, OneDrive.
Notifications: Slack, Microsoft Teams, custom webhook.

## Security
OAuth state and PKCE verifier are encrypted at rest using a key derived from SECRET_KEY. Access and refresh tokens are encrypted before being stored in the Connector config JSON. Never put provider secrets in frontend code.

## Important
The catalog/UI is included, but live OAuth requires registering an OAuth application with the provider and configuring its client ID, client secret (when applicable), and exact HTTPS redirect URI. Meta WhatsApp uses Embedded Signup rather than a normal username/password form.

## Frontend
Set `VITE_API_URL` to the public FastAPI URL before building the frontend. The Integrations page is available from the System sidebar.
