// Source for the R20 block embedded in index.html. Run build-r20.cjs after editing.
const R20_SPOTS={bed:{x:4.25,z:-3.0},chair:{x:3.6,z:.6},craft:{x:-4.6,z:-2.6},storage:{x:-4.7,z:2.3}};
function r20RegisterRooms(){
 for(const [id,spec] of Object.entries(portalSpecs)){
  const data=id==='workshop'?{...spec,w:12,d:10}:spec;
  portals.set(id,{...data,id,point:new T.Vector3(),direction:new T.Vector3(0,0,1),bounds:{minX:-data.w/2+.29,maxX:data.w/2-.29,minZ:-data.d/2+.29,maxZ:data.d/2-.23},blockers:[],unit:.31});
 }
}
furnishWorkshop=async function(r){
 shell(r,['#d5c7b1','#645143','#888075',['#a78360','#ae8b65','#a47e59','#b08c67']]);
 windowAt(r.group,-5.86,1.9,-2,Math.PI/2);windowAt(r.group,1.3,1.9,-4.86);
 rug(r.group,'#667263',4.6,4,0,.4);hearth(r,2,-4.45);
 const bench=await setProp(r,'room-workbench',R20_SPOTS.craft.x,R20_SPOTS.craft.z,{height:1,turn:Math.PI/2,solid:true});
 const shelf=await setProp(r,'room-shelf',R20_SPOTS.storage.x,R20_SPOTS.storage.z,{height:2,turn:Math.PI/2,solid:true});
 const table=await setProp(r,'room-table',3.6,-.45,{height:.8,shape:[.65,1,.7],solid:true});
 await Promise.all([
  setProp(r,'room-bed',R20_SPOTS.bed.x,R20_SPOTS.bed.z,{depth:2.1,solid:true}),
  setProp(r,'room-stool',R20_SPOTS.chair.x,R20_SPOTS.chair.z,{height:.48,solid:true}),
  setProp(r,'room-cauldron',-3,-3.9,{height:.85,solid:true}),
  setProp(r,'room-journal',-4.6,-2.6,{width:.45,y:bench.y}),
  setProp(r,'room-bottles',-4.5,-2.95,{width:.38,y:bench.y}),
  setProp(r,'room-vial',-4.6,2.3,{height:.23,y:shelf.y*.7}),
  setProp(r,'mug',3.6,-.45,{height:.18,y:table.y}),
  setProp(r,'basket',-5,3.9,{height:.65,solid:true}),
  setProp(r,'lantern',-1.8,-4.7,{height:.55,y:1.5}),
  setProp(r,'lantern',4.5,-4.7,{height:.55,y:1.5})
 ]);
};
const r20Distance=p=>Math.hypot(player.x-p.x,player.z-p.z);
coreAtBed=()=>activeRoom?.id==='workshop'&&r20Distance(R20_SPOTS.bed)<1.65;
wsAtBench=()=>activeRoom?.id==='workshop'&&r20Distance(R20_SPOTS.craft)<2.1;
const r20Recover=coreRecover;
coreRecover=function(){if(activeRoom?.id==='workshop'&&r20Distance(R20_SPOTS.chair)<1.5)r20Recover();};
lifeFieldAllowed=()=>true;
worldVisible=()=>true;
worldRegions[0].name='키라의 공방';
trailLabel.village='공방';

// Existing town/office saves resume at the expanded workshop; field saves stay put.
const r20PlaceBase=corePlace;
corePlace=async function(loc){
 if(loc.id==='village'||portals.has(loc.id)&&loc.id!=='workshop')loc={id:'workshop',x:0,z:3.8,heading:Math.PI};
 await r20PlaceBase(loc);r20Visitors(0);r20SyncUI();
};
changeRoom=function(room){if(!room)return worldRender();return r20Travel('workshop');};
const r20Switch=switchField;
switchField=async function(link){if(link?.to==='village')return r20Travel('workshop');return r20Switch(link);};
battleReturn=function(){
 if(coreBusy)return;coreBusy=true;r08Defeat=true;coreStop();
 return corePlace({id:'workshop',x:0,z:3.8,heading:Math.PI}).then(()=>{battleState().hire=null;coreToast('공방으로 돌아왔습니다.');}).catch(console.error).finally(()=>{r08Defeat=false;coreBusy=false;coreAutoSave();});
};
setDoorButton=function(){roomButton.hidden=true;};

