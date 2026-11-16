# V3 Architecture

```text
Workspace
  ├─ ICP
  ├─ Intent Profile
  ├─ Offer + AI policy
  ├─ Provider connections
  ├─ Campaigns
  ├─ Prospects
  │   ├─ Company
  │   └─ Evidence
  ├─ Conversations / Interactions
  ├─ Suppression / DNC
  └─ Analytics / Audit

Discovery → Intent → Enrichment → Verification → Dedup → Suppression
→ Scoring → Personalization → Email/Voice → Qualification → Calendar
→ Meeting booked → Stop outreach
```

Provider abstraction keeps the product independent of any single search, enrichment, email, voice, or calendar vendor.

For production, add a queue/event bus, Redis, PostgreSQL, secrets manager, OAuth, provider webhooks, rate limits, tenant auth/RBAC, encrypted connector secrets, observability, retries/idempotency, and country-specific compliance controls.
