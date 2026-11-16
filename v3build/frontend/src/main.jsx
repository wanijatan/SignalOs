import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Database,
  ExternalLink,
  Filter,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
  Zap
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const WS = 1;

const ORANGE = "#FF5A1F";

const NAV = [
  {
    label: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "prospects", label: "Prospects", icon: Users },
      { id: "companies", label: "Companies", icon: Building2 },
      { id: "intent", label: "Intent signals", icon: Target }
    ]
  },
  {
    label: "Outbound",
    items: [
      { id: "campaigns", label: "Campaigns", icon: Send },
      { id: "conversations", label: "Conversations", icon: MessageSquare },
      { id: "meetings", label: "Meetings", icon: CalendarDays }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { id: "activity", label: "AI activity", icon: Activity },
      { id: "analytics", label: "Analytics", icon: BarChart3 }
    ]
  },
  {
    label: "System",
    items: [
      { id: "integrations", label: "Integrations", icon: Link2 },
      { id: "automation", label: "Automation", icon: Zap },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  }
];

const PROVIDER_LOGOS = {
  gmail: "https://cdn.simpleicons.org/gmail",
  google_workspace: "https://cdn.simpleicons.org/google",
  google_calendar: "https://cdn.simpleicons.org/googlecalendar",
  google_drive: "https://cdn.simpleicons.org/googledrive",
  outlook: "https://cdn.simpleicons.org/microsoftoutlook",
  microsoft_365: "https://cdn.simpleicons.org/microsoft",
  outlook_calendar: "https://cdn.simpleicons.org/microsoftoutlook",
  resend: "https://cdn.simpleicons.org/resend",
  sendgrid: "https://cdn.simpleicons.org/twilio",
  mailgun: "https://cdn.simpleicons.org/mailgun",
  hubspot: "https://cdn.simpleicons.org/hubspot",
  salesforce: "https://cdn.simpleicons.org/salesforce",
  pipedrive: "https://cdn.simpleicons.org/pipedrive",
  zoho: "https://cdn.simpleicons.org/zoho",
  calendly: "https://cdn.simpleicons.org/calendly",
  calcom: "https://cdn.simpleicons.org/caldotcom",
  twilio: "https://cdn.simpleicons.org/twilio",
  exotel: "https://cdn.simpleicons.org/exotel",
  whatsapp: "https://cdn.simpleicons.org/whatsapp",
  openai: "https://cdn.simpleicons.org/openai",
  anthropic: "https://cdn.simpleicons.org/anthropic",
  gemini: "https://cdn.simpleicons.org/googlegemini",
  openrouter: "https://cdn.simpleicons.org/openrouter",
  apollo: "https://cdn.simpleicons.org/apollo",
  hunter: "https://cdn.simpleicons.org/hunter",
  crunchbase: "https://cdn.simpleicons.org/crunchbase",
  slack: "https://cdn.simpleicons.org/slack",
  microsoft_teams: "https://cdn.simpleicons.org/microsoftteams",
  dropbox: "https://cdn.simpleicons.org/dropbox",
  onedrive: "https://cdn.simpleicons.org/microsoftonedrive"
};

const PROVIDER_DESCRIPTIONS = {
  gmail:
    "Send personalized outreach, read replies and automatically manage conversations.",
  google_workspace:
    "Connect your Google Workspace account for email and productivity workflows.",
  google_calendar:
    "Use Google Calendar for meeting availability and scheduling workflows.",
  outlook:
    "Connect Microsoft Outlook for email sending, replies and mailbox activity.",
  microsoft_365:
    "Connect Microsoft 365 for enterprise email and productivity workflows.",
  calendly:
    "Turn booked meetings into automatic campaign and CRM updates.",
  hubspot:
    "Sync prospects, contacts, companies and campaign activity with HubSpot.",
  salesforce:
    "Push qualified prospects and activity into Salesforce.",
  pipedrive:
    "Keep prospect and deal activity synchronized with Pipedrive.",
  openai:
    "Power SignalOS research, scoring, personalization and AI agents.",
  anthropic:
    "Use Claude for prospect research, reasoning and personalization.",
  hunter:
    "Find and verify professional contact information.",
  apollo:
    "Use Apollo data and enrichment capabilities inside SignalOS.",
  twilio:
    "Enable communication workflows and future voice capabilities.",
  whatsapp:
    "Connect WhatsApp Business for supported messaging workflows."
};

const CATEGORY_LABELS = {
  all: "All",
  email: "Email",
  calendar: "Calendar",
  crm: "CRM",
  ai: "AI",
  data: "Data & enrichment",
  voice: "Voice",
  messaging: "Messaging",
  storage: "Storage",
  notifications: "Notifications"
};

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
    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function providerKey(provider) {
  return (
    provider.id ||
    provider.provider_id ||
    provider.slug ||
    provider.name?.toLowerCase().replace(/\s+/g, "_")
  );
}

function providerLogo(provider) {
  const key = providerKey(provider);

  return (
    provider.logo_url ||
    provider.logo ||
    PROVIDER_LOGOS[key] ||
    `https://cdn.simpleicons.org/${key}`
  );
}

function formatProviderName(provider) {
  return (
    provider.name ||
    provider.display_name ||
    provider.label ||
    provider.id
  );
}

