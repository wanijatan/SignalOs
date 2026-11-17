import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, BarChart3, Bell, Building2, Calendar, Check, ChevronDown,
  ChevronRight, CircleHelp, ClipboardList, Clock3, Command, Database, ExternalLink,
  Eye, FileText, Gauge, Globe2, Layers3, Link2, Mail, Menu, MessageSquare,
  MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Send, Settings, ShieldCheck,
  Sparkles, Target, ToggleLeft, ToggleRight, Users, X, Zap
} from 'lucide-react';
import './styles.css';

const API = (import.meta.env.VITE_API_URL || 'https://signalos-api-15va.onrender.com').replace(/\/$/, '');
const WS = 1;

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { detail: text }; }
  if (!response.ok) throw new Error(data.detail || data.message || `${response.status} ${response.statusText}`);
  return data;
}

const groups = [
  { title: 'Workspace', items: [
    ['overview','Overview',Gauge], ['prospects','Prospects',Users], ['companies','Companies',Building2], ['signals','Intent signals',Zap]
  ]},
  { title: 'Outbound', items: [
    ['campaigns','Campaigns',Send], ['conversations','Conversations',MessageSquare], ['meetings','Meetings',Calendar]
  ]},
  { title: 'Intelligence', items: [
    ['activity','AI activity',Activity], ['analytics','Analytics',BarChart3]
  ]},
  { title: 'System', items: [
    ['integrations','Integrations',Link2], ['automation','Automation',Sparkles], ['settings','Settings',Settings]
  ]}
];

const categories = ['All','Email','Calendar','CRM','AI','Data & Enrichment','Voice & Messaging','Notifications'];

