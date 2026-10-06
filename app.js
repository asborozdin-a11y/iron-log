/* IRON WORLD · ЯДРО v48: P0+P1+P2 + фикс bicep→biceps + дедуп колонок + чистый startApp */

const P_LIST='ironlog_personas', P_CUR='ironlog_persona', LEGACY='ironlog_v1', LEGACY_FLAG='ironlog_legacy_migrated';
const OLD_REPO='iron-log';
let PERSONAS=loadPersonas(), ME=null;
let KEYC=LEGACY, GHKC='ironlog_gh', VKEYC='ironlog_view', PKEYC='ironlog_pending';
let S={sessions:[],measures:[],reminder:null}, cur=1, GH={};

function loadPersonas(){try{return JSON.parse(localStorage.getItem(P_LIST))||[]}catch(e){return[]}}
function savePersonas(){try{localStorage.setItem(P_LIST,JSON.stringify(PERSONAS));return true}catch(e){return false}}
function personaById(id){return PERSONAS.find(p=>p.id===id)}
function esc(s){return String(s===undefined||s===null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function slugName(s){
 const map={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
 return String(s||'').toLowerCase().split('').map(ch=>map[ch]!==undefined?map[ch]:ch).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'persona';
}
function exKey(n){return String(n||'').toLowerCase().replace(/[^a-zа-яё0-9]+/g,'-').replace(/^-+|-+$/g,'')||'ex'}

const PRESETS=[
 {key:'alex',name:'ALEX',desc:'мужской пакет · terminator',pack:'default',theme:'terminator',stats:'MALE · 186 CM · 40 Y'},
 {key:'ksy', name:'KSY', desc:'женский пакет · tiffany noir',pack:'oksana',theme:'tiffany-noir',stats:'FEMALE · 153 CM · 50 Y'}
];

const THEMES={
 'terminator':{fx:{ember:[255,120,60],bolt:[185,220,255],boltGlow:'rgba(80,150,255,.95)',flash:[110,165,255],dist:[255,90,40]}},
 'tiffany-noir':{fx:{ember:[110,220,210],bolt:[200,255,250],boltGlow:'rgba(20,184,166,.95)',flash:[120,220,210],dist:[20,184,166]}},
 'tiffany-audrey':{fx:{ember:[20,150,140],bolt:[10,120,115],boltGlow:'rgba(10,150,140,.8)',flash:[140,220,215],dist:[20,150,140]}},
 'rose-champagne':{fx:{ember:[255,150,170],bolt:[255,225,235],boltGlow:'rgba(255,122,156,.9)',flash:[255,170,190],dist:[255,122,156]}}
};
const TH_LIST=['terminator','tiffany-noir','tiffany-audrey','rose-champagne'];
const TH_SW={
 'terminator':'linear-gradient(135deg,#ff2d43 50%,#0a0d10 50%)',
 'tiffany-noir':'linear-gradient(135deg,#17c3bc 50%,#081114 50%)',
 'tiffany-audrey':'linear-gradient(135deg,#0abab5 50%,#f2f6f5 50%)',
 'rose-champagne':'linear-gradient(135deg,#ff7a9c 50%,#120d14 50%)'};

/* ==== ЕДИНАЯ СХЕМА ЗАМЕРОВ для всех профилей (9 метрик) ====
   METRICS паков больше не влияют на хранилище и CSV.
   Каждый заполняет только свои поля, остальные оставляет пустыми. */
var METRICS_UNIFIED=[
 {k:'w',l:'Вес',u:'кг',rule:'dn'},
 {k:'neck',l:'Шея',u:'см',rule:'up'},
 {k:'chest',l:'Грудь',u:'см',rule:'up'},
 {k:'biceps',l:'Бицепс',u:'см',rule:'up'},
 {k:'fore',l:'Предплечье',u:'см',rule:'up'},
 {k:'waist',l:'Талия',u:'см',rule:'dn'},
 {k:'thigh',l:'Бедро',u:'см',rule:'up'},
 {k:'calf',l:'Голень',u:'см',rule:'up'},
 {k:'glute',l:'Ягодицы',u:'см',rule:'up'}
];
/* applyPack здесь перезаписывает старую версию из data.js,
   потому что app.js грузится после data.js. Для чистоты старую
   applyPack из data.js можно удалить — поведение не изменится. */
if(typeof window.applyPack!=='function'){window.applyPack=function(){};}
let FXC=THEMES.terminator.fx;
function applyPack(pk){
 if(!pk)return;
 DAYS=pk.DAYS;
 METRICS=METRICS_UNIFIED;
 MACROS=pk.MACROS;
 FOOD=pk.FOOD;
}
function applyTheme(t){document.body.dataset.theme=t;FXC=(THEMES[t]||THEMES.terminator).fx;}
function setTheme(t){
 if(!ME)return; ME.theme=t;
 const p=personaById(ME.id); if(p){p.theme=t;savePersonas();}
 applyTheme(t);renderProfile(); toast('[OK] ТЕМА: '+t.toUpperCase());
}

/* ==== PIN ==== */
function randSalt(){const a=new Uint8Array(8);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function pinHashFn(pin,salt){
 try{const d=new TextEncoder().encode(salt+':'+pin);const h=await crypto.subtle.digest('SHA-256',d);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 catch(e){let h=5381;const s=salt+':'+pin;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'fb'+(h>>>0).toString(16)}
}
async function pinVerify(pin,p){return !!(p&&p.pinHash)&&(await pinHashFn(pin,p.pinSalt||''))===p.pinHash}

/* ==== ФОКУС-ТРАП (чистая версия, без мёртвой карты) ==== */
function trapFocus(box, onEscape){
 if(!box) return function(){};
 const prev=document.activeElement;
 const sel='button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
 const nodes=function(){return [...box.querySelectorAll(sel)].filter(n=>!n.disabled&&n.offsetParent!==null);};
 setTimeout(function(){try{const f=nodes();f[0]&&f[0].focus({preventScroll:true});}catch(e){}},50);
 const onKey=function(e){
  if(e.key==='Escape'&&onEscape){e.preventDefault();onEscape();return;}
  if(e.key!=='Tab')return;
  const f=nodes();if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 };
 box.addEventListener('keydown',onKey);
 return function(){
  box.removeEventListener('keydown',onKey);
  try{prev&&prev.focus&&prev.focus({preventScroll:true});}catch(e){}
 };
}

function pinGate(p,done){
 const b=onboardShell(`<div class="ob-title">IRON <span>WORLD</span></div>
  <div class="ob-sub"><span class="ob-lock">[PIN]</span> профиль ${esc(p.name)} защищён</div>
  <label class="ob-lab">Введите PIN-код</label>
  <div class="pin-row"><input id="gate-pin" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
  <div class="mact" style="justify-content:center;margin-top:16px"><button id="gate-go">Войти</button></div>`);
 const go=async()=>{
  const ok=await pinVerify(b.querySelector('#gate-pin').value.trim(),p);
  if(ok){sessionStorage.setItem('ironlog_unlocked_'+p.id,'1');b.remove();done();}
  else{toast('[!] НЕВЕРНЫЙ PIN');const el=b.querySelector('#gate-pin');el.value='';el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),350);}
 };
 b.querySelector('#gate-go').onclick=go;
 b.querySelector('#gate-pin').addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}
function pinSetup(){
 const b=onboardShell(`<div class="ob-title">IRON <span>WORLD</span></div>
  <div class="ob-sub">PIN профиля ${esc(ME.name)}</div>
  ${ME.pinHash?`<label class="ob-lab">Текущий PIN</label><div class="pin-row"><input id="ps-cur" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>`:''}
  <label class="ob-lab">Новый PIN (4 цифры)</label><div class="pin-row"><input id="ps-new" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
  <label class="ob-lab">Повторите</label><div class="pin-row"><input id="ps-new2" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
  <div class="mact" style="justify-content:center;margin-top:16px"><button class="ghost" id="ps-cancel">Отмена</button><button id="ps-go">Сохранить</button></div>`);
 b.querySelector('#ps-cancel').onclick=()=>b.remove();
 b.querySelector('#ps-go').onclick=async()=>{
  if(ME.pinHash){const ok=await pinVerify(b.querySelector('#ps-cur').value.trim(),ME);if(!ok){toast('[!] НЕВЕРНЫЙ ТЕКУЩИЙ PIN');return;}}
  const n1=b.querySelector('#ps-new').value.trim(),n2=b.querySelector('#ps-new2').value.trim();
  if(!/^\d{4}$/.test(n1)){toast('[!] PIN: РОВНО 4 ЦИФРЫ');return;}
  if(n1!==n2){toast('[!] PIN НЕ СОВПАДАЕТ');return;}
  const p=personaById(ME.id);
  ME.pinSalt=randSalt();ME.pinHash=await pinHashFn(n1,ME.pinSalt);
  if(p){p.pinHash=ME.pinHash;p.pinSalt=ME.pinSalt;savePersonas();}
  sessionStorage.setItem('ironlog_unlocked_'+ME.id,'1');
  b.remove();renderProfile();toast('[OK] PIN УСТАНОВЛЕН');
 };
}
function pinRemove(){
 const b=onboardShell(`<div class="ob-title">IRON <span>WORLD</span></div>
  <div class="ob-sub">снятие PIN профиля ${esc(ME.name)}</div>
  <label class="ob-lab">Текущий PIN</label><div class="pin-row"><input id="pr-cur" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
  <div class="mact" style="justify-content:center;margin-top:16px"><button class="ghost" id="pr-cancel">Отмена</button><button id="pr-go">Снять PIN</button></div>`);
 b.querySelector('#pr-cancel').onclick=()=>b.remove();
 b.querySelector('#pr-go').onclick=async()=>{
  const ok=await pinVerify(b.querySelector('#pr-cur').value.trim(),ME);
  if(!ok){toast('[!] НЕВЕРНЫЙ PIN');return;}
  const p=personaById(ME.id);ME.pinHash=null;ME.pinSalt=null;
  if(p){p.pinHash=null;p.pinSalt=null;savePersonas();}
  b.remove();renderProfile();toast('[OK] PIN СНЯТ');
 };
}

/* ==== ХРАНИЛИЩЕ: миграция тренировок + замеров ==== */
function migrate(S){
 let changed=false;
 if(Array.isArray(S.sessions) && S.sessions.length){
  const defPack = (typeof PACKS!=='undefined' && PACKS.default) ? PACKS.default : null;
  S.sessions = S.sessions.map(s=>{
   if(s && typeof s === 'object' && s.v>=2) return s;
   changed=true;
   const dayId = (s && (s.dayId!==undefined?s.dayId:s.day)) || 1;
   const d = defPack && defPack.DAYS ? defPack.DAYS.find(x=>x.id===dayId) : null;
   const ex = (s && Array.isArray(s.ex)) ? s.ex.map((sets,i)=>{
    const exDef = d && d.ex && d.ex[i] ? d.ex[i] : null;
    return {
     key: exKey(exDef?exDef.n:'ex-'+i), name: exDef?exDef.n:'Упражнение '+(i+1),
     note: exDef?(exDef.note||''):'', sets: Array.isArray(sets)?sets:[]
    };
   }) : [];
   return {
    ts:(s&&s.ts)||Date.now(), v:2, packId:'default', dayId,
    dayTitle: d?d.t:'День '+dayId, ex, cardio:(s&&s.cardio)||null
   };
  });
 }
 return {changed, data:S};
}
/* переименование ключа бицепса: старые данные лежат в v.bicep */
function migrateMeasures(D){
 var changed=false;
 (D.measures||[]).forEach(function(m){
  if(!m||!m.v)return;
  if(m.v.bicep!==undefined&&m.v.biceps===undefined){m.v.biceps=m.v.bicep;delete m.v.bicep;changed=true;}
 });
 return changed;
}
function load(){
 try{
  const o = JSON.parse(localStorage.getItem(KEYC));
  if(o){
   if(!Array.isArray(o.sessions))o.sessions=[];
   if(!Array.isArray(o.measures))o.measures=[];
   if(!('reminder' in o))o.reminder=null;
   const m = migrate(o);
   const mm = migrateMeasures(m.data);
   if(m.changed||mm){ try{localStorage.setItem(KEYC,JSON.stringify(m.data));}catch(e){} }
   return m.data;
  }
 }catch(e){}
 return {sessions:[],measures:[],reminder:null};
}
function saveS(){
 try{ localStorage.setItem(KEYC, JSON.stringify(S)); return true; }
 catch(e){ toast('[!] НЕ ХВАТАЕТ МЕСТА: сделай «Экспорт JSON» и удали старые записи'); return false; }
}
function loadGH(){try{return JSON.parse(localStorage.getItem(GHKC))||{}}catch(e){return{}}}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function lastOf(day){return [...S.sessions].reverse().find(s=>s.dayId===day)}
/* следующий день ротации после последней тренировки */
function nextDayId(){
 if(typeof DAYS==='undefined'||!DAYS||!DAYS.length)return 1;
 if(!S.sessions.length)return DAYS[0].id;
 var last=S.sessions.reduce(function(a,b){return b.ts>a.ts?b:a;});
 for(var i=0;i<DAYS.length;i++){if(DAYS[i].id===last.dayId)return DAYS[(i+1)%DAYS.length].id;}
 return DAYS[0].id;
}
function vol(s){let v=0;(s.ex||[]).forEach(e=>{(e.sets||[]).forEach(([w,r])=>{v+=(+w||0)*(+r||0)});});return v}
function fmtDate(iso){if(!iso)return'';const[p]=iso.split('T');const a=p.split('-');return a.length===3?`${a[2]}.${a[1]}.${a[0].slice(2)}`:iso}
function fmtDateFull(iso){if(!iso)return'';const[p]=iso.split('T');const a=p.split('-');return a.length===3?`${a[2]}.${a[1]}.${a[0]}`:iso}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fxOK(){return !matchMedia('(prefers-reduced-motion: reduce)').matches}

/* ==== ВАЛИДАЦИЯ (хранилище хранит СЫРЫЕ данные, esc() только на выводе) ==== */
const num = v => (v === '' || v === null || v === undefined) ? '' : (Number.isFinite(+v) ? +v : '');
function validPackIds(){return (typeof PACKS!=='undefined')?Object.keys(PACKS):['default']}
function validDayIds(){
 const pks = (typeof PACKS!=='undefined')?PACKS:null;
 const ids=new Set();
 if(pks) Object.values(pks).forEach(p=>(p.DAYS||[]).forEach(d=>ids.add(d.id)));
 if(!ids.size){[1,2,3].forEach(i=>ids.add(i));}
 return ids;
}
function sanitizeSession(s){
 if(!s || typeof s !== 'object' || typeof s.ts !== 'number') return null;
 const dayId = +((s.dayId!==undefined?s.dayId:s.day)||1);
 if(!validDayIds().has(dayId)) return null;
 const packId = s.packId && validPackIds().includes(s.packId) ? s.packId : 'default';
 let ex=[];
 if(s.v>=2 && Array.isArray(s.ex)){
  ex = s.ex.slice(0,40).map(e=>{
   if(!e || typeof e!=='object') return null;
   return {
    key: String(e.key||'').slice(0,80),
    name: String(e.name||'Упражнение').slice(0,120),
    note: String(e.note||'').slice(0,200),
    sets: Array.isArray(e.sets)?e.sets.slice(0,12).map(p=>[num(p&&p[0]),num(p&&p[1])]):[]
   };
  }).filter(Boolean);
 } else if(Array.isArray(s.ex)){
  const defPack = (typeof PACKS!=='undefined' && PACKS.default)?PACKS.default:null;
  const d = defPack && defPack.DAYS ? defPack.DAYS.find(x=>x.id===dayId) : null;
  ex = s.ex.slice(0,40).map((sets,i)=>{
   const exDef = d && d.ex && d.ex[i] ? d.ex[i] : null;
   return {
    key: exKey(exDef?exDef.n:'ex-'+i),
    name: String(exDef?exDef.n:'Упражнение '+(i+1)).slice(0,120),
    note: String(exDef?(exDef.note||''):'').slice(0,200),
    sets: Array.isArray(sets)?sets.slice(0,12).map(p=>[num(p&&p[0]),num(p&&p[1])]):[]
   };
  });
 }
 const cardio = s.cardio && typeof s.cardio==='object' ? {done:!!s.cardio.done, min:num(s.cardio.min)} : null;
 return {
  ts:s.ts, v:2, packId, dayId,
  dayTitle: String(s.dayTitle||'День '+dayId).slice(0,60),
  ex, cardio
 };
}
function sanitizeMeasure(m){
 if(!m || typeof m!=='object' || typeof m.ts!=='number') return null;
 if(typeof m.date!=='string' || !/^\d{4}-\d{2}-\d{2}/.test(m.date)) return null;
 if(!m.v || typeof m.v!=='object') return null;
 const v={}; Object.keys(m.v).forEach(k=>{v[k]=num(m.v[k]);});
 return {ts:m.ts, date:m.date, v};
}

/* ==== ОНБОРДИНГ ==== */
let onboardTrapCleanup = null;
function onboardShell(html){
 const old=document.getElementById('onboard'); if(old)old.remove();
 if(onboardTrapCleanup){try{onboardTrapCleanup();}catch(e){} onboardTrapCleanup=null;}
 const b=document.createElement('div');b.id='onboard';
 b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');b.setAttribute('aria-label','Настройка профиля');
 b.innerHTML=`<div class="ob-box">${html}</div>`;
 document.body.appendChild(b);
 onboardTrapCleanup = trapFocus(b, null);
 const origRemove = b.remove.bind(b);
 b.remove = function(){ if(onboardTrapCleanup){try{onboardTrapCleanup();}catch(e){} onboardTrapCleanup=null;} return origRemove(); };
 return b;
}
function onboardCreate(adopt){
 const PK=(typeof PACKS!=='undefined')?PACKS:{default:{label:'базовый'}};
 let params=null;
 const b=onboardShell('');
 function stage1(){
  b.innerHTML=`<div class="ob-box">
   <div class="ob-title">IRON <span>WORLD</span></div>
   <div class="ob-sub">persona setup · выбор оператора</div>
   ${adopt&&localStorage.getItem(LEGACY)&&!localStorage.getItem(LEGACY_FLAG)?`<div class="ob-note">Найден существующий журнал — он привяжется к создаваемому профилю.</div>`:''}
   <div class="ob-presets">${PRESETS.map(pr=>`<button class="ob-preset ${pr.key}" data-k="${pr.key}"><b>${pr.name}</b><small>${pr.desc}</small></button>`).join('')}</div>
   <div class="ob-div">— или —</div>
   <div id="ob-manual" style="display:none;margin-top:12px">
    <label class="ob-lab">Имя оператора</label><input id="ob-name" class="ob-in" maxlength="18" placeholder="ИМЯ">
    <label class="ob-lab">Пакет программ</label>
    <div class="ob-packs">${Object.keys(PK).map(k=>`<button class="ob-pk ${k==='default'?'on':''}" data-p="${k}">${esc(PK[k].label||k)}</button>`).join('')}</div>
    <label class="ob-lab">Тема оформления</label>
    <div class="ob-themes">${TH_LIST.map(t=>`<button class="ob-th ${t==='terminator'?'on':''}" data-t="${t}" style="background:${TH_SW[t]}" title="${t}"></button>`).join('')}</div>
    <div class="mact" style="justify-content:center;margin-top:14px"><button id="ob-manual-go">Далее: PIN</button></div>
   </div>
   <div class="mact" style="justify-content:center;margin-top:12px"><button class="ghost" id="ob-toggle">+ Новый профиль</button></div>
  </div>`;
  let mPack='default', mTheme='terminator';
  b.querySelectorAll('.ob-preset').forEach(btn=>btn.onclick=()=>{
   const pr=PRESETS.find(x=>x.key===btn.dataset.k);
   params={name:pr.name,pack:pr.pack,theme:pr.theme,stats:pr.stats}; stage2();
  });
  b.querySelector('#ob-toggle').onclick=()=>{const m=b.querySelector('#ob-manual');m.style.display=(m.style.display==='none'?'block':'none');};
  b.querySelectorAll('#ob-manual .ob-pk').forEach(pk=>pk.onclick=()=>{
   mPack=pk.dataset.p;
   b.querySelectorAll('#ob-manual .ob-pk').forEach(x=>x.classList.toggle('on',x===pk));
   const dt=(PK[mPack]&&PK[mPack].theme)||'terminator';mTheme=dt;
   b.querySelectorAll('#ob-manual .ob-th').forEach(x=>x.classList.toggle('on',x.dataset.t===dt));
  });
  b.querySelectorAll('#ob-manual .ob-th').forEach(th=>th.onclick=()=>{
   mTheme=th.dataset.t;
   b.querySelectorAll('#ob-manual .ob-th').forEach(x=>x.classList.toggle('on',x===th));
  });
  b.querySelector('#ob-manual-go').onclick=()=>{
   const nm=(b.querySelector('#ob-name').value||'').trim().toUpperCase();
   if(!nm){toast('[!] ВВЕДИ ИМЯ');return;}
   params={name:nm,pack:mPack,theme:mTheme,stats:''}; stage2();
  };
  if(onboardTrapCleanup){try{onboardTrapCleanup();}catch(e){}}
  onboardTrapCleanup = trapFocus(b, null);
 }
 function stage2(){
  b.innerHTML=`<div class="ob-box">
   <div class="ob-title">IRON <span>WORLD</span></div>
   <div class="ob-sub">профиль ${esc(params.name)} · защита</div>
   <label class="ob-lab">PIN-код (4 цифры)</label>
   <div class="pin-row"><input id="pin1" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
   <label class="ob-lab">Повторите PIN</label>
   <div class="pin-row"><input id="pin2" class="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"></div>
   <div class="mact" style="justify-content:center;margin-top:16px">
    <button class="ghost" id="pin-back">Назад</button>
    <button class="ghost" id="pin-skip">Пропустить</button>
    <button id="pin-go">Создать профиль</button>
   </div></div>`;
  b.querySelector('#pin-back').onclick=()=>stage1();
  b.querySelector('#pin-skip').onclick=()=>finishCreate('');
  b.querySelector('#pin-go').onclick=()=>finishCreate(b.querySelector('#pin1').value.trim(),b.querySelector('#pin2').value.trim());
  if(onboardTrapCleanup){try{onboardTrapCleanup();}catch(e){}}
  onboardTrapCleanup = trapFocus(b, null);
 }
 async function finishCreate(pin,pin2){
  if(pin===undefined)pin='';
  if(pin!==''){
   if(!/^\d{4}$/.test(pin)){toast('[!] PIN: РОВНО 4 ЦИФРЫ');return;}
   if(pin!==(pin2||'')){toast('[!] PIN НЕ СОВПАДАЕТ');const el=b.querySelector('#pin2');if(el){el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),350);}return;}
  }
  let pinHash=null,pinSalt=null;
  if(pin){pinSalt=randSalt();pinHash=await pinHashFn(pin,pinSalt);}
  const p={id:'p'+Date.now(),name:params.name,pack:params.pack,theme:params.theme,stats:params.stats||'',pinHash,pinSalt,created:Date.now()};
  if(adopt&&localStorage.getItem(LEGACY)&&!localStorage.getItem(LEGACY_FLAG)){
   localStorage.setItem('ironlog_d_'+p.id,localStorage.getItem(LEGACY));
   localStorage.setItem(LEGACY_FLAG,p.id);
   if(!p.stats)p.stats='MALE · 186 CM · 40 Y';
  }
  PERSONAS.push(p);savePersonas();b.remove();
  if(pinHash)sessionStorage.setItem('ironlog_unlocked_'+p.id,'1');
  startApp(p.id);
 }
 stage1();
 return b;
}
function onboardSelect(){
 const b=onboardShell(`<div class="ob-title">IRON <span>WORLD</span></div>
  <div class="ob-sub">persona setup · выбор профиля</div>
  <div class="ob-list">${PERSONAS.map(p=>`<button class="ob-p" data-id="${p.id}"><b>${esc(p.name)}</b><small>${p.pinHash?'<span class="ob-lock">[PIN]</span> ':''}${esc(p.stats||'')}</small></button>`).join('')}</div>
  <div class="mact" style="justify-content:center;margin-top:16px"><button class="ghost" id="ob-add">+ Новый профиль</button></div>`);
 b.querySelectorAll('.ob-p').forEach(btn=>btn.onclick=()=>{
  const p=personaById(btn.dataset.id); b.remove();
  if(p.pinHash&&sessionStorage.getItem('ironlog_unlocked_'+p.id)!=='1'){pinGate(p,()=>startApp(p.id));}
  else{startApp(p.id);}
 });
 b.querySelector('#ob-add').onclick=()=>{b.remove();onboardCreate(false);};
}

/* ==== СТАРТ (схлопнутый: одна функция, hash читается сам) ==== */
function startApp(pid){
 ME=personaById(pid);
 localStorage.setItem(P_CUR,pid);
 KEYC='ironlog_d_'+pid; GHKC='ironlog_gh_'+pid; VKEYC='ironlog_v_'+pid; PKEYC='ironlog_p_'+pid;
 S=load(); GH=loadGH(); cur=nextDayId();
 try{
  const PK=(typeof PACKS!=='undefined')?PACKS:null;
  if(PK&&typeof applyPack==='function')applyPack(PK[ME.pack]||PK.default);
 }catch(e){}
 applyTheme(ME.theme||'terminator');
 const t=document.getElementById('gh-token'); if(t)t.value=GH.token||'';
 const o=document.getElementById('gh-owner'); if(o)o.value=GH.owner||'asborozdin-a11y';
 const r=document.getElementById('gh-repo'); if(r)r.value=GH.repo||'iron-data';
 ghStatus();
 /* отложенный синк — через setTimeout, чтобы train.js (ghGet) был гарантированно загружен */
 if(GH.token&&localStorage.getItem(PKEYC))setTimeout(function(){if(GH.token&&localStorage.getItem(PKEYC))doSync(false);},0);
 checkReminder();
 if(fxOK()){ensureCanvas();initParts();nextDist=performance.now()+6000;kick();}
 const hashView=(location.hash||'').replace('#','');
 runBoot(function(){
  const target=(hashView&&VALID_VIEWS.indexOf(hashView)>=0)?hashView:'home';
  showView(target,null,{nofx:true,nohistory:true});
  try{history.replaceState({v:target},'','#'+target);}catch(e){}
 });
}

/* ==== ПРОФИЛИ ==== */
function countFor(p){try{const o=JSON.parse(localStorage.getItem('ironlog_d_'+p.id));return o?((o.sessions||[]).length+(o.measures||[]).length):0}catch(e){return 0}}
function switchPersona(id){localStorage.setItem(P_CUR,id);location.reload();}
function renderProfile(){
 const el=document.getElementById('profileBody'); if(!el)return;
 el.innerHTML=PERSONAS.map(p=>`
  <div class="ses">
   <div class="sh"><span class="d">${esc(p.name)}</span>${p.id===ME.id?'<span class="dl up">АКТИВНЫЙ</span>':'<span class="dl eq">НЕАКТИВНЫЙ</span>'}</div>
   <ul><li><span class="n">Записей в журнале</span><span class="w">${countFor(p)}</span></li></ul>
   ${p.id===ME.id?`
    <div class="pf-themes"><span class="pf-lab">Пакет:</span>${Object.keys(PACKS).map(k=>`<button class="ob-pk ${ME.pack===k?'on':''}" onclick="setPack('${k}')">${esc(PACKS[k].label||k)}</button>`).join('')}</div>
    <div class="pf-themes"><span class="pf-lab">Тема:</span>${TH_LIST.map(t=>`<button class="ob-th ${ME.theme===t?'on':''}" style="background:${TH_SW[t]}" title="${t}" onclick="setTheme('${t}')"></button>`).join('')}</div>
    <div class="pf-themes"><span class="pf-lab">PIN:</span><button class="ob-pk on" onclick="pinSetup()">${ME.pinHash?'сменить':'установить'}</button>${ME.pinHash?`<button class="ob-pk" onclick="pinRemove()">снять</button>`:''}</div>`
   :`<div class="mact" style="justify-content:flex-start;margin-top:10px"><button class="ghost" onclick="switchPersona('${p.id}')">Открыть профиль</button></div>`}
  </div>`).join('')+
  `<div class="actions"><button class="ghost" onclick="onboardCreate(false)">+ Добавить профиль</button></div>`;
}
function setPack(k){
 if(!ME||typeof PACKS==='undefined'||!PACKS[k])return;
 ME.pack=k;
 const p=personaById(ME.id);
 if(p){ p.pack=k; if(k==='oksana'&&!p.stats)p.stats='FEMALE · 153 CM · 50 Y'; savePersonas(); }
 applyPack(PACKS[k]);
 renderProfile();
 toast('[OK] ПАКЕТ: '+(PACKS[k].label||k).toUpperCase());
}

/* ==== FX ==== */
let fxCv=null,fxCtx=null,parts=[],bolts=[],flash=0,distFlash=0,loopOn=false,nextDist=0;
function ensureCanvas(){
 if(fxCv)return;
 fxCv=document.createElement('canvas');fxCv.id='fxcanvas';
 fxCv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:115;mix-blend-mode:screen';
 document.body.appendChild(fxCv);fxCtx=fxCv.getContext('2d');fxSize();
 addEventListener('resize',fxSize);
}
function fxSize(){const dpr=Math.min(devicePixelRatio||1,2);fxCv.width=innerWidth*dpr;fxCv.height=innerHeight*dpr;fxCtx.setTransform(dpr,0,0,dpr,0,0);}
function newPart(top){return{x:Math.random()*innerWidth,y:top?Math.random()*innerHeight:innerHeight+8,v:.12+Math.random()*.3,s:1+Math.random()*1.6,a:.18+Math.random()*.35,f:Math.random()*6.28}}
function initParts(){parts=Array.from({length:24},()=>newPart(true));}
function bolt(x,y,angle,len,width,depth){
 const pts=[[x,y]];let cx=x,cy=y,a=angle;const steps=(8+Math.random()*10)|0;
 for(let i=0;i<steps;i++){
  a+=(Math.random()-.5)*1.15;const s=len/steps;cx+=Math.cos(a)*s;cy+=Math.sin(a)*s;pts.push([cx,cy]);
  if(depth>0&&Math.random()<.16)bolt(cx,cy,a+(Math.random()<.5?-1:1)*(.6+Math.random()*.8),len*.35,width*.5,depth-1);
 }
 bolts.push({pts,w:width,life:1});
}
function eyeFlare(){const w=document.querySelector('.eye-wrap');if(w){w.classList.add('flare');setTimeout(()=>w.classList.remove('flare'),450);}}
function fireReward(x,y,pr){
 if(!fxOK())return; ensureCanvas();
 const n=pr?3:1;
 for(let i=0;i<n;i++)bolt(x,y,-Math.PI/2+(Math.random()-.5)*1.7,Math.max(innerWidth,innerHeight)*(.3+Math.random()*.35),2.4,2);
 flash=Math.max(flash,pr?1.5:0.9); eyeFlare();kick();
}
function fxLoop(t){
 if(document.hidden){loopOn=false;return;}
 fxCtx.clearRect(0,0,innerWidth,innerHeight);
 for(const p of parts){
  p.y-=p.v;p.f+=.05;const tw=p.a*(.6+.4*Math.sin(p.f));
  const g=FXC.ember[1]+(((p.f*37)|0)%70);
  fxCtx.fillStyle=`rgba(${FXC.ember[0]},${g},${FXC.ember[2]},${tw.toFixed(3)})`;
  fxCtx.fillRect(p.x,p.y,p.s,p.s);
  if(p.y<-8)Object.assign(p,newPart(false));
 }
 if(t>=nextDist){nextDist=t+18000+Math.random()*22000;distFlash=1;}
 if(distFlash>0){
  const g=fxCtx.createRadialGradient(innerWidth/2,innerHeight+60,10,innerWidth/2,innerHeight+60,innerHeight*.7);
  g.addColorStop(0,`rgba(${FXC.dist[0]},${FXC.dist[1]},${FXC.dist[2]},${(distFlash*.10).toFixed(3)})`);
  g.addColorStop(1,`rgba(${FXC.dist[0]},${FXC.dist[1]},${FXC.dist[2]},0)`);
  fxCtx.fillStyle=g;fxCtx.fillRect(0,0,innerWidth,innerHeight);distFlash-=.02;
 }
 if(flash>0){
  fxCtx.fillStyle=`rgba(${FXC.flash[0]},${FXC.flash[1]},${FXC.flash[2]},${(Math.min(flash,1.6)*0.11).toFixed(3)})`;
  fxCtx.fillRect(0,0,innerWidth,innerHeight);flash-=.07;
 }
 bolts=bolts.filter(b=>b.life>0);
 for(const b of bolts){
  fxCtx.shadowColor=FXC.boltGlow;fxCtx.shadowBlur=16*b.life;
  fxCtx.strokeStyle=`rgba(${FXC.bolt[0]},${FXC.bolt[1]},${FXC.bolt[2]},${b.life.toFixed(3)})`;
  fxCtx.lineWidth=b.w;fxCtx.beginPath();
  b.pts.forEach((p,i)=>i?fxCtx.lineTo(p[0],p[1]):fxCtx.moveTo(p[0],p[1]));
  fxCtx.stroke();
  fxCtx.strokeStyle=`rgba(255,255,255,${(b.life*.9).toFixed(3)})`;
  fxCtx.lineWidth=b.w*.4;fxCtx.stroke();
  b.life-=.085;
 }
 fxCtx.shadowBlur=0; requestAnimationFrame(fxLoop);
}
function kick(){if(!loopOn&&fxOK()){loopOn=true;requestAnimationFrame(fxLoop);}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)loopOn=false;else kick();});

