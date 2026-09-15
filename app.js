/* IRON WORLD · ЯДРО: хранилище, навигация, boot, FX-движок v2, GitHub-синк */

const KEY='ironlog_v1', GHKEY='ironlog_gh', PKEY='ironlog_pending';
let S=load(), cur=1, GH=loadGH();

function load(){try{const o=JSON.parse(localStorage.getItem(KEY));if(o){if(!o.sessions)o.sessions=[];if(!o.measures)o.measures=[];if(!('reminder' in o))o.reminder=null;return o}}catch(e){}return{sessions:[],measures:[],reminder:null}}
function saveS(){localStorage.setItem(KEY,JSON.stringify(S))}
function loadGH(){try{return JSON.parse(localStorage.getItem(GHKEY))||{}}catch(e){return{}}}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function lastOf(day){return [...S.sessions].reverse().find(s=>s.day===day)}
function vol(s){let v=0;s.ex.forEach(e=>e.forEach(([w,r])=>{v+=(+w||0)*(+r||0)}));return v}
function fmtDate(iso){if(!iso)return'';const[p]=iso.split('T');const a=p.split('-');return a.length===3?`${a[2]}.${a[1]}.${a[0].slice(2)}`:iso}
function fmtDateFull(iso){if(!iso)return'';const[p]=iso.split('T');const a=p.split('-');return a.length===3?`${a[2]}.${a[1]}.${a[0]}`:iso}
function todayISO(){return new Date().toISOString().slice(0,10)}
function fxOK(){return !matchMedia('(prefers-reduced-motion: reduce)').matches}

/* ==== FX-ДВИЖОК v2: угли, разряды-награды, вспышки ==== */
let fxCv=null,fxCtx=null,parts=[],bolts=[],flash=0,distFlash=0,loopOn=false,nextDist=0;
function ensureCanvas(){
 if(fxCv)return;
 fxCv=document.createElement('canvas');fxCv.id='fxcanvas';
 fxCv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:115;mix-blend-mode:screen';
 document.body.appendChild(fxCv);
 fxCtx=fxCv.getContext('2d');
 fxSize();
 addEventListener('resize',fxSize);
}
function fxSize(){const dpr=Math.min(devicePixelRatio||1,2);fxCv.width=innerWidth*dpr;fxCv.height=innerHeight*dpr;fxCtx.setTransform(dpr,0,0,dpr,0,0);}
function newPart(top){return{x:Math.random()*innerWidth,y:top?Math.random()*innerHeight:innerHeight+8,v:.12+Math.random()*.3,s:1+Math.random()*1.6,a:.18+Math.random()*.35,f:Math.random()*6.28}}
function initParts(){parts=Array.from({length:24},()=>newPart(true));}
function bolt(x,y,angle,len,width,depth){
 const pts=[[x,y]];let cx=x,cy=y,a=angle;
 const steps=(8+Math.random()*10)|0;
 for(let i=0;i<steps;i++){
  a+=(Math.random()-.5)*1.15;
  const s=len/steps;
  cx+=Math.cos(a)*s;cy+=Math.sin(a)*s;
  pts.push([cx,cy]);
  if(depth>0&&Math.random()<.16)bolt(cx,cy,a+(Math.random()<.5?-1:1)*(.6+Math.random()*.8),len*.35,width*.5,depth-1);
 }
 bolts.push({pts,w:width,life:1});
}
function eyeFlare(){const w=document.querySelector('.eye-wrap');if(w){w.classList.add('flare');setTimeout(()=>w.classList.remove('flare'),450);}}
function fireReward(x,y,pr){
 if(!fxOK())return;
 ensureCanvas();
 const n=pr?3:1;
 for(let i=0;i<n;i++)bolt(x,y,-Math.PI/2+(Math.random()-.5)*1.7,Math.max(innerWidth,innerHeight)*(.3+Math.random()*.35),2.4,2);
 flash=Math.max(flash,pr?1.5:0.9);
 eyeFlare();kick();
}
function fxLoop(t){
 if(document.hidden){loopOn=false;return;}
 fxCtx.clearRect(0,0,innerWidth,innerHeight);
 for(const p of parts){
  p.y-=p.v;p.f+=.05;
  const tw=p.a*(.6+.4*Math.sin(p.f));
  fxCtx.fillStyle=`rgba(255,${120+((p.f*37)|0)%70},60,${tw.toFixed(3)})`;
  fxCtx.fillRect(p.x,p.y,p.s,p.s);
  if(p.y<-8)Object.assign(p,newPart(false));
 }
 if(t>=nextDist){nextDist=t+18000+Math.random()*22000;distFlash=1;}
 if(distFlash>0){
  const g=fxCtx.createRadialGradient(innerWidth/2,innerHeight+60,10,innerWidth/2,innerHeight+60,innerHeight*.7);
  g.addColorStop(0,`rgba(255,90,40,${(distFlash*.10).toFixed(3)})`);
  g.addColorStop(1,'rgba(255,90,40,0)');
  fxCtx.fillStyle=g;fxCtx.fillRect(0,0,innerWidth,innerHeight);
  distFlash-=.02;
 }
 if(flash>0){
  fxCtx.fillStyle=`rgba(110,165,255,${(Math.min(flash,1.6)*0.11).toFixed(3)})`;
  fxCtx.fillRect(0,0,innerWidth,innerHeight);
  flash-=.07;
 }
 bolts=bolts.filter(b=>b.life>0);
 for(const b of bolts){
  fxCtx.shadowColor='rgba(80,150,255,.95)';
  fxCtx.shadowBlur=16*b.life;
  fxCtx.strokeStyle=`rgba(185,220,255,${b.life.toFixed(3)})`;
  fxCtx.lineWidth=b.w;
  fxCtx.beginPath();
  b.pts.forEach((p,i)=>i?fxCtx.lineTo(p[0],p[1]):fxCtx.moveTo(p[0],p[1]));
  fxCtx.stroke();
  fxCtx.strokeStyle=`rgba(255,255,255,${(b.life*.9).toFixed(3)})`;
  fxCtx.lineWidth=b.w*.4;
  fxCtx.stroke();
  b.life-=.085;
 }
 fxCtx.shadowBlur=0;
 requestAnimationFrame(fxLoop);
}
function kick(){if(!loopOn&&fxOK()){loopOn=true;requestAnimationFrame(fxLoop);}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)loopOn=false;else kick();});

