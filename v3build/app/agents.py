from dataclasses import dataclass

@dataclass
class AgentContext:
    workspace_id: int
    prospect_id: int | None
    evidence: list[dict]
    offer: dict
    conversation: list[dict]

class ResearchAgent:
    role = "research"
    def run(self, ctx): return {"status": "READY", "evidence": ctx.evidence}

class EnrichmentAgent:
    role = "enrichment"
    def run(self, ctx): return {"status": "READY"}

class IntentAgent:
    role = "intent"
    def run(self, ctx):
        return {"status": "READY", "reason": "Use only supported evidence; do not invent intent."}

class ScoringAgent:
    role = "scoring"
    def run(self, ctx): return {"status": "READY"}

class PersonalizationAgent:
    role = "personalization"
    def run(self, ctx):
        return {"status": "READY", "rule": "Personalize from evidence, not fabricated claims."}

class EmailAgent:
    role = "email"
    def run(self, ctx): return {"status": "READY"}

class VoiceAgent:
    role = "voice"
    def run(self, ctx): return {"status": "READY", "rules": ["AI disclosure", "one question at a time", "respect opt-out"]}

class QualificationAgent:
    role = "qualification"
    def run(self, ctx): return {"status": "READY"}

class ObjectionAgent:
    role = "objection"
    def run(self, ctx): return {"status": "READY"}

class MeetingAgent:
    role = "meeting"
    def run(self, ctx): return {"status": "READY"}
