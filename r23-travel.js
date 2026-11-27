// R23: public region entrances, discovered checkpoints, and light ambient encounters.
function r23LoadUIImages(){
 const properties={panel:'--r22-panel',button:'--r22-button',sheet:'--r22-sheet','world-map':'--r23-world-map'};
 for(const [name,property] of Object.entries(properties)){
  const el=$('kira-ui-'+name);if(!el||el.dataset.loaded)continue;
  try{
   const raw=atob(el.textContent.trim()),bytes=new Uint8Array(raw.length);
   for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
   document.documentElement.style.setProperty(property,`url("${url}")`);
   el.dataset.loaded='1';el.textContent='';
  }catch(error){console.error('UI image load failed',name,error);}
 }
}
r23LoadUIImages();
const R23_REGIONS=R20_REGIONS.map((r,i)=>({...r,root:r.areas[0][0],point:[[52,49],[39,24],[28,49],[43,74],[15,23],[18,79],[80,44],[73,77]][i]}));
const R23_AREA_IDS=new Set(R23_REGIONS.flatMap(r=>r.areas.map(a=>a[0])));
const R23_ENTRANCES=new Set(R23_REGIONS.map(r=>r.root));
function r23TravelState(s=core){
 const flags=life(s).flags,t=flags.travel??(flags.travel={version:1,seen:{workshop:true}});
 // Import only evidence of actual presence, never story unlocks or a region flag.
 for(const id of s.visited??[])if(typeof id==='string'&&R23_AREA_IDS.has(id))t.seen[id]=true;
 for(const e of flags.personal?.actions??[])if(e.kind==='visit'&&R23_AREA_IDS.has(e.area))t.seen[e.area]=true;
 for(const key of Object.keys(life(s).nodes??{})){const a=key.split(':'),id=a[0]==='r12'?a[1]:a[0];if(R23_AREA_IDS.has(id))t.seen[id]=true;}
 return t;
}
function r23RecordArrival(){const id=areaID();if(R23_AREA_IDS.has(id))r23TravelState().seen[id]=true;}
function r23CanTravel(id,s=core){return R23_ENTRANCES.has(id)||R23_AREA_IDS.has(id)&&r23TravelState(s).seen[id]===true;}
const r23Place=corePlace;
corePlace=async function(loc){await r23Place(loc);r23RecordArrival();};
const r23Restore=coreRestore;
coreRestore=async function(p){await r23Restore(p);r23RecordArrival();};
const r23Switch=switchField;
switchField=async function(link){const from=areaID();await r23Switch(link);if(areaID()!==from)r23RecordArrival();};
const r23TravelBase=r20Travel;
r20Travel=async function(id){
 if(!r23CanTravel(id)){coreToast('입구에서 직접 탐험해 도착한 뒤 빠른 이동할 수 있습니다.');return;}
 await r23TravelBase(id);
};
let r23Selected='workshop';
worldRender=function(selected){
 if(!lifeOpen('worldmap','세계지도'))return;
 const current=R23_REGIONS.find(r=>r.areas.some(a=>a[0]===areaID()))??R23_REGIONS[0];
 const region=R23_REGIONS.find(r=>r.root===selected)??current;r23Selected=region.root;
 const seen=r23TravelState().seen,checkpoints=region.areas.filter(([id])=>id!==region.root&&seen[id]);
 const nodes=R23_REGIONS.map(r=>`<button class="r23-map-node ${r.root===region.root?'selected':''} ${r.root===current.root?'current':''}" style="left:${r.point[0]}%;top:${r.point[1]}%" data-act="r23Region:${r.root}" aria-label="${htmlSafe(r.name)}" aria-pressed="${r.root===region.root}"><span class="r23-node-ring"></span><b>${htmlSafe(r.name)}</b></button>`).join('');
 const fast=checkpoints.length?`<section class="r23-checkpoints"><h3>방문한 곳</h3><select id="r23-checkpoint" aria-label="빠른 이동 지점">${checkpoints.map(([id,name])=>`<option value="${id}">${htmlSafe(name)}</option>`).join('')}</select>${lifeBtn('빠른 이동','r23Fast')}</section>`:'';
 const enter=region.root==='workshop'?'':lifeBtn('입구로 이동','r20Travel:'+region.root);
 const home=areaID()==='workshop'?'':lifeBtn('공방으로 돌아가기','r20Travel:workshop',false,'class="r23-return"');
 lifeHTML(`<div class="r23-world"><div class="r23-map" role="group" aria-label="지역과 길이 그려진 세계지도">${nodes}</div><aside class="r23-map-details"><h2>${htmlSafe(region.name)}</h2><p>${htmlSafe(region.desc)}</p>${enter}${fast}${home}<p class="r23-map-note">안쪽 지역은 직접 거쳐서 탐험합니다.<br>도착한 곳만 빠른 이동에 등록됩니다.</p></aside></div>`);
};
const r23Action=lifeAction;
lifeAction=function(a,k){
 if(a==='r23Region')return worldRender(k);
 if(a==='r23Fast'){const id=$('r23-checkpoint')?.value;if(id&&r23CanTravel(id))return r20Travel(id);return;}
 return r23Action(a,k);
};

