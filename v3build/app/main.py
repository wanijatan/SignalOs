from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import Base, engine, get_db
from .models import Workspace, ICP, IntentProfile, Prospect, Evidence, Campaign, Interaction, Suppression, Connector, Job, AuditEvent
from .schemas import WorkspaceCreate, ICPCreate, IntentProfileCreate, ScoreRequest, SuppressionRequest, WebhookEvent
from .scoring import score_breakdown
from .compliance import detects_opt_out
from .integrations import CATALOG, all_providers, provider, pkce_pair, authorization_url, encrypt, decrypt, oauth_settings, OAUTH, now
import os, secrets, httpx, urllib.parse

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Prospecting & Outbound OS V3", version="3.1.0")

@app.get('/health')
def health(): return {'status':'ok','version':'3.1.0'}

@app.post('/workspaces')
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)):
    obj=Workspace(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return {'id':obj.id,'name':obj.name}

@app.post('/workspaces/{workspace_id}/icps')
def create_icp(workspace_id:int,payload:ICPCreate,db:Session=Depends(get_db)):
    if payload.workspace_id!=workspace_id: raise HTTPException(400,'workspace mismatch')
    obj=ICP(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return {'id':obj.id,'name':obj.name}

@app.post('/workspaces/{workspace_id}/intent-profiles')
def create_intent(workspace_id:int,payload:IntentProfileCreate,db:Session=Depends(get_db)):
    if payload.workspace_id!=workspace_id: raise HTTPException(400,'workspace mismatch')
    obj=IntentProfile(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return {'id':obj.id,'name':obj.name}

@app.post('/score')
def score(payload:ScoreRequest): return score_breakdown(**payload.model_dump())

@app.post('/workspaces/{workspace_id}/suppressions')
def suppress(workspace_id:int,payload:SuppressionRequest,db:Session=Depends(get_db)):
    if payload.workspace_id not in (None,workspace_id): raise HTTPException(400,'workspace mismatch')
    obj=Suppression(**payload.model_dump(exclude_none=False)); obj.workspace_id=workspace_id; db.add(obj); db.commit(); return {'status':'suppressed','id':obj.id}

@app.get('/workspaces/{workspace_id}/dashboard')
def dashboard(workspace_id:int,db:Session=Depends(get_db)):
    def count(model): return db.scalar(select(func.count()).select_from(model).where(model.workspace_id==workspace_id)) or 0
    return {'prospects':count(Prospect),'evidence':count(Evidence),'campaigns':count(Campaign),'interactions':count(Interaction),'jobs':count(Job),'suppressions':count(Suppression)}

@app.post('/webhooks/email')
def email_webhook(event:WebhookEvent,db:Session=Depends(get_db)):
    text=str(event.payload.get('text',''))
    if detects_opt_out(text) and event.email:
        db.add(Suppression(email=event.email.lower(),reason='OPT_OUT')); db.commit(); return {'action':'SUPPRESS_AND_STOP'}
    return {'action':'PROCESS_REPLY','event_type':event.event_type}

@app.post('/webhooks/calendar')
def calendar_webhook(event:WebhookEvent):
    if event.event_type in {'scheduled','meeting.scheduled'}: return {'action':'MEETING_BOOKED','stop_outreach':True}
    if event.event_type in {'canceled','meeting.canceled'}: return {'action':'MEETING_CANCELED','restore_followup':True}
    return {'action':'IGNORED'}

@app.get('/providers')
def providers(): return {'categories':CATALOG,'providers':all_providers()}

@app.get('/workspaces/{workspace_id}/connectors')
def list_connectors(workspace_id:int,db:Session=Depends(get_db)):
    rows=db.scalars(select(Connector).where(Connector.workspace_id==workspace_id)).all()
    return [{'id':r.id,'provider':r.provider,'kind':r.kind,'status':r.status,'scopes':r.scopes,'connected_at':r.connected_at} for r in rows]

@app.post('/workspaces/{workspace_id}/connectors/{provider_id}/connect')
def connect_provider(workspace_id:int,provider_id:str,db:Session=Depends(get_db)):
    p=provider(provider_id)
    if not p: raise HTTPException(404,'Unknown provider')
    row=db.scalar(select(Connector).where(Connector.workspace_id==workspace_id,Connector.provider==provider_id))
    if not row:
        row=Connector(workspace_id=workspace_id,kind=p['category'],provider=provider_id,status='DISCONNECTED',config={},scopes=[]); db.add(row); db.commit(); db.refresh(row)
    if p['mode']=='oauth':
        try:
            verifier,challenge=pkce_pair(); state=secrets.token_urlsafe(32)
            url=authorization_url(provider_id,state,(verifier,challenge))
        except RuntimeError as e: return {'status':'CONFIG_REQUIRED','provider':provider_id,'message':str(e),'mode':'oauth'}
        row.status='AUTHORIZING'; row.config={'oauth_state':encrypt(state),'pkce_verifier':encrypt(verifier)}; db.commit()
        return {'status':'REDIRECT','url':url,'provider':provider_id}
    row.status='CONFIG_REQUIRED'; db.commit(); return {'status':'CONFIG_REQUIRED','provider':provider_id,'mode':p['mode']}

@app.get('/oauth/callback/{provider_id}')
async def oauth_callback(provider_id:str,code:str|None=None,state:str|None=None,error:str|None=None,db:Session=Depends(get_db)):
    if error: return RedirectResponse('/?oauth_error='+urllib.parse.quote(error))
    if not code or not state: raise HTTPException(400,'Missing OAuth code/state')
    rows=db.scalars(select(Connector).where(Connector.provider==provider_id,Connector.status=='AUTHORIZING')).all()
    row=None
    for r in rows:
        try:
            if decrypt(r.config.get('oauth_state',''))==state: row=r; break
        except Exception: pass
    if not row: raise HTTPException(400,'Invalid or expired OAuth state')
    p=provider(provider_id); cfg=oauth_settings(provider_id); endpoint=OAUTH.get((p.get('oauth_env') or '').lower(),{}).get('token') or OAUTH.get(provider_id,{}).get('token')
    if not endpoint: raise HTTPException(400,'Token endpoint not configured')
    data={'grant_type':'authorization_code','code':code,'redirect_uri':cfg['redirect_uri'],'client_id':cfg['client_id'],'code_verifier':decrypt(row.config['pkce_verifier'])}
    headers={'Content-Type':'application/x-www-form-urlencoded'}
    if cfg.get('client_secret') and provider_id not in {'resend'}:
        # Calendly/Twilio and similar server apps can authenticate with Basic; providers may also accept body credentials.
        import base64
        headers['Authorization']='Basic '+base64.b64encode((cfg['client_id']+':'+cfg['client_secret']).encode()).decode()
    async with httpx.AsyncClient(timeout=20) as client:
        resp=await client.post(endpoint,data=data,headers=headers)
    if resp.status_code>=400: raise HTTPException(resp.status_code,'OAuth token exchange failed: '+resp.text[:500])
    token=resp.json(); row.status='CONNECTED'; row.scopes=token.get('scope','').split() if isinstance(token.get('scope'),str) else (p.get('scopes') or [])
    row.connected_at=now(); row.config={'access_token':encrypt(token.get('access_token','')),'refresh_token':encrypt(token.get('refresh_token','')) if token.get('refresh_token') else '', 'token_type':token.get('token_type','Bearer'),'expires_in':token.get('expires_in')}; db.commit()
    return RedirectResponse('/?oauth_connected='+provider_id)

@app.post('/workspaces/{workspace_id}/connectors/{provider_id}/configure')
def configure_provider(workspace_id:int,provider_id:str,payload:dict,db:Session=Depends(get_db)):
    p=provider(provider_id)
    if not p: raise HTTPException(404,'Unknown provider')
    row=db.scalar(select(Connector).where(Connector.workspace_id==workspace_id,Connector.provider==provider_id))
    if not row: row=Connector(workspace_id=workspace_id,kind=p['category'],provider=provider_id,config={},scopes=[]); db.add(row)
    safe={k:v for k,v in payload.items() if k.lower() not in {'password','client_secret','access_token','refresh_token','api_key'} }
    secrets_payload={k:v for k,v in payload.items() if k.lower() in {'password','client_secret','access_token','refresh_token','api_key'}}
    row.config={**safe,**{k:encrypt(str(v)) for k,v in secrets_payload.items()}}; row.status='CONNECTED'; row.scopes=p.get('scopes',[]); row.connected_at=now(); db.commit(); return {'status':'CONNECTED','provider':provider_id}

@app.delete('/workspaces/{workspace_id}/connectors/{provider_id}')
def disconnect_provider(workspace_id:int,provider_id:str,db:Session=Depends(get_db)):
    row=db.scalar(select(Connector).where(Connector.workspace_id==workspace_id,Connector.provider==provider_id))
    if not row: return {'status':'DISCONNECTED'}
    row.status='DISCONNECTED'; row.config={}; row.scopes=[]; row.connected_at=None; db.commit(); return {'status':'DISCONNECTED','provider':provider_id}

@app.post('/workspaces/{workspace_id}/jobs')
def create_job(workspace_id:int,type:str,db:Session=Depends(get_db)):
    obj=Job(workspace_id=workspace_id,type=type); db.add(obj); db.commit(); db.refresh(obj); return {'id':obj.id,'status':obj.status}

@app.get('/docs/operating-model')
def operating_model():
    return {'loop':['discover','detect_intent','enrich','verify','deduplicate','suppress_check','score','personalize','contact','handle_reply_or_call','qualify','book','stop_outreach'],'rules':['Never guess email or phone numbers','Use legitimate/approved data sources','Respect opt-outs and DNC','Do not bypass authentication or platform restrictions','Disclose AI identity when required/asked','Do not fabricate evidence, pricing, clients, or outcomes']}
