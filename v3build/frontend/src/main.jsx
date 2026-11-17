import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
Activity,ArrowRight,BarChart3,Bell,BookOpen,Building2,Calendar,Check,
ChevronDown,ChevronRight,CircleHelp,Command,ExternalLink,FileText,Gauge,
Link2,Loader2,Mail,Menu,MessageSquare,MoreHorizontal,Pause,Play,Plus,
Search,Send,Settings,ShieldCheck,Sparkles,Target,Trash2,Users,X,Zap
} from 'lucide-react';
import './styles.css';

const API=(import.meta.env.VITE_API_URL||'https://signalos-api-15va.onrender.com').replace(/\/$/,'');
const WS=1;

const api=async(path,opt={})=>{
 const r=await fetch(`${API}${path}`,{
  ...opt,
  headers:{
   'Content-Type':'application/json',
   ...(opt.headers||{})
  }
 });
 const t=await r.text();
 let d={};
 try{d=t?JSON.parse(t):{}}catch{d={detail:t}}
 if(!r.ok)throw new Error(d.detail||d.message||`${r.status} ${r.statusText}`);
 return d;
};

const groups=[
 {title:'Workspace',items:[
  ['overview','Overview',Gauge],
  ['prospects','Prospects',Users],
  ['companies','Companies',Building2],
  ['signals','Intent signals',Target]
 ]},
 {title:'Outbound',items:[
  ['campaigns','Campaigns',Send],
  ['conversations','Conversations',MessageSquare],
  ['meetings','Meetings',Calendar]
 ]},
 {title:'Intelligence',items:[
  ['activity','AI activity',Activity],
  ['analytics','Analytics',BarChart3]
 ]},
 {title:'System',items:[
  ['integrations','Integrations',Link2],
  ['automation','Automation',Zap],
  ['notifications','Notifications',Bell],
  ['settings','Settings',Settings],
  ['help','Help & docs',CircleHelp]
 ]}
];

