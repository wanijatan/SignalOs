import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data.db")
    secret_key: str = os.getenv("SECRET_KEY", "change-me")
    ai_provider: str = os.getenv("AI_PROVIDER", "stub")
    email_provider: str = os.getenv("EMAIL_PROVIDER", "stub")
    voice_provider: str = os.getenv("VOICE_PROVIDER", "stub")
    calendar_provider: str = os.getenv("CALENDAR_PROVIDER", "stub")
    oauth_redirect_uri: str = os.getenv("OAUTH_REDIRECT_URI", "")

settings = Settings()