function App(){
  const [page,setPage] = useState('overview');
  const [mobile,setMobile] = useState(false);
  const [health,setHealth] = useState('checking');
  const [toast,setToast] = useState(null);
  const [onboarding,setOnboarding] = useState(null);
  const [showTour,setShowTour] = useState(false);
  const [stats,setStats] = useState({prospects:0,companies:0,campaigns:0,interactions:0,connected_integrations:0});
  const [prospects,setProspects] = useState([]);
  const [campaigns,setCampaigns] = useState([]);
  const [connectors,setConnectors] = useState([]);
  const [loading,setLoading] = useState(false);
  const [campaignModal,setCampaignModal] = useState(false);
  const [integrationModal,setIntegrationModal] = useState(null);
  const [integrationSearch,setIntegrationSearch] = useState('');
  const [integrationCategory,setIntegrationCategory] = useState('All');
  const [campaign,setCampaign] = useState({name:'',countries:'India',industries:'SaaS, Technology',decision_makers:'Founder, CEO, Head of Marketing',signals:'Funding, hiring, expansion, website changes',channel:'Email',booking_link:'https://calendly.com/'});
  const [tourStep,setTourStep] = useState(0);

  const notify = (message, type='success') => { setToast({message,type}); setTimeout(()=>setToast(null), 3500); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d,p,c,i,o] = await Promise.all([
        api(`/workspaces/${WS}/dashboard`),
        api(`/workspaces/${WS}/prospects`),
        api(`/workspaces/${WS}/campaigns`),
        api(`/workspaces/${WS}/connectors`),
        api(`/workspaces/${WS}/onboarding`)
      ]);
      setStats(d.metrics || {});
      setProspects(p.prospects || []);
      setCampaigns(c.campaigns || []);
      setConnectors(i.connectors || []);
      setOnboarding(o);
      setHealth('online');
      if (!o.completed) setShowTour(true);
    } catch (e) {
      setHealth('offline');
      notify(`SignalOS API is not reachable: ${e.message}`, 'error');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ loadAll(); },[]);

  const createCampaign = async () => {
    if (!campaign.name.trim()) return notify('Campaign name is required', 'error');
    try {
      await api(`/workspaces/${WS}/campaigns`, {method:'POST', body:JSON.stringify(campaign)});
      notify('Campaign created successfully');
      setCampaignModal(false);
      setPage('campaigns');
      setCampaign({name:'',countries:'India',industries:'SaaS, Technology',decision_makers:'Founder, CEO, Head of Marketing',signals:'Funding, hiring, expansion, website changes',channel:'Email',booking_link:'https://calendly.com/'});
      await loadAll();
    } catch(e) { notify(`Could not create campaign: ${e.message}`, 'error'); }
  };

  const toggleCampaign = async (id, status) => {
    try { await api(`/workspaces/${WS}/campaigns/${id}`, {method:'PATCH',body:JSON.stringify({status})}); await loadAll(); notify(status === 'ACTIVE' ? 'Campaign activated' : 'Campaign paused'); }
    catch(e){ notify(e.message,'error'); }
  };

  const startConnect = async (provider) => {
    try {
      const result = await api(`/workspaces/${WS}/connectors/${provider.id}/connect`, {method:'POST',body:'{}'});
      if (result.authorization_url) window.location.href = result.authorization_url;
      else notify('Connection started');
    } catch(e) {
      notify(e.message, 'error');
      setIntegrationModal({...provider, error:e.message});
    }
  };

  const configure = async (provider, value) => {
    try {
      await api(`/workspaces/${WS}/connectors/${provider.id}/configure`, {method:'POST',body:JSON.stringify({api_key:value})});
      notify(`${provider.name} connected`);
      setIntegrationModal(null); await loadAll();
    } catch(e) { notify(e.message,'error'); }
  };

  const toggleIntegration = async (provider, enabled) => {
    try { await api(`/workspaces/${WS}/connectors/${provider.id}/toggle`, {method:'PATCH',body:JSON.stringify({enabled})}); await loadAll(); }
    catch(e){ notify(e.message,'error'); }
  };

  const finishTour = async () => {
    try { await api(`/workspaces/${WS}/onboarding/complete`, {method:'POST',body:JSON.stringify({})}); }
    catch {}
    setShowTour(false); setTourStep(0); await loadAll();
  };

  const filtered = useMemo(()=>connectors.filter(x =>
    (integrationCategory === 'All' || x.category === integrationCategory) &&
    `${x.name} ${x.description}`.toLowerCase().includes(integrationSearch.toLowerCase())
  ),[connectors,integrationCategory,integrationSearch]);

  const navigate = (p)=>{ setPage(p); setMobile(false); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobile?'open':''}`}>
      <div className="brand"><div className="brand-mark">S</div><div><strong>SignalOS</strong><span>Revenue intelligence</span></div></div>
      <div className="workspace-switch"><div className="workspace-avatar">A</div><div><b>Acme Growth</b><small>Workspace</small></div><ChevronDown size={15}/></div>
      <nav>{groups.map(group=><div className="nav-group" key={group.title}><div className="nav-label">{group.title}</div>{group.items.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={17}/><span>{label}</span>{id==='integrations' && stats.connected_integrations>0?<em>{stats.connected_integrations}</em>:null}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button onClick={()=>setShowTour(true)}><CircleHelp size={17}/>Product tour</button><div className="user-card"><div className="avatar">JW</div><div><b>Workspace owner</b><small>Admin</small></div><MoreHorizontal size={16}/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(!mobile)}><Menu/></button><div className="crumb"><Command size={15}/><span>SignalOS</span><ChevronRight size={14}/><b>{titleFor(page)}</b></div><div className="top-actions"><div className={`api-status ${health}`}><span></span>{health==='online'?'API online':health==='checking'?'Checking API':'API offline'}</div><button className="icon-btn"><Bell size={17}/></button><button className="help-btn"><CircleHelp size={17}/> Help</button></div></header>
      <div className="content">
        {page==='overview' && <Overview stats={stats} loading={loading} onCampaign={()=>setCampaignModal(true)} onIntegrations={()=>navigate('integrations')} />}
        {page==='prospects' && <Prospects prospects={prospects} onRefresh={loadAll}/>} 
        {page==='companies' && <Simple title="Companies" icon={Building2} description="Company-level intelligence will appear here as SignalOS discovers accounts." action="Add company"/>}
        {page==='signals' && <Simple title="Intent signals" icon={Zap} description="Define the events that make a prospect worth contacting now." action="Create signal"/>}
        {page==='campaigns' && <Campaigns campaigns={campaigns} onCreate={()=>setCampaignModal(true)} onToggle={toggleCampaign} />}
        {page==='conversations' && <Simple title="Conversations" icon={MessageSquare} description="Email threads and AI qualification activity will appear here." action="Open inbox"/>}
        {page==='meetings' && <Simple title="Meetings" icon={Calendar} description="Booked meetings from your connected calendar will appear here." action="Connect calendar"/>}
        {page==='activity' && <Simple title="AI activity" icon={Activity} description="See research, scoring, personalization and automation events in one audit trail." action="View activity"/>}
        {page==='analytics' && <Analytics stats={stats}/>} 
        {page==='integrations' && <Integrations connectors={filtered} categories={categories} activeCategory={integrationCategory} setCategory={setIntegrationCategory} search={integrationSearch} setSearch={setIntegrationSearch} onConnect={startConnect} onConfigure={setIntegrationModal} onToggle={toggleIntegration} />}
        {page==='automation' && <Automation onboarding={onboarding} onRefresh={loadAll} notify={notify}/>} 
        {page==='settings' && <SettingsPage/>}
      </div>
    </main>

    {campaignModal && <CampaignModal campaign={campaign} setCampaign={setCampaign} onClose={()=>setCampaignModal(false)} onCreate={createCampaign}/>} 
    {integrationModal && <IntegrationModal provider={integrationModal} onClose={()=>setIntegrationModal(null)} onConnect={startConnect} onConfigure={configure}/>} 
    {showTour && <Tour step={tourStep} setStep={setTourStep} onSkip={finishTour}/>} 
    {toast && <div className={`toast ${toast.type}`}><span>{toast.type==='success'?<Check size={16}/>:<X size={16}/>}</span>{toast.message}</div>}
  </div>
}

function titleFor(page){ return page.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '); }

function Overview({stats,onCampaign,onIntegrations}){ return <>
  <div className="page-head"><div><div className="eyebrow">WORKSPACE OVERVIEW</div><h1>Good evening, Jatan.</h1><p>Turn buying signals into qualified conversations without the busywork.</p></div><div className="head-actions"><button className="secondary" onClick={onIntegrations}><Link2 size={16}/> Connect tools</button><button className="primary" onClick={onCampaign}><Plus size={17}/> New campaign</button></div></div>
  <div className="stat-grid">{[['Prospects',stats.prospects||0,Users],['Companies',stats.companies||0,Building2],['Campaigns',stats.campaigns||0,Send],['Connected tools',stats.connected_integrations||0,Link2]].map(([a,b,I])=><div className="stat-card" key={a}><div className="stat-icon"><I size={18}/></div><span>{a}</span><strong>{b}</strong><small><span className="up">●</span> Live data</small></div>)}</div>
  <div className="grid-two"><div className="panel"><div className="panel-head"><div><h2>Revenue workflow</h2><p>SignalOS operating loop</p></div><span className="live-pill"><span/> Live</span></div><div className="workflow">{[['01','Discover','Find accounts with a reason to buy',Target],['02','Prove','Collect evidence and score timing',ShieldCheck],['03','Engage','Send context-rich outreach',Send],['04','Qualify','Understand replies and intent',MessageSquare],['05','Book','Move qualified buyers to a meeting',Calendar]].map(([n,t,d,I],i)=><div className="workflow-item" key={n}><div className="workflow-num">{n}</div><I size={18}/><div><b>{t}</b><small>{d}</small></div>{i<4&&<ChevronRight className="workflow-arrow" size={16}/>}</div>)}</div></div>
  <div className="panel"><div className="panel-head"><div><h2>Setup checklist</h2><p>Get SignalOS ready for real outreach</p></div></div><Checklist/></div></div>
</> }

function Checklist(){const items=[['Define ICP','Tell SignalOS who you sell to',Target,true],['Connect email','Choose the mailbox you want to send from',Mail,false],['Add calendar','Stop outreach when meetings are booked',Calendar,false],['Create campaign','Turn signals into an outbound workflow',Send,false]];return <div className="checklist">{items.map(([t,d,I,done])=><div className="check-item" key={t}><div className={done?'check done':'check'}>{done?<Check size={14}/>:<I size={15}/>}</div><div><b>{t}</b><small>{d}</small></div><ChevronRight size={16}/></div>)}</div>}

function Prospects({prospects,onRefresh}){return <><div className="page-head"><div><div className="eyebrow">PROSPECT INTELLIGENCE</div><h1>Prospects</h1><p>Accounts and people ranked by fit, evidence and timing.</p></div><button className="secondary" onClick={onRefresh}><RefreshCw size={16}/> Refresh</button></div><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search prospects, companies or titles"/></div><button className="filter">All prospects <ChevronDown size={15}/></button><button className="filter">High intent <ChevronDown size={15}/></button></div><div className="table-panel"><table><thead><tr><th>Prospect</th><th>Company</th><th>Role</th><th>Intent</th><th>Status</th><th></th></tr></thead><tbody>{prospects.length?prospects.map((p,i)=><tr key={p.id||i}><td><div className="person"><div className="mini-avatar">{String(p.name||p.full_name||'P').slice(0,1)}</div><b>{p.name||p.full_name||'Unnamed prospect'}</b></div></td><td>{p.company_name||p.company||'—'}</td><td>{p.title||p.role||'—'}</td><td><span className="intent">{p.intent_score||p.score||'—'}</span></td><td><span className="status">{p.status||'NEW'}</span></td><td><MoreHorizontal size={17}/></td></tr>):<tr><td colSpan="6"><Empty title="No prospects yet" text="Once SignalOS discovers or you add prospects, they will appear here."/></td></tr>}</tbody></table></div></>}

function Campaigns({campaigns,onCreate,onToggle}){return <><div className="page-head"><div><div className="eyebrow">OUTBOUND</div><h1>Campaigns</h1><p>Create controlled outbound workflows from your ICP and buying signals.</p></div><button className="primary" onClick={onCreate}><Plus size={17}/> New campaign</button></div><div className="campaign-grid">{campaigns.length?campaigns.map(c=><div className="campaign-card" key={c.id}><div className="campaign-top"><div className="campaign-icon"><Send size={17}/></div><span className={`badge ${String(c.status||'DRAFT').toLowerCase()}`}>{c.status||'DRAFT'}</span></div><h3>{c.name}</h3><p>{c.industries||'All industries'} · {c.countries||'Global'}</p><div className="campaign-meta"><span><Users size={14}/> {c.decision_makers||'Decision makers'}</span><span><Zap size={14}/> {c.signals||'Intent signals'}</span></div><div className="campaign-actions">{String(c.status)==='ACTIVE'?<button className="secondary" onClick={()=>onToggle(c.id,'PAUSED')}><Pause size={15}/> Pause</button>:<button className="primary small" onClick={()=>onToggle(c.id,'ACTIVE')}><Play size={15}/> Activate</button>}<button className="icon-btn"><MoreHorizontal size={17}/></button></div></div>):<div className="empty-card"><div className="empty-icon"><Send/></div><h2>No campaigns yet</h2><p>Create your first campaign and SignalOS will store the workflow in your workspace.</p><button className="primary" onClick={onCreate}><Plus size={16}/> Create campaign</button></div>}</div></>}

function Integrations({connectors,categories,activeCategory,setCategory,search,setSearch,onConnect,onConfigure,onToggle}){return <><div className="page-head"><div><div className="eyebrow">APP MARKETPLACE</div><h1>Integrations</h1><p>Connect the tools your team already uses. SignalOS works around your stack.</p></div><div className="secure-note"><ShieldCheck size={16}/> Your credentials stay with your provider</div></div><div className="integration-hero"><div><div className="hero-icon"><Link2 size={21}/></div><div><h2>Build your revenue stack</h2><p>Connect email, calendars, CRM, data and AI providers. Enable or disable each connection whenever you want.</p></div></div><div className="hero-stats"><b>{connectors.filter(x=>x.status==='CONNECTED').length}</b><span>connected</span></div></div><div className="integration-toolbar"><div className="search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search integrations"/></div><div className="category-pills">{categories.map(c=><button key={c} className={activeCategory===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div><div className="integration-grid">{connectors.map(p=><IntegrationCard key={p.id} provider={p} onConnect={onConnect} onConfigure={onConfigure} onToggle={onToggle}/> )}</div></>}

function IntegrationCard({provider,onConnect,onConfigure,onToggle}){const connected=provider.status==='CONNECTED';const logo=provider.logo;return <div className="integration-card"><div className="integration-card-top"><div className="provider-logo">{logo?<img src={logo} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='grid'}}/>:null}<span style={{display:logo?'none':'grid'}}>{provider.name.slice(0,1)}</span></div><div className="provider-actions">{connected?<label className="switch"><input type="checkbox" checked={provider.enabled!==false} onChange={e=>onToggle(provider,e.target.checked)}/><span/></label>:<span className="available">Available</span>}<button className="icon-btn"><MoreHorizontal size={17}/></button></div></div><div className="integration-category">{provider.category}</div><h3>{provider.name}</h3><p>{provider.description}</p><div className="card-bottom">{connected?<><span className="connected"><Check size={14}/> Connected</span><button className="secondary small" onClick={()=>onConfigure(provider)}>Manage</button></>:provider.auth==='api_key'?<button className="primary small" onClick={()=>onConfigure(provider)}>Configure <ArrowRight size={14}/></button>:<button className="primary small" onClick={()=>onConnect(provider)}>Connect <ExternalLink size={14}/></button>}</div></div>}

function IntegrationModal({provider,onClose,onConnect,onConfigure}){const [key,setKey]=useState('');const apiKey=provider.auth==='api_key';return <div className="modal-backdrop"><div className="modal integration-modal"><button className="close" onClick={onClose}><X/></button><div className="modal-eyebrow">{provider.category.toUpperCase()}</div><div className="modal-provider"><div className="provider-logo large"><img src={provider.logo} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='grid'}}/><span style={{display:'none'}}>{provider.name.slice(0,1)}</span></div><div><h2>{provider.name}</h2><p>{provider.description}</p></div></div><div className="permission-box"><div><ShieldCheck size={18}/><b>{apiKey?'Secure API connection':'Secure OAuth connection'}</b></div><p>{apiKey?'Paste the API key from your provider account. SignalOS stores it encrypted on the server.':'SignalOS sends you to the provider’s official authorization page. Your provider password is never entered into SignalOS.'}</p>{provider.error&&<div className="error-box">{provider.error}</div>}</div>{apiKey?<><label className="field-label">API key</label><input className="text-input" value={key} onChange={e=>setKey(e.target.value)} placeholder="Paste provider API key"/><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!key} onClick={()=>onConfigure(provider,key)}>Save & connect</button></div></>:<div className="oauth-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={()=>onConnect(provider)}>Continue to {provider.name} <ExternalLink size={15}/></button></div>}</div></div>}

function CampaignModal({campaign,setCampaign,onClose,onCreate}){return <div className="modal-backdrop"><div className="modal campaign-modal"><button className="close" onClick={onClose}><X/></button><div className="modal-eyebrow">NEW CAMPAIGN</div><h2>Create outbound campaign</h2><p>Define the audience and signals. You can activate it after creation.</p><div className="form-grid"><Field label="Campaign name" value={campaign.name} onChange={v=>setCampaign({...campaign,name:v})} placeholder="e.g. SaaS founders showing buying intent"/><Field label="Countries" value={campaign.countries} onChange={v=>setCampaign({...campaign,countries:v})} placeholder="India, US, UK"/><Field label="Industries" value={campaign.industries} onChange={v=>setCampaign({...campaign,industries:v})} placeholder="SaaS, Fintech"/><Field label="Decision makers" value={campaign.decision_makers} onChange={v=>setCampaign({...campaign,decision_makers:v})} placeholder="Founder, CEO, CMO"/><Field label="Buying signals" value={campaign.signals} onChange={v=>setCampaign({...campaign,signals:v})} placeholder="Funding, hiring, expansion"/><Field label="Booking link" value={campaign.booking_link} onChange={v=>setCampaign({...campaign,booking_link:v})} placeholder="https://calendly.com/..."/></div><div className="channel-box"><div><Mail size={17}/><b>Email outreach</b><small>More channels can be enabled after their providers are connected.</small></div><span className="selected-check"><Check size={15}/></span></div><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={onCreate}>Create campaign <ArrowRight size={15}/></button></div></div></div>}

function Field({label,value,onChange,placeholder}){return <label className="field"><span>{label}</span><input className="text-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}

function Automation({onboarding,onRefresh,notify}){const [enabled,setEnabled]=useState(onboarding?.automation_enabled||false);const [mode,setMode]=useState(onboarding?.ai_mode||'copilot');useEffect(()=>{setEnabled(onboarding?.automation_enabled||false);setMode(onboarding?.ai_mode||'copilot')},[onboarding]);const save=async(e,m)=>{try{await api(`/workspaces/${WS}/automation`,{method:'PATCH',body:JSON.stringify({enabled:e,mode:m})});notify('Automation settings updated');onRefresh()}catch(err){notify(err.message,'error')}};return <><div className="page-head"><div><div className="eyebrow">CONTROL CENTER</div><h1>Automation</h1><p>Decide how much autonomy SignalOS has over research and outreach.</p></div></div><div className="automation-panel"><div className="kill-switch"><div><div className="hero-icon orange"><Zap size={19}/></div><div><h2>Automation master switch</h2><p>Turn every automated action on or off from one place.</p></div></div><button className={enabled?'big-switch on':'big-switch'} onClick={()=>{setEnabled(!enabled);save(!enabled,mode)}}>{enabled?'ON':'OFF'}</button></div><div className="mode-grid">{[['manual','Manual','Nothing sends without your approval'],['copilot','Copilot','SignalOS researches and drafts; you approve actions'],['autopilot','Autopilot','SignalOS can execute approved workflows within limits']].map(([id,t,d])=><button className={`mode-card ${mode===id?'selected':''}`} onClick={()=>{setMode(id);save(enabled,id)}} key={id}><div className="mode-radio">{mode===id&&<span/>}</div><div><b>{t}</b><small>{d}</small></div></button>)}</div><div className="safety-list"><div><ShieldCheck/><span><b>Global kill switch</b><small>Pause automation instantly.</small></span></div><div><Eye/><span><b>Human approval</b><small>Keep outbound actions reviewable.</small></span></div><div><Clock3/><span><b>Provider limits</b><small>Respect sending and API limits.</small></span></div></div></div></>}

function Analytics({stats}){return <><div className="page-head"><div><div className="eyebrow">INTELLIGENCE</div><h1>Analytics</h1><p>A clean view of your SignalOS operating volume.</p></div></div><div className="analytics-grid">{[['Prospects discovered',stats.prospects||0,Users],['Companies tracked',stats.companies||0,Building2],['Campaigns',stats.campaigns||0,Send],['Interactions',stats.interactions||0,MessageSquare]].map(([t,v,I])=><div className="metric-large" key={t}><I size={18}/><span>{t}</span><strong>{v}</strong><small>Workspace total</small></div>)}</div><div className="empty-card"><div className="empty-icon"><BarChart3/></div><h2>Analytics will grow with activity</h2><p>Once campaigns, integrations and prospects are active, this view becomes your source of truth for pipeline performance.</p></div></>}

function SettingsPage(){return <><div className="page-head"><div><div className="eyebrow">SYSTEM</div><h1>Settings</h1><p>Workspace defaults, security and product preferences.</p></div></div><div className="settings-list"><div><div><h3>Workspace</h3><p>Acme Growth · workspace ID 1</p></div><button className="secondary">Manage</button></div><div><div><h3>Security</h3><p>OAuth credentials, provider permissions and audit controls.</p></div><button className="secondary">Review</button></div><div><div><h3>Notifications</h3><p>Choose where SignalOS sends internal alerts.</p></div><button className="secondary">Configure</button></div></div></>}

function Simple({title,description,icon:Icon,action}){return <><div className="page-head"><div><div className="eyebrow">SIGNALOS</div><h1>{title}</h1><p>{description}</p></div><button className="primary"><Plus size={16}/> {action}</button></div><div className="empty-card"><div className="empty-icon"><Icon/></div><h2>{title} is ready</h2><p>This section is connected to the SignalOS workspace. Add the relevant data or integration to start filling it.</p></div></>}
function Empty({title,text}){return <div className="inline-empty"><FileText size={20}/><b>{title}</b><span>{text}</span></div>}

function Tour({step,setStep,onSkip}){const slides=[['Start with the workspace','SignalOS turns intent signals into a controlled revenue workflow. Everything is scoped to this workspace.','Workspace'],['Connect your stack','Choose your email, calendar, CRM, data and AI providers from Integrations. Customers connect their own accounts.','Integrations'],['Control AI autonomy','Use Manual, Copilot or Autopilot. The master switch can pause automated actions instantly.','Automation'],['Create the first campaign','Define your ICP, buying signals and booking link. Campaigns are saved to your workspace before activation.','Campaigns']];const s=slides[step];return <div className="tour-backdrop"><div className="tour"><div className="tour-visual"><div className="tour-orb"><Sparkles size={28}/></div><div className="tour-lines"><span/><span/><span/></div></div><div className="tour-content"><div className="tour-top"><span>QUICK TOUR · {step+1}/4</span><button onClick={onSkip}>Skip tour</button></div><h2>{s[0]}</h2><p>{s[1]}</p><div className="tour-feature"><Check size={15}/>{s[2]}</div><div className="tour-actions"><button className="secondary" onClick={()=>step>0&&setStep(step-1)} disabled={step===0}>Back</button>{step<3?<button className="primary" onClick={()=>setStep(step+1)}>Next <ArrowRight size={15}/></button>:<button className="primary" onClick={onSkip}>Finish <Check size={15}/></button>}</div></div></div></div>}

createRoot(document.getElementById('root')).render(<App/>);