/* ==== BOOT (каждый вход, ~1.1 c, тап = пропуск) ==== */
function runBoot(done){
 const b=document.createElement('div');b.id='boot';
 const lines=[
  '> CYBERDYNE TACTICAL CORE · ONLINE',
  `> MUSCLE DB: ${S.sessions.length} SESSIONS LOADED`,
  `> METRICS DB: ${S.measures.length} RECORDS`,
  `> CLOUD LINK: ${GH.token?'SYNC ON':'SYNC OFF'}`,
  '> OPERATOR 186CM/40Y — CLEARANCE GRANTED'
 ];
 b.innerHTML=`<div class="b-lines">${lines.map((l,i)=>`<div style="animation-delay:${i*110}ms">${l}</div>`).join('')}</div>
  <div class="b-bar"><i></i></div><div class="b-skip">тап — пропуск</div>`;
 document.body.appendChild(b);
 let fin=false;
 const finish=()=>{if(fin)return;fin=true;b.classList.add('off');setTimeout(()=>b.remove(),320);document.body.classList.add('booted');done&&done();};
 b.addEventListener('pointerdown',finish);
 setTimeout(finish,1100);
}

/* ==== ПРИЦЕЛ + СКАН ПРИ ПЕРЕХОДЕ ==== */
function fxTarget(x,y,done){
 const r=document.createElement('div');r.className='reticle';
 r.style.left=x+'px';r.style.top=y+'px';
 r.innerHTML='<i></i><i></i><i></i><i></i><b></b>';
 document.body.appendChild(r);
 const sc=document.createElement('div');sc.className='scanline';document.body.appendChild(sc);
 requestAnimationFrame(()=>{r.classList.add('go');sc.classList.add('go');});
 setTimeout(done,130);
 setTimeout(()=>{r.remove();sc.remove();},650);
}

/* ---- навигация ---- */
function showView(v,ev,nofx){
 const apply=()=>{
  document.body.dataset.view=v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on','reveal'));
  const view=document.getElementById('view-'+v);
  view.classList.add('on');
  void view.offsetWidth;
  view.classList.add('reveal');
  setTimeout(()=>view.classList.remove('reveal'),600);
  document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='train')renderTrain();
  if(v==='measure')renderMeasure();
  if(v==='home')renderHome();
  scrollTo({top:0});
  checkReminder();
 };
 if(nofx||!fxOK()){apply();return;}
 let x=innerWidth/2,y=innerHeight/2;
 if(ev&&ev.currentTarget){const r=ev.currentTarget.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2;}
 fxTarget(x,y,apply);
}
function renderHome(){
 const last=S.sessions.length?[...S.sessions].sort((a,b)=>b.ts-a.ts)[0]:null;
 const lm=S.measures.length?[...S.measures].sort((a,b)=>b.ts-a.ts)[0]:null;
 document.getElementById('hstatus').innerHTML=
  `OPERATOR: <b>MALE · 186 CM · 40 Y</b><br>`+
  `SESSIONS: <b>${S.sessions.length}</b>${last?` · LAST: <b>${new Date(last.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})} · ${vol(last).toLocaleString('ru-RU')} кг</b>`:''}<br>`+
  `MEASURES: <b>${S.measures.length}</b>${lm&&lm.v.w?` · LAST WEIGHT: <b>${lm.v.w} кг</b>`:''}<br>`+
  `CLOUD: <b>${GH.token?'SYNC ON':'SYNC OFF'}</b>`;
 document.getElementById('ms-train').textContent=last?`последняя: ${new Date(last.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})} · ${vol(last).toLocaleString('ru-RU')} кг`:'журнал силовых · 3 дня';
 document.getElementById('ms-meas').textContent=lm&&lm.v.w?`последний: ${fmtDate(lm.date)} · ${lm.v.w} кг`:'история пропорций';
}