/* ==== BOOT ==== */
function runBoot(done){
 const b=document.createElement('div');b.id='boot';
 const lines=['> CYBERDYNE TACTICAL CORE · ONLINE',
  `> PERSONA: ${ME?ME.name:'—'}`,
  `> THEME: ${(ME&&ME.theme||'terminator').toUpperCase()}`,
  `> SECURITY: ${ME&&ME.pinHash?'PIN LOCK ON':'OPEN'}`,
  `> SCHEMA: v2 · METRICS: 9`,
  `> MUSCLE DB: ${S.sessions.length} SESSIONS LOADED`,
  `> CLOUD LINK: ${GH.token?'SYNC ON':'SYNC OFF'}`];
 b.innerHTML=`<div class="b-lines">${lines.map((l,i)=>`<div style="animation-delay:${i*100}ms">${l}</div>`).join('')}</div>
  <div class="b-bar"><i></i></div><div class="b-skip">тап — пропуск</div>`;
 document.body.appendChild(b);
 let fin=false;
 const finish=()=>{if(fin)return;fin=true;b.classList.add('off');setTimeout(()=>b.remove(),320);document.body.classList.add('booted');done&&done();};
 b.addEventListener('pointerdown',finish);
 setTimeout(finish,1100);
}
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

/* ==== НАВИГАЦИЯ с History API ==== */
const VALID_VIEWS = ['home','train','measure','food','profile'];
function showView(v, ev, opts){
 opts = opts || {};
 if(VALID_VIEWS.indexOf(v)<0) v = 'home';
 const apply = () => {
  document.body.dataset.view = v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on','reveal'));
  const view = document.getElementById('view-'+v);
  view.classList.add('on'); void view.offsetWidth; view.classList.add('reveal');
  setTimeout(()=>view.classList.remove('reveal'),600);
  document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='train')renderTrain();
  if(v==='measure')renderMeasure();
  if(v==='home')renderHome();
  if(v==='profile')renderProfile();
  if(v==='food')renderFood();
  scrollTo({top:0}); checkReminder();
  if(!opts.fromPop && !opts.nohistory){
   try{ history.pushState({v}, '', '#'+v); }catch(e){}
  }
 };
 if(opts.nofx || !fxOK()){ apply(); return; }
 let x=innerWidth/2, y=innerHeight/2;
 if(ev && ev.currentTarget){const r=ev.currentTarget.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2;}
 fxTarget(x,y, apply);
}
addEventListener('popstate', e=>{
 const v = (e.state && e.state.v && VALID_VIEWS.indexOf(e.state.v)>=0) ? e.state.v : 'home';
 showView(v, null, {fromPop:true, nofx:true, nohistory:true});
});

