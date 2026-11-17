import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cloud,
  Code2,
  Database,
  FileText,
  Filter,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Loader2,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const API = (
  import.meta.env.VITE_API_URL ||
  "https://signalos-api-15va.onrender.com"
).replace(/\/$/, "");

const WS = 1;

/* ---------------------------------------------------------
   COMPLETE PROVIDER CATALOG
--------------------------------------------------------- */

const PROVIDERS = [
  // EMAIL
  {
    id: "gmail",
    name: "Gmail / Google Workspace",
    category: "Email",
    description: "Send and read email from a Google mailbox.",
    permissions: ["Send email", "Read replies", "Delivery events"],
    color: "#EA4335",
    icon: "gmail",
    mode: "oauth"
  },
  {
    id: "outlook",
    name: "Microsoft 365 / Outlook",
    category: "Email",
    description: "Connect Outlook and Microsoft 365 mailboxes.",
    permissions: ["Send email", "Read replies", "Mailbox access"],
    color: "#0078D4",
    icon: "outlook",
    mode: "oauth"
  },
  {
    id: "resend",
    name: "Resend",
    category: "Email",
    description: "Transactional and outbound email infrastructure.",
    permissions: ["Send email", "Delivery events", "Bounce events"],
    color: "#111111",
    icon: "resend",
    mode: "api"
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "Email",
    description: "Reliable email delivery and event tracking.",
    permissions: ["Send email", "Delivery events", "Bounce events"],
    color: "#1A82E2",
    icon: "sendgrid",
    mode: "api"
  },
  {
    id: "mailgun",
    name: "Mailgun",
    category: "Email",
    description: "Email API and deliverability infrastructure.",
    permissions: ["Send email", "Delivery events", "Bounce events"],
    color: "#E85D75",
    icon: "mailgun",
    mode: "api"
  },
  {
    id: "smtp",
    name: "Custom SMTP",
    category: "Email",
    description: "Connect any SMTP-compatible mailbox.",
    permissions: ["Send email", "SMTP authentication"],
    color: "#111111",
    icon: "smtp",
    mode: "api"
  },

  // CALENDAR
  {
    id: "calendly",
    name: "Calendly",
    category: "Calendar",
    description: "Detect meetings, cancellations and reschedules.",
    permissions: ["Read events", "Meeting status", "Webhooks"],
    color: "#006BFF",
    icon: "calendly",
    mode: "oauth"
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Connect Google Calendar for meeting intelligence.",
    permissions: ["Read calendar", "Create events", "Event updates"],
    color: "#4285F4",
    icon: "google",
    mode: "oauth"
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    category: "Calendar",
    description: "Connect Microsoft calendars.",
    permissions: ["Read calendar", "Create events", "Event updates"],
    color: "#0078D4",
    icon: "outlook",
    mode: "oauth"
  },
  {
    id: "cal_com",
    name: "Cal.com",
    category: "Calendar",
    description: "Open scheduling infrastructure.",
    permissions: ["Read events", "Booking events"],
    color: "#111111",
    icon: "calendar",
    mode: "oauth"
  },

  // CRM
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Sync prospects, lifecycle stages and activities.",
    permissions: ["Read contacts", "Create contacts", "Activities"],
    color: "#FF7A59",
    icon: "hubspot",
    mode: "oauth"
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Enterprise CRM and opportunity synchronization.",
    permissions: ["Read leads", "Create leads", "Activities"],
    color: "#00A1E0",
    icon: "salesforce",
    mode: "oauth"
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "CRM",
    description: "Sync people, organizations and deals.",
    permissions: ["Read contacts", "Create contacts", "Deals"],
    color: "#017737",
    icon: "pipedrive",
    mode: "oauth"
  },
  {
    id: "zoho_crm",
    name: "Zoho CRM",
    category: "CRM",
    description: "Connect your Zoho sales workspace.",
    permissions: ["Read contacts", "Create contacts", "Activities"],
    color: "#E42527",
    icon: "zoho",
    mode: "oauth"
  },
  {
    id: "freshsales",
    name: "Freshsales",
    category: "CRM",
    description: "Sync prospects and sales activities.",
    permissions: ["Read contacts", "Create contacts", "Activities"],
    color: "#00A886",
    icon: "fresh",
    mode: "api"
  },

  // AI / LLM
  {
    id: "openai",
    name: "OpenAI",
    category: "AI / LLM",
    description: "Use OpenAI models for research, scoring and personalization.",
    permissions: ["Model access", "Text generation", "Structured outputs"],
    color: "#111111",
    icon: "openai",
    mode: "api"
  },
  {
    id: "anthropic",
    name: "Anthropic / Claude",
    category: "AI / LLM",
    description: "Use Claude for research, reasoning and outbound intelligence.",
    permissions: ["Model access", "Text generation", "Reasoning"],
    color: "#D97757",
    icon: "claude",
    mode: "api"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "AI / LLM",
    description: "Use Gemini models for prospect research and generation.",
    permissions: ["Model access", "Text generation", "Multimodal"],
    color: "#4285F4",
    icon: "gemini",
    mode: "api"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "AI / LLM",
    description: "Access multiple AI models through one API.",
    permissions: ["Model routing", "Text generation", "Model selection"],
    color: "#111111",
    icon: "openrouter",
    mode: "api"
  },
  {
    id: "custom_ai",
    name: "Custom OpenAI-Compatible API",
    category: "AI / LLM",
    description: "Connect your own compatible AI endpoint.",
    permissions: ["Endpoint access", "Model access"],
    color: "#111111",
    icon: "code",
    mode: "api"
  },

  // DATA
  {
    id: "apollo",
    name: "Apollo",
    category: "Data & Enrichment",
    description: "Discover companies, contacts and sales intelligence.",
    permissions: ["Search contacts", "Company data", "Enrichment"],
    color: "#111111",
    icon: "apollo",
    mode: "api"
  },
  {
    id: "hunter",
    name: "Hunter",
    category: "Data & Enrichment",
    description: "Find and verify professional email addresses.",
    permissions: ["Email discovery", "Email verification"],
    color: "#FF6B35",
    icon: "hunter",
    mode: "api"
  },
  {
    id: "people_data_labs",
    name: "People Data Labs",
    category: "Data & Enrichment",
    description: "People and company enrichment infrastructure.",
    permissions: ["People data", "Company data", "Enrichment"],
    color: "#111111",
    icon: "pdl",
    mode: "api"
  },
  {
    id: "crunchbase",
    name: "Crunchbase",
    category: "Data & Enrichment",
    description: "Funding, company and investor intelligence.",
    permissions: ["Company data", "Funding data"],
    color: "#0284C7",
    icon: "crunchbase",
    mode: "api"
  },

  // VOICE
  {
    id: "twilio",
    name: "Twilio",
    category: "Voice & Messaging",
    description: "Voice, SMS and communication infrastructure.",
    permissions: ["Calls", "SMS", "Call status"],
    color: "#F22F46",
    icon: "twilio",
    mode: "api"
  },
  {
    id: "exotel",
    name: "Exotel",
    category: "Voice & Messaging",
    description: "India-focused voice and telephony infrastructure.",
    permissions: ["Calls", "Call status", "Recordings"],
    color: "#F59E0B",
    icon: "phone",
    mode: "api"
  },
  {
    id: "telnyx",
    name: "Telnyx",
    category: "Voice & Messaging",
    description: "Programmable voice and messaging.",
    permissions: ["Calls", "Messaging"],
    color: "#111111",
    icon: "phone",
    mode: "api"
  },
  {
    id: "plivo",
    name: "Plivo",
    category: "Voice & Messaging",
    description: "Programmable communications infrastructure.",
    permissions: ["Calls", "SMS"],
    color: "#111111",
    icon: "phone",
    mode: "api"
  },
  {
    id: "vonage",
    name: "Vonage",
    category: "Voice & Messaging",
    description: "Communications APIs for voice and messaging.",
    permissions: ["Calls", "Messaging"],
    color: "#DA291C",
    icon: "phone",
    mode: "api"
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Voice & Messaging",
    description: "Connect WhatsApp Business messaging.",
    permissions: ["Send messages", "Receive messages", "Webhooks"],
    color: "#25D366",
    icon: "whatsapp",
    mode: "oauth"
  },

  // STORAGE
  {
    id: "google_drive",
    name: "Google Drive",
    category: "Storage",
    description: "Store and access campaign files.",
    permissions: ["Read files", "Create files"],
    color: "#4285F4",
    icon: "drive",
    mode: "oauth"
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Storage",
    description: "Connect Dropbox for campaign assets.",
    permissions: ["Read files", "Create files"],
    color: "#0061FF",
    icon: "dropbox",
    mode: "oauth"
  },
  {
    id: "onedrive",
    name: "OneDrive",
    category: "Storage",
    description: "Microsoft cloud file storage.",
    permissions: ["Read files", "Create files"],
    color: "#0078D4",
    icon: "drive",
    mode: "oauth"
  },

  // NOTIFICATIONS
  {
    id: "slack",
    name: "Slack",
    category: "Notifications",
    description: "Receive prospect and campaign notifications.",
    permissions: ["Send notifications", "Channel messages"],
    color: "#4A154B",
    icon: "slack",
    mode: "oauth"
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    category: "Notifications",
    description: "Send SignalOS notifications to Teams.",
    permissions: ["Send notifications", "Channel messages"],
    color: "#6264A7",
    icon: "teams",
    mode: "oauth"
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    category: "Notifications",
    description: "Send SignalOS events to any webhook.",
    permissions: ["Outbound events"],
    color: "#111111",
    icon: "webhook",
    mode: "api"
  }
];

