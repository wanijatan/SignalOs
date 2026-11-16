from dataclasses import dataclass
from typing import Protocol

@dataclass
class DiscoveryQuery:
    countries: list[str]
    industries: list[str]
    keywords: list[str]
    limit: int = 50

@dataclass
class DiscoveryResult:
    company_name: str
    domain: str | None
    source_url: str | None
    evidence_hint: str | None = None

class DiscoveryProvider(Protocol):
    def search(self, query: DiscoveryQuery) -> list[DiscoveryResult]: ...

class EmptyDiscoveryProvider:
    def search(self, query):
        return []

# Add approved search/data providers behind this interface.