const R20_REGIONS=[
 {name:'공방',color:'#c4b281',desc:'제작 · 보관 · 휴식 · 방문객',areas:[['workshop','키라의 공방']]},
 {name:'바람숲',color:'#8dbb8c',desc:'가지 · 약초 · 원목 · 버섯',areas:[['outer','외곽'],['hunt','사냥터']]},
 {name:'햇살 농지',color:'#d3c280',desc:'재배 · 수확 · 들풀',areas:[['farm','농지']]},
 {name:'은물내',color:'#90c7cb',desc:'샘물 · 점토 · 모래 · 낚시',areas:[['river','강가']]},
 {name:'그늘숲',color:'#8aa88b',desc:'더 높은 채집 숙련과 도구가 필요한 자원',areas:[['shadePath','숲길'],['shadeHunt','사냥터'],['shadeDepth','깊은 숲']]},
 {name:'달그림자 호수',color:'#91abc7',desc:'수생 자원 · 낚시',areas:[['lake','호수']]},
 {name:'돌빛 광산',color:'#bcb4ac',desc:'상층에서 심층으로 갈수록 단단한 광맥',areas:[['g01','상층'],['g02','중층'],['g03','심층']]},
 {name:'옛길 던전',color:'#c0a3af',desc:'위험 지역 · 아래층일수록 강한 적',areas:[['dungeon','1층'],...Array.from({length:11},(_,i)=>['b'+String(i+2).padStart(2,'0'),(i+2)+'층'])]}
];
worldRender=function(){
 if(!lifeOpen('worldmap','세계지도'))return;
 lifeHTML('<div class="r20-map">'+R20_REGIONS.map(r=>`<section class="r20-region" style="border-top:3px solid ${r.color}"><h2>${r.name}</h2><p>${r.desc}</p><div class="r20-places">${r.areas.map(([id,name])=>lifeBtn(name,'r20Travel:'+id,false,`class="${areaID()===id?'here':''}"`)).join('')}</div></section>`).join('')+'</div>');
};
async function r20Travel(id){
 if(coreBusy||transitionTimer||lifeAnimation||!R20_REGIONS.some(r=>r.areas.some(a=>a[0]===id)))return;
 if(areaID()===id){lifeClose();return;}
 coreStop();coreBusy=true;passage.dataset.active='yes';
 try{
  let loc={id,x:0,z:3.8,heading:Math.PI};
  if(id!=='workshop'){
   const f=await getField(id).then(lifePrepareField);
   const entrance=trailLinks[id]?.find(l=>l.to==='village')??trailLinks[id]?.[0];
   const aim=entrance?spawnFromLink(entrance):{x:0,z:0};
   const p=[...f.navigation.values()].filter(p=>!blocked(p.x,p.z,.3,f)).sort((a,b)=>Math.hypot(a.x-aim.x,a.z-aim.z)-Math.hypot(b.x-aim.x,b.z-aim.z))[0];
   if(!p)throw Error('도착 지점을 찾을 수 없습니다.');
   loc={id,x:p.x,z:p.z,heading:entrance?Math.atan2(-entrance.dx,-entrance.dz):0};
  }
  await corePlace(loc);worldState().seen[worldRegion(id)]=true;worldState().target=null;
  lifeClose();lifeFieldVisit();
 }catch(e){console.error(e);coreToast(e.message||'이동하지 못했습니다.');}
 finally{passage.dataset.active='no';coreBusy=false;coreRender(true);r20SyncUI();coreAutoSave();}
}

