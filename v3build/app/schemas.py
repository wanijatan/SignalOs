from pydantic import BaseModel, Field
from typing import Any

class WorkspaceCreate(BaseModel):
    name: str
    owner_user_id: int | None = None
    settings: dict[str, Any] = Field(default_factory=dict)

class ICPCreate(BaseModel):
    workspace_id: int
    name: str
    countries: list[str] = []
    industries: list[str] = []
    company_sizes: list[str] = []
    job_titles: list[str] = []
    technologies: list[str] = []
    keywords: list[str] = []

class IntentProfileCreate(BaseModel):
    workspace_id: int
    name: str
    signals: list[str] = []
    weights: dict[str, float] = {}
    minimum_score: float = 60

class ScoreRequest(BaseModel):
    fit_score: float
    evidence_scores: list[float] = []
    contactability: float = 0
    recency: float = 0

class SuppressionRequest(BaseModel):
    workspace_id: int | None = None
    email: str | None = None
    phone: str | None = None
    reason: str = "OPT_OUT"

class WebhookEvent(BaseModel):
    event_type: str
    external_id: str | None = None
    email: str | None = None
    phone: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
