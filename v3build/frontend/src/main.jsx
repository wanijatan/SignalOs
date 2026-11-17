import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  ExternalLink,
  FileText,
  Gauge,
  HelpCircle,
  Link2,
  Loader2,
  Menu,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
  Zap
} from 'lucide-react';

import './styles.css';


const API = (
  import.meta.env.VITE_API_URL ||
  'https://signalos-api-15va.onrender.com'
).replace(/\/$/, '');

const WS = 1;


async function api(path, opt = {}) {
  const response = await fetch(
    `${API}${path}`,
    {
      ...opt,
      headers: {
        'Content-Type': 'application/json',
        ...(opt.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      detail: text
    };
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      `${response.status} ${response.statusText}`
    );
  }

  return data;
}


const groups = [
  {
    title: 'Workspace',
    items: [
      ['overview', 'Overview', Gauge],
      ['prospects', 'Prospects', Users],
      ['companies', 'Companies', Building2],
      ['signals', 'Intent signals', Target]
    ]
  },
  {
    title: 'Outbound',
    items: [
      ['campaigns', 'Campaigns', Send],
      ['conversations', 'Conversations', MessageSquare],
      ['meetings', 'Meetings', Calendar]
    ]
  },
  {
    title: 'Intelligence',
    items: [
      ['activity', 'AI activity', Activity],
      ['analytics', 'Analytics', BarChart3]
    ]
  },
  {
    title: 'System',
    items: [
      ['integrations', 'Integrations', Link2],
      ['automation', 'Automation', Zap],
      ['notifications', 'Notifications', Bell],
      ['settings', 'Settings', Settings],
      ['help', 'Help & docs', CircleHelp]
    ]
  }
];


const cats = [
  'All',
  'Email',
  'Calendar',
  'CRM',
  'AI / LLM',
  'Data & Enrichment',
  'Voice & Messaging',
  'Storage',
  'Notifications'
];


const blankCampaign = {
  name: '',
  countries: 'India',
  industries: 'SaaS, Technology',
  decision_makers: 'Founder, CEO, CMO',
  signals: 'Funding, hiring, expansion, website changes',
  channel: 'Email',
  booking_link: '',
  daily_limit: 25
};


function App() {
  const [
    page,
    setPage
  ] = useState('overview');

  const [
    mobile,
    setMobile
  ] = useState(false);

  const [
    health,
    setHealth
  ] = useState('checking');

  const [
    toast,
    setToast
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    stats,
    setStats
  ] = useState({});

  const [
    data,
    setData
  ] = useState({
    prospects: [],
    companies: [],
    campaigns: [],
    connectors: [],
    notifications: [],
    activity: []
  });

  const [
    onboarding,
    setOnboarding
  ] = useState(null);

  const [
    tour,
    setTour
  ] = useState(false);

  const [
    campaignModal,
    setCampaignModal
  ] = useState(false);

  const [
    campaign,
    setCampaign
  ] = useState(blankCampaign);

  const [
    intModal,
    setIntModal
  ] = useState(null);

  const [
    search,
    setSearch
  ] = useState('');

  const [
    cat,
    setCat
  ] = useState('All');


  const notify = (
    message,
    type = 'success'
  ) => {
    setToast({
      message,
      type
    });

    setTimeout(
      () => setToast(null),
      3500
    );
  };


  const load = async (
    silent = false
  ) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [
        h,
        d,
        p,
        c,
        co,
        n,
        a,
        o
      ] = await Promise.all([
        api('/health'),
        api(`/workspaces/${WS}/dashboard`),
        api(`/workspaces/${WS}/prospects`),
        api(`/workspaces/${WS}/companies`),
        api(`/workspaces/${WS}/campaigns`),
        api(`/workspaces/${WS}/notifications`),
        api(`/workspaces/${WS}/activity`),
        api(`/workspaces/${WS}/onboarding`)
      ]);

      setHealth(
        h.ok
          ? 'online'
          : 'offline'
      );

      setStats(
        d.metrics || {}
      );

      setData({
        prospects: p.prospects || [],
        companies: c.companies || [],
        campaigns: co.campaigns || [],
        connectors: [],
        notifications: n.notifications || [],
        activity: a.activity || []
      });

      setOnboarding(o);

      if (
        !o.completed &&
        !localStorage.getItem(
          'signalos_tour_skipped'
        )
      ) {
        setTour(true);
      }

    } catch (error) {
      setHealth('offline');

      if (!silent) {
        notify(
          `API error: ${error.message}`,
          'error'
        );
      }

    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };


  const loadConnectors = async () => {
    try {
      const result = await api(
        `/workspaces/${WS}/connectors`
      );

      setData(
        current => ({
          ...current,
          connectors:
            result.connectors || []
        })
      );

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  useEffect(
    () => {
      load();
      loadConnectors();
    },
    []
  );


  useEffect(
    () => {
      const params =
        new URLSearchParams(
          location.search
        );

      if (params.get('oauth')) {
        notify(
          params.get('oauth') === 'connected'
            ? `${params.get('provider')} connected successfully`
            : `Connection failed for ${params.get('provider')}`,
          params.get('oauth') === 'connected'
            ? 'success'
            : 'error'
        );

        history.replaceState(
          {},
          '',
          location.pathname
        );
      }
    },
    []
  );


  const navigate = pageName => {
    setPage(pageName);
    setMobile(false);

    if (
      pageName === 'integrations'
    ) {
      loadConnectors();
    }
  };


  const createCampaign = async () => {
    if (!campaign.name.trim()) {
      return notify(
        'Campaign name is required',
        'error'
      );
    }

    try {
      await api(
        `/workspaces/${WS}/campaigns`,
        {
          method: 'POST',
          body: JSON.stringify(
            campaign
          )
        }
      );

      notify(
        'Campaign created'
      );

      setCampaign(
        blankCampaign
      );

      setCampaignModal(false);

      navigate('campaigns');

      load(true);

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const campaignStatus = async (
    id,
    status
  ) => {
    try {
      await api(
        `/workspaces/${WS}/campaigns/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status
          })
        }
      );

      notify(
        status === 'ACTIVE'
          ? 'Campaign activated'
          : 'Campaign paused'
      );

      load(true);

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const connect = async provider => {
    try {
      const result = await api(
        `/workspaces/${WS}/connectors/${provider.id}/connect`,
        {
          method: 'POST',
          body: '{}'
        }
      );

      if (
        result.authorization_url
      ) {
        location.href =
          result.authorization_url;
      } else {
        setIntModal({
          ...provider,
          mode: 'api'
        });
      }

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const configure = async (
    provider,
    secret
  ) => {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}/configure`,
        {
          method: 'POST',
          body: JSON.stringify({
            api_key: secret
          })
        }
      );

      notify(
        `${provider.name} connected`
      );

      setIntModal(null);

      loadConnectors();

      load(true);

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const toggle = async (
    provider,
    enabled
  ) => {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}/toggle`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            enabled
          })
        }
      );

      loadConnectors();

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const disconnect = async provider => {
    try {
      await api(
        `/workspaces/${WS}/connectors/${provider.id}`,
        {
          method: 'DELETE'
        }
      );

      notify(
        `${provider.name} disconnected`
      );

      loadConnectors();

      load(true);

    } catch (error) {
      notify(
        error.message,
        'error'
      );
    }
  };


  const finishTour = async () => {
    localStorage.setItem(
      'signalos_tour_skipped',
      '1'
    );

    try {
      await api(
        `/workspaces/${WS}/onboarding/complete`,
        {
          method: 'POST',
          body: '{}'
        }
      );
    } catch {}

    setTour(false);
  };


  const filtered =
    (data.connectors || [])
      .filter(
        provider =>
          (
            cat === 'All' ||
            provider.category === cat
          ) &&
          `${provider.name} ${provider.vendor} ${provider.description}`
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );


  return (
    <div className="shell">

      <aside
        className={`sidebar ${
          mobile ? 'open' : ''
        }`}
      >

        <div className="brand">
          <div className="mark">
            S
          </div>

          <div>
            <b>SignalOS</b>
            <small>
              Revenue operating system
            </small>
          </div>
        </div>


        <button className="workspace">
          <span>AG</span>

          <div>
            <b>Acme Growth</b>
            <small>Workspace</small>
          </div>

          <ChevronDown size={15}/>
        </button>


        <div className="side-scroll">
          <nav>

            {groups.map(group => (
              <section
                key={group.title}
              >

                <div className="nav-label">
                  {group.title}
                </div>

                {group.items.map(
                  ([
                    id,
                    label,
                    Icon
                  ]) => (
                    <button
                      key={id}
                      className={
                        page === id
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        navigate(id)
                      }
                    >
                      <Icon size={17}/>
                      <span>
                        {label}
                      </span>

                      {id ===
                        'notifications' &&
                        data.notifications.filter(
                          n => !n.read
                        ).length > 0 ? (
                        <em>
                          {
                            data.notifications.filter(
                              n => !n.read
                            ).length
                          }
                        </em>
                      ) : null}

                      {id ===
                        'integrations' &&
                        stats.connected_integrations >
                          0 ? (
                        <em>
                          {
                            stats.connected_integrations
                          }
                        </em>
                      ) : null}

                    </button>
                  )
                )}

              </section>
            ))}

          </nav>
        </div>


        <div className="side-footer">

          <button
            onClick={() =>
              setTour(true)
            }
          >
            <BookOpen size={16}/>
            Product tour
          </button>

          <div className="profile">
            <div>JW</div>

            <span>
              <b>Workspace owner</b>
              <small>
                Administrator
              </small>
            </span>

            <ChevronRight size={15}/>
          </div>

        </div>

      </aside>


      <main className="main">

        <header className="top">

          <button
            className="mobile"
            onClick={() =>
              setMobile(!mobile)
            }
          >
            <Menu/>
          </button>

          <div className="breadcrumbs">
            <Command size={15}/>
            <span>SignalOS</span>
            <ChevronRight size={13}/>
            <b>
              {title(page)}
            </b>
          </div>

          <div className="top-right">

            <span
              className={`status ${health}`}
            >
              <i/>
              {
                health === 'online'
                  ? 'API online'
                  : health === 'checking'
                    ? 'Checking API'
                    : 'API offline'
              }
            </span>

            <button
              className="top-icon"
              onClick={() =>
                navigate('notifications')
              }
            >
              <Bell size={17}/>

              {
                data.notifications.filter(
                  n => !n.read
                ).length > 0 && (
                  <i/>
                )
              }

            </button>

            <button
              className="help-link"
              onClick={() =>
                navigate('help')
              }
            >
              <CircleHelp size={16}/>
              Help
            </button>

          </div>

        </header>


        <div className="content">

          {page === 'overview' && (
            <Overview
              stats={stats}
              campaigns={data.campaigns}
              connectors={data.connectors}
              onNew={() =>
                setCampaignModal(true)
              }
              onIntegrations={() =>
                navigate('integrations')
              }
              onCampaigns={() =>
                navigate('campaigns')
              }
            />
          )}


          {page === 'prospects' && (
            <Prospects
              items={data.prospects}
              onAdd={async () => {
                const name =
                  prompt(
                    'Prospect name'
                  );

                if (!name) return;

                try {
                  await api(
                    `/workspaces/${WS}/prospects`,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        name,
                        title:
                          'Decision maker',
                        status: 'NEW'
                      })
                    }
                  );

                  notify(
                    'Prospect added'
                  );

                  load(true);

                } catch (error) {
                  notify(
                    error.message,
                    'error'
                  );
                }
              }}
            />
          )}


          {page === 'companies' && (
            <Companies
              items={data.companies}
              onAdd={async () => {
                const name =
                  prompt(
                    'Company name'
                  );

                if (!name) return;

                try {
                  await api(
                    `/workspaces/${WS}/companies`,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        name
                      })
                    }
                  );

                  notify(
                    'Company added'
                  );

                  load(true);

                } catch (error) {
                  notify(
                    error.message,
                    'error'
                  );
                }
              }}
            />
          )}


          {page === 'signals' && (
            <Signals/>
          )}


          {page === 'campaigns' && (
            <Campaigns
              items={data.campaigns}
              onNew={() =>
                setCampaignModal(true)
              }
              onStatus={
                campaignStatus
              }
            />
          )}


          {page === 'conversations' && (
            <Conversations/>
          )}

          {page === 'meetings' && (
            <Meetings/>
          )}

          {page === 'activity' && (
            <ActivityPage
              items={data.activity}
            />
          )}

          {page === 'analytics' && (
            <Analytics
              stats={stats}
            />
          )}

          {page === 'integrations' && (
            <Integrations
              list={filtered}
              cat={cat}
              setCat={setCat}
              search={search}
              setSearch={setSearch}
              onConnect={connect}
              onConfigure={
                provider =>
                  setIntModal(provider)
              }
              onToggle={toggle}
              onDisconnect={
                disconnect
              }
            />
          )}

          {page === 'automation' && (
            <Automation/>
          )}

          {page === 'notifications' && (
            <Notifications
              items={
                data.notifications
              }
              refresh={() =>
                load(true)
              }
            />
          )}

          {page === 'settings' && (
            <SettingsPage/>
          )}

          {page === 'help' && (
            <Help/>
          )}

        </div>

      </main>


      {campaignModal && (
        <CampaignModal
          campaign={campaign}
          setCampaign={setCampaign}
          close={() =>
            setCampaignModal(false)
          }
          create={createCampaign}
        />
      )}


      {intModal && (
        <IntegrationModal
          p={intModal}
          close={() =>
            setIntModal(null)
          }
          connect={connect}
          configure={configure}
        />
      )}


      {tour && (
        <Tour
          close={finishTour}
        />
      )}


      {toast && (
        <div
          className={`toast ${toast.type}`}
        >
          <span>
            {
              toast.type === 'success'
                ? <Check size={14}/>
                : <X size={14}/>
            }
          </span>

          {toast.message}
        </div>
      )}

    </div>
  );
}


function title(page) {
  return page
    .split(' ')
    .map(
      x =>
        x[0].toUpperCase() +
        x.slice(1)
    )
    .join(' ');
}


function PageHead({
  eyebrow,
  title,
  sub,
  action,
  onAction,
  secondary
}) {
  return (
    <div className="page-head">

      <div>
        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>{title}</h1>

        <p>{sub}</p>
      </div>

      {(action || secondary) && (
        <div className="head-actions">
          {secondary}

          {action && (
            <button
              className="primary"
              onClick={onAction}
            >
              <Plus size={16}/>
              {action}
            </button>
          )}

        </div>
      )}

    </div>
  );
}


function Overview({
  stats,
  campaigns,
  connectors,
  onNew,
  onIntegrations,
  onCampaigns
}) {
  const connected =
    connectors.filter(
      x =>
        x.status === 'CONNECTED'
    ).length;

  return (
    <>
      <PageHead
        eyebrow="WORKSPACE"
        title="Good morning, Jatan"
        sub="Your revenue workflow at a glance."
        action="New campaign"
        onAction={onNew}
      />

      <div className="metrics">

        {[
          ['Prospects', stats.prospects || 0, Users],
          ['Companies', stats.companies || 0, Building2],
          ['Campaigns', stats.campaigns || 0, Send],
          ['Connected', connected, Link2]
        ].map(
          ([
            label,
            value,
            Icon
          ]) => (
            <div
              className="metric"
              key={label}
            >
              <Icon size={18}/>

              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

              <small>
                Workspace total
              </small>
            </div>
          )
        )}

      </div>


      <div className="two-col">

        <section className="card">

          <div className="card-head">
            <div>
              <b>Campaigns</b>
              <small>
                Recent outbound workflows
              </small>
            </div>

            <button
              className="text-btn"
              onClick={onCampaigns}
            >
              View all
            </button>
          </div>

          {campaigns.length ? (
            campaigns
              .slice(0, 5)
              .map(campaign => (
                <div
                  className="row"
                  key={campaign.id}
                >
                  <div className="row-icon">
                    <Send size={16}/>
                  </div>

                  <div>
                    <b>
                      {campaign.name}
                    </b>

                    <small>
                      {campaign.channel}
                      {' · '}
                      {campaign.countries ||
                        'All countries'}
                    </small>
                  </div>

                  <Status
                    status={
                      campaign.status
                    }
                  />
                </div>
              ))
          ) : (
            <Empty
              title="No campaigns yet"
              text="Create your first campaign to start the workflow."
            />
          )}

        </section>


        <section className="card">

          <div className="card-head">
            <div>
              <b>Stack health</b>
              <small>
                Connected tools
              </small>
            </div>

            <button
              className="text-btn"
              onClick={
                onIntegrations
              }
            >
              Manage
            </button>
          </div>

          {
            connectors
              .filter(
                x =>
                  x.status ===
                  'CONNECTED'
              )
              .slice(0, 5)
              .map(provider => (
                <div
                  className="row"
                  key={provider.id}
                >
                  <Logo p={provider}/>

                  <div>
                    <b>
                      {provider.name}
                    </b>

                    <small>
                      {provider.category}
                    </small>
                  </div>

                  <span className="ok">
                    <Check size={14}/>
                    Ready
                  </span>
                </div>
              ))
          }

          {connected === 0 && (
            <Empty
              title="Connect your stack"
              text="Email, calendar, CRM and AI providers are available in Integrations."
            />
          )}

        </section>

      </div>
    </>
  );
}


function Status({
  status
}) {
  return (
    <span
      className={`pill ${
        String(status).toLowerCase()
      }`}
    >
      {status}
    </span>
  );
}


function Prospects({
  items,
  onAdd
}) {
  return (
    <>
      <PageHead
        eyebrow="PIPELINE"
        title="Prospects"
        sub="Decision makers ranked by fit and buying intent."
        action="Add prospect"
        onAction={onAdd}
      />

      <div className="table card">

        <div className="table-head">
          <b>Name</b>
          <b>Title</b>
          <b>Country</b>
          <b>Intent</b>
          <b>Score</b>
          <b>Status</b>
        </div>

        {items.length ? (
          items.map(
            prospect => (
              <div
                className="table-row"
                key={prospect.id}
              >
                <div>
                  <b>
                    {prospect.name}
                  </b>

                  <small>
                    {prospect.email ||
                      'No email yet'}
                  </small>
                </div>

                <span>
                  {prospect.title || '—'}
                </span>

                <span>
                  {prospect.country || '—'}
                </span>

                <span>
                  {prospect.intent || '—'}
                </span>

                <strong>
                  {prospect.score || 0}
                </strong>

                <Status
                  status={
                    prospect.status
                  }
                />
              </div>
            )
          )
        ) : (
          <Empty
            title="No prospects"
            text="Add prospects or connect a data provider to populate this workspace."
          />
        )}

      </div>
    </>
  );
}


function Companies({
  items,
  onAdd
}) {
  return (
    <>
      <PageHead
        eyebrow="ACCOUNTS"
        title="Companies"
        sub="Account-level context and buying signals."
        action="Add company"
        onAction={onAdd}
      />

      <div className="grid-cards">

        {items.length ? (
          items.map(
            company => (
              <div
                className="card company"
                key={company.id}
              >
                <div className="company-icon">
                  <Building2 size={18}/>
                </div>

                <h3>
                  {company.name}
                </h3>

                <p>
                  {company.domain ||
                    'No domain'}
                  {' · '}
                  {company.industry ||
                    'Industry not set'}
                </p>

                <span>
                  {company.country || '—'}
                  {' · '}
                  {company.size ||
                    'Size not set'}
                </span>
              </div>
            )
          )
        ) : (
          <Empty
            title="No companies"
            text="Create an account or connect Apollo / CRM to populate companies."
          />
        )}

      </div>
    </>
  );
}


function Signals() {
  const [
    list,
    setList
  ] = useState([]);

  const [
    value,
    setValue
  ] = useState('');

  const [
    busy,
    setBusy
  ] = useState(false);


  useEffect(
    () => {
      api(
        `/workspaces/${WS}/signals`
      )
        .then(
          result =>
            setList(
              result.signals || []
            )
        )
        .catch(
          () => {}
        );
    },
    []
  );


  const save = async () => {
    const next = [
      ...list,
      value
    ].filter(Boolean);

    setBusy(true);

    try {
      await api(
        `/workspaces/${WS}/signals`,
        {
          method: 'PUT',
          body: JSON.stringify({
            signals: next
          })
        }
      );

      setList(next);
      setValue('');

    } finally {
      setBusy(false);
    }
  };


  return (
    <>
      <PageHead
        eyebrow="INTENT"
        title="Intent signals"
        sub="Tell SignalOS what should make a prospect worth contacting now."
      />

      <div className="card settings-card">

        <div className="card-head">
          <div>
            <b>
              Buying signals
            </b>

            <small>
              Examples: funding, hiring,
              expansion, website changes.
            </small>
          </div>
        </div>


        <div className="signal-tags">

          {list.map(
            (signal, index) => (
              <span
                key={index}
              >
                {signal}

                <button
                  onClick={async () => {
                    const next =
                      list.filter(
                        (_, i) =>
                          i !== index
                      );

                    await api(
                      `/workspaces/${WS}/signals`,
                      {
                        method: 'PUT',
                        body:
                          JSON.stringify({
                            signals:
                              next
                          })
                      }
                    );

                    setList(next);
                  }}
                >
                  <X size={12}/>
                </button>
              </span>
            )
          )}

        </div>


        <div className="inline-form">

          <input
            value={value}
            onChange={
              e =>
                setValue(
                  e.target.value
                )
            }
            placeholder="Add a signal"
          />

          <button
            className="primary"
            disabled={
              !value ||
              busy
            }
            onClick={save}
          >
            {
              busy
                ? <Loader2 className="spin"/>
                : <Plus size={15}/>
            }

            Add
          </button>

        </div>

      </div>
    </>
  );
}


function Campaigns({
  items,
  onNew,
  onStatus
}) {
  return (
    <>
      <PageHead
        eyebrow="OUTBOUND"
        title="Campaigns"
        sub="Build controlled, evidence-based outbound workflows."
        action="New campaign"
        onAction={onNew}
      />

      <div className="campaign-grid">

        {items.length ? (
          items.map(
            campaign => (
              <div
                className="card campaign"
                key={campaign.id}
              >
                <div className="campaign-top">

                  <div className="campaign-icon">
                    <Send size={17}/>
                  </div>

                  <Status
                    status={
                      campaign.status
                    }
                  />

                </div>

                <h3>
                  {campaign.name}
                </h3>

                <p>
                  {campaign.industries ||
                    'All industries'}
                  {' · '}
                  {campaign.countries ||
                    'All countries'}
                </p>

                <div className="campaign-meta">
                  <span>
                    {campaign.channel}
                  </span>

                  <span>
                    Limit {
                      campaign.daily_limit
                    }/day
                  </span>
                </div>

                <div className="card-actions">

                  {
                    campaign.status ===
                    'ACTIVE'
                      ? (
                        <button
                          className="secondary"
                          onClick={() =>
                            onStatus(
                              campaign.id,
                              'PAUSED'
                            )
                          }
                        >
                          <Pause size={14}/>
                          Pause
                        </button>
                      )
                      : (
                        <button
                          className="primary"
                          onClick={() =>
                            onStatus(
                              campaign.id,
                              'ACTIVE'
                            )
                          }
                        >
                          <Play size={14}/>
                          Activate
                        </button>
                      )
                  }

                </div>
              </div>
            )
          )
        ) : (
          <Empty
            title="No campaigns"
            text="Create a campaign. It will be saved to Supabase through the Render API."
          />
        )}

      </div>
    </>
  );
}


function Conversations() {
  return (
    <>
      <PageHead
        eyebrow="OUTBOUND"
        title="Conversations"
        sub="Email threads, replies, objections and qualification state."
      />

      <div className="card">
        <Empty
          title="Inbox is ready"
          text="Connect Gmail, Microsoft 365 or Resend to begin receiving outbound activity."
        />
      </div>
    </>
  );
}


function Meetings() {
  return (
    <>
      <PageHead
        eyebrow="OUTBOUND"
        title="Meetings"
        sub="Bookings and handoffs from your connected calendar."
      />

      <div className="card">
        <Empty
          title="No meetings yet"
          text="Connect Calendly or Google Calendar to populate this view."
        />
      </div>
    </>
  );
}


function ActivityPage({
  items
}) {
  return (
    <>
      <PageHead
        eyebrow="INTELLIGENCE"
        title="AI activity"
        sub="A chronological audit trail of SignalOS operations."
      />

      <div className="card activity-list">

        {items.length ? (
          items.map(
            item => (
              <div
                className="activity-row"
                key={item.id}
              >
                <div className="activity-dot">
                  <Activity size={14}/>
                </div>

                <div>
                  <b>
                    {item.title}
                  </b>

                  <p>
                    {item.detail}
                  </p>

                  <small>
                    {
                      new Date(
                        item.created_at
                      ).toLocaleString()
                    }
                  </small>
                </div>
              </div>
            )
          )
        ) : (
          <Empty
            title="No activity yet"
            text="Actions, research and automation events will appear here."
          />
        )}

      </div>
    </>
  );
}


function Analytics({
  stats
}) {
  return (
    <>
      <PageHead
        eyebrow="INTELLIGENCE"
        title="Analytics"
        sub="Workspace-level operating metrics."
      />

      <div className="metrics">

        {[
          ['Prospects', stats.prospects || 0, Users],
          ['Companies', stats.companies || 0, Building2],
          ['Campaigns', stats.campaigns || 0, Send],
          ['Interactions', stats.interactions || 0, Activity]
        ].map(
          ([
            label,
            value,
            Icon
          ]) => (
            <div
              className="metric"
              key={label}
            >
              <Icon size={18}/>

              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

              <small>
                Live from backend
              </small>
            </div>
          )
        )}

      </div>


      <div className="card analytics-empty">
        <BarChart3 size={25}/>

        <h2>
          Live analytics foundation is connected
        </h2>

        <p>
          As prospecting and outbound
          integrations start generating
          events, this page can be extended
          with delivery, reply, meeting and
          conversion charts without changing
          the core workspace.
        </p>
      </div>
    </>
  );
}


function Integrations({
  list,
  cat,
  setCat,
  search,
  setSearch,
  onConnect,
  onConfigure,
  onToggle,
  onDisconnect
}) {
  const connected =
    list.filter(
      x =>
        x.status === 'CONNECTED'
    ).length;

  return (
    <>
      <PageHead
        eyebrow="SYSTEM / INTEGRATIONS"
        title="Integrations"
        sub="Connect the tools your team already uses. SignalOS never needs the provider password."
      />

      <div className="integration-banner">

        <div>
          <ShieldCheck size={20}/>

          <div>
            <b>
              Your stack, your accounts
            </b>

            <p>
              Choose a provider, review
              requested permissions, then
              connect your own account.
              API credentials stay server-side.
            </p>
          </div>
        </div>

        <strong>
          {connected} connected
        </strong>

      </div>


      <div className="integration-tools">

        <div className="search-box">
          <Search size={16}/>

          <input
            value={search}
            onChange={
              e =>
                setSearch(
                  e.target.value
                )
            }
            placeholder="Search integrations"
          />
        </div>


        <div className="pills">

          {cats.map(category => (
            <button
              className={
                cat === category
                  ? 'selected'
                  : ''
              }
              key={category}
              onClick={() =>
                setCat(category)
              }
            >
              {category}
            </button>
          ))}

        </div>

      </div>


      <div className="integration-grid">

        {list.map(provider => (
          <IntegrationCard
            key={provider.id}
            p={provider}
            onConnect={onConnect}
            onConfigure={onConfigure}
            onToggle={onToggle}
            onDisconnect={
              onDisconnect
            }
          />
        ))}

        {!list.length && (
          <div className="card">
            <Empty
              title="No matching integrations"
              text="Try another category or search."
            />
          </div>
        )}

      </div>
    </>
  );
}


function Logo({
  p
}) {
  return (
    <div className="logo">

      <img
        src={p.logo}
        onError={event => {
          event.currentTarget.style.display =
            'none';

          event.currentTarget.parentElement.classList.add(
            'fallback'
          );
        }}
      />

      <span>
        {p.name?.slice(0, 1)}
      </span>

    </div>
  );
}


function IntegrationCard({
  p,
  onConnect,
  onConfigure,
  onToggle,
  onDisconnect
}) {
  const connected =
    p.status === 'CONNECTED';

  return (
    <div className="integration-card">

      <div className="int-top">

        <Logo p={p}/>

        <div>
          {
            connected ? (
              <label className="switch">

                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={
                    event =>
                      onToggle(
                        p,
                        event.target.checked
                      )
                  }
                />

                <span/>

              </label>
            ) : (
              <span className="available">
                Available
              </span>
            )
          }
        </div>

      </div>


      <small className="cat">
        {p.category}
      </small>

      <h3>
        {p.name}
      </h3>

      <p>
        {p.description}
      </p>


      <div className="scope-row">

        {(p.scopes || [])
          .slice(0, 3)
          .map(scope => (
            <span key={scope}>
              {scope}
            </span>
          ))}

      </div>


      <div className="int-bottom">

        {
          connected ? (
            <>
              <span className="ready">
                <Check size={14}/>
                Connected
              </span>

              <div>
                <button
                  className="secondary small"
                  onClick={() =>
                    onConfigure(p)
                  }
                >
                  Manage
                </button>

                <button
                  className="danger small"
                  onClick={() =>
                    onDisconnect(p)
                  }
                >
                  <Trash2 size={13}/>
                </button>
              </div>
            </>
          ) : (
            p.auth === 'oauth' ? (
              <button
                className="primary small"
                onClick={() =>
                  onConnect(p)
                }
              >
                Connect with {p.vendor}
                <ExternalLink size={14}/>
              </button>
            ) : (
              <button
                className="primary small"
                onClick={() =>
                  onConfigure(p)
                }
              >
                Add credentials
                <ArrowRight size={14}/>
              </button>
            )
          )
        }

      </div>

    </div>
  );
}


function Automation() {
  const [
    state,
    setState
  ] = useState({
    enabled: false,
    mode: 'copilot'
  });


  useEffect(
    () => {
      api(
        `/workspaces/${WS}/onboarding`
      )
        .then(
          result =>
            setState({
              enabled:
                result.automation_enabled,
              mode:
                result.ai_mode ||
                'copilot'
            })
        )
        .catch(
          () => {}
        );
    },
    []
  );


  const save = async (
    enabled,
    mode
  ) => {
    try {
      const result =
        await api(
          `/workspaces/${WS}/automation`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              enabled,
              mode
            })
          }
        );

      setState({
        enabled:
          result.settings
            .automation_enabled,
        mode:
          result.settings.ai_mode
      });

    } catch (error) {
      alert(
        error.message
      );
    }
  };


  return (
    <>
      <PageHead
        eyebrow="CONTROL CENTER"
        title="Automation"
        sub="Control how much autonomy SignalOS has."
      />

      <div className="card automation">

        <div className="automation-head">

          <div>
            <div className="icon-box">
              <Zap size={19}/>
            </div>

            <div>
              <h3>
                Master automation
              </h3>

              <p>
                One switch pauses automated
                actions across the workspace.
              </p>
            </div>
          </div>


          <button
            className={
              state.enabled
                ? 'master on'
                : 'master'
            }
            onClick={() =>
              save(
                !state.enabled,
                state.mode
              )
            }
          >
            {
              state.enabled
                ? 'ON'
                : 'OFF'
            }
          </button>

        </div>


        <div className="mode-grid">

          {[
            [
              'manual',
              'Manual',
              'Nothing executes without approval'
            ],
            [
              'copilot',
              'Copilot',
              'Research and draft; you approve actions'
            ],
            [
              'autopilot',
              'Autopilot',
              'Execute approved workflows within limits'
            ]
          ].map(
            ([
              id,
              label,
              description
            ]) => (
              <button
                className={
                  state.mode === id
                    ? 'mode selected'
                    : 'mode'
                }
                key={id}
                onClick={() =>
                  save(
                    state.enabled,
                    id
                  )
                }
              >
                <i/>

                <div>
                  <b>
                    {label}
                  </b>

                  <small>
                    {description}
                  </small>
                </div>
              </button>
            )
          )}

        </div>

      </div>
    </>
  );
}


function Notifications({
  items,
  refresh
}) {
  const unread =
    items.filter(
      item => !item.read
    );


  const mark = async () => {
    await api(
      `/workspaces/${WS}/notifications/read`,
      {
        method: 'POST',
        body: JSON.stringify({
          ids: unread.map(
            item => item.id
          )
        })
      }
    );

    refresh();
  };


  return (
    <>
      <PageHead
        eyebrow="SYSTEM"
        title="Notifications"
        sub="Operational alerts, integration events and handoffs."
        secondary={
          unread.length > 0 && (
            <button
              className="secondary"
              onClick={mark}
            >
              Mark all read
            </button>
          )
        }
      />

      <div className="card notification-list">

        {items.length ? (
          items.map(
            notification => (
              <div
                className={
                  notification.read
                    ? 'notification'
                    : 'notification unread'
                }
                key={
                  notification.id
                }
              >
                <div className="notif-icon">
                  <Bell size={16}/>
                </div>

                <div>
                  <b>
                    {notification.title}
                  </b>

                  <p>
                    {notification.body}
                  </p>

                  <small>
                    {
                      new Date(
                        notification.created_at
                      ).toLocaleString()
                    }
                  </small>
                </div>
              </div>
            )
          )
        ) : (
          <Empty
            title="You're all caught up"
            text="Important workspace events will appear here."
          />
        )}

      </div>
    </>
  );
}


function SettingsPage() {
  const [
    state,
    setState
  ] = useState({
    workspace_name: '',
    owner_name: '',
    owner_email: '',
    timezone: 'Asia/Kolkata'
  });


  const [
    busy,
    setBusy
  ] = useState(false);


  useEffect(
    () => {
      api(
        `/workspaces/${WS}/settings`
      )
        .then(
          result =>
            setState({
              workspace_name:
                result.workspace.name,
              owner_name:
                result.workspace.owner_name,
              owner_email:
                result.workspace.owner_email,
              timezone:
                result.settings.timezone ||
                'Asia/Kolkata'
            })
        )
        .catch(
          () => {}
        );
    },
    []
  );


  const save = async () => {
    setBusy(true);

    try {
      await api(
        `/workspaces/${WS}/settings`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            settings: state
          })
        }
      );

      alert(
        'Settings saved'
      );

    } catch (error) {
      alert(
        error.message
      );

    } finally {
      setBusy(false);
    }
  };


  return (
    <>
      <PageHead
        eyebrow="SYSTEM"
        title="Settings"
        sub="Workspace identity and operating preferences."
      />

      <div className="card settings-card">

        <div className="form-grid">

          <label>
            <span>
              Workspace name
            </span>

            <input
              value={
                state.workspace_name
              }
              onChange={
                event =>
                  setState({
                    ...state,
                    workspace_name:
                      event.target.value
                  })
              }
            />
          </label>


          <label>
            <span>
              Owner name
            </span>

            <input
              value={
                state.owner_name
              }
              onChange={
                event =>
                  setState({
                    ...state,
                    owner_name:
                      event.target.value
                  })
              }
            />
          </label>


          <label>
            <span>
              Owner email
            </span>

            <input
              value={
                state.owner_email
              }
              onChange={
                event =>
                  setState({
                    ...state,
                    owner_email:
                      event.target.value
                  })
              }
            />
          </label>


          <label>
            <span>
              Timezone
            </span>

            <select
              value={
                state.timezone
              }
              onChange={
                event =>
                  setState({
                    ...state,
                    timezone:
                      event.target.value
                  })
              }
            >
              <option>
                Asia/Kolkata
              </option>

              <option>
                UTC
              </option>

              <option>
                America/New_York
              </option>

              <option>
                Europe/London
              </option>
            </select>
          </label>

        </div>


        <div className="save-bar">

          <span>
            <ShieldCheck size={15}/>
            Saved to backend
          </span>

          <button
            className="primary"
            onClick={save}
            disabled={busy}
          >
            {
              busy
                ? <Loader2 className="spin"/>
                : <Check size={15}/>
            }

            Save settings
          </button>

        </div>

      </div>
    </>
  );
}


function Help() {
  return (
    <>
      <PageHead
        eyebrow="HELP"
        title="Help & docs"
        sub="Everything you need to operate SignalOS."
      />

      <div className="help-grid">

        {[
          [
            'Getting started',
            'Connect an email provider, add an AI provider, define intent signals and create a campaign.',
            BookOpen
          ],
          [
            'Integrations',
            'OAuth providers redirect you to the provider. API-key providers require credentials from the provider account.',
            Link2
          ],
          [
            'AI / LLM',
            'Connect OpenAI, Claude, Gemini or OpenRouter using your own API credential. SignalOS does not require a ChatGPT password.',
            Sparkles
          ],
          [
            'Safety',
            'Use Manual, Copilot or Autopilot. The master automation switch pauses execution.',
            ShieldCheck
          ],
          [
            'Campaigns',
            'Campaigns are saved to the workspace database and can be activated or paused.',
            Send
          ],
          [
            'Support',
            'For provider setup errors, open the API health endpoint and inspect the Render logs.',
            HelpCircle
          ]
        ].map(
          ([
            heading,
            description,
            Icon
          ]) => (
            <div
              className="card help-card"
              key={heading}
            >
              <Icon size={20}/>

              <h3>
                {heading}
              </h3>

              <p>
                {description}
              </p>
            </div>
          )
        )}

      </div>
    </>
  );
}


function IntegrationModal({
  p,
  close,
  connect,
  configure
}) {
  const [
    secret,
    setSecret
  ] = useState('');

  const apiKey =
    p.auth === 'api_key';


  return (
    <div className="overlay">

      <div className="modal">

        <button
          className="close"
          onClick={close}
        >
          <X/>
        </button>


        <div className="eyebrow">
          {p.category}
        </div>


        <div className="modal-provider">

          <Logo p={p}/>

          <div>
            <h2>
              {p.name}
            </h2>

            <p>
              {p.description}
            </p>
          </div>

        </div>


        <div className="permissions">

          <ShieldCheck size={18}/>

          <div>
            <b>
              {
                apiKey
                  ? 'Secure credential connection'
                  : 'Secure OAuth connection'
              }
            </b>

            <p>
              {
                apiKey
                  ? 'SignalOS stores a server-side credential reference. The secret is never displayed again.'
                  : 'You will be redirected to the provider’s official login and consent screen. SignalOS never asks for the provider password.'
              }
            </p>
          </div>

        </div>


        <div className="scope-list">

          {(p.scopes || []).map(
            scope => (
              <span key={scope}>
                <Check size={13}/>
                {scope}
              </span>
            )
          )}

        </div>


        {apiKey ? (
          <>
            <label className="field">

              <span>
                API key / credential
              </span>

              <input
                type="password"
                value={secret}
                onChange={
                  event =>
                    setSecret(
                      event.target.value
                    )
                }
                placeholder="Paste credential"
              />

            </label>


            <div className="modal-actions">

              <button
                className="secondary"
                onClick={close}
              >
                Cancel
              </button>

              <button
                className="primary"
                disabled={!secret}
                onClick={() =>
                  configure(
                    p,
                    secret
                  )
                }
              >
                Save & connect
              </button>

            </div>
          </>
        ) : (
          <div className="modal-actions">

            <button
              className="secondary"
              onClick={close}
            >
              Cancel
            </button>

            <button
              className="primary"
              onClick={() =>
                connect(p)
              }
            >
              Continue to {p.vendor}
              <ExternalLink size={15}/>
            </button>

          </div>
        )}

      </div>

    </div>
  );
}


function CampaignModal({
  campaign,
  setCampaign,
  close,
  create
}) {
  return (
    <div className="overlay">

      <div className="modal large">

        <button
          className="close"
          onClick={close}
        >
          <X/>
        </button>


        <div className="eyebrow">
          OUTBOUND / NEW CAMPAIGN
        </div>

        <h2>
          Create campaign
        </h2>

        <p>
          Define the audience and signals.
          The campaign is stored before
          activation.
        </p>


        <div className="form-grid">

          {[
            [
              'name',
              'Campaign name',
              'e.g. SaaS founders with active hiring'
            ],
            [
              'countries',
              'Countries',
              'India, US, UK'
            ],
            [
              'industries',
              'Industries',
              'SaaS, Fintech'
            ],
            [
              'decision_makers',
              'Decision makers',
              'Founder, CEO, CMO'
            ],
            [
              'signals',
              'Buying signals',
              'Funding, hiring, expansion'
            ],
            [
              'booking_link',
              'Booking link',
              'https://calendly.com/...'
            ]
          ].map(
            ([
              key,
              label,
              placeholder
            ]) => (
              <label
                className="field"
                key={key}
              >
                <span>
                  {label}
                </span>

                <input
                  value={
                    campaign[key]
                  }
                  onChange={
                    event =>
                      setCampaign({
                        ...campaign,
                        [key]:
                          event.target.value
                      })
                  }
                  placeholder={
                    placeholder
                  }
                />
              </label>
            )
          )}

        </div>


        <label className="field">

          <span>
            Daily sending limit
          </span>

          <input
            type="number"
            min="1"
            max="1000"
            value={
              campaign.daily_limit
            }
            onChange={
              event =>
                setCampaign({
                  ...campaign,
                  daily_limit:
                    Number(
                      event.target.value
                    )
                })
            }
          />

        </label>


        <div className="modal-actions">

          <button
            className="secondary"
            onClick={close}
          >
            Cancel
          </button>

          <button
            className="primary"
            onClick={create}
          >
            Create campaign
            <ArrowRight size={15}/>
          </button>

        </div>

      </div>

    </div>
  );
}


function Tour({
  close
}) {
  const [
    index,
    setIndex
  ] = useState(0);


  const steps = [
    [
      'Your command center',
      'Overview gives you the live health of your revenue workspace.'
    ],
    [
      'Connect your stack',
      'Integrations lets each customer connect their own email, calendar, CRM, data and AI accounts.'
    ],
    [
      'Control autonomy',
      'Automation provides Manual, Copilot and Autopilot plus a global kill switch.'
    ],
    [
      'Launch a campaign',
      'Create a campaign, review it, then activate it when your stack is ready.'
    ]
  ];


  return (
    <div className="overlay">

      <div className="tour">

        <div className="tour-side">

          <div className="tour-mark">
            <Sparkles/>
          </div>

          <span>
            SignalOS onboarding
          </span>

        </div>


        <div className="tour-body">

          <div className="tour-top">

            <small>
              STEP {index + 1} OF 4
            </small>

            <button
              onClick={close}
            >
              Skip tour
            </button>

          </div>


          <h2>
            {steps[index][0]}
          </h2>

          <p>
            {steps[index][1]}
          </p>


          <div className="tour-actions">

            <button
              className="secondary"
              disabled={!index}
              onClick={() =>
                setIndex(index - 1)
              }
            >
              Back
            </button>


            {
              index < 3
                ? (
                  <button
                    className="primary"
                    onClick={() =>
                      setIndex(index + 1)
                    }
                  >
                    Next
                    <ArrowRight size={15}/>
                  </button>
                )
                : (
                  <button
                    className="primary"
                    onClick={close}
                  >
                    Finish
                    <Check size={15}/>
                  </button>
                )
            }

          </div>

        </div>

      </div>

    </div>
  );
}


function Empty({
  title,
  text
}) {
  return (
    <div className="empty">
      <FileText size={22}/>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}


createRoot(
  document.getElementById('root')
).render(
  <App/>
);