// Guests arrive on a schedule, without interrupting the player's work.
let r20GuestStamp='',r20Guests=[];
function r20VisitorIds(){
 const h=core.minute/60%24;if(h<8||h>=22)return [];
 const l=life(),ids=[];
 const push=n=>{if(n>0&&npc[n-1]&&!ids.includes(n))ids.push(n);};
 if(!l.started||mainCheck(l.main))push(mainNPC[l.main]);
 for(const o of l.orders)push(npc.find(n=>npcName(n.id)===o.npc)?.id);
 for(const id of Object.keys(personalState().active))if(personalReady(id))push(+id.slice(1,3));
 const merchants=[3,4,5,7,10,11,12];push(merchants[(core.day+Math.floor(h/3))%merchants.length]);
 push(1+((core.day*3+Math.floor(h/2))%npc.length));
 return ids.slice(0,4);
}
function r20Visitors(dt){
 if(!ready&&!activeRoom)return;
 for(const n of npc)n.group.visible=false;
 r08Guests=[];if(activeRoom?.id!=='workshop')return;
 const ids=r20VisitorIds(),stamp=core.day+':'+Math.floor(core.minute/120)+':'+ids.join(',');
 if(stamp!==r20GuestStamp){
  r20GuestStamp=stamp;
  const room=activeRoom,used=[];
  const points=[...room.navigation.values()].filter(p=>p.z>1&&p.z<3.6&&p.x>-2.8&&p.x<2.8&&!blocked(p.x,p.z,.4,room)).sort((a,b)=>Math.hypot(a.x,a.z-2)-Math.hypot(b.x,b.z-2));
  r20Guests=ids.map(id=>{const p=points.find(p=>used.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>1.3));if(!p)return null;used.push(p);return {n:id,x:p.x,z:p.z,group:npc[id-1].group};}).filter(Boolean);
 }
 r08Guests=r20Guests;
 for(const g of r20Guests){const n=npc[g.n-1];n.x=g.x;n.z=g.z;n.group.visible=true;n.group.position.set(g.x,0,g.z);n.group.rotation.y=Math.PI;n.mixer.update(dt);}
}
npcStepSchedule=r20Visitors;
npcScheduleRoom=n=>r20VisitorIds().includes(n)?'workshop':null;
const r20OriginalNPC=npcInteract;
function r20GuestPanel(n){
 lifeNPC=n;if(!lifeOpen('visitor',npcName(n)))return;
 const hasStory=mainNPC[life().main]===n;
 lifeHTML(`<div class="r20-menu">${lifeBtn(' 의뢰','orders')}${stockFor(npcName(n)).length?lifeBtn('거래','shop'):''}${lifeBtn(hasStory?'이야기 듣기':'대화','r20Talk:'+n)}${lifeBtn('헤어지기','close')}</div>`);
}
npcInteract=function(n){if(activeRoom?.id==='workshop')return r20GuestPanel(n);return r20OriginalNPC(n);};
// Orders are independent contracts. The list is sorted by material/recipe tier.
openOrders=function(name){const l=life();return ORDER_DATA.filter(o=>o.npc===name&&!l.orders.some(a=>a.id===o.id)&&!l.orderHistory.some(a=>a.id===o.id&&a.day===core.day)).sort((a,b)=>ITEM_DATA[a.item].t-ITEM_DATA[b.item].t||a.q-b.q).slice(0,4).map(r13Cond);};
acceptOrder=function(id,name){const l=life(),o=openOrders(name).find(o=>o.id===id);if(!o||l.orders.length>=12)return false;l.orders.push({...o,accept:core.day,due:core.day+6});return true;};
renderOrders=function(n){
 lifeNPC=n;const name=npcName(n);if(!lifeOpen('orders',name+' · 의뢰'))return;
 const active=life().orders.filter(o=>o.npc===name),offered=openOrders(name);
 const row=(o,accepted)=>`<article class="r20-order"><div><b>${htmlSafe(ITEM_DATA[o.item].name)} ×${o.n}</b><small>Q${o.q}${htmlSafe(r13Txt(o))} · ${orderReward(o,[{q:o.q,n:o.n}])} G${accepted?' · '+Math.max(0,o.due-core.day+1)+'일 남음':''}</small></div>${accepted?lifeBtn('납품','deliver:'+o.id,r13Have(o)<o.n):lifeBtn('수락','accept:'+o.id,life().orders.length>=12)}</article>`;
 lifeHTML(active.map(o=>row(o,true)).join('')+offered.map(o=>row(o,false)).join('')||'<p class="r20-meta">오늘 맡길 의뢰는 없습니다.</p>');
};
renderJournal=function(){
 if(!lifeOpen('journal','의뢰 목록'))return;
 const orders=[...life().orders].sort((a,b)=>ITEM_DATA[a.item].t-ITEM_DATA[b.item].t||a.q-b.q);
 const personal=Object.keys(personalState().active).map(id=>`<article class="r20-order"><div><b>${htmlSafe(PERSONAL_DATA[id].title)}</b><small>${htmlSafe(personalTaskText(id))}</small></div></article>`).join('');
 const contracts=orders.map(o=>`<article class="r20-order"><div><b>${htmlSafe(ITEM_DATA[o.item].name)} ×${o.n}</b><small>${htmlSafe(o.npc)} · Q${o.q}${htmlSafe(r13Txt(o))} · ${Math.max(0,o.due-core.day+1)}일 남음</small></div><span>${r13Have(o)}/${o.n}</span>${activeRoom?.id==='workshop'?lifeBtn('납품','r20Deliver:'+o.id,r13Have(o)<o.n):''}</article>`).join('');
 lifeHTML(contracts+personal||'<p class="r20-meta">받아 둔 의뢰가 없습니다.</p>');
};