/* ==== GitHub sync ==== */
function b64utf8(s){const b=new TextEncoder().encode(s);let bin='';for(let i=0;i<b.length;i++)bin+=String.fromCharCode(b[i]);return btoa(bin)}
async function ghPut(path,content){
 const url=`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`;
 const h={'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'};
 let sha=null;
 const g=await fetch(url,{headers:h});
 if(g.ok)sha=(await g.json()).sha;
 else if(g.status!==404)throw g.status;
 const body={message:'sync: auto-update '+path,content:b64utf8(content)};
 if(sha)body.sha=sha;
 const r=await fetch(url,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===409){
   const g2=await fetch(url,{headers:h}); if(!g2.ok)throw g2.status;
   body.sha=(await g2.json()).sha;
   const r2=await fetch(url,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!r2.ok)throw r2.status;
 } else if(!r.ok)throw r.status;
}
function csvEsc(v){v=(v===undefined||v===null)?'':String(v);return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function buildTrainCSV(){
 const rows=[['Дата','Время','День','Упражнение','Подход','Вес_кг','Повторы','Примечание']];
 [...S.sessions].sort((a,b)=>a.ts-b.ts).forEach(s=>{
  const d=DAYS.find(x=>x.id===s.day);
  const dt=new Date(s.ts);
  const ds=dt.toLocaleDateString('ru-RU'), tm=dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  s.ex.forEach((sets,i)=>sets.forEach((set,k)=>{
    if(set[0]===''&&set[1]==='')return;
    rows.push([ds,tm,d.t,d.ex[i].n,k+1,set[0],set[1],'']);
  }));
  if(s.cardio)rows.push([ds,tm,d.t,'Кардио (заминка)','','','',s.cardio.done?(s.cardio.min!==''?s.cardio.min+' мин':'выполнено'):'пропущено']);
 });
 return rows.map(r=>r.map(csvEsc).join(',')).join('\r\n');
}
function buildMeasCSV(){
 const rows=[['Дата','Вес_кг','Шея_см','Грудь_см','Бицепс_см','Предплечье_см','Талия_см','Бедро_см','Голень_см']];
 [...S.measures].sort((a,b)=>a.ts-b.ts).forEach(m=>{
  rows.push([fmtDateFull(m.date),m.v.w,m.v.neck,m.v.chest,m.v.bicep,m.v.fore,m.v.waist,m.v.thigh,m.v.calf]);
 });
 return rows.map(r=>r.map(csvEsc).join(',')).join('\r\n');
}
let syncT=null;
function scheduleSync(){
 if(!GH.token)return;
 localStorage.setItem(PKEY,'1');
 clearTimeout(syncT);
 syncT=setTimeout(()=>doSync(false),1500);
 ghStatus();
}
async function doSync(manual){
 if(!GH.token){if(manual)toast('[!] СНАЧАЛА ПОДКЛЮЧИ ТОКЕН');return;}
 if(!navigator.onLine){if(manual)toast('[!] НЕТ СЕТИ — СИНК ПОЗЖЕ');return;}
 try{
  await ghPut('trainings.csv',buildTrainCSV());
  await ghPut('measures.csv',buildMeasCSV());
  localStorage.removeItem(PKEY);
  toast('[CLOUD] GITHUB: ТАБЛИЦЫ ОБНОВЛЕНЫ');
 }catch(e){
  localStorage.setItem(PKEY,'1');
  toast(manual?'[CLOUD] ОШИБКА: '+e:'[CLOUD] НЕ СИНК — ПОВТОРЮ ПОЗЖЕ');
 }
 ghStatus();
}
function ghSave(){
 GH={token:document.getElementById('gh-token').value.trim(),
     owner:document.getElementById('gh-owner').value.trim()||'asborozdin-a11y',
     repo:document.getElementById('gh-repo').value.trim()||'iron-log'};
 localStorage.setItem(GHKEY,JSON.stringify(GH));
 toast('[OK] НАСТРОЙКИ СОХРАНЕНЫ');
 ghStatus();
 if(GH.token)doSync(true);
}
function ghStatus(){
 const el=document.getElementById('gh-status'); if(!el)return;
 el.innerHTML=!GH.token?'статус: <b>не подключено</b> — вставь токен один раз':
  `статус: <b>подключено</b> · ${GH.owner}/${GH.repo} · ${localStorage.getItem(PKEY)?'есть несинхронизированные данные — жду сеть':'всё синхронизировано'}`;
}

/* ==== старт ==== */
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
window.addEventListener('online',()=>{if(GH.token&&localStorage.getItem(PKEY))doSync(false)});
(function init(){
 const t=document.getElementById('gh-token');
 if(t)t.value=GH.token||'';
 const o=document.getElementById('gh-owner'); if(o&&GH.owner)o.value=GH.owner;
 const r=document.getElementById('gh-repo'); if(r&&GH.repo)r.value=GH.repo;
 ghStatus();
 if(GH.token&&localStorage.getItem(PKEY))doSync(false);
 checkReminder();
 if(fxOK()){ensureCanvas();initParts();nextDist=performance.now()+6000;kick();}
 runBoot(()=>showView('home',null,true));
})();
