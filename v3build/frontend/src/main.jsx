import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/*
  SignalOS Professional Frontend
  - Light theme
  - White / Black / Orange
  - Apollo-style SaaS layout
  - No icon-library dependency
  - Graceful API failures
*/

const API =
  import.meta.env.VITE_API_URL ||
  "https://signalos-api-15va.onrender.com";

const WORKSPACE_ID = 1;

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
      typeof data === "object" && data?.detail
        ? data.detail
        : `Request failed (${response.status})`
    );
  }

  return data;
}

const NAV = [
  {
    group: "Workspace",
    items: [
      ["overview", "Overview", "⌂"],
      ["prospects", "Prospects", "◎"],
      ["companies", "Companies", "▣"],
      ["intent", "Intent Signals", "◉"],
    ],
  },
  {
    group: "Outbound",
    items: [
      ["campaigns", "Campaigns", "↗"],
      ["conversations", "Conversations", "◌"],
      ["meetings", "Meetings", "□"],
    ],
  },
  {
    group: "Intelligence",
    items: [
      ["activity", "AI Activity", "✦"],
      ["analytics", "Analytics", "◒"],
    ],
  },
  {
    group: "System",
    items: [
      ["integrations", "Integrations", "⊞"],
      ["automation", "Automation", "⚙"],
      ["settings", "Settings", "☷"],
    ],
  },
];

const PROVIDER_CATEGORIES = [
  "All",
  "Email",
  "Calendar",
  "CRM",
  "AI",
  "Data",
  "Voice",
  "Messaging",
  "Storage",
  "Notifications",
];