// Keep the player-facing HUD independent from the old overlapping button updates.
const r20OpenBase=lifeOpen;
lifeOpen=function(view,title){
 if(coreCombat()&&['menu','bag','equipment','journal'].includes(view)){
  if(coreBusy||transitionTimer||lifeAnimation)return false;
  coreStop();coreModal=true;lifeView=view;lifeTitle.textContent=title;lifeWindow.hidden=false;corePanel.hidden=true;return true;
 }
 return r20OpenBase(view,title);
};
function r20Menu(){
 if(!lifeOpen('menu','메뉴'))return;
 lifeHTML(`<p class="r20-meta">${coreDate().text} · ${core.gold.toLocaleString('ko-KR')} G</p><div class="r20-menu">${lifeBtn('가방','bag')}${lifeBtn('장비','equipment')}${lifeBtn('의뢰','r20Journal')}${lifeBtn('세계지도','r20Map',coreCombat())}${lifeBtn('상태 · 저장','r20Status',coreCombat())}${lifeBtn('화면 확대','r20Full')}${life().flags.slime||life().main>8?lifeBtn('뿌뿌','pet'):''}</div>`);
}
$('kira-menu').onclick=r20Menu;
const r20LifeNearby=lifeNearby;
lifeNearby=function(){
 if(activeRoom?.id==='workshop'){
  const options=[];
  const add=(type,label,p,range)=>{const d=r20Distance(p);if(d<range)options.push({type,label,d});};
  add('r20sleep','잠자기',R20_SPOTS.bed,1.65);add('r20rest','휴식',R20_SPOTS.chair,1.5);
  add('craft','제작',R20_SPOTS.craft,2.1);add('r20storage','창고',R20_SPOTS.storage,1.75);
  add('r20exit','밖으로',{x:0,z:activeRoom.d/2-.45},1.45);
  for(const g of r20Guests){const d=r20Distance(g);if(d<1.7)options.push({type:'npc',n:g.n,label:'대화',d});}
  return options.sort((a,b)=>a.d-b.d)[0]??null;
 }
 const base=r20LifeNearby();
 const f=ruinActive(),loot=f&&(battleState().loot[f.id]??[]).filter(x=>distanceFromHero(x)<1.8&&direct(player,x,.06,f)).sort((a,b)=>distanceFromHero(a)-distanceFromHero(b))[0];
 if(loot&&(!base||distanceFromHero(loot)<base.d))return {type:'r20loot',label:'줍기',d:distanceFromHero(loot)};
 return base;
};
const r20Interact=lifeInteract;
lifeInteract=function(o){
 if(!o||coreModal||coreBusy||transitionTimer||lifeAnimation)return;
 if(o.type==='r20sleep')return coreSleep();
 if(o.type==='r20rest')return coreRecover();
 if(o.type==='r20storage')return renderBag('storage');
 if(o.type==='r20exit')return worldRender();
 if(o.type==='r20loot'){if(!battleCollect(ruinActive()))coreToast('가방이 가득 찼습니다.');return;}
 return r20Interact(o);
};
lifeButton.onclick=()=>lifeInteract(lifeNearby());
function r20SyncUI(){
 if(!ready)return;
 const fighting=!!ruinActive(),blockedUI=coreModal||coreBusy||!!transitionTimer||!!lifeAnimation;
 const near=blockedUI||coreCombat()?null:lifeNearby();
 const labels={node:'줍기',fish:'낚시',plot:'경작',hunt:'사냥',npc:'대화',story:'살펴보기'};
 lifeButton.hidden=!near;
 if(near){lifeButton.textContent=labels[near.type]??near.label;lifeButton.disabled=near.type==='r20rest'&&core.rest>=2;}
 actionBar.hidden=!fighting||blockedUI||!!near;attackKey.hidden=false;dodgeKey.hidden=false;
 attackKey.textContent='공격';dodgeKey.textContent='회피';
 $('kira-menu').hidden=coreBusy||!!transitionTimer;$('kira-menu').disabled=coreBusy||!!transitionTimer;$('kira-menu').textContent='메뉴';
 document.body.dataset.r20Combat=fighting?'yes':'no';
 for(const el of [roomButton,lifeTask,worldBtn,r12Cargo,r12TargetLabel,r12Alternate,pickKey,petKey,guardKey,potionKey,shortcutKey,r13SwapKey,...battleSpellKeys])el.hidden=true;
}
const r20Draw=draw;draw=function(){r20Draw();r20SyncUI();};
const r20CoreRender=coreRender;coreRender=function(force){r20CoreRender(force);r20SyncUI();};
// A single short pickup line, with no confirmation or extra panel.
r12Flyup=function(n,text){
 const p=new T.Vector3(n.x,areaHeight(n.x,n.z)+1,n.z).project(camera);
 if(p.z>1||p.z<-1)return;
 const el=document.createElement('div');el.className='r20-pickup';el.textContent=text;
 el.style.left=(p.x*.5+.5)*innerWidth+'px';el.style.top=(-p.y*.5+.5)*innerHeight+'px';
 document.body.append(el);setTimeout(()=>el.remove(),1100);
};
const r20Collect=battleCollect;
battleCollect=function(f,auto=false){
 if(!f)return 0;
 const toasts=coreToast;coreToast=msg=>{if(/ \+\d/.test(msg))r12Flyup(player,msg.replace(/^뿌뿌 · /,''));else toasts(msg);};
 try{return r20Collect(f,auto);}finally{coreToast=toasts;}
};