const cats=[
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

const blankCampaign={
 name:'',
 countries:'India',
 industries:'SaaS, Technology',
 decision_makers:'Founder, CEO, Head of Marketing',
 signals:'Funding, hiring, expansion, website changes',
 channel:'Email',
 booking_link:'',
 daily_limit:25
};

function App(){

 const [page,setPage]=useState('overview');
 const [mobile,setMobile]=useState(false);
 const [health,setHealth]=useState('checking');
 const [toast,setToast]=useState(null);
 const [loading,setLoading]=useState(false);

 const [onboarding,setOnboarding]=useState(null);
 const [showTour,setShowTour]=useState(false);
 const [tourStep,setTourStep]=useState(0);

 const [stats,setStats]=useState({});
 const [prospects,setProspects]=useState([]);
 const [companies,setCompanies]=useState([]);
 const [campaigns,setCampaigns]=useState([]);
 const [connectors,setConnectors]=useState([]);
 const [notifications,setNotifications]=useState([]);
 const [activity,setActivity]=useState([]);

 const [campaignModal,setCampaignModal]=useState(false);
 const [selectedCampaign,setSelectedCampaign]=useState(null);
 const [campaign,setCampaign]=useState(blankCampaign);

 const [integrationModal,setIntegrationModal]=useState(null);
 const [integrationSearch,setIntegrationSearch]=useState('');
 const [integrationCategory,setIntegrationCategory]=useState('All');

 const notify=(message,type='success')=>{
  setToast({message,type});
  window.clearTimeout(window.__sigtoast);
  window.__sigtoast=window.setTimeout(
   ()=>setToast(null),
   3500
  );
 };

 const loadOnboarding=async()=>{
  const o=await api(`/workspaces/${WS}/onboarding`);
  setOnboarding(o);
  return o;
 };

 const loadAll=async(silent=false)=>{

  if(!silent)setLoading(true);

  try{

   const h=await api('/health');

   setHealth(
    h.ok
    ?'online'
    :'offline'
   );

   const o=await loadOnboarding();

   if(!o.completed){
    setLoading(false);
    return;
   }

   const [
    d,
    p,
    c,
    ca,
    n,
    a
   ]=await Promise.all([
    api(`/workspaces/${WS}/dashboard`),
    api(`/workspaces/${WS}/prospects`),
    api(`/workspaces/${WS}/companies`),
    api(`/workspaces/${WS}/campaigns`),
    api(`/workspaces/${WS}/notifications`),
    api(`/workspaces/${WS}/activity`)
   ]);

   setStats(d.metrics||{});
   setProspects(p.prospects||[]);
   setCompanies(c.companies||[]);
   setCampaigns(ca.campaigns||[]);
   setNotifications(n.notifications||[]);
   setActivity(a.activity||[]);

  }catch(e){

   setHealth('offline');

   if(!silent){
    notify(
     `SignalOS API error: ${e.message}`,
     'error'
    );
   }

  }finally{

   if(!silent)setLoading(false);

  }
 };

 const loadConnectors=async()=>{

  try{

   const result=await api(
    `/workspaces/${WS}/connectors`
   );

   setConnectors(
    result.connectors||[]
   );

  }catch(e){

   if(onboarding?.completed){
    notify(
     e.message,
     'error'
    );
   }

  }
 };

 useEffect(()=>{
  loadAll();
 },[]);

 useEffect(()=>{

  if(onboarding?.completed){
   loadConnectors();
  }

 },[onboarding?.completed]);

 const navigate=p=>{
  setPage(p);
  setMobile(false);

  if(p==='integrations'){
   loadConnectors();
  }

  if(p==='notifications'){
   loadAll(true);
  }
 };

 const createCampaign=async()=>{

  if(!campaign.name.trim()){
   return notify(
    'Campaign name is required',
    'error'
   );
  }

  try{

   await api(
    `/workspaces/${WS}/campaigns`,
    {
     method:'POST',
     body:JSON.stringify(campaign)
    }
   );

   notify(
    'Campaign created'
   );

   setCampaign(blankCampaign);
   setCampaignModal(false);
   setPage('campaigns');

   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const campaignStatus=async(
  id,
  status
 )=>{

  try{

   await api(
    `/workspaces/${WS}/campaigns/${id}`,
    {
     method:'PATCH',
     body:JSON.stringify({status})
    }
   );

   notify(
    status==='ACTIVE'
    ?'Campaign activated'
    :'Campaign paused'
   );

   setSelectedCampaign(null);

   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const connect=async p=>{

  try{

   const result=await api(
    `/workspaces/${WS}/connectors/${p.id}/connect`,
    {
     method:'POST',
     body:'{}'
    }
   );

   if(result.authorization_url){

    window.location.href=
     result.authorization_url;

   }else{

    setIntegrationModal({
     ...p,
     mode:'api'
    });

   }

  }catch(e){

   setIntegrationModal({
    ...p,
    error:e.message
   });

   notify(
    e.message,
    'error'
   );
  }
 };

 const configure=async(
  p,
  secret
 )=>{

  try{

   await api(
    `/workspaces/${WS}/connectors/${p.id}/configure`,
    {
     method:'POST',
     body:JSON.stringify({
      api_key:secret
     })
    }
   );

   notify(
    `${p.name} connected`
   );

   setIntegrationModal(null);

   await loadConnectors();
   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const toggle=async(
  p,
  enabled
 )=>{

  try{

   await api(
    `/workspaces/${WS}/connectors/${p.id}/toggle`,
    {
     method:'PATCH',
     body:JSON.stringify({
      enabled
     })
    }
   );

   await loadConnectors();
   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const disconnect=async p=>{

  if(
   !window.confirm(
    `Disconnect ${p.name}?`
   )
  )return;

  try{

   await api(
    `/workspaces/${WS}/connectors/${p.id}`,
    {
     method:'DELETE'
    }
   );

   notify(
    `${p.name} disconnected`
   );

   setIntegrationModal(null);

   await loadConnectors();
   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const completeSetup=async payload=>{

  try{

   const result=await api(
    `/workspaces/${WS}/onboarding/complete`,
    {
     method:'POST',
     body:JSON.stringify(payload)
    }
   );

   setOnboarding({
    ...onboarding,
    ...result,
    completed:true
   });

   notify(
    'Setup completed'
   );

   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const markRead=async()=>{

  try{

   await api(
    `/workspaces/${WS}/notifications/read`,
    {
     method:'POST',
     body:JSON.stringify({
      ids:notifications
       .filter(x=>!x.read)
       .map(x=>x.id)
     })
    }
   );

   await loadAll(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }
 };

 const filtered=useMemo(
  ()=>connectors.filter(
   p=>
    (
     integrationCategory==='All'
     ||
     p.category===integrationCategory
    )
    &&
    `${p.name} ${p.vendor} ${p.description}`
     .toLowerCase()
     .includes(
      integrationSearch.toLowerCase()
     )
  ),
  [
   connectors,
   integrationCategory,
   integrationSearch
  ]
 );

 const unread=
  notifications.filter(
   x=>!x.read
  ).length;

 if(
  onboarding
  &&
  !onboarding.completed
 ){

  return (
   <SetupWizard
    onboarding={onboarding}
    complete={completeSetup}
    health={health}
   />
  );
 }

 return (
  <div className="app-shell">

   <aside
    className={
     `sidebar ${mobile?'open':''}`
    }
   >

    <div className="brand">

     <div className="brand-mark">
      S
     </div>

     <div>
      <strong>
       SignalOS
      </strong>

      <span>
       AI Prospecting & Outbound OS
      </span>
     </div>

    </div>

    <div className="workspace-switch">

     <div className="workspace-avatar">
      S
     </div>

     <div>
      <b>
       SignalOS Workspace
      </b>

      <small>
       Workspace · ID {WS}
      </small>
     </div>

     <ChevronDown size={15}/>

    </div>

    <div className="side-scroll">

     <nav>

      {groups.map(group=>(

       <div
        className="nav-group"
        key={group.title}
       >

        <div className="nav-label">
         {group.title}
        </div>

        {group.items.map(
         ([id,label,Icon])=>(

          <button
           key={id}
           className={
            page===id
            ?'active'
            :''
           }
           onClick={()=>
            navigate(id)
           }
          >

           <Icon size={17}/>

           <span>
            {label}
           </span>

           {
            id==='notifications'
            &&
            unread>0
            &&
            <em>
             {unread}
            </em>
           }

           {
            id==='integrations'
            &&
            stats.connected_integrations>0
            &&
            <em>
             {
              stats.connected_integrations
             }
            </em>
           }

          </button>

         )
        )}

       </div>

      ))}

     </nav>

    </div>

    <div className="sidebar-bottom">

     <button
      onClick={()=>{
       setTourStep(0);
       setShowTour(true);
      }}
     >
      <BookOpen size={17}/>
      Product tour
     </button>

     <div className="user-card">

      <div className="avatar">
       JW
      </div>

      <div>
       <b>
        Workspace owner
       </b>

       <small>
        Administrator
       </small>
      </div>

     </div>

    </div>

   </aside>

   <main className="main">

    <header className="topbar">

     <button
      className="mobile-menu"
      onClick={()=>
       setMobile(!mobile)
      }
     >
      <Menu/>
     </button>

     <div className="crumb">

      <Command size={15}/>

      <span>
       SignalOS
      </span>

      <ChevronRight size={14}/>

      <b>
       {titleFor(page)}
      </b>

     </div>

     <div className="top-actions">

      <div
       className={
        `api-status ${health}`
       }
      >

       <span/>

       {
        health==='online'
        ?'API online'
        :health==='checking'
        ?'Checking API'
        :'API offline'
       }

      </div>

      <button
       className="icon-btn"
       onClick={()=>
        navigate('notifications')
       }
      >

       <Bell size={17}/>

       {unread>0&&<i/>}

      </button>

      <button
       className="help-btn"
       onClick={()=>
        navigate('help')
       }
      >

       <CircleHelp size={17}/>
       Help

      </button>

     </div>

    </header>

    <div className="content">

     {page==='overview'&&
      <Overview
       stats={stats}
       campaigns={campaigns}
       connectors={connectors}
       onCampaign={()=>
        setCampaignModal(true)
       }
       onIntegrations={()=>
        navigate('integrations')
       }
      />
     }

     {page==='prospects'&&
      <Prospects
       items={prospects}
       onAdd={async()=>{
        const name=
         window.prompt(
          'Prospect name'
         );

        if(!name)return;

        try{

         await api(
          `/workspaces/${WS}/prospects`,
          {
           method:'POST',
           body:JSON.stringify({
            name,
            status:'NEW'
           })
          }
         );

         notify(
          'Prospect added'
         );

         await loadAll(true);

        }catch(e){

         notify(
          e.message,
          'error'
         );

        }
       }}
      />
     }

     {page==='companies'&&
      <Companies
       items={companies}
       onAdd={async()=>{
        const name=
         window.prompt(
          'Company name'
         );

        if(!name)return;

        try{

         await api(
          `/workspaces/${WS}/companies`,
          {
           method:'POST',
           body:JSON.stringify({
            name
           })
          }
         );

         notify(
          'Company added'
         );

         await loadAll(true);

        }catch(e){

         notify(
          e.message,
          'error'
         );

        }
       }}
      />
     }

     {page==='signals'&&
      <Signals/>
     }

     {page==='campaigns'&&
      <Campaigns
       items={campaigns}
       onNew={()=>
        setCampaignModal(true)
       }
       onOpen={
        setSelectedCampaign
       }
       onStatus={
        campaignStatus
       }
      />
     }

     {page==='conversations'&&
      <Conversations/>
     }

     {page==='meetings'&&
      <Meetings/>
     }

     {page==='activity'&&
      <ActivityPage
       items={activity}
      />
     }

     {page==='analytics'&&
      <Analytics
       stats={stats}
      />
     }

     {page==='integrations'&&
      <Integrations
       list={filtered}
       categories={cats}
       cat={integrationCategory}
       setCat={setIntegrationCategory}
       search={integrationSearch}
       setSearch={setIntegrationSearch}
       onConnect={connect}
       onConfigure={
        setIntegrationModal
       }
       onToggle={toggle}
      />
     }

     {page==='automation'&&
      <Automation/>
     }

     {page==='notifications'&&
      <Notifications
       items={notifications}
       markRead={markRead}
      />
     }

     {page==='settings'&&
      <SettingsPage
       notify={notify}
       onSaved={()=>
        loadAll(true)
       }
      />
     }

     {page==='help'&&
      <Help/>
     }

    </div>

   </main>

   {campaignModal&&
    <CampaignModal
     campaign={campaign}
     setCampaign={setCampaign}
     close={()=>
      setCampaignModal(false)
     }
     create={createCampaign}
    />
   }

   {selectedCampaign&&
    <CampaignDetail
     c={selectedCampaign}
     close={()=>
      setSelectedCampaign(null)
     }
     onStatus={campaignStatus}
    />
   }

   {integrationModal&&
    <IntegrationModal
     p={integrationModal}
     close={()=>
      setIntegrationModal(null)
     }
     connect={connect}
     configure={configure}
     disconnect={disconnect}
    />
   }

   {showTour&&
    <Tour
     step={tourStep}
     setStep={setTourStep}
     close={()=>
      setShowTour(false)
     }
    />
   }

   {toast&&
    <div
     className={
      `toast ${toast.type}`
     }
    >
     <span>
      {toast.type==='success'
       ?<Check size={15}/>
       :<X size={15}/>
      }
     </span>
     {toast.message}
    </div>
   }

  </div>
 );
}

function titleFor(p){
 return p
  .split('-')
  .map(
   x=>x[0].toUpperCase()+x.slice(1)
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
}){

 return (
  <div className="page-head">

   <div>

    <div className="eyebrow">
     {eyebrow}
    </div>

    <h1>
     {title}
    </h1>

    <p>
     {sub}
    </p>

   </div>

   <div className="head-actions">

    {secondary}

    {action&&
     <button
      className="primary"
      onClick={onAction}
     >
      <Plus size={16}/>
      {action}
     </button>
    }

   </div>

  </div>
 );
}

function Overview({
 stats,
 campaigns,
 connectors,
 onCampaign,
 onIntegrations
}){

 const connected=
  connectors.filter(
   x=>x.status==='CONNECTED'
  ).length;

 return (
  <>
   <PageHead
    eyebrow="WORKSPACE OVERVIEW"
    title="Revenue command center"
    sub="Live workspace state from the SignalOS backend."
    secondary={
     <button
      className="secondary"
      onClick={onIntegrations}
     >
      <Link2 size={16}/>
      Connect tools
     </button>
    }
    action="New campaign"
    onAction={onCampaign}
   />

   <div className="stat-grid">

    {[
     ['Prospects',stats.prospects||0,Users],
     ['Companies',stats.companies||0,Building2],
     ['Campaigns',stats.campaigns||0,Send],
     ['Connected tools',connected,Link2]
    ].map(
     ([label,value,Icon])=>
      <div
       className="stat-card"
       key={label}
      >

       <div className="stat-icon">
        <Icon size={18}/>
       </div>

       <span>
        {label}
       </span>

       <strong>
        {value}
       </strong>

       <small>
        Live backend data
       </small>

      </div>
    )}

   </div>

   <div className="grid-two">

    <div className="panel">

     <div className="panel-head">

      <div>
       <h2>
        Revenue workflow
       </h2>

       <p>
        SignalOS operating loop
       </p>
      </div>

      <span className="live-pill">
       <span/>
       Live
      </span>

     </div>

     <div className="workflow">

      {[
       ['01','Discover','Find accounts with a reason to buy',Target],
       ['02','Prove','Collect evidence and score timing',ShieldCheck],
       ['03','Engage','Send context-rich outreach',Send],
       ['04','Qualify','Understand replies and intent',MessageSquare],
       ['05','Book','Move qualified buyers to a meeting',Calendar]
      ].map(
       ([number,title,description,Icon],index)=>

        <div
         className="workflow-item"
         key={number}
        >

         <div className="workflow-num">
          {number}
         </div>

         <Icon size={18}/>

         <div>
          <b>
           {title}
          </b>

          <small>
           {description}
          </small>
         </div>

         {index<4&&
          <ChevronRight
           className="workflow-arrow"
           size={16}
          />
         }

        </div>
      )}

     </div>

    </div>

    <div className="panel">

     <div className="panel-head">

      <div>
       <h2>
        Campaigns
       </h2>

       <p>
        Recent outbound workflows
       </p>
      </div>

     </div>

     {campaigns.length
      ?campaigns.slice(0,5).map(
       campaign=>
        <div
         className="list-row"
         key={campaign.id}
        >

         <div className="row-icon">
          <Send size={15}/>
         </div>

         <div>
          <b>
           {campaign.name}
          </b>

          <small>
           {campaign.channel} · {campaign.status}
          </small>
         </div>

         <span
          className={
           `badge ${String(
            campaign.status
           ).toLowerCase()}`
          }
         >
          {campaign.status}
         </span>

        </div>
      )
      :
      <Empty
       title="No campaigns yet"
       text="Create a campaign to begin."
      />
     }

    </div>

   </div>
  </>
 );
}

function Prospects({
 items,
 onAdd
}){

 return (
  <>
   <PageHead
    eyebrow="PROSPECT INTELLIGENCE"
    title="Prospects"
    sub="People ranked by fit, evidence and timing."
    action="Add prospect"
    onAction={onAdd}
   />

   <div className="table-panel">

    <table>

     <thead>

      <tr>
       <th>Prospect</th>
       <th>Title</th>
       <th>Country</th>
       <th>Score</th>
       <th>Status</th>
       <th>Intent</th>
      </tr>

     </thead>

     <tbody>

      {items.length
       ?items.map(
        prospect=>
         <tr key={prospect.id}>

          <td>
           <div className="person">

            <div className="mini-avatar">
             {String(
              prospect.name||'P'
             ).slice(0,1)}
            </div>

            <b>
             {prospect.name}
            </b>

           </div>
          </td>

          <td>
           {prospect.title||'—'}
          </td>

          <td>
           {prospect.country||'—'}
          </td>

          <td>
           {prospect.score||0}
          </td>

          <td>
           <span className="badge">
            {prospect.status||'NEW'}
           </span>
          </td>

          <td>
           {prospect.intent||'—'}
          </td>

         </tr>
       )
       :
       <tr>
        <td colSpan="6">
         <Empty
          title="No prospects yet"
          text="Add a prospect or connect a data provider."
         />
        </td>
       </tr>
      }

     </tbody>

    </table>

   </div>
  </>
 );
}

function Companies({
 items,
 onAdd
}){

 return (
  <>
   <PageHead
    eyebrow="WORKSPACE"
    title="Companies"
    sub="Company records stored in your SignalOS workspace."
    action="Add company"
    onAction={onAdd}
   />

   <div className="table-panel">

    <table>

     <thead>
      <tr>
       <th>Company</th>
       <th>Domain</th>
       <th>Industry</th>
       <th>Country</th>
       <th>Size</th>
      </tr>
     </thead>

     <tbody>

      {items.length
       ?items.map(
        company=>
         <tr key={company.id}>

          <td>
           <b>
            {company.name}
           </b>
          </td>

          <td>
           {company.domain||'—'}
          </td>

          <td>
           {company.industry||'—'}
          </td>

          <td>
           {company.country||'—'}
          </td>

          <td>
           {company.size||'—'}
          </td>

         </tr>
       )
       :
       <tr>
        <td colSpan="5">
         <Empty
          title="No companies yet"
          text="Add a company or connect a data provider."
         />
        </td>
       </tr>
      }

     </tbody>

    </table>

   </div>
  </>
 );
}

function Signals(){

 const [items,setItems]=useState([]);
 const [value,setValue]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  api(
   `/workspaces/${WS}/signals`
  )
  .then(
   result=>
    setItems(
     result.signals||[]
    )
  )
  .catch(()=>{});
 },[]);

 const save=async()=>{

  if(!value.trim())return;

  setBusy(true);

  try{

   const result=await api(
    `/workspaces/${WS}/signals`,
    {
     method:'PUT',
     body:JSON.stringify({
      signals:[
       ...items,
       value.trim()
      ]
     })
    }
   );

   setItems(
    result.signals||[]
   );

   setValue('');

  }catch(e){

   alert(
    e.message
   );

  }finally{

   setBusy(false);

  }
 };

 return (
  <>
   <PageHead
    eyebrow="INTELLIGENCE"
    title="Intent signals"
    sub="Define the events that make a prospect worth contacting now."
   />

   <div className="card signal-card">

    <div className="signal-add">

     <input
      value={value}
      onChange={e=>
       setValue(e.target.value)
      }
      placeholder="e.g. raised seed funding, hiring sales team"
     />

     <button
      className="primary"
      disabled={busy}
      onClick={save}
     >
      <Plus size={15}/>
      Add
     </button>

    </div>

    <div className="tag-list">

     {items.map(
      item=>
       <span key={item}>
        {item}
       </span>
     )}

    </div>

    {!items.length&&
     <Empty
      title="No custom signals"
      text="Add your first buying signal."
     />
    }

   </div>
  </>
 );
}

function Campaigns({
 items,
 onNew,
 onOpen,
 onStatus
}){

 return (
  <>
   <PageHead
    eyebrow="OUTBOUND"
    title="Campaigns"
    sub="Create, review, activate and pause real campaigns."
    action="New campaign"
    onAction={onNew}
   />

   <div className="campaign-grid">

    {items.length
     ?items.map(
      campaign=>

       <div
        className="campaign-card"
        key={campaign.id}
        onClick={()=>
         onOpen(campaign)
        }
       >

        <div className="campaign-top">

         <div className="campaign-icon">
          <Send size={17}/>
         </div>

         <span
          className={
           `badge ${String(
            campaign.status||'DRAFT'
           ).toLowerCase()}`
          }
         >
          {campaign.status}
         </span>

        </div>

        <h3>
         {campaign.name}
        </h3>

        <p>
         {campaign.industries||'All industries'}
         {' · '}
         {campaign.countries||'Global'}
        </p>

        <div className="campaign-meta">

         <span>
          <Users size={13}/>
          {campaign.decision_makers||'Decision makers'}
         </span>

         <span>
          <Zap size={13}/>
          {campaign.signals||'Signals'}
         </span>

        </div>

        <div
         className="campaign-actions"
         onClick={e=>
          e.stopPropagation()
         }
        >

         {campaign.status==='ACTIVE'
          ?
          <button
           className="secondary"
           onClick={()=>
            onStatus(
             campaign.id,
             'PAUSED'
            )
           }
          >
           <Pause size={14}/>
           Pause
          </button>
          :
          <button
           className="primary small"
           onClick={()=>
            onStatus(
             campaign.id,
             'ACTIVE'
            )
           }
          >
           <Play size={14}/>
           Activate
          </button>
         }

         <button
          className="icon-btn"
          onClick={()=>
           onOpen(campaign)
          }
         >
          <MoreHorizontal size={16}/>
         </button>

        </div>

       </div>
     )
     :
     <div className="empty-card">

      <Send size={25}/>

      <h2>
       No campaigns yet
      </h2>

      <p>
       Create your first campaign.
       It will be stored in Supabase
       through the Render backend.
      </p>

      <button
       className="primary"
       onClick={onNew}
      >
       <Plus size={15}/>
       Create campaign
      </button>

     </div>
    }

   </div>
  </>
 );
}

function Conversations(){

 return (
  <>
   <PageHead
    eyebrow="OUTBOUND"
    title="Conversations"
    sub="Real email threads will appear here once an email provider is connected."
   />

   <div className="empty-card">

    <MessageSquare size={25}/>

    <h2>
     Inbox is ready
    </h2>

    <p>
     Connect Gmail, Microsoft 365
     or an email delivery provider
     to begin.
    </p>

   </div>
  </>
 );
}

function Meetings(){

 return (
  <>
   <PageHead
    eyebrow="OUTBOUND"
    title="Meetings"
    sub="Booked meetings and calendar events will appear here."
   />

   <div className="empty-card">

    <Calendar size={25}/>

    <h2>
     Calendar is ready
    </h2>

    <p>
     Connect Google Calendar,
     Outlook Calendar or Calendly.
    </p>

   </div>
  </>
 );
}

function ActivityPage({
 items
}){

 return (
  <>
   <PageHead
    eyebrow="INTELLIGENCE"
    title="AI activity"
    sub="Only real backend activity is shown here. No fabricated events."
   />

   <div className="card activity-list">

    {items.length
     ?items.map(
      item=>
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
          {new Date(
           item.created_at
          ).toLocaleString()}
         </small>

        </div>

       </div>
     )
     :
     <Empty
      title="No activity yet"
      text="Real research, integration and campaign events will appear here."
     />
    }

   </div>
  </>
 );
}

function Analytics({
 stats
}){

 return (
  <>
   <PageHead
    eyebrow="INTELLIGENCE"
    title="Analytics"
    sub="Workspace-level operating metrics from the backend."
   />

   <div className="analytics-grid">

    {[
     ['Prospects',stats.prospects||0,Users],
     ['Companies',stats.companies||0,Building2],
     ['Campaigns',stats.campaigns||0,Send],
     ['Interactions',stats.interactions||0,Activity]
    ].map(
     ([title,value,Icon])=>
      <div
       className="metric-large"
       key={title}
      >

       <Icon size={18}/>

       <span>
        {title}
       </span>

       <strong>
        {value}
       </strong>

       <small>
        Live data
       </small>

      </div>
    )}

   </div>
  </>
 );
}

function Integrations({
 list,
 categories,
 cat,
 setCat,
 search,
 setSearch,
 onConnect,
 onConfigure,
 onToggle
}){

 const connected=
  list.filter(
   x=>x.status==='CONNECTED'
  ).length;

 return (
  <>
   <PageHead
    eyebrow="APP MARKETPLACE"
    title="Integrations"
    sub="Connect customer-owned tools. SignalOS never asks for a provider password."
   />

   <div className="integration-hero">

    <div>

     <div className="hero-icon">
      <ShieldCheck size={21}/>
     </div>

     <div>

      <h2>
       Your stack. Your accounts.
      </h2>

      <p>
       OAuth providers open the provider's
       official login. API providers use
       secure credentials sent directly to
       SignalOS over HTTPS.
      </p>

     </div>

    </div>

    <strong>
     {connected} connected
    </strong>

   </div>

   <div className="integration-toolbar">

    <div className="search">

     <Search size={16}/>

     <input
      value={search}
      onChange={e=>
       setSearch(e.target.value)
      }
      placeholder="Search 30+ integrations"
     />

    </div>

    <div className="category-pills">

     {categories.map(
      category=>
       <button
        key={category}
        className={
         cat===category
         ?'selected'
         :''
        }
        onClick={()=>
         setCat(category)
        }
       >
        {category}
       </button>
     )}

    </div>

   </div>

   <div className="integration-grid">

    {list.map(
     provider=>
      <IntegrationCard
       key={provider.id}
       p={provider}
       onConnect={onConnect}
       onConfigure={onConfigure}
       onToggle={onToggle}
      />
    )}

   </div>

   {!list.length&&
    <div className="empty-card">

     <FileText size={25}/>

     <h2>
      No matching integrations
     </h2>

     <p>
      Try another category or search.
     </p>

    </div>
   }

  </>
 );
}

function Logo({
 p,
 large=false
}){

 return (
  <div
   className={
    `provider-logo ${large?'large':''}`
   }
  >

   <img
    src={p.logo}
    alt=""
    onError={event=>{
     event.currentTarget.style.display='none';
     event.currentTarget.parentElement
      .classList.add('fallback');
    }}
   />

   <span>
    {String(
     p.name||'S'
    ).slice(0,1)}
   </span>

  </div>
 );
}

function IntegrationCard({
 p,
 onConnect,
 onConfigure,
 onToggle
}){

 const connected=
  p.status==='CONNECTED';

 return (
  <div className="integration-card">

   <div className="int-top">

    <Logo p={p}/>

    <div className="int-tools">

     {connected
      ?
      <label className="switch">

       <input
        type="checkbox"
        checked={
         p.enabled!==false
        }
        onChange={e=>
         onToggle(
          p,
          e.target.checked
         )
        }
       />

       <span/>

      </label>
      :
      <span className="available">
       Available
      </span>
     }

     <button
      className="icon-btn"
      onClick={()=>
       onConfigure(p)
      }
     >
      <MoreHorizontal size={16}/>
     </button>

    </div>

   </div>

   <div className="integration-category">
    {p.category}
   </div>

   <h3>
    {p.name}
   </h3>

   <p>
    {p.description}
   </p>

   <div className="scope-row">

    {(p.scopes||[])
     .slice(0,3)
     .map(
      scope=>
       <span key={scope}>
        {scope}
       </span>
     )}

   </div>

   <div className="card-bottom">

    {connected
     ?
     <>
      <span className="connected">
       <Check size={14}/>
       Connected
      </span>

      <button
       className="secondary small"
       onClick={()=>
        onConfigure(p)
       }
      >
       Manage
      </button>
     </>
     :
     p.auth==='oauth'
     ?
     <button
      className="primary small"
      onClick={()=>
       onConnect(p)
      }
     >
      Connect
      <ExternalLink size={14}/>
     </button>
     :
     <button
      className="primary small"
      onClick={()=>
       onConfigure(p)
      }
     >
      Add credentials
      <ArrowRight size={14}/>
     </button>
    }

   </div>

  </div>
 );
}

function Automation(){

 const [settings,setSettings]=useState({
  automation_enabled:false,
  ai_mode:'copilot'
 });

 const [busy,setBusy]=useState(false);

 useEffect(()=>{

  api(
   `/workspaces/${WS}/onboarding`
  )
  .then(
   result=>
    setSettings(
     result.settings||{}
    )
  )
  .catch(()=>{});

 },[]);

 const save=async(
  enabled,
  mode
 )=>{

  setBusy(true);

  try{

   const result=await api(
    `/workspaces/${WS}/automation`,
    {
     method:'PATCH',
     body:JSON.stringify({
      enabled,
      mode
     })
    }
   );

   setSettings(
    result.settings||{}
   );

  }catch(e){

   alert(
    e.message
   );

  }finally{

   setBusy(false);

  }
 };

 const enabled=
  !!settings.automation_enabled;

 const mode=
  settings.ai_mode||'copilot';

 return (
  <>
   <PageHead
    eyebrow="CONTROL CENTER"
    title="Automation"
    sub="OFF by default. Choose the AI operating mode, then explicitly enable execution."
   />

   <div className="automation-panel">

    <div className="kill-switch">

     <div>

      <div className="hero-icon orange">
       <Zap size={19}/>
      </div>

      <div>

       <h2>
        Master automation
       </h2>

       <p>
        One switch pauses automated
        actions across the entire workspace.
       </p>

      </div>

     </div>

     <button
      disabled={busy}
      className={
       enabled
       ?'big-switch on'
       :'big-switch'
      }
      onClick={()=>
       save(
        !enabled,
        mode
       )
      }
     >
      {enabled?'ON':'OFF'}
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
      ([id,title,description])=>

       <button
        disabled={busy}
        className={
         `mode-card ${
          mode===id
          ?'selected'
          :''
         }`
        }
        onClick={()=>
         save(
          enabled,
          id
         )
        }
        key={id}
       >

        <div className="mode-radio">

         {mode===id&&
          <span/>
         }

        </div>

        <div>

         <b>
          {title}
         </b>

         <small>
          {description}
         </small>

        </div>

       </button>
     )}

    </div>

    <div className="safety-list">

     <div>
      <ShieldCheck/>

      <span>
       <b>
        Global kill switch
       </b>

       <small>
        Automation stays paused until you enable it.
       </small>
      </span>
     </div>

     <div>
      <Users/>

      <span>
       <b>
        Human control
       </b>

       <small>
        Copilot keeps execution reviewable.
       </small>
      </span>
     </div>

     <div>
      <Zap/>

      <span>
       <b>
        Provider limits
       </b>

       <small>
        Respect account and sending limits.
       </small>
      </span>
     </div>

    </div>

   </div>
  </>
 );
}

function Notifications({
 items,
 markRead
}){

 const unread=
  items.filter(
   x=>!x.read
  ).length;

 return (
  <>
   <PageHead
    eyebrow="SYSTEM"
    title="Notifications"
    sub="Operational alerts, integration events and handoffs."
    secondary={
     unread
     ?
     <button
      className="secondary"
      onClick={markRead}
     >
      Mark all read
     </button>
     :
     null
    }
   />

   <div className="card notification-list">

    {items.length
     ?items.map(
      notification=>
       <div
        className={
         `notification ${
          notification.read
          ?''
          :'unread'
         }`
        }
        key={notification.id}
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
          {new Date(
           notification.created_at
          ).toLocaleString()}
         </small>

        </div>

       </div>
     )
     :
     <Empty
      title="You're all caught up"
      text="Important workspace events will appear here."
     />
    }

   </div>
  </>
 );
}

function SettingsPage({
 notify,
 onSaved
}){

 const [
  settings,
  setSettings
 ]=useState({
  workspace_name:'',
  owner_name:'',
  owner_email:'',
  timezone:'Asia/Kolkata',
  llm_provider:'',
  llm_model:''
 });

 const [
  busy,
  setBusy
 ]=useState(false);

 useEffect(()=>{

  api(
   `/workspaces/${WS}/settings`
  )
  .then(result=>{

   setSettings({

    workspace_name:
     result.workspace.name||'',

    owner_name:
     result.workspace.owner_name||'',

    owner_email:
     result.workspace.owner_email||'',

    timezone:
     result.settings.timezone
     ||'Asia/Kolkata',

    llm_provider:
     result.settings.llm_provider
     ||'',

    llm_model:
     result.settings.llm_model
     ||''
   });

  })
  .catch(
   error=>
    notify(
     error.message,
     'error'
    )
  );

 },[]);

 const save=async()=>{

  setBusy(true);

  try{

   await api(
    `/workspaces/${WS}/settings`,
    {
     method:'PATCH',

     body:JSON.stringify({

      name:
       settings.workspace_name,

      owner_name:
       settings.owner_name,

      owner_email:
       settings.owner_email,

      settings:{
       timezone:
        settings.timezone,

       llm_provider:
        settings.llm_provider,

       llm_model:
        settings.llm_model
      }

     })
    }
   );

   notify(
    'Settings saved'
   );

   onSaved(true);

  }catch(e){

   notify(
    e.message,
    'error'
   );

  }finally{

   setBusy(false);

  }
 };

 return (
  <>
   <PageHead
    eyebrow="SYSTEM"
    title="Settings"
    sub="Workspace identity, LLM preference and operating defaults."
   />

   <div className="card settings-card">

    <div className="form-grid">

     <Field
      label="Workspace name"
      value={
       settings.workspace_name
      }
      onChange={value=>
       setSettings({
        ...settings,
        workspace_name:value
       })
      }
     />

     <Field
      label="Owner name"
      value={
       settings.owner_name
      }
      onChange={value=>
       setSettings({
        ...settings,
        owner_name:value
       })
      }
     />

     <Field
      label="Owner email"
      value={
       settings.owner_email
      }
      onChange={value=>
       setSettings({
        ...settings,
        owner_email:value
       })
      }
     />

     <label className="field">

      <span>
       Timezone
      </span>

      <select
       value={
        settings.timezone
       }
       onChange={event=>
        setSettings({
         ...settings,
         timezone:event.target.value
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

     <label className="field">

      <span>
       Default LLM provider
      </span>

      <select
       value={
        settings.llm_provider
       }
       onChange={event=>
        setSettings({
         ...settings,
         llm_provider:event.target.value
        })
       }
      >

       <option value="">
        Select after connecting
       </option>

       <option value="openai">
        OpenAI
       </option>

       <option value="anthropic">
        Anthropic / Claude
       </option>

       <option value="gemini">
        Google Gemini
       </option>

       <option value="openrouter">
        OpenRouter
       </option>

      </select>

     </label>

     <Field
      label="Default model"
      value={
       settings.llm_model
      }
      onChange={value=>
       setSettings({
        ...settings,
        llm_model:value
       })
      }
      placeholder="e.g. gpt-5"
     />

    </div>

    <div className="save-bar">

     <span>
      <ShieldCheck size={15}/>
      Saved through Render → Supabase
     </span>

     <button
      className="primary"
      disabled={busy}
      onClick={save}
     >

      {busy
       ?<Loader2 className="spin"/>
       :<Check size={15}/>
      }

      Save settings

     </button>

    </div>

   </div>
  </>
 );
}

function Help(){

 return (
  <>
   <PageHead
    eyebrow="HELP"
    title="Help & docs"
    sub="Operate SignalOS safely and understand each control."
   />

   <div className="help-grid">

    {[
     [
      'Onboarding',
      'Complete the mandatory setup before the workspace can be used.',
      BookOpen
     ],
     [
      'Integrations',
      'OAuth connections open the provider login. API providers use server-side credentials.',
      Link2
     ],
     [
      'LLM',
      'Connect OpenAI, Claude, Gemini or OpenRouter. API access is not the same as a consumer ChatGPT login.',
      Sparkles
     ],
     [
      'Automation',
      'Manual, Copilot and Autopilot are persisted in the workspace. The master switch is OFF by default.',
      Zap
     ],
     [
      'Campaigns',
      'Create, open, review, activate and pause campaigns. Activation checks email, LLM and automation prerequisites.',
      Send
     ],
     [
      'Notifications',
      'Integration and campaign events are stored in the workspace notification feed.',
      Bell
     ]
    ].map(
     ([title,description,Icon])=>

      <div
       className="help-card"
       key={title}
      >

       <Icon size={20}/>

       <h3>
        {title}
       </h3>

       <p>
        {description}
       </p>

      </div>
    )}

   </div>
  </>
 );
}

function CampaignModal({
 campaign,
 setCampaign,
 close,
 create
}){

 return (
  <div className="modal-backdrop">

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
     Save the workflow first.
     Activation happens separately
     after the required stack is ready.
    </p>

    <div className="form-grid">

     {[
      [
       'name',
       'Campaign name',
       'e.g. SaaS founders showing hiring intent'
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
      ([key,label,placeholder])=>

       <Field
        key={key}
        label={label}
        value={campaign[key]}
        onChange={value=>
         setCampaign({
          ...campaign,
          [key]:value
         })
        }
        placeholder={placeholder}
       />
     )}

    </div>

    <label className="field">

     <span>
      Daily sending limit
     </span>

     <input
      className="text-input"
      type="number"
      min="1"
      max="1000"
      value={
       campaign.daily_limit
      }
      onChange={event=>
       setCampaign({
        ...campaign,
        daily_limit:
         Number(event.target.value)
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

function CampaignDetail({
 c,
 close,
 onStatus
}){

 return (
  <div className="modal-backdrop">

   <div className="modal">

    <button
     className="close"
     onClick={close}
    >
     <X/>
    </button>

    <div className="eyebrow">
     CAMPAIGN DETAIL
    </div>

    <h2>
     {c.name}
    </h2>

    <p>
     Review this saved workflow.
     Activation is protected by
     backend prerequisites.
    </p>

    <div className="detail-grid">

     <div>
      <span>Status</span>
      <b>{c.status}</b>
     </div>

     <div>
      <span>Channel</span>
      <b>{c.channel}</b>
     </div>

     <div>
      <span>Countries</span>
      <b>{c.countries||'All'}</b>
     </div>

     <div>
      <span>Industries</span>
      <b>{c.industries||'All'}</b>
     </div>

     <div>
      <span>Decision makers</span>
      <b>{c.decision_makers||'All'}</b>
     </div>

     <div>
      <span>Daily limit</span>
      <b>{c.daily_limit}</b>
     </div>

    </div>

    <div className="modal-actions">

     {c.status==='ACTIVE'
      ?
      <button
       className="secondary"
       onClick={()=>
        onStatus(
         c.id,
         'PAUSED'
        )
       }
      >
       <Pause size={14}/>
       Pause
      </button>
      :
      <button
       className="primary"
       onClick={()=>
        onStatus(
         c.id,
         'ACTIVE'
        )
       }
      >
       <Play size={14}/>
       Activate
      </button>
     }

     <button
      className="secondary"
      onClick={close}
     >
      Close
     </button>

    </div>

   </div>

  </div>
 );
}

function IntegrationModal({
 p,
 close,
 connect,
 configure,
 disconnect
}){

 const [secret,setSecret]=useState('');

 const connected=
  p.status==='CONNECTED';

 const apiKey=
  p.auth==='api_key';

 return (
  <div className="modal-backdrop">

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

     <Logo
      p={p}
      large
     />

     <div>

      <h2>
       {p.name}
      </h2>

      <p>
       {p.description}
      </p>

     </div>

    </div>

    {connected
     ?
     <>

      <div className="connected-panel">

       <Check size={18}/>

       <div>

        <b>
         Connected
        </b>

        <p>
         SignalOS has an authorized
         connection for this workspace.
         Secrets are never returned
         to the browser.
        </p>

       </div>

      </div>

      <div className="scope-list">

       {(p.scopes||[]).map(
        scope=>
         <span key={scope}>
          <Check size={13}/>
          {scope}
         </span>
       )}

      </div>

      <div className="modal-actions">

       <button
        className="secondary"
        onClick={close}
       >
        Close
       </button>

       <button
        className="danger"
        onClick={()=>
         disconnect(p)
        }
       >
        <Trash2 size={14}/>
        Disconnect
       </button>

      </div>

     </>
     :
     <>

      <div className="permission-box">

       <ShieldCheck size={18}/>

       <div>

        <b>
         {
          apiKey
          ?'Secure credential connection'
          :'Secure OAuth connection'
         }
        </b>

        <p>
         {
          apiKey
          ?
          'Paste the credential from the provider account. SignalOS stores it server-side and never displays it again.'
          :
          'Continue to the provider’s official authorization page. SignalOS never asks for the provider password.'
         }
        </p>

       </div>

      </div>

      <div className="scope-list">

       {(p.scopes||[]).map(
        scope=>
         <span key={scope}>
          <Check size={13}/>
          {scope}
         </span>
       )}

      </div>

      {p.error&&
       <div className="error-box">
        {p.error}
       </div>
      }

      {apiKey
       ?
       <>

        <label className="field">

         <span>
          API key / credential
         </span>

         <input
          className="text-input"
          type="password"
          value={secret}
          onChange={e=>
           setSecret(e.target.value)
          }
          placeholder="Paste credential"
          autoComplete="off"
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
          onClick={()=>
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
       :
       <div className="modal-actions">

        <button
         className="secondary"
         onClick={close}
        >
         Cancel
        </button>

        <button
         className="primary"
         onClick={()=>
          connect(p)
         }
        >
         Continue to {p.vendor}
         <ExternalLink size={15}/>
        </button>

       </div>
      }

     </>
    }

   </div>

  </div>
 );
}

function Field({
 label,
 value,
 onChange,
 placeholder=''
}){

 return (
  <label className="field">

   <span>
    {label}
   </span>

   <input
    className="text-input"
    value={value??''}
    onChange={e=>
     onChange(
      e.target.value
     )
    }
    placeholder={placeholder}
   />

  </label>
 );
}

function SetupWizard({
 complete,
 health
}){

 const [step,setStep]=useState(0);

 const [name,setName]=useState(
  'SignalOS Workspace'
 );

 const [mode,setMode]=useState(
  'copilot'
 );

 const steps=[
  [
   'Welcome to SignalOS',
   'Complete this one-time setup before any workspace data or automation is accessible.'
  ],
  [
   'Workspace',
   'Choose the workspace identity and the default AI operating mode.'
  ],
  [
   'Connect your stack',
   'After setup, connect your AI/LLM, email, calendar, CRM and data providers from the Integrations marketplace.'
  ],
  [
   'Safety & finish',
   'Automation starts OFF. Nothing sends until you connect the required providers and explicitly enable execution.'
  ]
 ];

 const next=()=>{

  if(
   step<
   steps.length-1
  ){

   setStep(
    step+1
   );

  }else{

   complete({
    name,
    owner_name:
     'Workspace Owner',
    ai_mode:
     mode,
    timezone:
     'Asia/Kolkata'
   });

  }
 };

 return (
  <div className="onboarding-lock">

   <div className="setup-card">

    <div className="setup-side">

     <div className="setup-brand">

      <div className="brand-mark">
       S
      </div>

      <div>

       <b>
        SignalOS
       </b>

       <small>
        AI Prospecting & Outbound OS
       </small>

      </div>

     </div>

     <div className="setup-steps">

      {steps.map(
       (item,index)=>

        <div
         key={item[0]}
         className={
          index===step
          ?'current'
          :index<step
          ?'done'
          :''
         }
        >

         <span>

          {
           index<step
           ?<Check size={13}/>
           :index+1
          }

         </span>

         <div>

          <b>
           {item[0]}
          </b>

          <small>
           {item[1]}
          </small>

         </div>

        </div>
      )}

     </div>

    </div>

    <div className="setup-main">

     <div className="setup-top">

      <span>
       MANDATORY SETUP
      </span>

      <small>
       API {health}
      </small>

     </div>

     <h1>
      {steps[step][0]}
     </h1>

     <p>
      {steps[step][1]}
     </p>

     {step===0&&
      <div className="setup-callout">

       <Sparkles size={24}/>

       <div>

        <b>
         One workspace. One source of truth.
        </b>

        <p>
         Prospecting, intent, outbound,
         AI, integrations and controls
         live together.
        </p>

       </div>

      </div>
     }

     {step===1&&
      <>

       <Field
        label="Workspace name"
        value={name}
        onChange={setName}
       />

       <div className="setup-modes">

        {[
         [
          'manual',
          'Manual',
          'Approval required'
         ],
         [
          'copilot',
          'Copilot',
          'AI drafts; you approve'
         ],
         [
          'autopilot',
          'Autopilot',
          'Execute within limits'
         ]
        ].map(
         ([id,title,description])=>

          <button
           key={id}
           className={
            mode===id
            ?'mode-card selected'
            :'mode-card'
           }
           onClick={()=>
            setMode(id)
           }
          >

           <div className="mode-radio">

            {mode===id&&
             <span/>
            }

           </div>

           <div>

            <b>
             {title}
            </b>

            <small>
             {description}
            </small>

           </div>

          </button>
        )}

       </div>

      </>
     }

     {step===2&&
      <div className="setup-grid">

       <div>
        <Mail/>
        <b>Email</b>
        <span>
         Gmail, Microsoft 365, Resend,
         SendGrid, Mailgun
        </span>
       </div>

       <div>
        <Sparkles/>
        <b>AI / LLM</b>
        <span>
         OpenAI, Claude, Gemini,
         OpenRouter
        </span>
       </div>

       <div>
        <Calendar/>
        <b>Calendar</b>
        <span>
         Google Calendar, Outlook,
         Calendly
        </span>
       </div>

       <div>
        <Link2/>
        <b>CRM & Data</b>
        <span>
         HubSpot, Salesforce, Apollo,
         Hunter and more
        </span>
       </div>

      </div>
     }

     {step===3&&
      <div className="setup-callout success">

       <ShieldCheck size={24}/>

       <div>

        <b>
         Safe by default
        </b>

        <p>
         Completing setup does not connect
         any account and does not enable
         automation. You choose providers
         yourself from Integrations.
        </p>

       </div>

      </div>
     }

     <div className="setup-actions">

      {step>0&&
       <button
        className="secondary"
        onClick={()=>
         setStep(step-1)
        }
       >
        Back
       </button>
      }

      <button
       className="primary"
       disabled={
        step===1
        &&
        !name.trim()
       }
       onClick={next}
      >

       {
        step===steps.length-1
        ?'Enter SignalOS'
        :'Continue'
       }

       <ArrowRight size={15}/>

      </button>

     </div>

    </div>

   </div>

  </div>
 );
}

function Tour({
 step,
 setStep,
 close
}){

 const slides=[
  [
   'Command center',
   'Overview shows live workspace counts and stack health.'
  ],
  [
   'Integrations',
   'Choose the tools your team already uses. OAuth providers open official login; API providers use secure credentials.'
  ],
  [
   'Automation',
   'Manual, Copilot and Autopilot are persisted. The master switch is OFF until you explicitly enable it.'
  ],
  [
   'Campaigns',
   'Create, open, review, activate and pause campaigns. Backend checks protect activation.'
  ]
 ];

 const current=
  slides[step];

 return (
  <div className="tour-backdrop">

   <div className="tour">

    <div className="tour-visual">

     <div className="tour-orb">
      <Sparkles size={28}/>
     </div>

    </div>

    <div className="tour-content">

     <div className="tour-top">

      <span>
       PRODUCT TOUR · {step+1}/4
      </span>

      <button
       onClick={close}
      >
       Skip
      </button>

     </div>

     <h2>
      {current[0]}
     </h2>

     <p>
      {current[1]}
     </p>

     <div className="tour-actions">

      <button
       className="secondary"
       disabled={step===0}
       onClick={()=>
        setStep(step-1)
       }
      >
       Back
      </button>

      {step<3
       ?
       <button
        className="primary"
        onClick={()=>
         setStep(step+1)
        }
       >
        Next
        <ArrowRight size={15}/>
       </button>
       :
       <button
        className="primary"
        onClick={close}
       >
        Finish
        <Check size={15}/>
       </button>
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
}){

 return (
  <div className="inline-empty">

   <FileText size={21}/>

   <b>
    {title}
   </b>

   <span>
    {text}
   </span>

  </div>
 );
}

createRoot(
 document.getElementById('root')
).render(
 <App/>
);