const CATEGORIES = [
  "All",
  "Email",
  "Calendar",
  "CRM",
  "AI / LLM",
  "Data & Enrichment",
  "Voice & Messaging",
  "Storage",
  "Notifications"
];

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.detail || data?.message || `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function getAutomation(data) {
  return (
    data?.automation ||
    data?.workspace?.automation ||
    data?.settings?.automation ||
    {
      automation_enabled:
        data?.workspace?.settings?.automation_enabled ?? true,
      ai_mode: data?.workspace?.settings?.ai_mode || "copilot"
    }
  );
}

function providerState(provider, connected) {
  const found = connected.find(
    (item) =>
      item?.provider_id === provider.id ||
      item?.id === provider.id ||
      item?.provider === provider.id
  );

  if (!found) {
    return {
      ...provider,
      connected: false,
      enabled: false,
      status: "available",
      config: {}
    };
  }

  return {
    ...provider,
    ...found,
    connected: true,
    enabled: found.enabled !== false,
    status: found.status || "connected"
  };
}

/* ---------------------------------------------------------
   PROVIDER ICON
--------------------------------------------------------- */

function ProviderIcon({ provider, size = 34 }) {
  const letters = {
    gmail: "M",
    outlook: "O",
    resend: "R",
    sendgrid: "S",
    mailgun: "M",
    smtp: "@",
    calendly: "C",
    google: "G",
    calendar: "C",
    hubspot: "H",
    salesforce: "S",
    pipedrive: "P",
    zoho: "Z",
    fresh: "F",
    openai: "AI",
    claude: "C",
    gemini: "G",
    openrouter: "OR",
    code: "</>",
    apollo: "A",
    hunter: "H",
    pdl: "P",
    crunchbase: "CB",
    twilio: "T",
    phone: "☎",
    whatsapp: "WA",
    drive: "D",
    dropbox: "D",
    slack: "S",
    teams: "T",
    webhook: "↗"
  };

  return (
    <div
      className="provider-icon"
      style={{
        width: size,
        height: size,
        color: provider.color || "#111"
      }}
    >
      {letters[provider.icon] || provider.name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ---------------------------------------------------------
   APP
--------------------------------------------------------- */

function App() {
  const [page, setPage] = useState("Overview");
  const [mobileNav, setMobileNav] = useState(false);

  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const [workspace, setWorkspace] = useState(null);
  const [dashboard, setDashboard] = useState({});
  const [automation, setAutomation] = useState({
    automation_enabled: true,
    ai_mode: "copilot"
  });

  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [connectors, setConnectors] = useState([]);

  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  /* ---------------------------------------------------------
     INITIAL LOAD
  --------------------------------------------------------- */

  async function loadAll() {
    setLoading(true);

    try {
      const health = await api("/health");
      setOnline(Boolean(health?.ok ?? true));
    } catch {
      setOnline(false);
    }

    try {
      const ws = await api(`/workspaces/${WS}`);
      setWorkspace(ws);
      setAutomation(getAutomation(ws));
    } catch {
      // workspace endpoint can fail while other endpoints work
    }

    try {
      const dash = await api(`/workspaces/${WS}/dashboard`);
      setDashboard(dash || {});
      const a = getAutomation(dash);
      setAutomation((old) => ({ ...old, ...a }));
    } catch {
      setDashboard({});
    }

    try {
      const p = await api(`/workspaces/${WS}/prospects`);
      setProspects(safeArray(p));
    } catch {
      setProspects([]);
    }

    try {
      const c = await api(`/workspaces/${WS}/campaigns`);
      setCampaigns(safeArray(c));
    } catch {
      setCampaigns([]);
    }

    try {
      const integrations = await api(`/workspaces/${WS}/connectors`);
      setConnectors(safeArray(integrations));
    } catch {
      setConnectors([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */

  const navigation = [
    {
      label: "WORKSPACE",
      items: [
        ["Overview", LayoutDashboard],
        ["Prospects", Users],
        ["Companies", Globe2],
        ["Intent Signals", Target]
      ]
    },
    {
      label: "OUTBOUND",
      items: [
        ["Campaigns", Rocket],
        ["Conversations", MessageSquare],
        ["Meetings", CalendarDays]
      ]
    },
    {
      label: "INTELLIGENCE",
      items: [
        ["AI Activity", Bot],
        ["Analytics", Activity]
      ]
    },
    {
      label: "SYSTEM",
      items: [
        ["Integrations", Link2],
        ["Automation", Zap],
        ["Settings", Settings]
      ]
    }
  ];

  function navigate(next) {
    setPage(next);
    setMobileNav(false);
  }

  /* ---------------------------------------------------------
     AUTOMATION
  --------------------------------------------------------- */

  async function updateAutomation(patch) {
    const previous = automation;

    const next = {
      ...previous,
      ...patch
    };

    setAutomation(next);

    try {
      const result = await api(`/workspaces/${WS}/automation`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });

      setAutomation({
        ...next,
        ...getAutomation(result)
      });

      notify("Automation settings updated.");
    } catch (error) {
      setAutomation(previous);
      notify(error.message, "error");
    }
  }

  /* ---------------------------------------------------------
     CONNECT PROVIDER
  --------------------------------------------------------- */

  async function connectProvider(provider) {
    setModal({
      type: "connect",
      provider,
      loading: true
    });

    try {
      const result = await api(
        `/workspaces/${WS}/connectors/${provider.id}/connect`,
        {
          method: "POST"
        }
      );

      if (result?.authorization_url) {
        setModal(null);
        window.location.href = result.authorization_url;
        return;
      }

      if (result?.url) {
        setModal(null);
        window.location.href = result.url;
        return;
      }

      if (result?.requires_configuration || provider.mode === "api") {
        setModal({
          type: "configure",
          provider,
          loading: false,
          initial: result?.config || {}
        });
        return;
      }

      await loadAll();

      setModal(null);
      notify(`${provider.name} connected.`);
    } catch (error) {
      setModal(null);

      notify(
        `${provider.name}: ${error.message || "Connection could not be started."}`,
        "error"
      );
    }
  }

  async function configureProvider(provider, config) {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}/configure`,
        {
          method: "POST",
          body: JSON.stringify(config)
        }
      );

      await loadAll();
      setModal(null);
      notify(`${provider.name} configured successfully.`);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function toggleProvider(provider, enabled) {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({ enabled })
        }
      );

      await loadAll();
      notify(
        `${provider.name} ${enabled ? "enabled" : "disabled"}.`
      );
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function disconnectProvider(provider) {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}`,
        {
          method: "DELETE"
        }
      );

      await loadAll();
      notify(`${provider.name} disconnected.`);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  /* ---------------------------------------------------------
     CAMPAIGN
  --------------------------------------------------------- */

  async function createCampaign(payload) {
    try {
      await api(`/workspaces/${WS}/campaigns`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      await loadAll();

      setModal(null);
      navigate("Campaigns");
      notify("Campaign created successfully.");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function updateCampaign(id, status) {
    try {
      await api(`/workspaces/${WS}/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      await loadAll();
      notify(`Campaign ${status === "active" ? "activated" : "paused"}.`);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  /* ---------------------------------------------------------
     CONNECTED PROVIDERS
  --------------------------------------------------------- */

  const providerCards = useMemo(
    () => PROVIDERS.map((p) => providerState(p, connectors)),
    [connectors]
  );

  const connectedCount = providerCards.filter(
    (p) => p.connected && p.enabled !== false
  ).length;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">SignalOS</div>
            <div className="brand-subtitle">Revenue Intelligence</div>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">A</div>
          <div className="workspace-info">
            <strong>{workspace?.name || "Acme Growth"}</strong>
            <span>Workspace</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <div className="sidebar-scroll">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>

              {group.items.map(([name, Icon]) => (
                <button
                  key={name}
                  className={`nav-item ${
                    page === name ? "active" : ""
                  }`}
                  onClick={() => navigate(name)}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{name}</span>

                  {name === "Integrations" && connectedCount > 0 && (
                    <span className="nav-count">{connectedCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => navigate("Help")}>
            <CircleHelp size={17} />
            <span>Help & Support</span>
          </button>

          <div className="user-card">
            <div className="user-avatar">
              <UserRound size={16} />
            </div>
            <div>
              <strong>Workspace Owner</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            SignalOS
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>

          <div className="top-actions">
            <div className={`api-status ${online ? "online" : "offline"}`}>
              <span />
              {online ? "API online" : "API offline"}
            </div>

            <button
              className="icon-button"
              onClick={() => notify("No new notifications.")}
            >
              <Bell size={18} />
            </button>

            <button
              className="help-button"
              onClick={() => navigate("Help")}
            >
              <CircleHelp size={17} />
              Help
            </button>
          </div>
        </header>

        <div className="content">
          {loading && (
            <div className="loading-bar">
              <Loader2 size={16} className="spin" />
              Connecting to SignalOS...
            </div>
          )}

          {page === "Overview" && (
            <Overview
              dashboard={dashboard}
              prospects={prospects}
              campaigns={campaigns}
              automation={automation}
              connectedCount={connectedCount}
              onNavigate={navigate}
              onCreateCampaign={() =>
                setModal({ type: "campaign" })
              }
            />
          )}

          {page === "Automation" && (
            <AutomationPage
              automation={automation}
              updateAutomation={updateAutomation}
            />
          )}

          {page === "Integrations" && (
            <IntegrationsPage
              providers={providerCards}
              onConnect={connectProvider}
              onToggle={toggleProvider}
              onDisconnect={disconnectProvider}
              onConfigure={(provider) =>
                setModal({
                  type: "configure",
                  provider,
                  loading: false
                })
              }
            />
          )}

          {page === "Campaigns" && (
            <CampaignsPage
              campaigns={campaigns}
              onCreate={() => setModal({ type: "campaign" })}
              onUpdate={updateCampaign}
            />
          )}

          {page === "Prospects" && (
            <ProspectsPage prospects={prospects} />
          )}

          {page === "Companies" && (
            <EmptyPage
              icon={Globe2}
              title="Companies"
              description="Company intelligence and account-level signals will appear here."
            />
          )}

          {page === "Intent Signals" && (
            <EmptyPage
              icon={Target}
              title="Intent Signals"
              description="Monitor funding, hiring, expansion, technology and buying signals."
            />
          )}

          {page === "Conversations" && (
            <EmptyPage
              icon={MessageSquare}
              title="Conversations"
              description="Email and outbound conversations will appear here."
            />
          )}

          {page === "Meetings" && (
            <EmptyPage
              icon={CalendarDays}
              title="Meetings"
              description="Booked meetings and calendar activity will appear here."
            />
          )}

          {page === "AI Activity" && (
            <AIActivityPage />
          )}

          {page === "Analytics" && (
            <AnalyticsPage
              dashboard={dashboard}
              campaigns={campaigns}
              prospects={prospects}
            />
          )}

          {page === "Settings" && (
            <SettingsPage
              workspace={workspace}
              automation={automation}
              connectedCount={connectedCount}
              onAutomation={updateAutomation}
            />
          )}

          {page === "Help" && <HelpPage />}
        </div>
      </main>

      {modal?.type === "campaign" && (
        <CampaignModal
          onClose={() => setModal(null)}
          onCreate={createCampaign}
        />
      )}

      {modal?.type === "connect" && (
        <ConnectModal
          provider={modal.provider}
          loading={modal.loading}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "configure" && (
        <ConfigureModal
          provider={modal.provider}
          onClose={() => setModal(null)}
          onSave={configureProvider}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Check size={18} />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   OVERVIEW
--------------------------------------------------------- */

function Overview({
  dashboard,
  prospects,
  campaigns,
  automation,
  connectedCount,
  onNavigate,
  onCreateCampaign
}) {
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active"
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="WORKSPACE / OVERVIEW"
        title="Revenue intelligence"
        description="Find the right prospects, understand why now, and automate the next action."
        action={
          <button
            className="primary-button"
            onClick={onCreateCampaign}
          >
            <Plus size={17} />
            New campaign
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Prospects"
          value={dashboard?.prospects ?? prospects.length}
          icon={Users}
          note="Tracked in workspace"
        />
        <StatCard
          label="Active campaigns"
          value={dashboard?.active_campaigns ?? activeCampaigns}
          icon={Rocket}
          note="Currently running"
        />
        <StatCard
          label="Meetings"
          value={dashboard?.meetings ?? 0}
          icon={CalendarDays}
          note="Booked"
        />
        <StatCard
          label="Connected tools"
          value={connectedCount}
          icon={Link2}
          note="Enabled integrations"
        />
      </div>

      <div className="overview-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>SignalOS control center</h2>
              <p>Your operating system for intelligent outbound.</p>
            </div>
            <Sparkles size={20} />
          </div>

          <div className="control-cards">
            <button onClick={() => onNavigate("Prospects")}>
              <div className="control-icon blue">
                <Users size={19} />
              </div>
              <div>
                <strong>Find prospects</strong>
                <span>Discover and rank potential buyers.</span>
              </div>
              <ArrowRight size={17} />
            </button>

            <button onClick={() => onNavigate("Intent Signals")}>
              <div className="control-icon orange">
                <Target size={19} />
              </div>
              <div>
                <strong>Track intent</strong>
                <span>See why an account may be ready now.</span>
              </div>
              <ArrowRight size={17} />
            </button>

            <button onClick={() => onNavigate("Integrations")}>
              <div className="control-icon green">
                <Link2 size={19} />
              </div>
              <div>
                <strong>Connect your stack</strong>
                <span>
                  Email, CRM, calendar, AI and data providers.
                </span>
              </div>
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Automation</h2>
              <p>Current workspace operating mode.</p>
            </div>
            <Zap size={20} />
          </div>

          <div className="automation-summary">
            <div className="automation-status">
              <span
                className={
                  automation?.automation_enabled
                    ? "status-dot green"
                    : "status-dot red"
                }
              />
              <strong>
                {automation?.automation_enabled
                  ? "Automation enabled"
                  : "Automation paused"}
              </strong>
            </div>

            <div className="mode-pill">
              {String(
                automation?.ai_mode || "copilot"
              ).toUpperCase()}
            </div>
          </div>

          <button
            className="secondary-button full"
            onClick={() => onNavigate("Automation")}
          >
            Manage automation
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   AUTOMATION
--------------------------------------------------------- */

function AutomationPage({ automation, updateAutomation }) {
  const safeAutomation = {
    automation_enabled:
      automation?.automation_enabled ?? true,
    ai_mode: automation?.ai_mode || "copilot"
  };

  return (
    <div>
      <PageHeader
        eyebrow="SYSTEM / AUTOMATION"
        title="Automation"
        description="Control how much autonomy SignalOS has across your workspace."
      />

      <section className="automation-panel">
        <div className="automation-header">
          <div className="automation-title">
            <div className="large-icon orange">
              <Zap size={22} />
            </div>
            <div>
              <h2>Master automation</h2>
              <p>
                One switch pauses automated actions across the
                workspace.
              </p>
            </div>
          </div>

          <button
            className={`toggle-large ${
              safeAutomation.automation_enabled ? "on" : ""
            }`}
            onClick={() =>
              updateAutomation({
                automation_enabled:
                  !safeAutomation.automation_enabled
              })
            }
          >
            {safeAutomation.automation_enabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="mode-grid">
          {[
            [
              "manual",
              "Manual",
              "Nothing executes without approval.",
              SlidersHorizontal
            ],
            [
              "copilot",
              "Copilot",
              "Research and draft; you approve actions.",
              Bot
            ],
            [
              "autopilot",
              "Autopilot",
              "Execute approved workflows within limits.",
              Sparkles
            ]
          ].map(([value, title, description, Icon]) => (
            <button
              key={value}
              className={`mode-card ${
                safeAutomation.ai_mode === value
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                updateAutomation({ ai_mode: value })
              }
            >
              <div className="radio">
                {safeAutomation.ai_mode === value && (
                  <span />
                )}
              </div>
              <Icon size={19} />
              <div>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   INTEGRATIONS
--------------------------------------------------------- */

function IntegrationsPage({
  providers,
  onConnect,
  onToggle,
  onDisconnect,
  onConfigure
}) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = providers.filter((provider) => {
    const categoryMatch =
      category === "All" || provider.category === category;

    const searchMatch =
      !search ||
      provider.name.toLowerCase().includes(search.toLowerCase()) ||
      provider.description
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      provider.category
        .toLowerCase()
        .includes(search.toLowerCase());

    return categoryMatch && searchMatch;
  });

  return (
    <div>
      <PageHeader
        eyebrow="SYSTEM / INTEGRATIONS"
        title="Integrations"
        description="Connect the tools your team already uses. SignalOS never needs the provider password."
      />

      <div className="integration-banner">
        <div className="integration-banner-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong>Your stack, your accounts</strong>
          <span>
            Choose a provider, review permissions, then connect
            your own account. Credentials remain protected.
          </span>
        </div>
        <div className="connected-counter">
          {providers.filter(
            (p) => p.connected && p.enabled !== false
          ).length}{" "}
          connected
        </div>
      </div>

      <div className="integration-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search integrations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="category-scroll">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              className={
                category === item ? "category active" : "category"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="integration-count">
        {filtered.length} integrations
        {category !== "All" && ` · ${category}`}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={30} />
          <h3>No integrations found</h3>
          <p>
            Try another search or select All integrations.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setCategory("All");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="integration-grid">
          {filtered.map((provider) => (
            <IntegrationCard
              key={provider.id}
              provider={provider}
              onConnect={onConnect}
              onToggle={onToggle}
              onDisconnect={onDisconnect}
              onConfigure={onConfigure}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IntegrationCard({
  provider,
  onConnect,
  onToggle,
  onDisconnect,
  onConfigure
}) {
  const connected = provider.connected;

  return (
    <div className="integration-card">
      <div className="integration-card-top">
        <ProviderIcon provider={provider} />

        <div className="provider-title">
          <div>
            <strong>{provider.name}</strong>
            {connected && (
              <span className="connected-badge">
                <Check size={12} />
                Connected
              </span>
            )}
          </div>
          <span>{provider.category}</span>
        </div>

        <button className="more-button">
          <MoreHorizontal size={17} />
        </button>
      </div>

      <p className="provider-description">
        {provider.description}
      </p>

      <div className="permission-preview">
        {provider.permissions.slice(0, 3).map((permission) => (
          <span key={permission}>
            <Check size={12} />
            {permission}
          </span>
        ))}
      </div>

      <div className="integration-card-bottom">
        {connected ? (
          <>
            <button
              className="secondary-button small"
              onClick={() => onConfigure(provider)}
            >
              Configure
            </button>

            <button
              className={`mini-toggle ${
                provider.enabled !== false ? "enabled" : ""
              }`}
              onClick={() =>
                onToggle(
                  provider,
                  provider.enabled === false
                )
              }
            >
              {provider.enabled === false
                ? "Disabled"
                : "Enabled"}
            </button>

            <button
              className="disconnect-button"
              onClick={() => onDisconnect(provider)}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="connect-button"
            onClick={() => onConnect(provider)}
          >
            Connect
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CAMPAIGNS
--------------------------------------------------------- */

function CampaignsPage({ campaigns, onCreate, onUpdate }) {
  return (
    <div>
      <PageHeader
        eyebrow="OUTBOUND / CAMPAIGNS"
        title="Campaigns"
        description="Create evidence-driven outbound workflows."
        action={
          <button className="primary-button" onClick={onCreate}>
            <Plus size={17} />
            New campaign
          </button>
        }
      />

      <section className="panel">
        {campaigns.length === 0 ? (
          <div className="empty-state compact">
            <Rocket size={30} />
            <h3>No campaigns yet</h3>
            <p>
              Create your first campaign to start building an
              outbound workflow.
            </p>
            <button
              className="primary-button"
              onClick={onCreate}
            >
              <Plus size={16} />
              Create campaign
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <strong>
                        {campaign.name || "Untitled campaign"}
                      </strong>
                      <span className="table-sub">
                        {campaign.description || "SignalOS outbound"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          campaign.status || "draft"
                        }`}
                      >
                        {campaign.status || "draft"}
                      </span>
                    </td>
                    <td>
                      {campaign.channel || "Email"}
                    </td>
                    <td>
                      {campaign.created_at
                        ? new Date(
                            campaign.created_at
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {campaign.status === "active" ? (
                        <button
                          className="table-action"
                          onClick={() =>
                            onUpdate(campaign.id, "paused")
                          }
                        >
                          <Pause size={15} />
                          Pause
                        </button>
                      ) : (
                        <button
                          className="table-action"
                          onClick={() =>
                            onUpdate(campaign.id, "active")
                          }
                        >
                          <Play size={15} />
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   PROSPECTS
--------------------------------------------------------- */

function ProspectsPage({ prospects }) {
  return (
    <div>
      <PageHeader
        eyebrow="WORKSPACE / PROSPECTS"
        title="Prospects"
        description="Your AI-ranked prospect universe."
      />

      <section className="panel">
        {prospects.length === 0 ? (
          <div className="empty-state compact">
            <Users size={30} />
            <h3>No prospects yet</h3>
            <p>
              Connect your data provider or add a prospect to
              begin building your pipeline.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>
                        {p.name ||
                          `${p.first_name || ""} ${
                            p.last_name || ""
                          }`.trim() ||
                          "Unknown"}
                      </strong>
                    </td>
                    <td>{p.company_name || p.company || "—"}</td>
                    <td>{p.title || p.job_title || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td>
                      <span className="score">
                        {p.score ?? p.intent_score ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   CAMPAIGN MODAL
--------------------------------------------------------- */

function CampaignModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    countries: "India",
    industries: "SaaS",
    decision_makers: "Founder, CEO, Head of Sales",
    signals: "Funding, hiring, expansion",
    channel: "email",
    booking_link: ""
  });

  function update(key, value) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim()) return;

    setSaving(true);

    await onCreate({
      name: form.name.trim(),
      countries: form.countries
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      industries: form.industries
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      decision_makers: form.decision_makers
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      signals: form.signals
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      channel: form.channel,
      booking_link: form.booking_link
    });

    setSaving(false);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal campaign-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">CAMPAIGN BUILDER</span>
            <h2>Create campaign</h2>
            <p>Build your first evidence-driven workflow.</p>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="stepper">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`step ${
                step >= n ? "active" : ""
              }`}
            >
              <span>{n}</span>
              <label>
                {n === 1
                  ? "Audience"
                  : n === 2
                  ? "Signals"
                  : "Outbound"}
              </label>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="form-grid">
              <Field
                label="Campaign name"
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder="SaaS Founder Outreach"
              />

              <Field
                label="Countries"
                value={form.countries}
                onChange={(v) => update("countries", v)}
                placeholder="India, UAE, UK"
              />

              <Field
                label="Industries"
                value={form.industries}
                onChange={(v) => update("industries", v)}
                placeholder="SaaS, FinTech, AI"
              />

              <Field
                label="Decision makers"
                value={form.decision_makers}
                onChange={(v) =>
                  update("decision_makers", v)
                }
                placeholder="Founder, CEO, CMO"
              />
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <Field
                label="Buying signals"
                value={form.signals}
                onChange={(v) => update("signals", v)}
                placeholder="Funding, hiring, expansion"
                full
              />

              <div className="info-box">
                <Lightbulb size={18} />
                <div>
                  <strong>SignalOS recommendation</strong>
                  <p>
                    Start with signals that indicate an actual
                    reason to buy instead of simply targeting
                    job titles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-grid">
              <div>
                <label>Outbound channel</label>
                <select
                  value={form.channel}
                  onChange={(e) =>
                    update("channel", e.target.value)
                  }
                >
                  <option value="email">Email</option>
                  <option value="email+calendar">
                    Email + Calendar
                  </option>
                </select>
              </div>

              <Field
                label="Booking link"
                value={form.booking_link}
                onChange={(v) =>
                  update("booking_link", v)
                }
                placeholder="https://calendly.com/..."
                full
              />

              <div className="info-box">
                <ShieldCheck size={18} />
                <div>
                  <strong>Safe automation</strong>
                  <p>
                    Campaigns respect workspace automation,
                    provider limits and suppression settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          {step > 1 && (
            <button
              className="secondary-button"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              className="primary-button"
              disabled={step === 1 && !form.name.trim()}
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={!form.name.trim() || saving}
              onClick={submit}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket size={16} />
                  Create campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CONNECT MODAL
--------------------------------------------------------- */

function ConnectModal({ provider, loading, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal connection-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{provider.category}</span>
            <h2>Connect {provider.name}</h2>
            <p>
              SignalOS will redirect you to the provider's
              official authorization page.
            </p>
          </div>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="connection-content">
          <ProviderIcon provider={provider} size={72} />

          <h3>
            {provider.mode === "oauth"
              ? "Secure OAuth authorization"
              : "Secure API connection"}
          </h3>

          <p>
            {provider.mode === "oauth"
              ? "Your provider password is never shared with SignalOS. Authentication happens directly with the provider."
              : "Your API credential is stored server-side and is never displayed publicly."}
          </p>

          <div className="permission-box">
            <strong>SignalOS will request</strong>

            {provider.permissions.map((permission) => (
              <span key={permission}>
                <Check size={14} />
                {permission}
              </span>
            ))}
          </div>

          <div className="security-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Secure connection</strong>
              <span>
                You can disable or disconnect this integration
                at any time.
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Connecting...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CONFIGURE MODAL
--------------------------------------------------------- */

function ConfigureModal({ provider, onClose, onSave }) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");

  const isAI = provider.category === "AI / LLM";

  return (
    <div className="modal-backdrop">
      <div className="modal configure-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {provider.category}
            </span>
            <h2>Configure {provider.name}</h2>
            <p>
              Add the connection details SignalOS should use.
            </p>
          </div>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="config-provider">
            <ProviderIcon provider={provider} size={48} />
            <div>
              <strong>{provider.name}</strong>
              <span>{provider.description}</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="full-field">
              <label>API key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) =>
                  setApiKey(e.target.value)
                }
                placeholder="Paste your API key"
              />
            </div>

            {isAI && (
              <>
                <div>
                  <label>Model</label>
                  <input
                    value={model}
                    onChange={(e) =>
                      setModel(e.target.value)
                    }
                    placeholder="e.g. gpt-4.1-mini"
                  />
                </div>

                <div>
                  <label>Base URL</label>
                  <input
                    value={baseUrl}
                    onChange={(e) =>
                      setBaseUrl(e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              </>
            )}
          </div>

          <div className="security-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Credential protection</strong>
              <span>
                Credentials are sent to your SignalOS backend
                over HTTPS.
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button
            className="primary-button"
            disabled={!apiKey.trim()}
            onClick={() =>
              onSave(provider, {
                api_key: apiKey,
                base_url: baseUrl,
                model
              })
            }
          >
            <Check size={16} />
            Save connection
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   OTHER PAGES
--------------------------------------------------------- */

function AIActivityPage() {
  const events = [
    ["Research Agent", "Analyzed company buying signal", "2m"],
    ["Intent Agent", "Detected hiring acceleration", "8m"],
    ["Scoring Agent", "Ranked prospect 87/100", "14m"],
    ["Personalization Agent", "Prepared outreach draft", "21m"]
  ];

  return (
    <div>
      <PageHeader
        eyebrow="INTELLIGENCE / AI ACTIVITY"
        title="AI activity"
        description="See what SignalOS agents are researching, scoring and preparing."
      />

      <section className="panel">
        <div className="activity-list">
          {events.map(([agent, text, time]) => (
            <div className="activity-item" key={agent}>
              <div className="activity-icon">
                <Bot size={17} />
              </div>
              <div>
                <strong>{agent}</strong>
                <span>{text}</span>
              </div>
              <time>{time} ago</time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AnalyticsPage({ dashboard, campaigns, prospects }) {
  return (
    <div>
      <PageHeader
        eyebrow="INTELLIGENCE / ANALYTICS"
        title="Analytics"
        description="Measure pipeline creation and outbound performance."
      />

      <div className="stats-grid">
        <StatCard
          label="Prospects"
          value={dashboard?.prospects ?? prospects.length}
          icon={Users}
        />
        <StatCard
          label="Campaigns"
          value={campaigns.length}
          icon={Rocket}
        />
        <StatCard
          label="Meetings"
          value={dashboard?.meetings ?? 0}
          icon={CalendarDays}
        />
        <StatCard
          label="Replies"
          value={dashboard?.replies ?? 0}
          icon={MessageSquare}
        />
      </div>
    </div>
  );
}

function SettingsPage({
  workspace,
  automation,
  connectedCount,
  onAutomation
}) {
  return (
    <div>
      <PageHeader
        eyebrow="SYSTEM / SETTINGS"
        title="Settings"
        description="Manage your SignalOS workspace and operating preferences."
      />

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Workspace</h2>
              <p>Basic workspace configuration.</p>
            </div>
            <Settings size={19} />
          </div>

          <div className="settings-row">
            <span>Workspace name</span>
            <strong>
              {workspace?.name || "Acme Growth"}
            </strong>
          </div>

          <div className="settings-row">
            <span>Connected integrations</span>
            <strong>{connectedCount}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>AI autonomy</h2>
              <p>Choose how much SignalOS can execute.</p>
            </div>
            <Bot size={19} />
          </div>

          <div className="settings-row">
            <span>Mode</span>
            <strong>
              {String(
                automation?.ai_mode || "copilot"
              ).toUpperCase()}
            </strong>
          </div>

          <div className="settings-row">
            <span>Automation</span>
            <button
              className="mini-toggle enabled"
              onClick={() =>
                onAutomation({
                  automation_enabled:
                    !(automation?.automation_enabled ?? true)
                })
              }
            >
              {automation?.automation_enabled
                ? "Enabled"
                : "Disabled"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function HelpPage() {
  return (
    <div>
      <PageHeader
        eyebrow="SUPPORT"
        title="Help & Support"
        description="Everything you need to operate SignalOS."
      />

      <div className="help-grid">
        {[
          [
            "Getting started",
            "Connect your email, AI provider and calendar, then create your first campaign.",
            Rocket
          ],
          [
            "Integrations",
            "Choose the platforms your workspace already uses and connect them securely.",
            Link2
          ],
          [
            "Automation",
            "Use Manual, Copilot or Autopilot depending on how much control you want.",
            Zap
          ],
          [
            "Security",
            "SignalOS keeps provider credentials server-side and respects workspace controls.",
            ShieldCheck
          ]
        ].map(([title, text, Icon]) => (
          <div className="help-card" key={title}>
            <Icon size={21} />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyPage({ icon: Icon, title, description }) {
  return (
    <div>
      <PageHeader
        eyebrow="WORKSPACE"
        title={title}
        description={description}
      />

      <div className="empty-state">
        <Icon size={32} />
        <h3>Ready for data</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   SHARED UI
--------------------------------------------------------- */

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  full = false
}) {
  return (
    <div className={full ? "full-field" : ""}>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