function normalizedStatus(provider) {
  const status = String(
    provider.status ||
      provider.connection_status ||
      provider.connector_status ||
      ""
  ).toLowerCase();

  if (
    status === "connected" ||
    status === "active" ||
    provider.connected === true
  ) {
    return "connected";
  }

  if (
    status === "disabled" ||
    provider.enabled === false
  ) {
    return "disabled";
  }

  return "available";
}

function Logo({ provider, size = 42 }) {
  const [failed, setFailed] = useState(false);

  const name = formatProviderName(provider);
  const letters = name
    ? name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div
      className="provider-logo"
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img
          src={providerLogo(provider)}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{letters}</span>
      )}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`badge badge-${tone}`}>
      {children}
    </span>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = "button"
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <RefreshCw size={16} className="spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
}

function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={22} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action}
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      className={`toggle ${checked ? "toggle-on" : ""}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      aria-label={checked ? "Disable" : "Enable"}
    >
      <span />
    </button>
  );
}

function App() {
  const [page, setPage] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [workspace, setWorkspace] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [providers, setProviders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [integrationModal, setIntegrationModal] =
    useState(null);

  const [onboarding, setOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [automationEnabled, setAutomationEnabled] =
    useState(true);

  const [aiMode, setAiMode] = useState("copilot");

  const [campaignModal, setCampaignModal] =
    useState(false);

  const [toast, setToast] = useState("");

  async function loadWorkspace() {
    try {
      const [workspaceData, dashboardData] =
        await Promise.all([
          api(`/workspaces/${WS}`),
          api(`/workspaces/${WS}/dashboard`)
        ]);

      setWorkspace(workspaceData);
      setDashboard(dashboardData);

      if (workspaceData?.settings) {
        setAutomationEnabled(
          workspaceData.settings.automation_enabled !== false
        );

        setAiMode(
          workspaceData.settings.ai_mode || "copilot"
        );

        if (
          workspaceData.settings.onboarding_completed === false
        ) {
          setOnboarding(true);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadProspects() {
    try {
      const data = await api(
        `/workspaces/${WS}/prospects`
      );

      setProspects(
        Array.isArray(data)
          ? data
          : data?.items || data?.prospects || []
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCampaigns() {
    try {
      const data = await api(
        `/workspaces/${WS}/campaigns`
      );

      setCampaigns(
        Array.isArray(data)
          ? data
          : data?.items || data?.campaigns || []
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProviders() {
    try {
      const data = await api("/providers");

      setProviders(
        Array.isArray(data)
          ? data
          : data?.providers || data?.items || []
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAll() {
    setLoading(true);

    await Promise.all([
      loadWorkspace(),
      loadProspects(),
      loadCampaigns(),
      loadProviders()
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileOpen(false);
  }

  function showToast(message) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  }

  async function completeOnboarding() {
    try {
      await api(
        `/workspaces/${WS}/onboarding/complete`,
        {
          method: "POST"
        }
      );

      setOnboarding(false);
      showToast("Workspace setup completed.");
      loadWorkspace();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function updateAutomation(value) {
    try {
      await api(
        `/workspaces/${WS}/automation`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: value
          })
        }
      );

      setAutomationEnabled(value);

      showToast(
        value
          ? "Automation enabled."
          : "All automation paused."
      );
    } catch (err) {
      showToast(err.message);
    }
  }

  async function changeAiMode(mode) {
    try {
      await api(
        `/workspaces/${WS}/automation`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ai_mode: mode
          })
        }
      );

      setAiMode(mode);
      showToast(`AI mode changed to ${mode}.`);
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        navigate={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        workspace={workspace}
      />

      <main className="main-area">
        <Topbar
          page={page}
          onMenu={() => setMobileOpen(true)}
          automationEnabled={automationEnabled}
          onAutomationChange={updateAutomation}
          onRefresh={loadAll}
        />

        {error && (
          <div className="connection-warning">
            <ShieldCheck size={18} />

            <div>
              <strong>SignalOS API connection issue</strong>
              <span>{error}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={15} />}
              onClick={loadAll}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="page-container">
          {loading && !dashboard ? (
            <LoadingScreen />
          ) : (
            <PageRouter
              page={page}
              dashboard={dashboard}
              prospects={prospects}
              campaigns={campaigns}
              providers={providers}
              workspace={workspace}
              navigate={navigate}
              openIntegration={setIntegrationModal}
              openCampaign={() => setCampaignModal(true)}
              automationEnabled={automationEnabled}
              updateAutomation={updateAutomation}
              aiMode={aiMode}
              changeAiMode={changeAiMode}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {integrationModal && (
        <IntegrationModal
          provider={integrationModal}
          onClose={() => setIntegrationModal(null)}
          onUpdated={async () => {
            await loadProviders();
            await loadWorkspace();
          }}
          showToast={showToast}
        />
      )}

      {campaignModal && (
        <CampaignModal
          onClose={() => setCampaignModal(false)}
          onCreated={async () => {
            await loadCampaigns();
            setCampaignModal(false);
            navigate("campaigns");
            showToast("Campaign created.");
          }}
          showToast={showToast}
        />
      )}

      {onboarding && (
        <Onboarding
          step={onboardingStep}
          setStep={setOnboardingStep}
          onSkip={completeOnboarding}
          onFinish={completeOnboarding}
          navigate={navigate}
        />
      )}

      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  page,
  navigate,
  mobileOpen,
  setMobileOpen,
  workspace
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            S
          </div>

          <div className="brand-name">
            Signal<span>OS</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-selector">
          <div className="workspace-avatar">
            {(workspace?.name || "S")[0]}
          </div>

          <div className="workspace-info">
            <strong>
              {workspace?.name || "Your workspace"}
            </strong>

            <span>Workspace</span>
          </div>

          <ChevronDown size={15} />
        </div>

        <div className="sidebar-content">
          {NAV.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-label">
                {section.label}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    className={`nav-item ${
                      page === item.id ? "nav-active" : ""
                    }`}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={17} strokeWidth={1.8} />

                    <span>{item.label}</span>

                    {item.id === "integrations" &&
                      <span className="nav-dot" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <LifeBuoy size={17} />
            <span>Help center</span>
          </button>

          <button className="user-card">
            <div className="user-avatar">
              <UserRound size={16} />
            </div>

            <div>
              <strong>Workspace owner</strong>
              <span>Admin</span>
            </div>

            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  page,
  onMenu,
  automationEnabled,
  onAutomationChange,
  onRefresh
}) {
  const title =
    NAV.flatMap((x) => x.items).find(
      (x) => x.id === page
    )?.label || "Overview";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu" onClick={onMenu}>
          <Menu size={21} />
        </button>

        <div>
          <div className="breadcrumb">
            SignalOS
            <ChevronRight size={13} />
            {title}
          </div>

          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="automation-pill">
          <span
            className={`status-dot ${
              automationEnabled
                ? "status-green"
                : "status-gray"
            }`}
          />

          <span>
            {automationEnabled
              ? "Automation active"
              : "Automation paused"}
          </span>

          <Toggle
            checked={automationEnabled}
            onChange={onAutomationChange}
          />
        </div>

        <button
          className="icon-button"
          title="Refresh"
          onClick={onRefresh}
        >
          <RefreshCw size={17} />
        </button>

        <button className="icon-button">
          <Bell size={17} />
        </button>

        <div className="command-button">
          <Command size={15} />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </div>
      </div>
    </header>
  );
}

function PageRouter(props) {
  switch (props.page) {
    case "prospects":
      return <ProspectsPage {...props} />;

    case "campaigns":
      return <CampaignsPage {...props} />;

    case "integrations":
      return <IntegrationsPage {...props} />;

    case "automation":
      return <AutomationPage {...props} />;

    case "companies":
      return (
        <PlaceholderPage
          title="Companies"
          icon={Building2}
          description="Manage target accounts and company-level buying signals."
        />
      );

    case "intent":
      return (
        <PlaceholderPage
          title="Intent signals"
          icon={Target}
          description="Discover companies showing meaningful buying intent."
        />
      );

    case "conversations":
      return (
        <PlaceholderPage
          title="Conversations"
          icon={MessageSquare}
          description="Centralize replies, objections, positive responses and follow-ups."
        />
      );

    case "meetings":
      return (
        <PlaceholderPage
          title="Meetings"
          icon={CalendarDays}
          description="Track booked meetings and handoffs."
        />
      );

    case "activity":
      return (
        <PlaceholderPage
          title="AI activity"
          icon={Activity}
          description="Monitor what SignalOS agents are researching, scoring and executing."
        />
      );

    case "analytics":
      return (
        <PlaceholderPage
          title="Analytics"
          icon={BarChart3}
          description="Measure prospecting, outreach and pipeline performance."
        />
      );

    case "settings":
      return (
        <PlaceholderPage
          title="Settings"
          icon={Settings}
          description="Manage workspace, permissions, security and platform configuration."
        />
      );

    default:
      return <OverviewPage {...props} />;
  }
}

function OverviewPage({
  dashboard,
  prospects,
  campaigns,
  navigate,
  openIntegration,
  openCampaign,
  providers
}) {
  const connected =
    providers.filter(
      (p) => normalizedStatus(p) === "connected"
    ).length;

  const totalProspects =
    dashboard?.prospects ??
    dashboard?.prospect_count ??
    prospects.length ??
    0;

  const activeCampaigns =
    dashboard?.active_campaigns ??
    campaigns.filter(
      (c) =>
        String(c.status).toLowerCase() === "active"
    ).length;

  const meetings =
    dashboard?.meetings ??
    dashboard?.meeting_count ??
    0;

  const replies =
    dashboard?.replies ??
    dashboard?.reply_count ??
    0;

  return (
    <>
      <div className="page-header-row">
        <div>
          <div className="eyebrow">
            COMMAND CENTER
          </div>

          <h2>
            Your growth engine, in one place.
          </h2>

          <p>
            SignalOS finds relevant prospects, understands
            why they may buy, and helps your team act at
            the right moment.
          </p>
        </div>

        <div className="header-actions">
          <Button
            variant="secondary"
            icon={<Link2 size={16} />}
            onClick={() => navigate("integrations")}
          >
            Connect tools
          </Button>

          <Button
            icon={<Plus size={16} />}
            onClick={openCampaign}
          >
            Create campaign
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <MetricCard
          label="Prospects"
          value={totalProspects}
          change="In your workspace"
          icon={Users}
        />

        <MetricCard
          label="Active campaigns"
          value={activeCampaigns}
          change="Currently running"
          icon={Send}
        />

        <MetricCard
          label="Replies"
          value={replies}
          change="Detected by SignalOS"
          icon={MessageSquare}
        />

        <MetricCard
          label="Meetings"
          value={meetings}
          change="Booked"
          icon={CalendarDays}
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel panel-large">
          <div className="panel-header">
            <div>
              <h3>Pipeline activity</h3>
              <p>
                Your outbound system at a glance.
              </p>
            </div>

            <button
              className="text-button"
              onClick={() => navigate("analytics")}
            >
              View analytics
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="pipeline">
            <PipelineStage
              number={totalProspects}
              label="Prospects"
              icon={Users}
            />

            <div className="pipeline-arrow">
              <ArrowRight size={17} />
            </div>

            <PipelineStage
              number={activeCampaigns}
              label="Activated"
              icon={Zap}
            />

            <div className="pipeline-arrow">
              <ArrowRight size={17} />
            </div>

            <PipelineStage
              number={replies}
              label="Replies"
              icon={MessageSquare}
            />

            <div className="pipeline-arrow">
              <ArrowRight size={17} />
            </div>

            <PipelineStage
              number={meetings}
              label="Meetings"
              icon={CalendarDays}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Connected stack</h3>
              <p>
                Tools available to SignalOS.
              </p>
            </div>

            <button
              className="icon-button-small"
              onClick={() => navigate("integrations")}
            >
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="stack-list">
            {providers
              .filter(
                (p) =>
                  normalizedStatus(p) === "connected"
              )
              .slice(0, 5)
              .map((provider) => (
                <button
                  className="stack-row"
                  key={providerKey(provider)}
                  onClick={() => openIntegration(provider)}
                >
                  <Logo provider={provider} size={34} />

                  <div>
                    <strong>
                      {formatProviderName(provider)}
                    </strong>

                    <span>Connected</span>
                  </div>

                  <Check
                    size={16}
                    className="success-icon"
                  />
                </button>
              ))}

            {connected === 0 && (
              <div className="mini-empty">
                <Link2 size={19} />
                <span>
                  No integrations connected yet.
                </span>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("integrations")}
          >
            Manage integrations
          </Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Recent prospects</h3>
            <p>
              Highest-priority people in your workspace.
            </p>
          </div>

          <button
            className="text-button"
            onClick={() => navigate("prospects")}
          >
            View all
            <ArrowRight size={15} />
          </button>
        </div>

        <ProspectTable
          prospects={prospects.slice(0, 6)}
          compact
        />
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>

        <div className="metric-icon">
          <Icon size={17} />
        </div>
      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-change">
        {change}
      </div>
    </div>
  );
}

function PipelineStage({
  number,
  label,
  icon: Icon
}) {
  return (
    <div className="pipeline-stage">
      <div className="pipeline-icon">
        <Icon size={18} />
      </div>

      <strong>{number}</strong>
      <span>{label}</span>
    </div>
  );
}

function ProspectsPage({
  prospects,
  openCampaign
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      const text = [
        p.name,
        p.full_name,
        p.email,
        p.title,
        p.company_name,
        p.company,
        p.country
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !query ||
        text.includes(query.toLowerCase());

      const score =
        Number(p.score || p.fit_score || 0);

      const matchesFilter =
        filter === "all" ||
        (filter === "high" && score >= 80) ||
        (filter === "medium" &&
          score >= 50 &&
          score < 80) ||
        (filter === "low" && score < 50);

      return matchesQuery && matchesFilter;
    });
  }, [prospects, query, filter]);

  return (
    <>
      <div className="page-header-row">
        <div>
          <div className="eyebrow">
            PROSPECT INTELLIGENCE
          </div>

          <h2>Prospects</h2>

          <p>
            Review, qualify and activate the people
            SignalOS has identified.
          </p>
        </div>

        <Button
          icon={<Plus size={16} />}
          onClick={openCampaign}
        >
          Create campaign
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search prospects, companies or titles..."
          />
        </div>

        <select
          className="select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="all">
            All prospects
          </option>

          <option value="high">
            High fit
          </option>

          <option value="medium">
            Medium fit
          </option>

          <option value="low">
            Low fit
          </option>
        </select>

        <button className="filter-button">
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="panel table-panel">
        <ProspectTable prospects={filtered} />
      </div>
    </>
  );
}

function ProspectTable({
  prospects,
  compact = false
}) {
  if (!prospects.length) {
    return (
      <EmptyState
        icon={Users}
        title="No prospects yet"
        description="Connect your data providers or create a campaign to start building your prospect pool."
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Prospect</th>
            <th>Company</th>
            <th>Title</th>
            <th>Fit</th>
            <th>Intent</th>
            <th>Status</th>
            {!compact && <th />}
          </tr>
        </thead>

        <tbody>
          {prospects.map((p, index) => {
            const score = Number(
              p.score ||
                p.fit_score ||
                p.qualification_score ||
                0
            );

            const name =
              p.name ||
              p.full_name ||
              "Unnamed prospect";

            const company =
              p.company_name ||
              p.company ||
              "—";

            const title =
              p.title ||
              p.job_title ||
              "—";

            return (
              <tr key={p.id || index}>
                <td>
                  <div className="person-cell">
                    <div className="person-avatar">
                      {name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>{name}</strong>

                      <span>
                        {p.email || "Email not verified"}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="table-primary">
                    {company}
                  </span>
                </td>

                <td>{title}</td>

                <td>
                  <Score score={score} />
                </td>

                <td>
                  <Badge
                    tone={
                      p.intent
                        ? "orange"
                        : "neutral"
                    }
                  >
                    {p.intent || "Unknown"}
                  </Badge>
                </td>

                <td>
                  <Badge
                    tone={
                      String(
                        p.status || "new"
                      ).toLowerCase() ===
                      "active"
                        ? "green"
                        : "neutral"
                    }
                  >
                    {p.status || "New"}
                  </Badge>
                </td>

                {!compact && (
                  <td>
                    <button className="icon-button-small">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Score({ score }) {
  let tone = "low";

  if (score >= 80) tone = "high";
  else if (score >= 50) tone = "medium";

  return (
    <div className={`score score-${tone}`}>
      <span>{score || "—"}</span>
    </div>
  );
}

function CampaignsPage({
  campaigns,
  openCampaign,
  showToast
}) {
  async function updateCampaign(campaign) {
    const current =
      String(campaign.status || "").toLowerCase();

    const next =
      current === "active"
        ? "paused"
        : "active";

    try {
      await api(
        `/workspaces/${WS}/campaigns/${campaign.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: next
          })
        }
      );

      showToast(
        next === "active"
          ? "Campaign activated."
          : "Campaign paused."
      );

      window.location.reload();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <>
      <div className="page-header-row">
        <div>
          <div className="eyebrow">
            OUTBOUND
          </div>

          <h2>Campaigns</h2>

          <p>
            Build evidence-led outbound campaigns
            around real buying signals.
          </p>
        </div>

        <Button
          icon={<Plus size={16} />}
          onClick={openCampaign}
        >
          New campaign
        </Button>
      </div>

      {!campaigns.length ? (
        <div className="panel">
          <EmptyState
            icon={Send}
            title="No campaigns yet"
            description="Create your first campaign and define who SignalOS should find, why they should care, and how they should be contacted."
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={openCampaign}
              >
                Create campaign
              </Button>
            }
          />
        </div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((campaign) => {
            const active =
              String(
                campaign.status || ""
              ).toLowerCase() === "active";

            return (
              <div
                className="campaign-card"
                key={campaign.id}
              >
                <div className="campaign-top">
                  <div className="campaign-icon">
                    <Send size={18} />
                  </div>

                  <Badge
                    tone={
                      active
                        ? "green"
                        : "neutral"
                    }
                  >
                    {campaign.status || "Draft"}
                  </Badge>
                </div>

                <h3>
                  {campaign.name ||
                    "Untitled campaign"}
                </h3>

                <p>
                  {campaign.description ||
                    "Evidence-led prospecting campaign."}
                </p>

                <div className="campaign-meta">
                  <div>
                    <span>Channel</span>
                    <strong>
                      {campaign.channel ||
                        "Email"}
                    </strong>
                  </div>

                  <div>
                    <span>Prospects</span>
                    <strong>
                      {campaign.prospect_count ||
                        0}
                    </strong>
                  </div>
                </div>

                <div className="campaign-footer">
                  <Button
                    variant={
                      active
                        ? "secondary"
                        : "primary"
                    }
                    size="sm"
                    icon={
                      active ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} />
                      )
                    }
                    onClick={() =>
                      updateCampaign(campaign)
                    }
                  >
                    {active
                      ? "Pause"
                      : "Activate"}
                  </Button>

                  <button className="icon-button-small">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function IntegrationsPage({
  providers,
  openIntegration
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState("all");

  const categories = [
    ["all", "All"],
    ["email", "Email"],
    ["calendar", "Calendar"],
    ["crm", "CRM"],
    ["ai", "AI"],
    ["data", "Data & enrichment"],
    ["voice", "Voice"],
    ["messaging", "Messaging"],
    ["storage", "Storage"],
    ["notifications", "Notifications"]
  ];

  const filtered = useMemo(() => {
    return providers.filter((provider) => {
      const name =
        formatProviderName(provider);

      const description =
        provider.description ||
        PROVIDER_DESCRIPTIONS[
          providerKey(provider)
        ] ||
        "";

      const text =
        `${name} ${description}`.toLowerCase();

      const matchesQuery =
        !query ||
        text.includes(query.toLowerCase());

      const providerCategory =
        String(
          provider.category ||
            provider.type ||
            ""
        ).toLowerCase();

      const matchesCategory =
        category === "all" ||
        providerCategory.includes(category);

      return (
        matchesQuery &&
        matchesCategory
      );
    });
  }, [providers, query, category]);

  const connected = providers.filter(
    (p) => normalizedStatus(p) === "connected"
  );

  return (
    <>
      <div className="integration-hero">
        <div>
          <div className="eyebrow">
            APP MARKETPLACE
          </div>

          <h2>
            Connect your sales stack.
          </h2>

          <p>
            Bring the tools your team already uses
            into SignalOS. Connect once, control
            permissions, and decide exactly which
            systems automation can use.
          </p>
        </div>

        <div className="integration-summary">
          <div>
            <strong>{connected.length}</strong>
            <span>Connected</span>
          </div>

          <div>
            <strong>{providers.length}</strong>
            <span>Available</span>
          </div>
        </div>
      </div>

      <div className="integration-toolbar">
        <div className="search-box large">
          <Search size={18} />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search integrations..."
          />
        </div>

        <div className="category-tabs">
          {categories.map(([id, label]) => (
            <button
              key={id}
              className={
                category === id
                  ? "category-active"
                  : ""
              }
              onClick={() =>
                setCategory(id)
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="integration-section">
        <div className="section-title">
          <div>
            <h3>
              {category === "all"
                ? "All integrations"
                : CATEGORY_LABELS[category]}
            </h3>

            <p>
              Connect the systems SignalOS needs
              for prospecting and outbound.
            </p>
          </div>
        </div>

        <div className="integration-grid">
          {filtered.map((provider) => (
            <IntegrationCard
              key={providerKey(provider)}
              provider={provider}
              onClick={() =>
                openIntegration(provider)
              }
            />
          ))}
        </div>

        {!filtered.length && (
          <EmptyState
            icon={Search}
            title="No integrations found"
            description="Try a different search term or category."
          />
        )}
      </div>
    </>
  );
}

function IntegrationCard({
  provider,
  onClick
}) {
  const status =
    normalizedStatus(provider);

  const category =
    provider.category ||
    provider.type ||
    "Integration";

  return (
    <button
      className="integration-card"
      onClick={onClick}
    >
      <div className="integration-card-top">
        <Logo provider={provider} size={48} />

        {status === "connected" ? (
          <span className="connected-label">
            <Check size={13} />
            Connected
          </span>
        ) : status === "disabled" ? (
          <Badge tone="neutral">
            Disabled
          </Badge>
        ) : (
          <span className="arrow-circle">
            <ArrowRight size={15} />
          </span>
        )}
      </div>

      <div className="integration-card-content">
        <div className="integration-name-row">
          <h3>
            {formatProviderName(provider)}
          </h3>

          {provider.recommended && (
            <span className="recommended">
              Recommended
            </span>
          )}
        </div>

        <p>
          {provider.description ||
            PROVIDER_DESCRIPTIONS[
              providerKey(provider)
            ] ||
            "Connect this platform to SignalOS."}
        </p>
      </div>

      <div className="integration-card-footer">
        <span>{category}</span>

        <span>
          {status === "connected"
            ? "Manage"
            : "Connect"}
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

function IntegrationModal({
  provider,
  onClose,
  onUpdated,
  showToast
}) {
  const [loading, setLoading] =
    useState(false);

  const [mode, setMode] =
    useState("overview");

  const [enabled, setEnabled] =
    useState(
      normalizedStatus(provider) !==
        "disabled"
    );

  const [apiKey, setApiKey] =
    useState("");

  const status =
    normalizedStatus(provider);

  const key = providerKey(provider);

  async function connect() {
    setLoading(true);

    try {
      const result = await api(
        `/workspaces/${WS}/connectors/${key}/connect`,
        {
          method: "POST"
        }
      );

      const url =
        result?.authorization_url ||
        result?.auth_url ||
        result?.url;

      if (url) {
        window.location.href = url;
        return;
      }

      if (
        result?.requires_configuration ||
        result?.mode === "manual"
      ) {
        setMode("configure");
      } else {
        showToast("Connection started.");
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function configure() {
    setLoading(true);

    try {
      await api(
        `/workspaces/${WS}/connectors/${key}/configure`,
        {
          method: "POST",
          body: JSON.stringify({
            api_key: apiKey
          })
        }
      );

      await onUpdated();

      showToast(
        `${formatProviderName(
          provider
        )} connected successfully.`
      );

      onClose();
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggle(value) {
    setLoading(true);

    try {
      await api(
        `/workspaces/${WS}/connectors/${key}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: value
          })
        }
      );

      setEnabled(value);

      await onUpdated();

      showToast(
        value
          ? "Integration enabled."
          : "Integration disabled."
      );
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="integration-modal">
        <div className="modal-header">
          <div className="modal-provider-heading">
            <Logo
              provider={provider}
              size={48}
            />

            <div>
              <div className="modal-eyebrow">
                {provider.category ||
                  provider.type ||
                  "INTEGRATION"}
              </div>

              <h2>
                {formatProviderName(provider)}
              </h2>
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {status === "connected" && (
            <div className="connection-success">
              <div className="success-check">
                <Check size={17} />
              </div>

              <div>
                <strong>
                  Connected to SignalOS
                </strong>

                <span>
                  Your workspace can use this
                  integration according to its
                  enabled permissions.
                </span>
              </div>

              <Toggle
                checked={enabled}
                onChange={toggle}
                disabled={loading}
              />
            </div>
          )}

          {mode === "overview" && (
            <>
              <div className="provider-intro">
                <h3>
                  {PROVIDER_DESCRIPTIONS[key] ||
                    provider.description ||
                    `Connect ${formatProviderName(
                      provider
                    )} to SignalOS.`}
                </h3>

                <p>
                  SignalOS only requests the access
                  required for the capabilities you
                  enable.
                </p>
              </div>

              <div className="permissions-card">
                <div className="permissions-header">
                  <div>
                    <h3>
                      What SignalOS can do
                    </h3>

                    <p>
                      You can disable this connection
                      at any time.
                    </p>
                  </div>

                  <ShieldCheck
                    size={20}
                  />
                </div>

                <PermissionRow
                  label="Use the connected account"
                />

                <PermissionRow
                  label="Read relevant activity"
                />

                <PermissionRow
                  label="Create SignalOS actions"
                />

                <PermissionRow
                  label="Sync supported records"
                />
              </div>

              <div className="security-note">
                <ShieldCheck size={17} />

                <div>
                  <strong>
                    Secure authentication
                  </strong>

                  <span>
                    You will authenticate directly
                    with the provider. SignalOS does
                    not ask for your provider password.
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                <Button
                  loading={loading}
                  icon={<Link2 size={16} />}
                  onClick={connect}
                >
                  {status === "connected"
                    ? "Reconnect"
                    : `Connect ${formatProviderName(
                        provider
                      )}`}
                </Button>
              </div>
            </>
          )}

          {mode === "configure" && (
            <>
              <div className="provider-intro">
                <h3>
                  Configure your connection
                </h3>

                <p>
                  Enter the credential generated
                  by your provider. SignalOS stores
                  connection secrets securely.
                </p>
              </div>

              <div className="form-field">
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

              <div className="security-note">
                <ShieldCheck size={17} />

                <div>
                  <strong>
                    Keep control of your access
                  </strong>

                  <span>
                    You can disconnect this integration
                    from SignalOS at any time.
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setMode("overview")
                  }
                >
                  Back
                </Button>

                <Button
                  loading={loading}
                  disabled={!apiKey}
                  onClick={configure}
                >
                  Save connection
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionRow({ label }) {
  return (
    <div className="permission-row">
      <div className="permission-check">
        <Check size={13} />
      </div>

      <span>{label}</span>
    </div>
  );
}

function AutomationPage({
  automationEnabled,
  updateAutomation,
  aiMode,
  changeAiMode
}) {
  return (
    <>
      <div className="page-header-row">
        <div>
          <div className="eyebrow">
            AUTOMATION CONTROL
          </div>

          <h2>Automation</h2>

          <p>
            Decide how much SignalOS should do
            automatically.
          </p>
        </div>
      </div>

      <div className="automation-banner">
        <div className="automation-banner-icon">
          <Zap size={20} />
        </div>

        <div>
          <strong>
            {automationEnabled
              ? "Automation is active"
              : "Automation is paused"}
          </strong>

          <span>
            {automationEnabled
              ? "SignalOS can execute enabled workflows."
              : "No automated actions will be executed."}
          </span>
        </div>

        <Toggle
          checked={automationEnabled}
          onChange={updateAutomation}
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>AI autonomy</h3>

            <p>
              Choose how independently SignalOS
              should operate.
            </p>
          </div>
        </div>

        <div className="mode-grid">
          <AutomationMode
            active={aiMode === "manual"}
            icon={UserRound}
            title="Manual"
            description="SignalOS researches and recommends. You approve actions."
            onClick={() =>
              changeAiMode("manual")
            }
          />

          <AutomationMode
            active={aiMode === "copilot"}
            icon={Bot}
            title="Copilot"
            description="SignalOS prepares actions and waits for approval where appropriate."
            onClick={() =>
              changeAiMode("copilot")
            }
          />

          <AutomationMode
            active={aiMode === "autopilot"}
            icon={Sparkles}
            title="Autopilot"
            description="SignalOS executes approved workflows automatically within your rules."
            onClick={() =>
              changeAiMode("autopilot")
            }
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Safety controls</h3>

            <p>
              Automation should always remain
              controllable.
            </p>
          </div>
        </div>

        <div className="safety-list">
          <SafetyRow
            title="Global kill switch"
            description="Immediately pause all automated activity."
            enabled={automationEnabled}
            onChange={updateAutomation}
          />

          <SafetyRow
            title="Respect suppression lists"
            description="Never contact people who have opted out."
            enabled
            locked
          />

          <SafetyRow
            title="Require verified contact data"
            description="Prevent SignalOS from sending to unverified addresses."
            enabled
            locked
          />
        </div>
      </div>
    </>
  );
}

function AutomationMode({
  active,
  icon: Icon,
  title,
  description,
  onClick
}) {
  return (
    <button
      className={`mode-card ${
        active ? "mode-active" : ""
      }`}
      onClick={onClick}
    >
      <div className="mode-icon">
        <Icon size={20} />
      </div>

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      {active && (
        <div className="mode-check">
          <Check size={14} />
        </div>
      )}
    </button>
  );
}

function SafetyRow({
  title,
  description,
  enabled,
  onChange,
  locked
}) {
  return (
    <div className="safety-row">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <Toggle
        checked={enabled}
        onChange={onChange}
        disabled={locked}
      />
    </div>
  );
}

function CampaignModal({
  onClose,
  onCreated,
  showToast
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    countries: "",
    industries: "",
    decision_makers: "",
    signals: "",
    channel: "email",
    booking_link: ""
  });

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function create() {
    if (!form.name.trim()) {
      showToast(
        "Give your campaign a name first."
      );
      setStep(1);
      return;
    }

    setSaving(true);

    try {
      await api(
        `/workspaces/${WS}/campaigns`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            countries: splitValues(
              form.countries
            ),
            industries: splitValues(
              form.industries
            ),
            decision_makers: splitValues(
              form.decision_makers
            ),
            signals: splitValues(
              form.signals
            ),
            channel: form.channel,
            booking_link: form.booking_link
          })
        }
      );

      await onCreated();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="campaign-modal">
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">
              NEW CAMPAIGN
            </div>

            <h2>Create campaign</h2>

            <p>
              Define the audience, buying signals
              and activation channel.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="wizard-progress">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className={`wizard-step ${
                step >= number
                  ? "wizard-active"
                  : ""
              }`}
            >
              <span>{number}</span>

              <label>
                {number === 1
                  ? "Audience"
                  : number === 2
                  ? "Signals"
                  : "Activation"}
              </label>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="wizard-content">
              <FormField
                label="Campaign name"
                placeholder="e.g. SaaS founders hiring sales teams"
                value={form.name}
                onChange={(v) =>
                  update("name", v)
                }
              />

              <FormField
                label="Countries"
                placeholder="India, United States, United Kingdom"
                hint="Separate multiple values with commas."
                value={form.countries}
                onChange={(v) =>
                  update("countries", v)
                }
              />

              <FormField
                label="Industries"
                placeholder="SaaS, Fintech, Healthcare"
                value={form.industries}
                onChange={(v) =>
                  update("industries", v)
                }
              />

              <FormField
                label="Decision makers"
                placeholder="Founder, CEO, Head of Marketing"
                value={form.decision_makers}
                onChange={(v) =>
                  update(
                    "decision_makers",
                    v
                  )
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="wizard-content">
              <div className="signal-info">
                <Sparkles size={19} />

                <div>
                  <strong>
                    Find prospects with a reason
                    to buy now.
                  </strong>

                  <span>
                    Signals help SignalOS prioritize
                    timing instead of simply creating
                    another contact list.
                  </span>
                </div>
              </div>

              <FormField
                label="Buying signals"
                placeholder="Funding, hiring, expansion, new website, product launch"
                hint="Separate multiple signals with commas."
                value={form.signals}
                onChange={(v) =>
                  update("signals", v)
                }
              />
            </div>
          )}

          {step === 3 && (
            <div className="wizard-content">
              <div className="channel-options">
                {[
                  ["email", Mail, "Email"],
                  [
                    "manual",
                    UserRound,
                    "Manual review"
                  ]
                ].map(
                  ([value, Icon, label]) => (
                    <button
                      key={value}
                      className={`channel-option ${
                        form.channel === value
                          ? "channel-selected"
                          : ""
                      }`}
                      onClick={() =>
                        update(
                          "channel",
                          value
                        )
                      }
                    >
                      <Icon size={19} />
                      <span>{label}</span>

                      {form.channel ===
                        value && (
                        <Check size={16} />
                      )}
                    </button>
                  )
                )}
              </div>

              <FormField
                label="Booking link"
                placeholder="https://calendly.com/..."
                value={form.booking_link}
                onChange={(v) =>
                  update(
                    "booking_link",
                    v
                  )
                }
              />
            </div>
          )}

          <div className="wizard-actions">
            <Button
              variant="secondary"
              onClick={() => {
                if (step === 1) onClose();
                else setStep(step - 1);
              }}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < 3 ? (
              <Button
                icon={
                  <ArrowRight size={16} />
                }
                onClick={() =>
                  setStep(step + 1)
                }
              >
                Continue
              </Button>
            ) : (
              <Button
                loading={saving}
                icon={<Check size={16} />}
                onClick={create}
              >
                Create campaign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  hint
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
      />

      {hint && <span>{hint}</span>}
    </div>
  );
}

function Onboarding({
  step,
  setStep,
  onSkip,
  onFinish,
  navigate
}) {
  const steps = [
    {
      icon: Sparkles,
      eyebrow: "WELCOME TO SIGNALOS",
      title: "Your AI prospecting command center.",
      description:
        "SignalOS helps you find relevant buyers, understand why they may buy now, activate outreach and measure what happens next."
    },
    {
      icon: Target,
      eyebrow: "STEP 1 · INTELLIGENCE",
      title: "Start with the right prospects.",
      description:
        "Define your ICP, target markets and buying signals. SignalOS prioritizes prospects based on fit, evidence and timing."
    },
    {
      icon: Link2,
      eyebrow: "STEP 2 · CONNECT",
      title: "Bring your existing stack.",
      description:
        "Connect email, calendars, CRM, AI and enrichment providers. You choose which systems SignalOS can use."
    },
    {
      icon: Zap,
      eyebrow: "STEP 3 · AUTOMATE",
      title: "Choose how autonomous SignalOS should be.",
      description:
        "Use Manual, Copilot or Autopilot. You can pause every automated action instantly with the global automation switch."
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-card">
        <div className="onboarding-top">
          <div className="onboarding-logo">
            S
          </div>

          <button onClick={onSkip}>
            Skip tour
          </button>
        </div>

        <div className="onboarding-visual">
          <div className="onboarding-orb">
            <Icon size={32} />
          </div>

          <div className="onboarding-lines">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="onboarding-copy">
          <div className="eyebrow">
            {current.eyebrow}
          </div>

          <h2>{current.title}</h2>

          <p>
            {current.description}
          </p>
        </div>

        <div className="onboarding-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={
                index === step
                  ? "dot-active"
                  : ""
              }
              onClick={() =>
                setStep(index)
              }
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            className="text-button"
            onClick={onSkip}
          >
            Skip for now
          </button>

          {step < steps.length - 1 ? (
            <Button
              icon={<ArrowRight size={16} />}
              onClick={() =>
                setStep(step + 1)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              icon={<ArrowRight size={16} />}
              onClick={() => {
                navigate("integrations");
                onFinish();
              }}
            >
              Start building
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceholderPage({
  title,
  icon: Icon,
  description
}) {
  return (
    <div className="panel placeholder-panel">
      <div className="placeholder-icon">
        <Icon size={24} />
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

      <Badge tone="orange">
        SignalOS module
      </Badge>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />

      <strong>
        Loading SignalOS...
      </strong>

      <span>
        Connecting to your workspace.
      </span>
    </div>
  );
}

function splitValues(value) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default App;