function renderHome(){
 const last=S.sessions.length?[...S.sessions].sort((a,b)=>b.ts-a.ts)[0]:null;
 const lm=S.measures.length?[...S.measures].sort((a,b)=>b.ts-a.ts)[0]:null;
 document.getElementById('hstatus').innerHTML=
  `OPERATOR: <b>${esc(ME.name)}</b>${ME.stats?` · <b>${esc(ME.stats)}</b>`:''}<br>`+
  `SESSIONS: <b>${S.sessions.length}</b>${last?` · LAST: <b>${new Date(last.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})} · ${vol(last).toLocaleString('ru-RU')} кг</b>`:''}<br>`+
  `MEASURES: <b>${S.measures.length}</b>${lm&&lm.v.w?` · LAST WEIGHT: <b>${lm.v.w} кг</b>`:''}<br>`+
  `CLOUD: <b>${GH.token?'SYNC ON':'SYNC OFF'}</b>`;
 document.getElementById('ms-train').textContent=last?`последняя: ${new Date(last.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})} · ${vol(last).toLocaleString('ru-RU')} кг`:'журнал силовых · 3 дня';
 document.getElementById('ms-meas').textContent=lm&&lm.v.w?`последний: ${fmtDate(lm.date)} · ${lm.v.w} кг`:'история пропорций';
}

