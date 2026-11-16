from dataclasses import dataclass
from typing import Protocol

class EmailProvider(Protocol):
    def send(self, to: str, subject: str, body: str, reply_to: str | None = None) -> dict: ...

class VoiceProvider(Protocol):
    def call(self, to: str, from_number: str, metadata: dict | None = None) -> dict: ...

class CalendarProvider(Protocol):
    def booking_url(self, config: dict) -> str: ...

@dataclass
class StubEmailProvider:
    name: str = "stub"
    def send(self, to, subject, body, reply_to=None):
        return {"provider": self.name, "status": "SIMULATED", "to": to}

@dataclass
class StubVoiceProvider:
    name: str = "stub"
    def call(self, to, from_number, metadata=None):
        return {"provider": self.name, "status": "SIMULATED", "to": to}

@dataclass
class StubCalendarProvider:
    name: str = "stub"
    def booking_url(self, config):
        return config.get("booking_url", "")

class ProviderRegistry:
    def email(self, name="stub"):
        # Production adapters should be registered here after credentials/OAuth are configured.
        return StubEmailProvider(name)
    def voice(self, name="stub"):
        return StubVoiceProvider(name)
    def calendar(self, name="stub"):
        return StubCalendarProvider(name)

registry = ProviderRegistry()