const DEMO_PROVIDERS = [
  {
    id: "gmail",
    name: "Gmail / Google Workspace",
    category: "Email",
    description: "Send emails, read replies and monitor delivery.",
    logo: "G",
    color: "#EA4335",
    scopes: ["Send email", "Read replies", "Delivery events"],
  },
  {
    id: "outlook",
    name: "Microsoft 365 / Outlook",
    category: "Email",
    description: "Connect Microsoft email and business communication.",
    logo: "O",
    color: "#0078D4",
    scopes: ["Send email", "Read replies"],
  },
  {
    id: "resend",
    name: "Resend",
    category: "Email",
    description: "Developer-first transactional and outbound email.",
    logo: "R",
    color: "#111111",
    scopes: ["Send email", "Delivery events"],
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Calendar",
    description: "Sync meetings and stop outreach when a meeting is booked.",
    logo: "C",
    color: "#006BFF",
    scopes: ["Read events", "Meeting status"],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Connect calendar availability and meeting activity.",
    logo: "31",
    color: "#4285F4",
    scopes: ["Read calendar", "Meeting events"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Sync contacts, companies, deals and activity.",
    logo: "H",
    color: "#FF7A59",
    scopes: ["Contacts", "Companies", "Activity"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Connect your Salesforce workspace to SignalOS.",
    logo: "S",
    color: "#00A1E0",
    scopes: ["Contacts", "Accounts", "Activity"],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "CRM",
    description: "Keep prospects and sales activity synchronized.",
    logo: "P",
    color: "#2D9CDB",
    scopes: ["People", "Organizations", "Deals"],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "AI",
    description: "Use AI for research, scoring and personalization.",
    logo: "AI",
    color: "#111111",
    scopes: ["AI generation", "Research", "Classification"],
  },
  {
    id: "anthropic",
    name: "Claude",
    category: "AI",
    description: "Use Claude for research and outbound intelligence.",
    logo: "A",
    color: "#D97757",
    scopes: ["AI generation", "Research"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "AI",
    description: "Connect Gemini for AI-powered prospect intelligence.",
    logo: "G",
    color: "#4285F4",
    scopes: ["AI generation", "Research"],
  },
  {
    id: "apollo",
    name: "Apollo",
    category: "Data",
    description: "Import prospect and company intelligence.",
    logo: "A",
    color: "#6C5CE7",
    scopes: ["People", "Companies", "Signals"],
  },
  {
    id: "hunter",
    name: "Hunter",
    category: "Data",
    description: "Find and verify professional email addresses.",
    logo: "H",
    color: "#FF6B35",
    scopes: ["Email discovery", "Email verification"],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Voice",
    description: "Optional calling and messaging infrastructure.",
    logo: "T",
    color: "#F22F46",
    scopes: ["Voice", "SMS"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Messaging",
    description: "Connect WhatsApp Business for customer communication.",
    logo: "W",
    color: "#25D366",
    scopes: ["Messages", "Templates"],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    category: "Storage",
    description: "Access approved workspace files and assets.",
    logo: "D",
    color: "#34A853",
    scopes: ["Files", "Folders"],
  },
  {
    id: "slack",
    name: "Slack",
    category: "Notifications",
    description: "Receive important SignalOS activity notifications.",
    logo: "S",
    color: "#611F69",
    scopes: ["Notifications", "Activity"],
  },
];

function App() {
  const [page, setPage] = useState("overview");
  const [workspace, setWorkspace] = useState({
    name: "SignalOS Workspace",
    ai_mode: "copilot",
    automation_enabled: true,
    onboarding_completed: false,
  });

  const [dashboard, setDashboard] = useState({});
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [connectProvider, setConnectProvider] = useState(null);

  async function loadAll() {
    setLoading(true);
    setApiError("");

    try {
      const [dash, pros, camps, cons, ws] = await Promise.allSettled([
        api(`/workspaces/${WORKSPACE_ID}/dashboard`),
        api(`/workspaces/${WORKSPACE_ID}/prospects`),
        api(`/workspaces/${WORKSPACE_ID}/campaigns`),
        api(`/workspaces/${WORKSPACE_ID}/connectors`),
        api(`/workspaces/${WORKSPACE_ID}`),
      ]);

      if (dash.status === "fulfilled") setDashboard(dash.value || {});
      if (pros.status === "fulfilled") {
        setProspects(
          Array.isArray(pros.value)
            ? pros.value
            : pros.value?.items || []
        );
      }
      if (camps.status === "fulfilled") {
        setCampaigns(
          Array.isArray(camps.value)
            ? camps.value
            : camps.value?.items || []
        );
      }
      if (cons.status === "fulfilled") {
        setConnectors(
          Array.isArray(cons.value)
            ? cons.value
            : cons.value?.items || []
        );
      }
      if (ws.status === "fulfilled" && ws.value) {
        setWorkspace((old) => ({
          ...old,
          ...ws.value,
          settings: ws.value.settings || old.settings,
        }));
      }

      const failed = [dash, pros, camps, cons, ws].filter(
        (x) => x.status === "rejected"
      );

      if (failed.length === 5) {
        setApiError(
          "SignalOS API is not reachable. Check the VITE_API_URL environment variable and Render service."
        );
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (
      workspace.onboarding_completed === false &&
      !loading &&
      localStorage.getItem("signalos_onboarding_skipped") !== "1"
    ) {
      setShowOnboarding(true);
    }
  }, [workspace.onboarding_completed, loading]);

  async function completeOnboarding() {
    try {
      await api(`/workspaces/${WORKSPACE_ID}/onboarding/complete`, {
        method: "POST",
      });
    } catch {
      // UI should still close even if backend is temporarily unavailable.
    }

    localStorage.setItem("signalos_onboarding_skipped", "1");
    setShowOnboarding(false);
    setWorkspace((w) => ({ ...w, onboarding_completed: true }));
  }

  async function updateAutomation(enabled) {
    try {
      await api(`/workspaces/${WORKSPACE_ID}/automation`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });

      setWorkspace((w) => ({
        ...w,
        automation_enabled: enabled,
      }));
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function updateAIMode(mode) {
    try {
      await api(`/workspaces/${WORKSPACE_ID}/automation`, {
        method: "PATCH",
        body: JSON.stringify({
          ai_mode: mode,
        }),
      });

      setWorkspace((w) => ({
        ...w,
        ai_mode: mode,
      }));
    } catch (error) {
      setApiError(error.message);
    }
  }

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        workspace={workspace}
        onNewCampaign={() => setPage("campaigns")}
      />

      <div className="main">
        <Topbar
          page={page}
          workspace={workspace}
          onSearch={() => setPage("prospects")}
        />

        {apiError && (
          <div className="api-warning">
            <div>
              <strong>Connection notice</strong>
              <span>{apiError}</span>
            </div>
            <button onClick={loadAll}>Retry</button>
          </div>
        )}

        <main className="content">
          {page === "overview" && (
            <Overview
              dashboard={dashboard}
              prospects={prospects}
              campaigns={campaigns}
              connectors={connectors}
              loading={loading}
              onNavigate={setPage}
            />
          )}

          {page === "prospects" && (
            <Prospects prospects={prospects} loading={loading} />
          )}

          {page === "companies" && (
            <Placeholder
              title="Companies"
              description="Company intelligence and account-level prospecting will appear here."
            />
          )}

          {page === "intent" && (
            <Intent />
          )}

          {page === "campaigns" && (
            <Campaigns
              campaigns={campaigns}
              reload={loadAll}
            />
          )}

          {page === "conversations" && (
            <Placeholder
              title="Conversations"
              description="Replies, objections and AI-assisted conversations will appear here."
            />
          )}

          {page === "meetings" && (
            <Placeholder
              title="Meetings"
              description="Booked, upcoming and completed meetings will appear here."
            />
          )}

          {page === "activity" && (
            <Activity />
          )}

          {page === "analytics" && (
            <Analytics
              dashboard={dashboard}
              campaigns={campaigns}
              prospects={prospects}
            />
          )}

          {page === "integrations" && (
            <Integrations
              connectors={connectors}
              onConnect={setConnectProvider}
              reload={loadAll}
            />
          )}

          {page === "automation" && (
            <Automation
              workspace={workspace}
              updateAutomation={updateAutomation}
              updateAIMode={updateAIMode}
            />
          )}

          {page === "settings" && (
            <Settings workspace={workspace} />
          )}
        </main>
      </div>

      {connectProvider && (
        <ConnectModal
          provider={connectProvider}
          onClose={() => setConnectProvider(null)}
          onConnected={() => {
            setConnectProvider(null);
            loadAll();
          }}
        />
      )}

      {showOnboarding && (
        <Onboarding
          onSkip={completeOnboarding}
          onFinish={completeOnboarding}
        />
      )}
    </div>
  );
}

function Sidebar({ page, setPage, workspace, onNewCampaign }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-name">SignalOS</div>
          <div className="brand-sub">Prospecting OS</div>
        </div>
      </div>

      <button className="workspace-switcher">
        <div className="workspace-avatar">
          {(workspace.name || "S").slice(0, 1).toUpperCase()}
        </div>
        <div className="workspace-info">
          <strong>{workspace.name || "SignalOS Workspace"}</strong>
          <span>Workspace</span>
        </div>
        <span className="chevron">⌄</span>
      </button>

      <button className="new-campaign" onClick={onNewCampaign}>
        <span>＋</span>
        New campaign
      </button>

      <nav className="nav">
        {NAV.map((section) => (
          <div className="nav-section" key={section.group}>
            <div className="nav-label">{section.group}</div>

            {section.items.map(([id, label, icon]) => (
              <button
                key={id}
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={() => setPage(id)}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="automation-mini">
          <div className="mini-status">
            <span
              className={`status-dot ${
                workspace.automation_enabled ? "green" : "gray"
              }`}
            />
            {workspace.automation_enabled
              ? "Automation active"
              : "Automation paused"}
          </div>

          <button
            onClick={() =>
              setPage("automation")
            }
          >
            Manage
          </button>
        </div>

        <div className="user-card">
          <div className="user-avatar">JW</div>
          <div>
            <strong>Workspace owner</strong>
            <span>Administrator</span>
          </div>
          <span>•••</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ page, workspace, onSearch }) {
  const titles = {
    overview: ["Overview", "Your prospecting command center"],
    prospects: ["Prospects", "Find and prioritize people worth contacting"],
    companies: ["Companies", "Account intelligence and buying signals"],
    intent: ["Intent Signals", "Understand why a prospect may buy now"],
    campaigns: ["Campaigns", "Create and manage outbound campaigns"],
    conversations: ["Conversations", "Manage replies and AI conversations"],
    meetings: ["Meetings", "Track booked and upcoming meetings"],
    activity: ["AI Activity", "See what SignalOS is doing"],
    analytics: ["Analytics", "Measure pipeline and outbound performance"],
    integrations: ["Integrations", "Connect the tools your team already uses"],
    automation: ["Automation", "Control how independently SignalOS operates"],
    settings: ["Settings", "Manage workspace configuration"],
  };

  const [title, subtitle] = titles[page] || titles.overview;

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <button className="global-search" onClick={onSearch}>
          <span>⌕</span>
          <span>Search prospects, companies...</span>
          <kbd>⌘ K</kbd>
        </button>

        <button className="icon-button" title="Notifications">
          ♢
        </button>

        <div className="top-avatar">JW</div>
      </div>
    </header>
  );
}

function Overview({
  dashboard,
  prospects,
  campaigns,
  connectors,
  loading,
  onNavigate,
}) {
  const connected =
    connectors.filter(
      (x) =>
        x.status === "CONNECTED" ||
        x.connected === true ||
        x.enabled === true
    ).length || 0;

  const stats = [
    {
      label: "Prospects",
      value:
        dashboard?.prospects_count ??
        dashboard?.prospects ??
        prospects.length ??
        0,
      change: "Total tracked",
    },
    {
      label: "Active campaigns",
      value:
        dashboard?.active_campaigns ??
        campaigns.filter(
          (c) => String(c.status).toUpperCase() === "ACTIVE"
        ).length,
      change: "Currently running",
    },
    {
      label: "Meetings",
      value: dashboard?.meetings ?? 0,
      change: "Booked",
    },
    {
      label: "Connected tools",
      value: connected,
      change: "Integrations",
    },
  ];

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">COMMAND CENTER</div>
          <h2>Good to see you.</h2>
          <p>
            SignalOS turns buying signals into qualified conversations.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => onNavigate("campaigns")}
        >
          + Create campaign
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className="stat-icon">↗</span>
            </div>

            <strong>{loading ? "—" : stat.value}</strong>
            <small>{stat.change}</small>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Prospecting pipeline</h3>
              <p>Current prospect activity</p>
            </div>
            <button onClick={() => onNavigate("prospects")}>
              View all →
            </button>
          </div>

          {prospects.length === 0 ? (
            <EmptyState
              icon="◎"
              title="No prospects yet"
              description="Once SignalOS finds prospects matching your ICP, they will appear here."
              action="Explore prospects"
              onClick={() => onNavigate("prospects")}
            />
          ) : (
            <div className="table">
              {prospects.slice(0, 6).map((p, i) => (
                <div className="table-row" key={p.id || i}>
                  <div className="person">
                    <div className="person-avatar">
                      {(p.name || p.full_name || "P").slice(0, 1)}
                    </div>
                    <div>
                      <strong>
                        {p.name || p.full_name || "Unnamed prospect"}
                      </strong>
                      <span>
                        {p.title || p.job_title || "Decision maker"}
                      </span>
                    </div>
                  </div>

                  <div className="company-name">
                    {p.company_name || p.company || "Company"}
                  </div>

                  <div>
                    <span className="score-badge">
                      {p.score ?? p.intent_score ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Setup checklist</h3>
              <p>Get SignalOS ready for real outreach</p>
            </div>
          </div>

          <SetupChecklist
            connected={connected}
            campaigns={campaigns.length}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h3>How SignalOS works</h3>
            <p>The operating loop behind your outbound system</p>
          </div>
        </div>

        <div className="flow">
          <FlowStep number="01" title="Find" text="Discover accounts and people." />
          <div className="flow-arrow">→</div>
          <FlowStep number="02" title="Understand" text="Detect intent and evidence." />
          <div className="flow-arrow">→</div>
          <FlowStep number="03" title="Prioritize" text="Score the best opportunities." />
          <div className="flow-arrow">→</div>
          <FlowStep number="04" title="Contact" text="Send relevant outreach." />
          <div className="flow-arrow">→</div>
          <FlowStep number="05" title="Book" text="Convert replies into meetings." />
        </div>
      </div>
    </>
  );
}

function SetupChecklist({ connected, campaigns, onNavigate }) {
  const items = [
    {
      label: "Connect an email provider",
      done: connected > 0,
      page: "integrations",
    },
    {
      label: "Define your ICP",
      done: false,
      page: "settings",
    },
    {
      label: "Choose intent signals",
      done: false,
      page: "intent",
    },
    {
      label: "Create your first campaign",
      done: campaigns > 0,
      page: "campaigns",
    },
  ];

  return (
    <div className="checklist">
      {items.map((item) => (
        <button
          className="check-item"
          key={item.label}
          onClick={() => onNavigate(item.page)}
        >
          <span className={`check ${item.done ? "done" : ""}`}>
            {item.done ? "✓" : ""}
          </span>
          <span>{item.label}</span>
          <span className="check-arrow">→</span>
        </button>
      ))}
    </div>
  );
}

function FlowStep({ number, title, text }) {
  return (
    <div className="flow-step">
      <span>{number}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Prospects({ prospects, loading }) {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">PROSPECT INTELLIGENCE</div>
          <h2>Prospects</h2>
          <p>Prioritized people based on fit, intent and evidence.</p>
        </div>

        <button className="secondary-button">＋ Add prospect</button>
      </div>

      <div className="toolbar">
        <div className="search-input">
          ⌕
          <input placeholder="Search prospects..." />
        </div>

        <button>Filter</button>
        <button>Sort by score</button>
        <button>Export</button>
      </div>

      <div className="panel">
        <div className="data-table">
          <div className="data-head">
            <span>Prospect</span>
            <span>Company</span>
            <span>Title</span>
            <span>Intent</span>
            <span>Score</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="table-empty">Loading prospects...</div>
          ) : prospects.length === 0 ? (
            <div className="table-empty">
              <EmptyState
                icon="◎"
                title="Your prospect list is empty"
                description="Connect a data provider or create a campaign to begin prospect discovery."
              />
            </div>
          ) : (
            prospects.map((p, i) => (
              <div className="data-row" key={p.id || i}>
                <div className="person">
                  <div className="person-avatar">
                    {(p.name || p.full_name || "P").slice(0, 1)}
                  </div>
                  <div>
                    <strong>{p.name || p.full_name || "Unknown"}</strong>
                    <span>{p.email || "No email available"}</span>
                  </div>
                </div>

                <span>{p.company_name || p.company || "—"}</span>
                <span>{p.title || p.job_title || "—"}</span>
                <span>
                  <span className="intent-badge">
                    {p.intent || p.intent_signal || "Unknown"}
                  </span>
                </span>
                <strong>{p.score ?? p.intent_score ?? "—"}</strong>
                <span className="status-pill">
                  {p.status || "New"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Campaigns({ campaigns, reload }) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: "email",
    countries: "",
    industries: "",
    decision_makers: "",
    signals: "",
    booking_link: "",
  });

  async function createCampaign() {
    if (!form.name.trim()) return;

    setCreating(true);

    try {
      await api(`/workspaces/${WORKSPACE_ID}/campaigns`, {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
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
          booking_link: form.booking_link,
        }),
      });

      setForm({
        name: "",
        channel: "email",
        countries: "",
        industries: "",
        decision_makers: "",
        signals: "",
        booking_link: "",
      });

      setShowCreate(false);
      await reload();
    } catch (error) {
      alert(`Campaign could not be created: ${error.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function toggleCampaign(campaign) {
    const active =
      String(campaign.status).toUpperCase() === "ACTIVE";

    try {
      await api(
        `/workspaces/${WORKSPACE_ID}/campaigns/${campaign.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: active ? "PAUSED" : "ACTIVE",
          }),
        }
      );

      await reload();
    } catch (error) {
      alert(`Could not update campaign: ${error.message}`);
    }
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">OUTBOUND ENGINE</div>
          <h2>Campaigns</h2>
          <p>Build targeted, evidence-driven outbound sequences.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowCreate(true)}
        >
          ＋ New campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="panel large-empty">
          <EmptyState
            icon="↗"
            title="Create your first campaign"
            description="Define who you want to reach, what signals matter and which channel SignalOS should use."
            action="Create campaign"
            onClick={() => setShowCreate(true)}
          />
        </div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((campaign, i) => {
            const active =
              String(campaign.status).toUpperCase() === "ACTIVE";

            return (
              <div className="campaign-card" key={campaign.id || i}>
                <div className="campaign-card-top">
                  <div className="campaign-icon">↗</div>
                  <span
                    className={`campaign-status ${
                      active ? "active" : "paused"
                    }`}
                  >
                    {active ? "Active" : "Paused"}
                  </span>
                </div>

                <h3>{campaign.name}</h3>

                <p>
                  {campaign.channel || "Email"} outbound campaign
                </p>

                <div className="campaign-meta">
                  <span>
                    {Array.isArray(campaign.countries)
                      ? campaign.countries.join(", ") || "All countries"
                      : "All countries"}
                  </span>
                  <span>
                    {Array.isArray(campaign.signals)
                      ? campaign.signals.length
                      : 0}{" "}
                    signals
                  </span>
                </div>

                <button
                  className={active ? "secondary-button" : "primary-button"}
                  onClick={() => toggleCampaign(campaign)}
                >
                  {active ? "Pause campaign" : "Activate campaign"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop">
          <div className="modal campaign-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">NEW CAMPAIGN</div>
                <h2>Create campaign</h2>
                <p>Start with the fundamentals. You can refine it later.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Campaign name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. SaaS founders hiring sales teams"
                />
              </label>

              <label>
                Channel
                <select
                  value={form.channel}
                  onChange={(e) =>
                    setForm({ ...form, channel: e.target.value })
                  }
                >
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="multi-channel">Multi-channel</option>
                </select>
              </label>

              <label>
                Countries
                <input
                  value={form.countries}
                  onChange={(e) =>
                    setForm({ ...form, countries: e.target.value })
                  }
                  placeholder="India, United States, United Kingdom"
                />
              </label>

              <label>
                Industries
                <input
                  value={form.industries}
                  onChange={(e) =>
                    setForm({ ...form, industries: e.target.value })
                  }
                  placeholder="SaaS, Fintech, Healthcare"
                />
              </label>

              <label>
                Decision makers
                <input
                  value={form.decision_makers}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      decision_makers: e.target.value,
                    })
                  }
                  placeholder="Founder, CEO, VP Marketing"
                />
              </label>

              <label>
                Intent signals
                <input
                  value={form.signals}
                  onChange={(e) =>
                    setForm({ ...form, signals: e.target.value })
                  }
                  placeholder="Hiring, Funding, Expansion"
                />
              </label>

              <label className="full">
                Booking link
                <input
                  value={form.booking_link}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      booking_link: e.target.value,
                    })
                  }
                  placeholder="https://calendly.com/..."
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                disabled={creating}
                onClick={createCampaign}
              >
                {creating ? "Creating..." : "Create campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Integrations({ connectors, onConnect, reload }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const providerState = (provider) => {
    const match = connectors.find(
      (c) =>
        c.provider === provider.id ||
        c.provider_id === provider.id
    );

    return {
      ...provider,
      ...match,
      connected:
        match?.status === "CONNECTED" ||
        match?.connected === true,
      enabled:
        match?.enabled !== false &&
        match?.status !== "DISABLED",
    };
  };

  const providers = DEMO_PROVIDERS.map(providerState).filter((p) => {
    const categoryMatch =
      category === "All" || p.category === category;

    const searchMatch =
      !search ||
      `${p.name} ${p.description} ${p.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return categoryMatch && searchMatch;
  });

  async function toggle(provider) {
    if (!provider.connected) {
      onConnect(provider);
      return;
    }

    try {
      await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${provider.id}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({
            enabled: !provider.enabled,
          }),
        }
      );

      await reload();
    } catch (error) {
      alert(`Could not update integration: ${error.message}`);
    }
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">APP MARKETPLACE</div>
          <h2>Integrations</h2>
          <p>
            Connect the tools your team already uses. SignalOS works around
            your existing stack.
          </p>
        </div>

        <div className="integration-count">
          <strong>
            {providers.filter((p) => p.connected).length}
          </strong>
          connected
        </div>
      </div>

      <div className="integration-hero">
        <div>
          <span className="hero-badge">YOUR STACK, YOUR CONTROL</span>
          <h3>Connect SignalOS to your workflow.</h3>
          <p>
            Choose your providers, control their permissions and disable
            anything whenever you want.
          </p>
        </div>

        <div className="hero-visual">
          <div className="orbit center">S</div>
          <div className="orbit orbit-a">G</div>
          <div className="orbit orbit-b">C</div>
          <div className="orbit orbit-c">H</div>
          <div className="orbit orbit-d">AI</div>
        </div>
      </div>

      <div className="integration-toolbar">
        <div className="search-input large">
          ⌕
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
          />
        </div>
      </div>

      <div className="category-tabs">
        {PROVIDER_CATEGORIES.map((item) => (
          <button
            key={item}
            className={category === item ? "selected" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="integration-grid">
        {providers.map((provider) => (
          <IntegrationCard
            key={provider.id}
            provider={provider}
            onAction={() => toggle(provider)}
          />
        ))}
      </div>
    </>
  );
}

function IntegrationCard({ provider, onAction }) {
  return (
    <div className="integration-card">
      <div className="integration-card-head">
        <div
          className="provider-logo"
          style={{
            "--provider-color": provider.color || "#111",
          }}
        >
          {provider.logo}
        </div>

        {provider.connected ? (
          <span
            className={`connected-label ${
              provider.enabled ? "on" : "off"
            }`}
          >
            <span className="status-dot" />
            {provider.enabled ? "Connected" : "Disabled"}
          </span>
        ) : (
          <span className="available-label">Available</span>
        )}
      </div>

      <div className="integration-card-body">
        <div className="provider-category">
          {provider.category}
        </div>

        <h3>{provider.name}</h3>

        <p>{provider.description}</p>

        <div className="permission-list">
          {(provider.scopes || []).slice(0, 3).map((scope) => (
            <span key={scope}>✓ {scope}</span>
          ))}
        </div>
      </div>

      <div className="integration-card-footer">
        <button
          className={
            provider.connected && provider.enabled
              ? "secondary-button"
              : "primary-button"
          }
          onClick={onAction}
        >
          {!provider.connected
            ? "Connect"
            : provider.enabled
            ? "Disable"
            : "Enable"}
        </button>

        {provider.connected && (
          <button className="text-button">Configure →</button>
        )}
      </div>
    </div>
  );
}

function ConnectModal({ provider, onClose, onConnected }) {
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    setConnecting(true);

    try {
      const result = await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${provider.id}/connect`,
        {
          method: "POST",
        }
      );

      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      onConnected();
    } catch (error) {
      alert(`Connection could not be started: ${error.message}`);
      setConnecting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal connect-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div
          className="provider-logo large-logo"
          style={{
            "--provider-color": provider.color || "#111",
          }}
        >
          {provider.logo}
        </div>

        <div className="eyebrow">{provider.category}</div>

        <h2>Connect {provider.name}</h2>

        <p className="modal-description">
          SignalOS will redirect you to the provider's official
          authorization page. Your provider password is never stored by
          SignalOS.
        </p>

        <div className="permission-box">
          <strong>SignalOS will request</strong>

          {(provider.scopes || []).map((scope) => (
            <div className="permission-row" key={scope}>
              <span className="permission-check">✓</span>
              <span>{scope}</span>
            </div>
          ))}

          <div className="permission-note">
            You can disable or disconnect this integration later.
          </div>
        </div>

        <div className="security-note">
          <span>◆</span>
          <div>
            <strong>Secure connection</strong>
            <p>
              Authentication is handled by the provider using OAuth or
              secure API credentials.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button
            className="primary-button"
            disabled={connecting}
            onClick={connect}
          >
            {connecting
              ? "Connecting..."
              : `Connect ${provider.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Intent() {
  const signals = [
    ["Funding", "Company recently raised capital", "High"],
    ["Hiring", "Rapid hiring in relevant departments", "High"],
    ["Expansion", "Entering a new market or geography", "Medium"],
    ["Website change", "New website or product launch", "Medium"],
    ["Leadership", "New executive or founder activity", "Medium"],
  ];

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">BUYING INTELLIGENCE</div>
          <h2>Intent Signals</h2>
          <p>Tell SignalOS what events indicate a reason to buy.</p>
        </div>
      </div>

      <div className="signal-grid">
        {signals.map(([title, description, strength]) => (
          <div className="signal-card" key={title}>
            <div className="signal-icon">◉</div>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <span className={`strength ${strength.toLowerCase()}`}>
              {strength}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Automation({
  workspace,
  updateAutomation,
  updateAIMode,
}) {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">CONTROL CENTER</div>
          <h2>Automation</h2>
          <p>Decide how independently SignalOS should operate.</p>
        </div>

        <div
          className={`automation-status ${
            workspace.automation_enabled ? "enabled" : "disabled"
          }`}
        >
          <span className="status-dot" />
          {workspace.automation_enabled
            ? "Automation ON"
            : "Automation OFF"}
        </div>
      </div>

      <div className="automation-layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>AI autonomy</h3>
              <p>Choose how much control SignalOS has.</p>
            </div>
          </div>

          <div className="mode-list">
            {[
              [
                "manual",
                "Manual",
                "SignalOS recommends actions. You approve everything.",
              ],
              [
                "copilot",
                "Copilot",
                "SignalOS prepares actions and lets you stay in control.",
              ],
              [
                "autopilot",
                "Autopilot",
                "SignalOS can execute approved workflows automatically.",
              ],
            ].map(([value, title, description]) => (
              <button
                key={value}
                className={`mode-card ${
                  workspace.ai_mode === value ? "selected" : ""
                }`}
                onClick={() => updateAIMode(value)}
              >
                <span className="radio">
                  {workspace.ai_mode === value ? "●" : "○"}
                </span>

                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel danger-panel">
          <div className="panel-header">
            <div>
              <h3>Global automation switch</h3>
              <p>
                Immediately pause outbound automation across this
                workspace.
              </p>
            </div>
          </div>

          <div className="kill-switch">
            <div>
              <strong>
                {workspace.automation_enabled
                  ? "Automation is running"
                  : "Automation is paused"}
              </strong>
              <p>
                This does not disconnect your integrations or delete data.
              </p>
            </div>

            <button
              className={
                workspace.automation_enabled
                  ? "danger-button"
                  : "primary-button"
              }
              onClick={() =>
                updateAutomation(!workspace.automation_enabled)
              }
            >
              {workspace.automation_enabled
                ? "Pause all automation"
                : "Resume automation"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Activity() {
  const items = [
    ["Research Agent", "Reviewing prospect evidence", "Just now"],
    ["Intent Agent", "Scoring a new buying signal", "2 min ago"],
    ["Enrichment Agent", "Verifying company information", "5 min ago"],
    ["Email Agent", "Preparing personalized outreach", "8 min ago"],
  ];

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">AI OPERATIONS</div>
          <h2>AI Activity</h2>
          <p>See what your AI agents are working on.</p>
        </div>
      </div>

      <div className="panel">
        <div className="activity-list">
          {items.map(([agent, action, time]) => (
            <div className="activity-row" key={agent}>
              <div className="activity-icon">✦</div>
              <div>
                <strong>{agent}</strong>
                <p>{action}</p>
              </div>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Analytics({ dashboard, campaigns, prospects }) {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">PERFORMANCE</div>
          <h2>Analytics</h2>
          <p>Understand how your prospecting engine is performing.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total prospects</span>
          <strong>
            {dashboard?.prospects_count ?? prospects.length}
          </strong>
          <small>Tracked</small>
        </div>

        <div className="stat-card">
          <span>Campaigns</span>
          <strong>{campaigns.length}</strong>
          <small>Created</small>
        </div>

        <div className="stat-card">
          <span>Meetings</span>
          <strong>{dashboard?.meetings ?? 0}</strong>
          <small>Booked</small>
        </div>

        <div className="stat-card">
          <span>Replies</span>
          <strong>{dashboard?.replies ?? 0}</strong>
          <small>Detected</small>
        </div>
      </div>

      <div className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h3>Outbound activity</h3>
            <p>Performance visualization will populate as activity grows.</p>
          </div>
        </div>

        <div className="chart-placeholder">
          <div className="chart-line">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <p>Not enough activity to display a meaningful trend yet.</p>
        </div>
      </div>
    </>
  );
}

function Settings({ workspace }) {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">WORKSPACE</div>
          <h2>Settings</h2>
          <p>Manage your SignalOS workspace.</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="panel">
          <h3>Workspace</h3>

          <label>
            Workspace name
            <input value={workspace.name || ""} readOnly />
          </label>

          <label>
            Workspace ID
            <input value={WORKSPACE_ID} readOnly />
          </label>
        </div>

        <div className="panel">
          <h3>Environment</h3>

          <div className="setting-row">
            <span>API</span>
            <code>{API}</code>
          </div>

          <div className="setting-row">
            <span>AI mode</span>
            <strong>{workspace.ai_mode || "copilot"}</strong>
          </div>

          <div className="setting-row">
            <span>Automation</span>
            <strong>
              {workspace.automation_enabled ? "Enabled" : "Disabled"}
            </strong>
          </div>
        </div>
      </div>
    </>
  );
}

function Placeholder({ title, description }) {
  return (
    <div className="panel large-empty">
      <EmptyState
        icon="◌"
        title={title}
        description={description}
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  onClick,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>

      {action && (
        <button className="secondary-button" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  );
}

function Onboarding({ onSkip, onFinish }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      label: "Welcome",
      title: "Welcome to SignalOS",
      text: "SignalOS helps your team find the right prospects, understand why they may buy and turn those signals into conversations.",
    },
    {
      label: "Prospecting",
      title: "Start with the right prospects",
      text: "Define your ICP, target industries and decision makers. SignalOS uses those rules to focus your prospecting engine.",
    },
    {
      label: "Intent",
      title: "Look for reasons to buy",
      text: "Funding, hiring, expansion, leadership changes and other signals help SignalOS understand why now.",
    },
    {
      label: "Integrations",
      title: "Connect your existing stack",
      text: "Connect Gmail, Outlook, CRMs, calendars, AI providers and data platforms. You control what is enabled.",
    },
    {
      label: "Automation",
      title: "You stay in control",
      text: "Choose Manual, Copilot or Autopilot. You can pause all automation instantly from the Automation page.",
    },
  ];

  const current = steps[step];

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding">
        <div className="onboarding-side">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div>
              <div className="brand-name">SignalOS</div>
              <div className="brand-sub">Prospecting OS</div>
            </div>
          </div>

          <div className="tour-steps">
            {steps.map((item, i) => (
              <div
                key={item.label}
                className={`tour-step ${
                  i === step ? "active" : ""
                } ${i < step ? "completed" : ""}`}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>

          <button className="skip-tour" onClick={onSkip}>
            Skip tour
          </button>
        </div>

        <div className="onboarding-main">
          <div className="tour-illustration">
            <div className="tour-circle">
              <span>✦</span>
            </div>
          </div>

          <div className="eyebrow">
            STEP {step + 1} OF {steps.length}
          </div>

          <h2>{current.title}</h2>
          <p>{current.text}</p>

          <div className="onboarding-actions">
            {step > 0 && (
              <button
                className="secondary-button"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}

            <button
              className="primary-button"
              onClick={() => {
                if (step === steps.length - 1) {
                  onFinish();
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === steps.length - 1
                ? "Start using SignalOS"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