/* ==== GitHub sync ==== */
function b64utf8(s){const b=new TextEncoder().encode(s);let bin='';for(let i=0;i<b.length;i++)bin+=String.fromCharCode(b[i]);return btoa(bin)}
async function ghSha(path){
 const r=await fetch('https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/git/trees/HEAD?recursive=1',{
  headers:{'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'}
 });
 if(!r.ok)throw r.status;
 const j=await r.json();
 const f=(j.tree||[]).find(function(x){return x.path===path;});
 return f?f.sha:null;
}
async function ghPut(path,content){
 const base='https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path;
 const h={'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'};
 let sha=null;
 const g=await fetch(base,{headers:h});
 if(g.ok){
  const gt=await g.text();
  try{sha=JSON.parse(gt).sha||null;}catch(e){sha=null;}
  if(!sha){try{sha=await ghSha(path);}catch(e){}}
 } else if(g.status!==404)throw g.status;
 const body={message:'sync: auto-update '+path,content:b64utf8(content)};
 if(sha)body.sha=sha;
 const r=await fetch(base,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===409){
  sha=null;
  try{sha=await ghSha(path);}catch(e){}
  if(!sha)throw 409;
  const body2={message:'sync: auto-update '+path,content:b64utf8(content),sha:sha};
  const r2=await fetch(base,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(body2)});
  if(!r2.ok)throw r2.status;
 } else if(!r.ok)throw r.status;
}
async function ghDelete(owner,repo,path){
 const h={'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'};
 const g=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,{headers:h});
 if(g.status===404)return true; if(!g.ok)return false;
 const j=await g.json();
 const d=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,{method:'DELETE',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({message:'purge',sha:j.sha})});
 return d.ok;
}
function csvEsc(v){v=(v===undefined||v===null)?'':String(v);return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function buildTrainCSV(){
 const rows=[['Дата','Время','День','Упражнение','Подход','Вес_кг','Повторы','Примечание']];
 [...S.sessions].sort((a,b)=>a.ts-b.ts).forEach(s=>{
  const dt=new Date(s.ts);
  const ds=dt.toLocaleDateString('ru-RU'), tm=dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  (s.ex||[]).forEach(ex=>{
   (ex.sets||[]).forEach((set,k)=>{
    if(set[0]===''&&set[1]==='')return;
    rows.push([ds,tm,s.dayTitle,ex.name,k+1,set[0],set[1],ex.note||'']);
   });
  });
  if(s.cardio)rows.push([ds,tm,s.dayTitle,'Кардио (заминка)','','','',s.cardio.done?(s.cardio.min!==''?s.cardio.min+' мин':'выполнено'):'пропущено']);
 });
 return rows.map(r=>r.map(csvEsc).join(',')).join('\r\n');
}
/* объединение метрик: текущий пак + всё из данных; дедуп по ключу И по метке */
function allMetricDefs(){
 var seen={},seenLabel={},order=[];
 METRICS.forEach(function(mt){if(!seen[mt.k]&&!seenLabel[mt.l+'_'+mt.u]){seen[mt.k]=mt;seenLabel[mt.l+'_'+mt.u]=1;order.push(mt.k);}});
 S.measures.forEach(function(m){
  Object.keys(m.v||{}).forEach(function(k){
   if(seen[k])return;
   var def=null;
   if(typeof PACKS!=='undefined'){
    Object.keys(PACKS).forEach(function(pk){
     (PACKS[pk].METRICS||[]).forEach(function(mt){if(mt.k===k&&!def)def=mt;});
    });
   }
   def=def||{k:k,l:k,u:''};
   var lab=def.l+'_'+def.u;
   if(seenLabel[lab])return;
   seen[k]=def;seenLabel[lab]=1;
   order.push(k);
  });
 });
 return order.map(function(k){return seen[k];});
}
function METRICS_HEADER(){return ['Дата'].concat(allMetricDefs().map(function(mt){return mt.l+'_'+mt.u;}))}
function buildMeasCSV(){
 var defs=allMetricDefs();
 var rows=[METRICS_HEADER()];
 [...S.measures].sort((a,b)=>a.ts-b.ts).forEach(function(m){
  rows.push([fmtDateFull(m.date)].concat(defs.map(function(mt){return m.v[mt.k];})));
 });
 return rows.map(function(r){return r.map(csvEsc).join(',');}).join('\r\n');
}
let syncT=null;
function scheduleSync(){
 if(!GH.token)return;
 try{localStorage.setItem(PKEYC,'1');}catch(e){}
 clearTimeout(syncT); syncT=setTimeout(()=>doSync(false),1500); ghStatus();
}
async function doSync(manual){
 if(!GH.token){if(manual)toast('[!] СНАЧАЛА ПОДКЛЮЧИ ТОКЕН');return;}
 if(!navigator.onLine){if(manual)toast('[!] НЕТ СЕТИ — СИНК ПОЗЖЕ');return;}
 const sl=slugName(ME?ME.name:'persona');
 /* защита: не затираем облако пустым локальным журналом */
 if(!S.sessions.length&&!S.measures.length){
  let cloudHas=false;
  try{
   const t=await ghGet('trainings-'+sl+'.csv');
   if(t&&t.split(/\r?\n/).filter(function(l){return l.trim()!=='';}).length>1)cloudHas=true;
  }catch(e){}
  if(cloudHas){
   if(manual)toast('[!] ЛОКАЛЬНО ПУСТО — НАЖМИ «ВОССТАНОВИТЬ ИЗ ОБЛАКА»');
   return;
  }
 }
 try{
  await ghPut('trainings-'+sl+'.csv',buildTrainCSV());
  await ghPut('measures-'+sl+'.csv',buildMeasCSV());
  try{localStorage.removeItem(PKEYC);}catch(e){}
  toast('[CLOUD] GITHUB: ТАБЛИЦЫ ОБНОВЛЕНЫ');
 }catch(e){
  try{localStorage.setItem(PKEYC,'1');}catch(e){}
  toast(manual?'[CLOUD] ОШИБКА: '+e:'[CLOUD] НЕ СИНК — ПОВТОРЮ ПОЗЖЕ');
 }
 ghStatus();
}
async function purgePublic(){
 if(!GH.token){toast('[!] СНАЧАЛА ПОДКЛЮЧИ ТОКЕН');return;}
 if(!confirm('Удалить дубликаты без приставки из '+GH.repo+' и старые публичные CSV из '+OLD_REPO+'?'))return;
 const o=GH.owner||'asborozdin-a11y';
 const targets=[[o,GH.repo||'iron-data','trainings.csv'],[o,GH.repo||'iron-data','measures.csv'],[o,OLD_REPO,'trainings.csv'],[o,OLD_REPO,'measures.csv']];
 let ok=0,fail=0;
 for(const [ow,rp,p] of targets){try{if(await ghDelete(ow,rp,p))ok++;else fail++;}catch(e){fail++;}}
 toast(fail?`[CLOUD] УДАЛЕНО ${ok}, ОШИБОК ${fail}`:`[CLOUD] ЧИСТО: УДАЛЕНО ${ok}`);
}
function ghSave(){
 GH={token:document.getElementById('gh-token').value.trim(),
     owner:document.getElementById('gh-owner').value.trim()||'asborozdin-a11y',
     repo:document.getElementById('gh-repo').value.trim()||'iron-data'};
 try{localStorage.setItem(GHKC,JSON.stringify(GH));}catch(e){toast('[!] ОШИБКА СОХРАНЕНИЯ');return;}
 toast('[OK] НАСТРОЙКИ СОХРАНЕНЫ'); ghStatus();
 if(GH.token)doSync(true);
}
function ghStatus(){
 const el=document.getElementById('gh-status'); if(!el)return;
 const sl=slugName(ME?ME.name:'persona');
 el.innerHTML=!GH.token?'статус: <b>не подключено</b> — вставь токен один раз':
  `статус: <b>подключено</b> · ${esc(GH.owner)}/${esc(GH.repo)}<br>файлы: trainings-${esc(sl)}.csv · measures-${esc(sl)}.csv<br>${localStorage.getItem(PKEYC)?'есть несинхронизированные данные — жду сеть':'всё синхронизировано'}`;
}

/* ==== НАПОМИНАНИЯ ==== */
const REPN={none:'разово',daily:'ежедневно',weekly:'еженедельно',monthly:'ежемесячно'};
function remBase(){if(!S.reminder)return null;const[d]=(S.reminder.date||'').split('T');const t=S.reminder.time||'08:00';const dt=new Date(d+'T'+t);return isNaN(dt)?null:dt}
function nextReminder(){
 const r=S.reminder; if(!r||!r.enabled)return null;
 let d=remBase(); if(!d)return null;
 const now=new Date();
 if(r.repeat==='none')return d;
 while(d<now){
  if(r.repeat==='daily')d.setDate(d.getDate()+1);
  else if(r.repeat==='weekly')d.setDate(d.getDate()+7);
  else if(r.repeat==='monthly')d.setMonth(d.getMonth()+1);
  else break;
 }
 return d;
}
function remStatus(){
 const el=document.getElementById('rem-status'); if(!el)return;
 const r=S.reminder;
 if(!r||!r.enabled){el.innerHTML='статус: <b>напомнит при следующем открытии приложения</b>';return}
 const n=nextReminder();
 el.innerHTML=`напомнит при открытии после: <b>${n?fmtDate(n.toISOString().slice(0,10))+' '+(r.time||'08:00'):'—'}</b> · ${REPN[r.repeat]||'разово'}`;
}
let remModalTrap=null;
function openRem(){
 const r=S.reminder||{};
 document.getElementById('rem-date').value=r.date||todayISO();
 document.getElementById('rem-time').value=r.time||'08:00';
 document.getElementById('rem-repeat').value=r.repeat||'weekly';
 document.getElementById('remModal').classList.add('on');
 if(remModalTrap){try{remModalTrap();}catch(e){}}
 remModalTrap = trapFocus(document.getElementById('remModal'), closeRem);
}
function closeRem(){
 document.getElementById('remModal').classList.remove('on');
 if(remModalTrap){try{remModalTrap();}catch(e){} remModalTrap=null;}
}
function saveRem(){
 S.reminder={enabled:true,
  date:document.getElementById('rem-date').value||todayISO(),
  time:document.getElementById('rem-time').value||'08:00',
  repeat:document.getElementById('rem-repeat').value,
  lastFire:0,snooze:0};
 saveS();closeRem();remStatus();
 if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();
 toast('[OK] НАПОМИНАНИЕ ВКЛЮЧЕНО');
 checkReminder();
}
function remOff(){if(S.reminder){S.reminder.enabled=false;saveS();remStatus();toast('НАПОМИНАНИЕ ВЫКЛЮЧЕНО')}}
let remAlertTrap=null;
function checkReminder(){
 const r=S.reminder; if(!r||!r.enabled)return;
 const n=nextReminder(); if(!n)return;
 const now=Date.now();
 if(now>=n.getTime()&&now>=(r.snooze||0)&&(r.lastFire||0)<n.getTime()){
   r.lastFire=n.getTime(); saveS();
   document.getElementById('remAlert').classList.add('on');
   if(remAlertTrap){try{remAlertTrap();}catch(e){}}
   remAlertTrap = trapFocus(document.getElementById('remAlert'), snoozeRem);
   if('Notification' in window&&Notification.permission==='granted'){try{new Notification('IRON WORLD',{body:'Пора сделать замер тела'})}catch(e){}}
   remStatus();
 }
}
function snoozeRem(){
 document.getElementById('remAlert').classList.remove('on');
 if(remAlertTrap){try{remAlertTrap();}catch(e){} remAlertTrap=null;}
 if(S.reminder){S.reminder.snooze=Date.now()+3600*1000;saveS()}
 toast('[Z] ОТЛОЖЕНО НА 1 ЧАС');
}
function goMeasure(){
 document.getElementById('remAlert').classList.remove('on');
 if(remAlertTrap){try{remAlertTrap();}catch(e){} remAlertTrap=null;}
 if(S.reminder&&S.reminder.repeat==='none'){S.reminder.enabled=false;saveS();remStatus()}
 showView('measure');
}
setInterval(checkReminder,30000);

/* ==== SW registration + баннер обновления ==== */
function registerSW(){
 if(!('serviceWorker' in navigator)) return;
 navigator.serviceWorker.register('sw.js').then(reg=>{
  const showBanner = () => {
   if(document.getElementById('update-banner')) return;
   const b = document.createElement('div');
   b.id = 'update-banner';
   b.setAttribute('role','alert');
   b.innerHTML = '<span>Доступно обновление</span><button id="update-apply">Обновить</button>';
   document.body.appendChild(b);
   document.getElementById('update-apply').onclick = () => {
    if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
   };
  };
  if(reg.waiting) showBanner();
  reg.addEventListener('updatefound', ()=>{
   const nw = reg.installing;
   if(!nw) return;
   nw.addEventListener('statechange', ()=>{
    if(nw.state === 'installed' && navigator.serviceWorker.controller) showBanner();
   });
  });
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{ location.reload(); });
 }).catch(()=>{});
}

