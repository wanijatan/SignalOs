# API examples

Create a workspace:
```bash
curl -X POST http://localhost:8000/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Workspace"}'
```

Score a prospect:
```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{"fit_score":90,"evidence_scores":[90,80],"contactability":100,"recency":90}'
```

Email webhook:
```bash
curl -X POST http://localhost:8000/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{"event_type":"reply","email":"prospect@example.com","payload":{"text":"unsubscribe"}}'
```
