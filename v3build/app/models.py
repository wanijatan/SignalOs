from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Workspace(Base):
    __tablename__ = "signalos_workspaces"

    id = Column(Integer, primary_key=True)

    name = Column(
        String(160),
        nullable=False,
        default="SignalOS Workspace",
    )

    owner_name = Column(
        String(160),
        default="Workspace Owner",
    )

    owner_email = Column(
        String(255),
        default="",
    )

    settings = Column(
        JSON,
        default=dict,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )


class Company(Base):
    __tablename__ = "signalos_companies"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    name = Column(
        String(255),
        nullable=False,
    )

    domain = Column(
        String(255),
        default="",
    )

    industry = Column(
        String(160),
        default="",
    )

    country = Column(
        String(120),
        default="",
    )

    size = Column(
        String(80),
        default="",
    )

    website = Column(
        String(500),
        default="",
    )

    metadata_json = Column(
        JSON,
        default=dict,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )


class Prospect(Base):
    __tablename__ = "signalos_prospects"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    company_id = Column(
        Integer,
        ForeignKey("signalos_companies.id"),
        nullable=True,
    )

    name = Column(
        String(255),
        nullable=False,
    )

    email = Column(
        String(255),
        default="",
    )

    title = Column(
        String(160),
        default="",
    )

    country = Column(
        String(120),
        default="",
    )

    score = Column(
        Integer,
        default=0,
    )

    status = Column(
        String(60),
        default="NEW",
    )

    intent = Column(
        String(255),
        default="",
    )

    evidence = Column(
        Text,
        default="",
    )

    source = Column(
        String(255),
        default="",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )


class Campaign(Base):
    __tablename__ = "signalos_campaigns"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    name = Column(
        String(255),
        nullable=False,
    )

    status = Column(
        String(40),
        default="DRAFT",
    )

    countries = Column(
        Text,
        default="",
    )

    industries = Column(
        Text,
        default="",
    )

    decision_makers = Column(
        Text,
        default="",
    )

    signals = Column(
        Text,
        default="",
    )

    channel = Column(
        String(80),
        default="Email",
    )

    booking_link = Column(
        String(500),
        default="",
    )

    daily_limit = Column(
        Integer,
        default=25,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )


class Connector(Base):
    __tablename__ = "signalos_connectors"

    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "provider",
            "name",
            name="uq_signalos_connector",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    provider = Column(
        String(100),
        nullable=False,
    )

    name = Column(
        String(255),
        default="",
    )

    status = Column(
        String(40),
        default="AVAILABLE",
    )

    enabled = Column(
        Boolean,
        default=True,
    )

    auth_type = Column(
        String(40),
        default="api_key",
    )

    config = Column(
        JSON,
        default=dict,
    )

    connected_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )


class Activity(Base):
    __tablename__ = "signalos_activity"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    kind = Column(
        String(80),
        default="system",
    )

    title = Column(
        String(255),
        nullable=False,
    )

    detail = Column(
        Text,
        default="",
    )

    severity = Column(
        String(30),
        default="info",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )


class Notification(Base):
    __tablename__ = "signalos_notifications"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    type = Column(
        String(80),
        default="system",
    )

    title = Column(
        String(255),
        nullable=False,
    )

    body = Column(
        Text,
        default="",
    )

    read = Column(
        Boolean,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )


class Suppression(Base):
    __tablename__ = "signalos_suppressions"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    value = Column(
        String(255),
        nullable=False,
    )

    reason = Column(
        String(255),
        default="",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utcnow,
    )


class Setting(Base):
    __tablename__ = "signalos_settings"

    id = Column(
        Integer,
        primary_key=True,
    )

    workspace_id = Column(
        Integer,
        ForeignKey("signalos_workspaces.id"),
        index=True,
        nullable=False,
    )

    key = Column(
        String(120),
        nullable=False,
    )

    value = Column(
        JSON,
        default=dict,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "key",
            name="uq_signalos_setting",
        ),
    )