// Wider sword strikes; the enchantment is released from the blade on the finisher.
const r20SlashFX=[];
function r20Slash(a){
 const w=core.equipment.weapon,element=R13EL[w?.enchant],color={fire:'#ff9a51',ice:'#b7eaff',wind:'#a7ffcf',earth:'#edcb85'}[element]??'#fff3ca';
 const radius=a.chain===2||a.heavy?4.2:3.3,arc=a.chain===2?Math.PI*1.7:Math.PI*1.25;
 const mesh=new T.Mesh(new T.RingGeometry(radius-.6,radius,42,1,-arc/2,arc),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));
 mesh.rotation.x=-Math.PI/2;mesh.rotation.z=Math.PI/2-player.heading;mesh.position.set(player.x,areaHeight(player.x,player.z)+.7,player.z);scene.add(mesh);r20SlashFX.push({mesh,t:.22,max:.22});
}
function r20SwordMagic(a,hits){
 const w=core.equipment.weapon,el=R13EL[w?.enchant];if(!el||a.chain!==2&&!a.heavy)return;
 const lv=battleEnLevel(w),cost=3+lv*2;if(core.mp<cost)return;
 core.mp-=cost;const f=ruinActive();if(!f)return;
 const range=(el==='wind'?6:4)+lv*.7,color={fire:'#ff9147',ice:'#b7eaff',wind:'#a7ffcf',earth:'#edcb85'}[el];
 for(const e of f.enemies.filter(e=>e.hp>0&&distanceFromHero(e)<range&&direct(player,e,.06,f))){
  const dot=Math.cos(Math.atan2(e.x-player.x,e.z-player.z)-player.heading);if(el!=='earth'&&dot<-.15)continue;
  battleDamage(e,battleFormula(e,[.9,1.5,2.2][lv-1],'magic',el),'magic');
  if(e.hp>0&&BATTLE_DATA[e.cid]?.rank==='normal'&&(el==='ice'||el==='earth')){e.mode='stagger';e.clock=el==='ice'?.65:.35;}
  battleFlash(e.x,e.z,.8,color,.22,.8+lv*.2);
 }
 battleFlash(player.x,player.z,.7,color,.3,range*.7);
}
let r20AttackHeld=false,r20AttackPointer=null;
function r20EndAttack(){r20AttackHeld=false;r20AttackPointer=null;}
attackKey.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();attackKey.setPointerCapture?.(e.pointerId);r20AttackHeld=true;r20AttackPointer=e.pointerId;ruinAttack();};
attackKey.onpointerup=r20EndAttack;attackKey.onpointercancel=r20EndAttack;attackKey.onlostpointercapture=r20EndAttack;
window.addEventListener('blur',r20EndAttack);
const r20BattleTick=battleTick;
battleTick=function(dt){
 r20BattleTick(dt);
 for(let i=r20SlashFX.length-1;i>=0;i--){const a=r20SlashFX[i];a.t-=dt;if(a.t<=0){a.mesh.removeFromParent();a.mesh.geometry.dispose();a.mesh.material.dispose();r20SlashFX.splice(i,1);}else{a.mesh.material.opacity=.7*a.t/a.max;a.mesh.scale.setScalar(1+(1-a.t/a.max)*.12);}}
 if(coreModal||coreBusy||transitionTimer||!ruinActive()){r20EndAttack();return;}
 if(r20AttackHeld)ruinAttack();
};
// Existing first-floor enemy IDs stay in the same slots; extra pack IDs use the
// regular battle save records, while the legacy dungeon snapshot keeps 12 slots.
const r20PrepareBattle=battlePrepare;
battlePrepare=async function(f){
 await r20PrepareBattle(f);if(f.id!=='dungeon'||f.r20Packs)return;
 const points=[...f.navigation.values()].filter(p=>p.z<17&&!blocked(p.x,p.z,.45,f)&&!(trailLinks[f.id]??[]).some(l=>Math.hypot(p.x-l.x,p.z-l.z)<6));
 const used=[],extra=[];
 for(const p of points.sort((a,b)=>lifeHash(f.id+a.x+':'+a.z)-lifeHash(f.id+b.x+':'+b.z))){
  if(used.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<3))continue;
  const cid=['C01','C02','C03','C05'][used.length%4];
  extra.push(await battleActor(cid,p,f,String(f.enemies.length+extra.length)));used.push(p);if(used.length>=24)break;
 }
 f.enemies.push(...extra);f.r20Packs=true;battleRestoreField(f);
};
// Enemies follow reachable paths instead of waiting for the player at their home.
const r20EnemyTurn=ruinEnemyTurn;
ruinEnemyTurn=function(f,e,dt,slots){
 if(e.hp>0&&e.group.visible&&e.mode!=='strike'&&e.mode!=='stagger'&&ruinCombat.hp>0&&distanceFromHero(e)<30&&!direct(e,player,.2,f)){
  e.r20PathAt=(e.r20PathAt??0)-dt;
  if(e.r20PathAt<=0){e.steps=route(e,player,f);e.r20PathAt=.8+lifeHash(e.key)*.4;}
  const moving=moveActor(e,dt);display(e);animateActor(e,moving,dt);return;
 }
 return r20EnemyTurn(f,e,dt,slots);
};

