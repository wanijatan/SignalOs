import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Filter,
  HardDrive,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Plus,
  Plug,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const WORKSPACE_ID = 1;

const NAV = [
  ["Overview", LayoutDashboard],
  ["Prospects", Users],
  ["Companies", Building2],
  ["Intent Signals", Zap],
  ["Campaigns", Send],
  ["Conversations", MessageSquare],
  ["Calls", Phone],
  ["Meetings", CalendarDays],
  ["Analytics", BarChart3]
];

const CATEGORIES = {
  email: "Email",
  calendar: "Calendar",
  crm: "CRM",
  ai: "AI",
  data: "Data & Enrichment",
  voice: "Voice",
  messaging: "Messaging",
  storage: "Storage",
  notifications: "Notifications"
};

const ICONS = {
  email: Mail,
  calendar: CalendarDays,
  crm: Building2,
  ai: Brain,
  data: Search,
  voice: Phone,
  messaging: MessageSquare,
  storage: HardDrive,
  notifications: Bell
};

const SIGNALS = [
  "Funding / capital raised",
  "Relevant hiring",
  "Expansion / new market",
  "Product launch",
  "Public buying request",
  "Technology change",
  "Leadership change",
  "New website / product",
  "Competitor change",
  "Technology adoption"
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function PageHeader({
  eyebrow,
  title,
  description,
  action
}) {
  return (
    <div className="pageHeader">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  title,
  text,
  button,
  onClick
}) {
  return (
    <div className="empty">
      <Sparkles size={25} />

      <div className="eyebrow">
        SIGNALOS
      </div>

      <h2>{title}</h2>

      <p>{text}</p>

      {button && (
        <button
          className="btn primary"
          onClick={onClick}
        >
          <Plus size={15} />
          {button}
        </button>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub
}) {
  return (
    <div className="stat">
      <div className="statIcon">
        <Icon size={17} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ONBOARDING
------------------------------------------------------- */

function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Welcome to SignalOS",
      text:
        "Your AI revenue operating system. Find prospects with a reason to buy, prove why now, and control every outbound action.",
      label: "Overview"
    },
    {
      title: "Build your prospect engine",
      text:
        "Configure your ICP, intent signals, countries, industries and decision makers. SignalOS uses these rules to rank opportunities.",
      label: "Prospects & Intent"
    },
    {
      title: "Connect your tools",
      text:
        "Connect the platforms your team already uses. You control which providers are connected and which automations are enabled.",
      label: "Integrations"
    },
    {
      title: "Launch controlled outbound",
      text:
        "Create campaigns, choose your AI autonomy level, review evidence and activate only when you are ready.",
      label: "Campaigns"
    },
    {
      title: "Stay in control",
      text:
        "Pause automation globally, disable individual integrations and keep opt-outs inside your suppression layer.",
      label: "Automation & Safety"
    }
  ];

  const current = slides[step];

  return (
    <div className="tourOverlay">
      <div className="tourCard">

        <div className="tourTop">
          <Badge tone="green">
            QUICK TOUR
          </Badge>

          <button
            className="close"
            onClick={onFinish}
          >
            <X />
          </button>
        </div>

        <div className="tourIcon">
          <Sparkles size={25} />
        </div>

        <div className="tourProgress">
          {slides.map((_, index) => (
            <span
              key={index}
              className={index <= step ? "on" : ""}
            />
          ))}
        </div>

        <div className="eyebrow">
          STEP {step + 1} OF {slides.length}
        </div>

        <h2>{current.title}</h2>

        <p>{current.text}</p>

        <div className="tourHint">
          <CheckCircle2 size={17} />
          <span>{current.label}</span>
        </div>

        <div className="tourActions">

          {step > 0 && (
            <button
              className="btn secondary"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}

          <button
            className="btn ghost"
            onClick={onFinish}
          >
            Skip tour
          </button>

          {step < slides.length - 1 ? (
            <button
              className="btn primary"
              onClick={() => setStep(step + 1)}
            >
              Next
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              className="btn primary"
              onClick={onFinish}
            >
              Finish
              <Check size={15} />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SETUP PANEL
------------------------------------------------------- */

function SetupPanel({ onGo }) {
  return (
    <div className="setupPanel">

      <div>
        <div className="eyebrow">
          GET STARTED
        </div>

        <h2>
          Complete your SignalOS setup
        </h2>

        <p>
          Connect your tools, define your ICP and
          create your first campaign. You can skip
          anything and return later.
        </p>
      </div>

      <div className="setupSteps">

        <button onClick={() => onGo("Integrations")}>
          <Plug size={16} />

          <span>
            <b>Connect platforms</b>
            <small>
              Email, CRM, calendar and AI
            </small>
          </span>

          <ArrowRight size={15} />
        </button>

        <button onClick={() => onGo("Prospects")}>
          <Target size={16} />

          <span>
            <b>Define prospecting</b>
            <small>
              ICP and intent signals
            </small>
          </span>

          <ArrowRight size={15} />
        </button>

        <button onClick={() => onGo("Campaigns")}>
          <Send size={16} />

          <span>
            <b>Create campaign</b>
            <small>
              Start with Copilot mode
            </small>
          </span>

          <ArrowRight size={15} />
        </button>

      </div>
    </div>
  );
}

/* -------------------------------------------------------
   OVERVIEW
------------------------------------------------------- */

function Overview({ go }) {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api(`/workspaces/${WORKSPACE_ID}/dashboard`)
      .then(setDashboard)
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="COMMAND CENTER"
        title="Your revenue engine, under control"
        description="Find the right people, understand why now, start the conversation and stop when the handoff is ready."
        action={
          <button
            className="btn primary"
            onClick={() => go("Campaigns")}
          >
            <Plus size={15} />
            New campaign
          </button>
        }
      />

      <div className="stats">

        <Stat
          icon={Target}
          label="Prospects"
          value={dashboard?.prospects ?? "—"}
          sub="Live database"
        />

        <Stat
          icon={CheckCircle2}
          label="Evidence"
          value={dashboard?.evidence ?? "—"}
          sub="Intent evidence"
        />

        <Stat
          icon={Send}
          label="Campaigns"
          value={dashboard?.campaigns ?? "—"}
          sub="Workspace campaigns"
        />

        <Stat
          icon={Activity}
          label="Jobs"
          value={dashboard?.jobs ?? "—"}
          sub="Automation jobs"
        />

      </div>

      <SetupPanel onGo={go} />

      <div className="dashboardGrid">

        <div className="panel">

          <div className="panelHead">
            <div>
              <h2>Operating loop</h2>
              <span>
                The SignalOS prospecting workflow
              </span>
            </div>

            <Badge tone="green">
              LIVE
            </Badge>
          </div>

          <div className="loop">

            {[
              "Discover",
              "Detect intent",
              "Enrich",
              "Score",
              "Personalize",
              "Contact",
              "Qualify",
              "Book",
              "Stop"
            ].map((item, index) => (
              <div key={item}>
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <b>{item}</b>

                {index < 8 && (
                  <ArrowRight size={13} />
                )}
              </div>
            ))}

          </div>

        </div>

        <div className="panel">

          <div className="panelHead">
            <div>
              <h2>AI control layer</h2>
              <span>
                Choose how much autonomy SignalOS has
              </span>
            </div>
          </div>

          <div className="controlList">

            <div>
              <Brain />

              <span>
                <b>Research Agent</b>
                <small>
                  Finds evidence and buying signals.
                </small>
              </span>

              <Badge tone="green">
                READY
              </Badge>
            </div>

            <div>
              <Sparkles />

              <span>
                <b>Personalization Agent</b>
                <small>
                  Creates evidence-led outreach.
                </small>
              </span>

              <Badge tone="green">
                READY
              </Badge>
            </div>

            <div>
              <ShieldCheck />

              <span>
                <b>Compliance Agent</b>
                <small>
                  Checks suppression and outreach rules.
                </small>
              </span>

              <Badge tone="green">
                READY
              </Badge>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}

/* -------------------------------------------------------
   CAMPAIGN WIZARD
------------------------------------------------------- */

function CampaignWizard({ close, saved }) {

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    countries: "Worldwide",
    industries: "",
    company_sizes: "",
    decision_makers:
      "Founder, CEO, Head of Sales, Head of Marketing",
    technologies: "",
    keywords: "",
    signals: [
      "Funding / capital raised",
      "Relevant hiring"
    ],
    channel: "email",
    booking_link: "",
    daily_limit: "25",
    send_window: "09:00–17:00",
    ai_autonomy: "Copilot"
  });

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const toggleSignal = (signal) => {
    update(
      "signals",
      form.signals.includes(signal)
        ? form.signals.filter((item) => item !== signal)
        : [...form.signals, signal]
    );
  };

  const next = () => {

    setError("");

    if (
      step === 1 &&
      !form.name.trim()
    ) {
      setError(
        "Campaign name is required."
      );
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    }
  };

  const save = async () => {

    if (!form.name.trim()) {
      setError(
        "Campaign name is required."
      );
      return;
    }

    setSaving(true);

    try {

      await api(
        `/workspaces/${WORKSPACE_ID}/campaigns`,
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            workspace_id: WORKSPACE_ID
          })
        }
      );

      saved();
      close();

    } catch (error) {

      setError(error.message);

    } finally {

      setSaving(false);

    }
  };

  return (
    <div className="overlay">

      <div className="wizard">

        <header className="wizardHead">

          <div>
            <div className="eyebrow">
              CAMPAIGN BUILDER
            </div>

            <h2>
              Build an autonomous outbound campaign
            </h2>

            <p>
              Define who to find, why now, how to
              contact them and how much autonomy
              SignalOS has.
            </p>
          </div>

          <button
            className="close"
            onClick={close}
          >
            <X />
          </button>

        </header>

        <div className="wizardSteps">

          {[
            "Basics",
            "ICP",
            "Intent",
            "Channels",
            "AI & review"
          ].map((label, index) => (

            <button
              key={label}
              className={
                step === index + 1
                  ? "active"
                  : step > index + 1
                  ? "done"
                  : ""
              }
              onClick={() => {
                if (index + 1 < step) {
                  setStep(index + 1);
                }
              }}
            >

              <span>
                {step > index + 1 ? (
                  <Check size={13} />
                ) : (
                  index + 1
                )}
              </span>

              {label}

            </button>

          ))}

        </div>

        <div className="wizardBody">

          {step === 1 && (
            <div className="wizardGrid">

              <label className="field full">
                <span>
                  Campaign name *
                </span>

                <input
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    update(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="US B2B SaaS — Support Automation"
                />
              </label>

              <label className="field full">
                <span>
                  What are you selling?
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    update(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Offer, outcome, price range, differentiator and ideal trigger."
                />
              </label>

              <label className="field">
                <span>Countries</span>

                <input
                  value={form.countries}
                  onChange={(event) =>
                    update(
                      "countries",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field">
                <span>Industries</span>

                <input
                  value={form.industries}
                  onChange={(event) =>
                    update(
                      "industries",
                      event.target.value
                    )
                  }
                  placeholder="SaaS, fintech, healthcare"
                />
              </label>

              <label className="field">
                <span>
                  Company sizes
                </span>

                <input
                  value={form.company_sizes}
                  onChange={(event) =>
                    update(
                      "company_sizes",
                      event.target.value
                    )
                  }
                  placeholder="11–50, 51–200"
                />
              </label>

              <label className="field">
                <span>
                  Technologies
                </span>

                <input
                  value={form.technologies}
                  onChange={(event) =>
                    update(
                      "technologies",
                      event.target.value
                    )
                  }
                  placeholder="HubSpot, Shopify"
                />
              </label>

            </div>
          )}

          {step === 2 && (
            <div className="wizardGrid">

              <label className="field full">
                <span>
                  Decision makers
                </span>

                <input
                  value={form.decision_makers}
                  onChange={(event) =>
                    update(
                      "decision_makers",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field full">
                <span>
                  Keywords / buying language
                </span>

                <textarea
                  value={form.keywords}
                  onChange={(event) =>
                    update(
                      "keywords",
                      event.target.value
                    )
                  }
                  placeholder="customer support automation, AI support, Zendesk replacement"
                />
              </label>

              <div className="infoCard full">
                <Target size={18} />

                <div>
                  <b>
                    Account intelligence
                  </b>

                  <p>
                    SignalOS combines fit with
                    intent evidence instead of
                    treating every company as an
                    equal lead.
                  </p>
                </div>
              </div>

            </div>
          )}

          {step === 3 && (
            <div>

              <div className="sectionIntro">
                <b>
                  What signals mean “ready now”?
                </b>

                <span>
                  Select the buying signals this
                  campaign should prioritize.
                </span>
              </div>

              <div className="signalGrid">

                {SIGNALS.map((signal) => (

                  <button
                    type="button"
                    key={signal}
                    className={
                      form.signals.includes(signal)
                        ? "signal selected"
                        : "signal"
                    }
                    onClick={() =>
                      toggleSignal(signal)
                    }
                  >

                    <span>
                      {form.signals.includes(
                        signal
                      ) ? (
                        <Check size={15} />
                      ) : null}
                    </span>

                    <b>{signal}</b>

                    <small>
                      Evidence that can indicate
                      a current business change.
                    </small>

                  </button>

                ))}

              </div>

            </div>
          )}

          {step === 4 && (
            <div className="wizardGrid">

              <div className="channelCard full">

                <div className="channelIcon">
                  <Mail size={20} />
                </div>

                <div>
                  <b>Email</b>

                  <span>
                    Evidence-led outbound through
                    a connected provider.
                  </span>
                </div>

                <Badge tone="green">
                  AVAILABLE
                </Badge>

              </div>

              <label className="field">
                <span>
                  Booking link
                </span>

                <input
                  value={form.booking_link}
                  onChange={(event) =>
                    update(
                      "booking_link",
                      event.target.value
                    )
                  }
                  placeholder="https://calendly.com/yourname/30min"
                />
              </label>

              <label className="field">
                <span>
                  Daily send limit
                </span>

                <input
                  type="number"
                  value={form.daily_limit}
                  onChange={(event) =>
                    update(
                      "daily_limit",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field">
                <span>
                  Sending window
                </span>

                <input
                  value={form.send_window}
                  onChange={(event) =>
                    update(
                      "send_window",
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="infoCard full">

                <ShieldCheck size={18} />

                <div>
                  <b>
                    Safety defaults
                  </b>

                  <p>
                    Opt-outs stop outreach.
                    Booking stops the sequence.
                    SignalOS never guesses contact
                    details.
                  </p>
                </div>

              </div>

            </div>
          )}

          {step === 5 && (
            <div className="review">

              <div className="reviewHero">
                <Sparkles size={22} />

                <div>
                  <b>
                    Ready for launch
                  </b>

                  <span>
                    The campaign will be saved
                    as a draft. Activate it only
                    after reviewing connected
                    providers.
                  </span>
                </div>
              </div>

              <div className="reviewGrid">

                <div>
                  <small>
                    CAMPAIGN
                  </small>

                  <b>
                    {form.name ||
                      "Untitled campaign"}
                  </b>

                  <span>
                    {form.countries} ·{" "}
                    {form.industries ||
                      "All industries"}
                  </span>
                </div>

                <div>
                  <small>
                    BUYING COMMITTEE
                  </small>

                  <b>
                    {form.decision_makers}
                  </b>

                  <span>
                    Technology:{" "}
                    {form.technologies ||
                      "Any"}
                  </span>
                </div>

                <div>
                  <small>
                    INTENT
                  </small>

                  <b>
                    {form.signals.length}{" "}
                    signals selected
                  </b>

                  <span>
                    {form.signals.join(" · ")}
                  </span>
                </div>

                <div>
                  <small>
                    OUTREACH
                  </small>

                  <b>
                    Email ·{" "}
                    {form.daily_limit}/day
                  </b>

                  <span>
                    {form.booking_link ||
                      "No booking link configured yet"}
                  </span>
                </div>

              </div>

              <label className="autonomy">

                <span>
                  AI autonomy
                </span>

                <select
                  value={form.ai_autonomy}
                  onChange={(event) =>
                    update(
                      "ai_autonomy",
                      event.target.value
                    )
                  }
                >
                  <option>
                    Manual
                  </option>

                  <option>
                    Copilot
                  </option>

                  <option>
                    Autopilot
                  </option>
                </select>

              </label>

            </div>
          )}

          {error && (
            <div className="formError">
              {error}
            </div>
          )}

        </div>

        <footer className="wizardFoot">

          <button
            className="btn ghost"
            onClick={close}
          >
            Cancel
          </button>

          <div>

            {step > 1 && (
              <button
                className="btn secondary"
                onClick={() =>
                  setStep(step - 1)
                }
              >
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                className="btn primary"
                onClick={next}
              >
                Continue
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="btn primary"
                disabled={saving}
                onClick={save}
              >
                {saving ? (
                  <RefreshCw
                    className="spin"
                    size={15}
                  />
                ) : (
                  <Check size={15} />
                )}

                Save draft
              </button>
            )}

          </div>

        </footer>

      </div>
    </div>
  );
}

/* -------------------------------------------------------
   INTEGRATIONS
------------------------------------------------------- */

function Integrations() {

  const [providers, setProviders] =
    useState([]);

  const [connections, setConnections] =
    useState({});

  const [category, setCategory] =
    useState("all");

  const [query, setQuery] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const [values, setValues] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = async () => {

    try {

      const [
        providerResponse,
        connectorResponse
      ] = await Promise.all([
        api("/providers"),
        api(
          `/workspaces/${WORKSPACE_ID}/connectors`
        )
      ]);

      setProviders(
        providerResponse.providers || []
      );

      setConnections(
        Object.fromEntries(
          (connectorResponse || []).map(
            (connector) => [
              connector.provider,
              connector
            ]
          )
        )
      );

    } catch (error) {

      setError(error.message);

    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      providers.filter((provider) => {

        const categoryMatch =
          category === "all" ||
          provider.category === category;

        const queryMatch =
          `${provider.name} ${provider.description}`
            .toLowerCase()
            .includes(query.toLowerCase());

        return (
          categoryMatch &&
          queryMatch
        );
      }),
    [providers, category, query]
  );

  const connect = async (provider) => {

    setError("");

    try {

      const result = await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${provider.id}/connect`,
        {
          method: "POST"
        }
      );

      if (result.status === "REDIRECT") {
        window.location.href = result.url;
        return;
      }

      setSelected({
        ...provider,
        edit: false,
        config: result
      });

    } catch (error) {

      setError(error.message);

    }
  };

  const configure = async () => {

    if (!selected) {
      return;
    }

    setSaving(true);

    try {

      await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${selected.id}/configure`,
        {
          method: "POST",
          body: JSON.stringify(values)
        }
      );

      setSelected(null);
      setValues({});
      await load();

    } catch (error) {

      setError(error.message);

    } finally {

      setSaving(false);

    }
  };

  const toggle = async (provider) => {

    const connector =
      connections[provider.id];

    if (!connector) {
      return;
    }

    try {

      await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${provider.id}/configure`,
        {
          method: "POST",
          body: JSON.stringify({
            enabled:
              !(connector.enabled !== false)
          })
        }
      );

      await load();

    } catch (error) {

      setError(error.message);

    }
  };

  const disconnect = async (provider) => {

    try {

      await api(
        `/workspaces/${WORKSPACE_ID}/connectors/${provider.id}`,
        {
          method: "DELETE"
        }
      );

      await load();

    } catch (error) {

      setError(error.message);

    }
  };

  return (
    <>
      <PageHeader
        eyebrow="PLATFORM MARKETPLACE"
        title="Integrations"
        description="Connect the tools your team already uses. You decide what SignalOS can access and what automation stays disabled."
      />

      <div className="integrationNotice">

        <ShieldCheck size={18} />

        <div>
          <b>
            You control every connection
          </b>

          <span>
            OAuth connections open the
            provider authorization page.
            API-key connections are stored
            encrypted on the server.
          </span>
        </div>

      </div>

      {error && (
        <div className="errorNotice">
          {error}
        </div>
      )}

      <div className="integrationToolbar">

        <div className="searchInput">

          <Search size={16} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search integrations…"
          />

        </div>

        <div className="categoryTabs">

          <button
            className={
              category === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setCategory("all")
            }
          >
            All
          </button>

          {Object.entries(CATEGORIES).map(
            ([key, value]) => (
              <button
                key={key}
                className={
                  category === key
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(key)
                }
              >
                {value}
              </button>
            )
          )}

        </div>

      </div>

      <div className="providerGrid">

        {filtered.map((provider) => {

          const connector =
            connections[provider.id];

          const connected =
            connector?.status ===
            "CONNECTED";

          const enabled =
            connector?.enabled !== false &&
            connected;

          return (
            <div
              className="providerCard"
              key={provider.id}
            >

              <div className="providerTop">

                <Logo provider={provider} />

                <div className="providerIdentity">

                  <b>
                    {provider.name}
                  </b>

                  <span>
                    {CATEGORIES[
                      provider.category
                    ]}
                  </span>

                </div>

                {connected && (
                  <Badge
                    tone={
                      enabled
                        ? "green"
                        : "amber"
                    }
                  >
                    {enabled
                      ? "ENABLED"
                      : "DISABLED"}
                  </Badge>
                )}

              </div>

              <p>
                {provider.description}
              </p>

              <div className="providerBottom">

                {!connected ? (
                  <button
                    className="btn primary"
                    onClick={() =>
                      connect(provider)
                    }
                  >
                    <Plug size={14} />
                    Connect
                  </button>
                ) : (
                  <>
                    <label className="toggleRow">

                      <span>
                        Allow automation
                      </span>

                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() =>
                          toggle(provider)
                        }
                      />

                    </label>

                    <button
                      className="btn secondary"
                      onClick={() =>
                        setSelected({
                          ...provider,
                          edit: true
                        })
                      }
                    >
                      Configure
                    </button>

                    <button
                      className="textBtn"
                      onClick={() =>
                        disconnect(provider)
                      }
                    >
                      Disconnect
                    </button>
                  </>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {selected && (
        <div className="overlay">

          <div className="configModal">

            <header>

              <div>

                <div className="eyebrow">
                  {selected.name.toUpperCase()}
                </div>

                <h2>
                  {selected.edit
                    ? "Connection settings"
                    : "Configure connection"}
                </h2>

                <p>
                  {selected.description}
                </p>

              </div>

              <button
                className="close"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X />
              </button>

            </header>

            <div className="configBody">

              {selected.mode === "oauth" ? (

                <div className="oauthGuide">

                  <Logo
                    provider={selected}
                    size={56}
                  />

                  <h3>
                    OAuth authorization
                  </h3>

                  <p>
                    Clicking Connect sends the
                    customer to the provider.
                    SignalOS never asks for the
                    provider password.
                  </p>

                  <code>
                    {API}/oauth/callback/
                    {selected.id}
                  </code>

                  {selected.docs && (
                    <a
                      href={selected.docs}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Provider documentation
                      <ExternalLink size={13} />
                    </a>
                  )}

                </div>

              ) : (

                <div className="configFields">

                  {(selected.fields || []).map(
                    (field) => (

                      <label
                        className="field"
                        key={field.name}
                      >

                        <span>
                          {field.label}
                          {field.required
                            ? " *"
                            : ""}
                        </span>

                        <input
                          type={
                            field.secret
                              ? "password"
                              : "text"
                          }
                          value={
                            values[field.name] ||
                            ""
                          }
                          onChange={(event) =>
                            setValues(
                              (current) => ({
                                ...current,
                                [field.name]:
                                  event.target.value
                              })
                            )
                          }
                          placeholder={
                            field.placeholder
                          }
                        />

                      </label>
                    )
                  )}

                </div>
              )}

            </div>

            <footer className="wizardFoot">

              <button
                className="btn ghost"
                onClick={() =>
                  setSelected(null)
                }
              >
                Cancel
              </button>

              {selected.mode !== "oauth" && (
                <button
                  className="btn primary"
                  disabled={saving}
                  onClick={configure}
                >
                  {saving ? (
                    <RefreshCw
                      className="spin"
                      size={15}
                    />
                  ) : (
                    <Check size={15} />
                  )}

                  Save connection
                </button>
              )}

            </footer>

          </div>

        </div>
      )}

    </>
  );
}

/* -------------------------------------------------------
   CAMPAIGNS
------------------------------------------------------- */

function Campaigns() {

  const [campaigns, setCampaigns] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [wizard, setWizard] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = () => {

    setLoading(true);

    api(
      `/workspaces/${WORKSPACE_ID}/campaigns`
    )
      .then(setCampaigns)
      .catch((error) =>
        setError(error.message)
      )
      .finally(() =>
        setLoading(false)
      );
  };

  useEffect(load, []);

  const changeStatus = async (
    campaign,
    status
  ) => {

    try {

      await api(
        `/workspaces/${WORKSPACE_ID}/campaigns/${campaign.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status
          })
        }
      );

      load();

    } catch (error) {

      setError(error.message);

    }
  };

  return (
    <>
      <PageHeader
        eyebrow="OUTBOUND ENGINE"
        title="Campaigns"
        description="Build, review and control autonomous outbound programs."
        action={
          <button
            className="btn primary"
            onClick={() =>
              setWizard(true)
            }
          >
            <Plus size={15} />
            New campaign
          </button>
        }
      />

      {error && (
        <div className="errorNotice">
          {error}
        </div>
      )}

      <div className="campaignSummary">

        <Stat
          icon={Target}
          label="Campaigns"
          value={campaigns.length}
          sub="Workspace records"
        />

        <Stat
          icon={Play}
          label="Active"
          value={
            campaigns.filter(
              (campaign) =>
                campaign.status === "ACTIVE"
            ).length
          }
          sub="Currently running"
        />

        <Stat
          icon={Clock3}
          label="Drafts"
          value={
            campaigns.filter(
              (campaign) =>
                campaign.status === "DRAFT"
            ).length
          }
          sub="Awaiting launch"
        />

      </div>

      <div className="panel">

        <div className="panelHead">

          <div>
            <h2>
              Campaign library
            </h2>

            <span>
              Real records from the SignalOS
              database
            </span>
          </div>

          <button
            className="btn secondary"
            onClick={load}
          >
            <RefreshCw size={14} />
            Refresh
          </button>

        </div>

        {loading ? (
          <div className="loading">
            Loading campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            text="Create your first campaign. It will be saved to the live database."
            button="Create campaign"
            onClick={() =>
              setWizard(true)
            }
          />
        ) : (
          <div className="campaignList">

            {campaigns.map((campaign) => (

              <div
                className="campaignRow"
                key={campaign.id}
              >

                <div className="campaignAvatar">
                  <Send size={16} />
                </div>

                <div className="campaignMain">

                  <b>
                    {campaign.name}
                  </b>

                  <span>
                    {campaign.channel ||
                      "email"}{" "}
                    ·{" "}
                    {campaign.config
                      ?.countries ||
                      "Worldwide"}{" "}
                    ·{" "}
                    {campaign.config
                      ?.signals?.length ||
                      0}{" "}
                    intent signals
                  </span>

                </div>

                <Badge
                  tone={
                    campaign.status ===
                    "ACTIVE"
                      ? "green"
                      : campaign.status ===
                        "PAUSED"
                      ? "amber"
                      : ""
                  }
                >
                  {campaign.status}
                </Badge>

                <div className="campaignActions">

                  {campaign.status ===
                  "ACTIVE" ? (
                    <button
                      className="btn secondary"
                      onClick={() =>
                        changeStatus(
                          campaign,
                          "PAUSED"
                        )
                      }
                    >
                      <Pause size={14} />
                      Pause
                    </button>
                  ) : (
                    <button
                      className="btn primary"
                      onClick={() =>
                        changeStatus(
                          campaign,
                          "ACTIVE"
                        )
                      }
                    >
                      <Play size={14} />
                      Activate
                    </button>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {wizard && (
        <CampaignWizard
          close={() =>
            setWizard(false)
          }
          saved={load}
        />
      )}

    </>
  );
}

/* -------------------------------------------------------
   PROSPECTS
------------------------------------------------------- */

function Prospects() {

  const [prospects, setProspects] =
    useState([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    api(
      `/workspaces/${WORKSPACE_ID}/prospects`
    )
      .then(setProspects)
      .finally(() =>
        setLoading(false)
      );

  }, []);

  const filtered =
    prospects.filter((prospect) =>
      `${prospect.name}
       ${prospect.company || ""}
       ${prospect.title || ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

  return (
    <>
      <PageHeader
        eyebrow="PROSPECT INTELLIGENCE"
        title="Prospects"
        description="Live prospects ranked from your SignalOS database."
      />

      <div className="toolbar">

        <div className="searchInput">

          <Search size={16} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search people, companies, roles…"
          />

        </div>

        <button className="btn secondary">
          <Filter size={14} />
          Filters
        </button>

      </div>

      <div className="panel">

        <div className="panelHead">

          <div>
            <h2>
              All prospects
            </h2>

            <span>
              {prospects.length} records
            </span>
          </div>

        </div>

        {loading ? (
          <div className="loading">
            Loading prospects…
          </div>
        ) : prospects.length === 0 ? (
          <EmptyState
            title="No prospects yet"
            text="Prospects will appear here once your prospecting workflow is configured."
          />
        ) : (
          <div className="tableWrap">

            <table>

              <thead>
                <tr>
                  <th>PROSPECT</th>
                  <th>COMPANY</th>
                  <th>ROLE</th>
                  <th>FIT</th>
                  <th>INTENT</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map(
                  (prospect) => (

                    <tr
                      key={prospect.id}
                    >

                      <td>
                        <b>
                          {prospect.name}
                        </b>

                        <small>
                          {prospect.email ||
                            "No email"}
                        </small>
                      </td>

                      <td>
                        {prospect.company ||
                          "—"}
                      </td>

                      <td>
                        {prospect.title ||
                          "—"}
                      </td>

                      <td>
                        {Math.round(
                          prospect.fit_score ||
                            0
                        )}
                      </td>

                      <td>
                        {Math.round(
                          prospect.intent_score ||
                            0
                        )}
                      </td>

                      <td>
                        <strong>
                          {Math.round(
                            prospect.total_score ||
                              0
                          )}
                        </strong>
                      </td>

                      <td>
                        <Badge
                          tone={
                            prospect.status ===
                            "QUALIFIED"
                              ? "green"
                              : ""
                          }
                        >
                          {prospect.status ||
                            "NEW"}
                        </Badge>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </>
  );
}

/* -------------------------------------------------------
   PLACEHOLDER
------------------------------------------------------- */

function Placeholder({ name }) {

  return (
    <EmptyState
      title={name}
      text="This module is connected to the SignalOS navigation. Its live workflow can be enabled without changing the rest of the platform."
    />
  );
}

/* -------------------------------------------------------
   LOGO
------------------------------------------------------- */

function Logo({
  provider,
  size = 44
}) {

  const Icon =
    ICONS[provider?.category] ||
    Plug;

  if (provider?.logo) {

    return (
      <img
        className="providerLogo"
        src={provider.logo}
        alt={provider.name}
        onError={(event) => {
          event.currentTarget.style.display =
            "none";
        }}
      />
    );
  }

  return (
    <span
      className="logoFallback"
      style={{
        width: size,
        height: size
      }}
    >
      <Icon size={19} />
    </span>
  );
}

/* -------------------------------------------------------
   APP
------------------------------------------------------- */

function App() {

  const [active, setActive] =
    useState("Overview");

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [tour, setTour] =
    useState(
      () =>
        localStorage.getItem(
          "signalos_tour_done"
        ) !== "1"
    );

  const [automation, setAutomation] =
    useState(true);

  const finishTour = () => {

    localStorage.setItem(
      "signalos_tour_done",
      "1"
    );

    setTour(false);
  };

  let page;

  if (active === "Overview") {
    page = (
      <Overview go={setActive} />
    );
  } else if (active === "Integrations") {
    page = <Integrations />;
  } else if (active === "Campaigns") {
    page = <Campaigns />;
  } else if (active === "Prospects") {
    page = <Prospects />;
  } else {
    page = (
      <Placeholder name={active} />
    );
  }

  return (
    <div className="app">

      <aside
        className={
          sidebarOpen
            ? "sidebar"
            : "sidebar collapsed"
        }
      >

        <div className="brand">

          <span>✦</span>

          {sidebarOpen && (
            <div>
              <b>SignalOS</b>

              <small>
                AI revenue operating system
              </small>
            </div>
          )}

        </div>

        <button className="workspaceSwitch">

          <span className="workspaceMark">
            A
          </span>

          {sidebarOpen && (
            <span>
              <b>Acme Growth</b>
              <small>Workspace</small>
            </span>
          )}

          <ChevronDown size={14} />

        </button>

        <div className="navGroup">

          <label>
            WORKSPACE
          </label>

          {NAV.map(
            ([name, Icon]) => (

              <button
                key={name}
                className={
                  active === name
                    ? "nav active"
                    : "nav"
                }
                onClick={() =>
                  setActive(name)
                }
              >

                <Icon size={16} />

                {sidebarOpen && (
                  <span>{name}</span>
                )}

              </button>

            )
          )}

        </div>

        <div className="navGroup">

          <label>
            SYSTEM
          </label>

          <button
            className={
              active === "Integrations"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              setActive("Integrations")
            }
          >
            <Plug size={16} />

            {sidebarOpen && (
              <span>
                Integrations
              </span>
            )}
          </button>

          <button
            className={
              active === "Suppression"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              setActive("Suppression")
            }
          >
            <ShieldCheck size={16} />

            {sidebarOpen && (
              <span>
                Suppression
              </span>
            )}
          </button>

          <button
            className={
              active === "Settings"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              setActive("Settings")
            }
          >
            <Settings size={16} />

            {sidebarOpen && (
              <span>
                Settings
              </span>
            )}
          </button>

        </div>

        <div className="sidebarBottom">

          <span
            className={
              automation
                ? "liveDot"
                : "pausedDot"
            }
          />

          {sidebarOpen && (
            <>
              <span>
                {automation
                  ? "Automation active"
                  : "Automation paused"}
              </span>

              <Badge
                tone={
                  automation
                    ? "green"
                    : "amber"
                }
              >
                {automation
                  ? "LIVE"
                  : "PAUSED"}
              </Badge>
            </>
          )}

        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <div className="topLeft">

            <button
              className="iconBtn"
              onClick={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
            >
              <Menu size={18} />
            </button>

            <span>
              Workspace /{" "}
              <b>{active}</b>
            </span>

          </div>

          <div className="topRight">

            <button
              className={
                automation
                  ? "automationButton"
                  : "automationButton paused"
              }
              onClick={() =>
                setAutomation(!automation)
              }
            >

              {automation ? (
                <Play size={14} />
              ) : (
                <Pause size={14} />
              )}

              {automation
                ? "Automation active"
                : "Automation paused"}

            </button>

            <div className="globalSearch">

              <Search size={14} />

              <span>
                Search SignalOS
              </span>

              <kbd>
                ⌘ K
              </kbd>

            </div>

            <button className="iconBtn">
              <Bell size={17} />
            </button>

            <div className="avatar">
              JW
            </div>

          </div>

        </header>

        <section className="content">
          {page}
        </section>

      </main>

      {tour && (
        <Onboarding
          onFinish={finishTour}
        />
      )}

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
