/* IRON WORLD · ЯДРО: хранилище, навигация, главный экран, GitHub-синк, FX */

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

/* ==== МОЛНИИ ГЛАВНОГО ЭКРАНА (Terminator FX) ==== */
let storm=null;
function startStorm(){
 if(storm)return;
 const host=document.getElementById('view-home');
 if(!host)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let cv=document.getElementById('storm');
 if(!cv){cv=document.createElement('canvas');cv.id='storm';host.appendChild(cv);}
 const ctx=cv.getContext('2d');
 function size(){const dpr=Math.min(devicePixelRatio||1,2);cv.width=host.clientWidth*dpr;cv.height=host.clientHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 size();
 const onRs=()=>size();
 addEventListener('resize',onRs);
 let bolts=[],flash=0,next=performance.now()+500,raf=0,run=true;
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
 function strike(){
  const w=host.clientWidth,h=host.clientHeight;
  bolt(w*(.12+Math.random()*.76),-12,Math.PI/2+(Math.random()-.5)*.7,h*(.45+Math.random()*.5),2.6,2);
  if(Math.random()<.35)setTimeout(()=>{if(run)bolt(w*(.12+Math.random()*.76),-12,Math.PI/2+(Math.random()-.5)*.7,h*(.4+Math.random()*.45),2,2)},70+Math.random()*90);
  flash=1;
  const wrap=host.querySelector('.wrap');
  if(wrap){wrap.style.transform=`translate(${(Math.random()-.5)*5}px,${(Math.random()-.5)*4}px)`;setTimeout(()=>{wrap.style.transform=''},100);}
 }
 function frame(t){
  if(!run)return;
  const w=host.clientWidth,h=host.clientHeight;
  ctx.clearRect(0,0,w,h);
  if(t>=next){strike();next=t+900+Math.random()*2600;}
  if(flash>0){
   ctx.fillStyle=`rgba(110,165,255,${(flash*0.11).toFixed(3)})`;
   ctx.fillRect(0,0,w,h);
   flash-=0.06;
  }
  bolts=bolts.filter(b=>b.life>0);
  for(const b of bolts){
   ctx.shadowColor='rgba(80,150,255,.95)';
   ctx.shadowBlur=16*b.life;
   ctx.strokeStyle=`rgba(185,220,255,${b.life.toFixed(3)})`;
   ctx.lineWidth=b.w;
   ctx.beginPath();
   b.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
   ctx.stroke();
   ctx.strokeStyle=`rgba(255,255,255,${(b.life*.9).toFixed(3)})`;
   ctx.lineWidth=b.w*.4;
   ctx.stroke();
   b.life-=0.085;
  }
  ctx.shadowBlur=0;
  raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);
 storm={stop(){run=false;cancelAnimationFrame(raf);removeEventListener('resize',onRs);bolts=[];flash=0;ctx.clearRect(0,0,cv.width,cv.height);}};
}
function stopStorm(){if(storm){storm.stop();storm=null}}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)stopStorm();
 else if(document.body.dataset.view==='home')startStorm();
});

/* ---- навигация: запуск всегда с главного экрана ---- */
function showView(v){
 document.body.dataset.view=v;
 document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
 document.getElementById('view-'+v).classList.add('on');
 document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 if(v==='train')renderTrain();
 if(v==='measure')renderMeasure();
 if(v==='home'){renderHome();startStorm();}else{stopStorm();}
 scrollTo({top:0});
 checkReminder();
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

/* ---- GitHub sync ---- */
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

/* ---- старт: всегда с главного экрана ---- */
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
 showView('home');
})();
