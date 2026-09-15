/* IRON WORLD · РАЗДЕЛ «ЗАМЕРЫ»: форма, история, напоминания */

function renderMeasure(){
 const di=document.getElementById('m-date');
 if(!di.value)di.value=todayISO();
 const lastM=S.measures.length?[...S.measures].sort((a,b)=>b.ts-a.ts)[0]:null;
 document.getElementById('mform').innerHTML=METRICS.map(m=>{
  const pv=lastM&&lastM.v[m.k]!==''&&lastM.v[m.k]!==undefined?lastM.v[m.k]:null;
  return `<div class="mcell"><label>${m.l}, ${m.u}</label>
   <input type="number" step="0.1" min="0" inputmode="decimal" id="mz-${m.k}" placeholder="${pv!==null?pv:m.u}"></div>`}).join('');
 remStatus();
 mhist();
}
function saveMeasure(){
 const v={};let any=false;
 METRICS.forEach(m=>{const el=document.getElementById('mz-'+m.k);v[m.k]=el.value===''?'':+el.value;if(v[m.k]!=='')any=true});
 if(!any){toast('[!] ЗАПОЛНИ ХОТЯ БЫ ОДНО ПОЛЕ');return}
 S.measures.push({ts:Date.now(),date:document.getElementById('m-date').value||todayISO(),v});
 saveS();renderMeasure();toast('[OK] ЗАМЕР СОХРАНЁН');
 scheduleSync();
}
function delMeasure(ts){if(confirm('Удалить этот замер?')){S.measures=S.measures.filter(m=>m.ts!==ts);saveS();renderMeasure();toast('ЗАМЕР УДАЛЁН');scheduleSync()}}
function dcls(rule,d){if(d===0)return'nt';if(rule==='nt')return'nt';if(rule==='dn')return d<0?'up':'dn';return d>0?'up':'dn'}
function mhist(){
 const el=document.getElementById('mhist');
 if(!S.measures.length){el.innerHTML='<div class="empty">// замеров пока нет — сделай первый утром натощак</div>';return}
 const asc=[...S.measures].sort((a,b)=>a.ts-b.ts);
 el.innerHTML=[...asc].reverse().map(m=>{
  const i=asc.indexOf(m);
  const prevM=i>0?asc[i-1]:null;
  return `<div class="ses">
   <div class="sh"><span class="d">${fmtDate(m.date)}</span>
   ${prevM?'<span class="dl eq">vs '+fmtDate(prevM.date)+'</span>':'<span class="dl eq">ПЕРВЫЙ</span>'}
   <button class="delbtn" onclick="delMeasure(${m.ts})" title="удалить">✖</button></div>
   <div class="grid">${METRICS.map(mt=>{
     const val=m.v[mt.k];
     if(val===''||val===undefined)return'';
     let d='';
     if(prevM&&prevM.v[mt.k]!==''&&prevM.v[mt.k]!==undefined){
       const df=Math.round((val-prevM.v[mt.k])*10)/10;
       if(df!==0)d=` <i class="${dcls(mt.rule,df)}">${df>0?'▲':'▼'}${Math.abs(df)}</i>`;
     }
     return `<div class="mzv"><span>${mt.l}</span><b>${val}</b>${d}</div>`}).join('')}
   </div></div>`}).join('');
}

/* ---- напоминания ---- */
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
 if(!r||!r.enabled){el.innerHTML='статус: <b>не настроено / выключено</b>';return}
 const n=nextReminder();
 el.innerHTML=`ближайшее: <b>${n?fmtDate(n.toISOString().slice(0,10))+' '+(r.time||'08:00'):'—'}</b> · ${REPN[r.repeat]||'разово'}`;
}
function openRem(){
 const r=S.reminder||{};
 document.getElementById('rem-date').value=r.date||todayISO();
 document.getElementById('rem-time').value=r.time||'08:00';
 document.getElementById('rem-repeat').value=r.repeat||'weekly';
 document.getElementById('remModal').classList.add('on');
}
function closeRem(){document.getElementById('remModal').classList.remove('on')}
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
function checkReminder(){
 const r=S.reminder; if(!r||!r.enabled)return;
 const n=nextReminder(); if(!n)return;
 const now=Date.now();
 if(now>=n.getTime()&&now>=(r.snooze||0)&&(r.lastFire||0)<n.getTime()){
   r.lastFire=n.getTime(); saveS();
   document.getElementById('remAlert').classList.add('on');
   if('Notification' in window&&Notification.permission==='granted'){try{new Notification('IRON WORLD',{body:'Пора сделать замер тела'})}catch(e){}}
   remStatus();
 }
}
function snoozeRem(){
 document.getElementById('remAlert').classList.remove('on');
 if(S.reminder){S.reminder.snooze=Date.now()+3600*1000;saveS()}
 toast('[Z] ОТЛОЖЕНО НА 1 ЧАС');
}
function goMeasure(){
 document.getElementById('remAlert').classList.remove('on');
 if(S.reminder&&S.reminder.repeat==='none'){S.reminder.enabled=false;saveS();remStatus()}
 showView('measure');
}
setInterval(checkReminder,30000);
