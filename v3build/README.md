# AI Prospecting & Outbound OS — V3

General-purpose, multi-tenant foundation for autonomous B2B prospecting and outbound.

Core loop:
Find a reason to buy → prove why now → contact → understand response → qualify → book → stop.

## Included
- Multi-tenant workspace model
- ICP and intent profiles
- Company/prospect/evidence models
- Campaigns, interactions, suppression/DNC
- Discovery and enrichment provider interfaces
- Intent scoring and evidence explanations
- Provider registry for email/voice/calendar
- AI agent roles
- Webhook handlers for email and calendar
- Compliance-oriented state machine
- REST API with SQLite default and PostgreSQL-ready SQLAlchemy setup
- Docker support
- Tests

## Important
Provider adapters are safe interfaces/stubs where credentials, paid APIs, OAuth, telephony streaming, or provider-specific contracts are required. This repository does not bypass authentication, platform restrictions, paywalls, or provider terms.

## Run
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Open http://127.0.0.1:8000/docs

## Integration Hub
See `docs/INTEGRATIONS.md`. The frontend includes a multi-provider Connect/Configure UI and the backend includes connector storage plus OAuth state/PKCE callback infrastructure. Live provider access requires provider-side app registration and environment configuration.
