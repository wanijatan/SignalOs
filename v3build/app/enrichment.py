from dataclasses import dataclass
from typing import Protocol

@dataclass
class EnrichmentResult:
    full_name: str | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    email_verified: bool = False
    phone_verified: bool = False
    source: str | None = None

class EnrichmentProvider(Protocol):
    def enrich(self, company_domain: str, job_titles: list[str]) -> list[EnrichmentResult]: ...

class EmptyEnrichmentProvider:
    def enrich(self, company_domain, job_titles):
        return []

# Never guess contact details. Providers must return legitimate/authorized evidence.