/* ==== СТАРТ ==== */
registerSW();
window.addEventListener('online',()=>{if(GH.token&&localStorage.getItem(PKEYC))doSync(false)});
document.addEventListener('input', e=>{
 if(typeof saveDraftDebounced==='function' && e.target && e.target.closest && e.target.closest('#workout')){
  if(e.target.dataset) e.target.dataset.inherited='false';
  saveDraftDebounced();
 }
});
document.addEventListener('change', e=>{
 if(typeof saveDraftDebounced==='function' && e.target && e.target.closest && e.target.closest('#workout')) saveDraftDebounced();
});
addEventListener('pagehide', ()=>{ if(typeof saveDraftDebounced==='function' && saveDraftDebounced.flush) saveDraftDebounced.flush(); });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && typeof saveDraftDebounced==='function' && saveDraftDebounced.flush) saveDraftDebounced.flush(); });
(function init(){
 const pid=localStorage.getItem(P_CUR);
 if(!PERSONAS.length){onboardCreate(!!localStorage.getItem(LEGACY));return;}
 if(!pid||!personaById(pid)){onboardSelect();return;}
 const p=personaById(pid);
 if(p.pinHash&&sessionStorage.getItem('ironlog_unlocked_'+pid)!=='1'){pinGate(p,()=>startApp(pid));return;}
 startApp(pid);
})();