// Code-drawn item symbols replace the bitmap UI; original character art is untouched.
kimg=function(k,c=''){
 const i=ITEM_DATA[k],type=i?i.cat:k;
 const paths=/무기|attack|s_weapon/.test(type)?'<path d="M7 25 25 7m-5 1 5-1-1 5M5 22l5 5m-3-3-3 4"/>':/목재|wood|A03/.test(type)?'<path d="m7 22 14-14 5 5-14 14zM18 10l5 5M8 21l5 5"/>':/광물|회수품|mine|A06/.test(type)?'<path d="m6 23 3-13 12-5 7 14-7 8H10zM9 10l9 7 3 10m-3-10 10 2"/>':/약초|식재|gather|farm/.test(type)?'<path d="M9 27C6 12 15 5 26 6c1 13-6 19-15 17M9 27 23 10m-9 12 1-9"/>':/음식|potion|hp|mp/.test(type)?'<path d="M12 5h8m-7 0v7L7 23q-2 5 4 5h10q6 0 4-5l-6-11V5M9 21h14"/>':'<path d="m16 4 12 7v13l-12 6-12-6V11zm-12 7 12 7 12-7M16 18v12"/>';
 return `<svg class="ki ${c}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${i?['#c8d9af','#aad2e1','#b8b7eb','#edc78d','#e5b1c1'][i.t-1]:'#d4dec7'}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${paths}</svg>`;
};

const r20LifeAction=lifeAction;
lifeAction=function(a,k){
 if(a==='r20Travel'){void r20Travel(k);return;}
 if(a==='r20Map')return worldRender();
 if(a==='r20Journal')return renderJournal();
 if(a==='r20Status'){lifeClose();return coreOpen();}
 if(a==='r20Full')return $('full').onclick?.();
 if(a==='r20Talk')return r20OriginalNPC(+k);
 if(a==='r20Deliver'){
  if(activeRoom?.id!=='workshop')return;
  const o=life().orders.find(o=>o.id===k);if(o){const paid=deliverOrder(o.id,o.npc);if(paid){coreToast('납품 +'+paid+' G');coreAutoSave();}}return renderJournal();
 }
 if(a==='pet')return battlePetPanel();
 return r20LifeAction(a,k);
};