// Counts are for a whole field, not per room or per resource cluster.
const R23_AMBIENT={
 outer:{count:3,cid:'C01',hp:40,atk:7,def:4},
 hunt:{count:4,cid:'C02',hp:45,atk:8,def:5},
 shadePath:{count:3,cid:'C05',hp:55,atk:10,def:6},
 shadeHunt:{count:4,cid:'C04',hp:65,atk:12,def:8},
 shadeDepth:{count:3,cid:'C05',hp:65,atk:12,def:8},
 river:{count:2,cid:'C01',hp:35,atk:6,def:3},
 lake:{count:2,cid:'C05',hp:50,atk:9,def:5},
 g01:{count:3,cid:'C03',hp:45,atk:9,def:6},
 g02:{count:3,cid:'C05',hp:60,atk:11,def:7},
 g03:{count:3,cid:'C07',hp:80,atk:14,def:10}
};
for(const [id,c] of Object.entries(R23_AMBIENT))battleFloors[id]=[c.cid];
const r23Prepare=battlePrepare;
battlePrepare=async function(f){
 await r23Prepare(f);const c=R23_AMBIENT[f.id];if(!c||f.r23AmbientReady)return;
 await battleInitClips();
 const links=trailLinks[f.id]??[],safe=links.map(spawnFromLink);
 const points=[...f.navigation.values()].filter(p=>!blocked(p.x,p.z,.45,f)&&safe.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>7)&&links.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>7)&&(f.lifeNodes??[]).every(n=>Math.hypot(p.x-n.x,p.z-n.z)>1.7)).sort((a,b)=>lifeHash(f.id+':ambient:'+a.x+':'+a.z)-lifeHash(f.id+':ambient:'+b.x+':'+b.z));
 const chosen=[];f.enemies??=[];
 for(const p of points){
  if(chosen.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<10))continue;
  // Use the original actor constructor so minor field mobs do not roll elite affixes.
  const e=await r13BA(c.cid,p,f,String(chosen.length));
  e.type={...e.type,hp:c.hp,atk:c.atk,def:c.def,range:1.35,wind:.85,speed:1.65};e.hp=c.hp;e.speed=1.65;e.r23Ambient=true;e.r23Aggro=false;e.r23Patrol=5+chosen.length*2;
  f.enemies.push(e);chosen.push(p);if(chosen.length>=c.count)break;
 }
 f.r23AmbientReady=true;battleRestoreField(f);
};
const r23EnemyTurn=ruinEnemyTurn;
ruinEnemyTurn=function(f,e,dt,slots){
 if(!e.r23Ambient||e.hp<=0||e.mode==='dead')return r23EnemyTurn(f,e,dt,slots);
 const d=distanceFromHero(e),fromHome=Math.hypot(player.x-e.home.x,player.z-e.home.z);
 if(e.r23Aggro&&(d>9||fromHome>8)){
  e.r23Aggro=false;e.mode='free';e.warning.visible=false;e.steps=route(e,e.home,f);e.r23Returning=true;
 }
 if(!e.r23Aggro&&!e.r23Returning&&d<4.5&&direct(e,player,.1,f)&&!f.enemies.some(a=>a!==e&&a.r23Aggro&&a.hp>0))e.r23Aggro=true;
 if(e.r23Aggro)return r23EnemyTurn(f,e,dt,Math.min(1,slots));
 if(e.mode==='stagger'){e.clock-=dt;e.mixer.update(dt);if(e.clock<=0)e.mode='free';return;}
 e.r23Patrol-=dt;
 if(!e.steps.length){
  if(e.r23Returning){e.r23Returning=false;e.r23Patrol=5;}
  if(e.r23Patrol<=0){const angle=lifeHash(f.id+e.key+':'+Math.floor(battleClock/10))*Math.PI*2,p={x:e.home.x+Math.cos(angle)*1.2,z:e.home.z+Math.sin(angle)*1.2};if(!blocked(p.x,p.z,.3,f))e.steps=route(e,p,f);e.r23Patrol=8+lifeHash(e.key)*5;}
 }
 const moving=moveActor(e,dt);display(e);animateActor(e,moving,dt);
};
const r23Hit=hitRuinEnemy;
hitRuinEnemy=function(e,amount){r23Hit(e,amount);if(e.r23Ambient&&e.hp>0){e.r23Aggro=true;e.r23Returning=false;}};
const r23ResetEnemy=battleResetEnemy;
battleResetEnemy=function(e,hp){r23ResetEnemy(e,hp);if(e.r23Ambient){e.r23Aggro=false;e.r23Returning=false;e.r23Patrol=5;}};
const r23Display=display;
display=function(a){r23Display(a);if(a.r23Ambient&&activeField)a.group.position.y=areaHeight(a.x,a.z);};
const r23Warn=ruinWarn;
ruinWarn=function(e){r23Warn(e);if(e.r23Ambient)e.warning.position.y=areaHeight(e.x,e.z)+.052;};
const r23Flash=battleFlash;
battleFlash=function(x,z,y,...rest){return r23Flash(x,z,y+(activeField?.r23AmbientReady?areaHeight(x,z):0),...rest);};
const r23Entry=ruinEntry;
ruinEntry=function(from,to){
 r23Entry(from,to);battleResetTransient();
 Object.assign(ruinCombat,{move:null,target:null,queued:false,chain:0,chainTime:0,hurt:0});
 if(ruinSword)ruinSword.visible=!!ruinActive();
};
const r23Sync=r20SyncUI;
const r23FieldMap=document.createElement('button');
r23FieldMap.id='r23-field-map';r23FieldMap.hidden=true;r23FieldMap.innerHTML=r22Icon('map');
r23FieldMap.setAttribute('aria-label','세계지도');r23FieldMap.title='세계지도';
r23FieldMap.onclick=()=>worldRender();document.body.append(r23FieldMap);
r20SyncUI=function(){
 r23Sync();
 r23FieldMap.hidden=!ready||!activeField||coreModal||coreBusy||!!transitionTimer||!!lifeAnimation;
 r23FieldMap.disabled=coreCombat();r23FieldMap.title=r23FieldMap.disabled?'전투가 끝나면 세계지도를 열 수 있습니다.':'세계지도';
 if(activeField?.r23AmbientReady){const fight=coreCombat();document.body.dataset.r20Combat=fight?'yes':'no';if(!fight)actionBar.hidden=true;}
 if(ruinSword)ruinSword.visible=!!ruinActive()&&!lifeAnimation&&!coreBusy;
};
const r23Snapshot=coreSnapshot;
coreSnapshot=function(){r23RecordArrival();const p=r23Snapshot();p.contentVersion='R23_2_UI_ART';return p;};
const r23Validate=validateLife;
validateLife=function(s){
 r23Validate(s);const t=s.life?.flags?.travel;
 if(t&&(t.version!==1||!t.seen||Object.entries(t.seen).some(([id,v])=>!R23_AREA_IDS.has(id)||v!==true)))throw Error('탐험 기록이 올바르지 않습니다.');
};
