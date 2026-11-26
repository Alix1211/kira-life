// R22: regular contracts come by letter; story/personal visits happen once a day.
function r22BuildMailbox(room){
 const g=new T.Group();g.name='편지함';const p=R20_SPOTS.mail;g.position.set(p.x,0,p.z);room.group.add(g);
 box(g,'#72607e',.16,.8,.16,0,.4,0);box(g,'#584661',.58,.08,.4,0,.04,0);
 box(g,'#a18bb2',.95,.57,.35,0,1.02,0);box(g,'#d2c7df',1.02,.07,.43,0,1.34,0);
 box(g,'#45394d',.65,.045,.035,0,1.13,-.194);box(g,'#f0e7ed',.49,.21,.022,.06,1.14,-.219);
 room.blockers.push({x:p.x,z:p.z,w:1,d:.42,key:'mailbox'});
}
function r22MailState(){const f=life().flags;return f.mailbox??(f.mailbox={version:1,day:0,letters:[],tiers:{}});}
function r22Capability(s=core){
 const result={alchemy:1,craft:1};
 for(const i of Object.values(ITEM_DATA))if(i.inp&&recipeAllowed(i,s)){const skill=R13.skillOf(i);result[skill]=Math.max(result[skill]??1,i.t);}
 return result;
}
function r22EnsureMail(){
 const box=r22MailState();if(box.day===core.day)return box;
 const tiers=r22Capability(),l=life(),active=new Set(l.orders.map(o=>o.id));
 const pool=ORDER_DATA.filter(o=>ITEM_DATA[o.item]?.inp&&!active.has(o.id));
 const ready=pool.filter(o=>recipeAllowed(ITEM_DATA[o.item]));
 const above=pool.filter(o=>{const i=ITEM_DATA[o.item];return !recipeAllowed(i)&&i.t===(tiers[R13.skillOf(i)]??1)+1;});
 const rank=(o,kind)=>lifeHash('mail:'+core.day+':'+kind+':'+o.id);
 const current=ready.sort((a,b)=>{
  const ia=ITEM_DATA[a.item],ib=ITEM_DATA[b.item];
  const da=(tiers[R13.skillOf(ia)]??1)-ia.t,db=(tiers[R13.skillOf(ib)]??1)-ib.t;
  return da-db||rank(a,'current')-rank(b,'current');
 });
 const higher=above.sort((a,b)=>rank(a,'higher')-rank(b,'higher'));
 // A normal day has two achievable and two next-tier letters. Never invent T6.
 let rows=[];
 if(higher.length&&current.length){const n=Math.min(2,higher.length,current.length);rows=[...current.slice(0,n).map(o=>({...r13Cond(o),band:'current'})),...higher.slice(0,n).map(o=>({...r13Cond(o),band:'higher'}))];}
 else if(!higher.length&&Object.values(tiers).every(t=>t>=5))rows=current.slice(0,4).map(o=>({...r13Cond(o),band:'current'}));
 box.day=core.day;box.tiers=tiers;box.letters=rows.map(o=>({...o,status:'new',mailDay:core.day}));
 return box;
}
function r22RenderMail(){
 if(activeRoom?.id!=='workshop'||r20Distance(R20_SPOTS.mail)>=1.35||!lifeOpen('mailbox','편지함'))return;
 const box=r22EnsureMail();
 const section=(band,title)=>{const rows=box.letters.filter(o=>o.band===band);return rows.length?`<section class="r22-letter-group"><h2>${title}</h2>${rows.map(o=>`<article class="r20-order"><span class="r22-item">${kit(o.item)}</span><div><b>${htmlSafe(ITEM_DATA[o.item].name)} ×${o.n}</b><small>${htmlSafe(o.npc)} · T${ITEM_DATA[o.item].t} · Q${o.q}${htmlSafe(r13Txt(o))} · ${orderReward(o,[{q:o.q,n:o.n}])} G</small></div>${lifeBtn(o.status==='accepted'?'받은 의뢰':'편지 읽기','r22Letter:'+o.id,o.status==='accepted')}</article>`).join('')}</section>`:'';};
 lifeHTML(`<p class="r22-mail-note">${coreDate().text} · 오늘 온 편지</p>${section('current','지금 만들 수 있는 의뢰')}${section('higher','한 등급 위의 의뢰')}${box.letters.length?'':'<p>오늘은 새 납품의뢰가 없습니다.</p>'}`);
 coreAutoSave();
}
function r22ReadLetter(id){
 if(lifeView!=='mailbox'&&lifeView!=='letter')return;
 const o=r22EnsureMail().letters.find(o=>o.id===id);if(!o||o.status==='accepted')return;
 lifeView='letter';const i=ITEM_DATA[o.item],skill=R13.skillOf(i),level=R13.tierSkill[i.t-1],pay=orderReward(o,[{q:o.q,n:o.n}]);
 lifeHTML(`<article class="r22-letter"><p>키라에게</p><h2>${htmlSafe(i.name)} ${o.n}개를 부탁합니다.</h2><div class="r22-letter-item">${kit(o.item)}</div><p>품질 ${o.q} 이상${o.trait?' · '+htmlSafe(o.trait)+' 특성':''}<br>보수 ${pay} G · 수락 후 7일</p>${o.band==='higher'?`<p class="r22-challenge">${skill==='craft'?'제작':'연금술'} 숙련 ${level} · T${i.t} 제조법에 도전하는 의뢰</p>`:''}<p>${htmlSafe(o.npc)} 드림</p><div class="life-dialog-footer">${lifeBtn('맡기','r22Accept:'+o.id,life().orders.length>=12)}${lifeBtn('편지함으로','r22Mailbox')}</div></article>`);
}
acceptOrder=function(id,name){
 const o=r22EnsureMail().letters.find(o=>o.id===id&&o.npc===name);
 if(!o)return false;
 if(o.status==='accepted'||life().orders.some(x=>x.id===id)||life().orders.length>=12)return false;
 const {status,band,mailDay,...contract}=o;
 life().orders.push({...contract,accept:core.day,due:core.day+6});o.status='accepted';return true;
};
r20PickVisit=function(){
 const v=r20VisitState(),main=mainNPC[life().main];
 if(v.questDay!==core.day){
  const pending=[];
  if(main&&(!life().started||mainCheck(life().main)))pending.push({id:main,kind:'story'});
  for(const n of npc){
   if(n.id===main)continue;const id=personalID(n.id,personalStage(n.id));
   if(personalState().active[id]?personalReady(id):personalCanStart(n.id))pending.push({id:n.id,kind:'personal'});
  }
  if(pending.length)return pending[core.day%pending.length];
 }
 if(v.tradeDay!==core.day){const merchants=npc.filter(n=>stockFor(npcName(n.id)).length);if(merchants.length)return {id:merchants[core.day%merchants.length].id,kind:'merchant'};}
 return null;
};
const r22Action=lifeAction;
lifeAction=function(a,k){
 if(a==='r22Mailbox')return r22RenderMail();
 if(a==='r22Letter')return r22ReadLetter(k);
 if(a==='r22Accept'){
  if(lifeView!=='letter')return;const o=r22EnsureMail().letters.find(o=>o.id===k);if(!o)return;
  if(!acceptOrder(o.id,o.npc)){coreToast('이미 받은 의뢰이거나 목록이 가득 찼습니다.');return;}
  coreToast('의뢰 목록에 넣었습니다.');lifeView='mailbox';r22RenderMail();lifeClose();coreAutoSave();return;
 }
 return r22Action(a,k);
};
// One eight-icon atlas. Item artwork continues to use the original item icons.
const R22_UI_ICONS={menu:0,map:1,mail:2,bag:3,quest:4,equipment:5,status:6,close:7};
function r22Icon(name){return `<span class="r22-icon r22-icon-${name}" aria-hidden="true"></span>`;}
r20Menu=function(){
 if(!lifeOpen('menu','메뉴'))return;
 const tile=(icon,label,act,disabled=false)=>lifeBtn(label,act,disabled,`class="r22-tile" data-r22-icon="${icon}"`);
 lifeHTML(`<p class="r20-meta">${coreDate().text} · ${core.gold.toLocaleString('ko-KR')} G</p><div class="r20-menu r22-icon-menu">${tile('bag','가방','bag')}${tile('equipment','장비','equipment')}${tile('quest','의뢰','r20Journal')}${tile('map','세계지도','r20Map',coreCombat())}${tile('status','상태 · 저장','r20Status',coreCombat())}${tile('menu','화면 확대','r20Full')}</div>`);
 for(const b of lifeContent.querySelectorAll('[data-r22-icon]'))b.insertAdjacentHTML('afterbegin',r22Icon(b.dataset.r22Icon));
};
$('kira-menu').onclick=r20Menu;
$('life-close').onclick=()=>lifeClose();
const r22Sync=r20SyncUI;
r20SyncUI=function(){
 r22Sync();const menu=$('kira-menu');if(!menu.querySelector('.r22-icon'))menu.innerHTML=r22Icon('menu');menu.setAttribute('aria-label','메뉴');menu.title='메뉴';
 for(const id of ['life-close','kira-close']){const b=$(id);if(b&&!b.querySelector('.r22-icon')){b.innerHTML=r22Icon('close');b.setAttribute('aria-label','닫기');}}
};
const r22Snapshot=coreSnapshot;
coreSnapshot=function(){const p=r22Snapshot();p.contentVersion='R22_MAIL_LAVENDER';return p;};
