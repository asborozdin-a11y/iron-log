/* IRON WORLD · РАЗДЕЛ «ТРЕНИРОВКИ»: рендер дней, журнал, экспорт/импорт */

function tabs(){document.getElementById('tabs').innerHTML=DAYS.map(d=>
 `<button class="${d.id===cur?'on':''}" onclick="setDay(${d.id})">${d.t}</button>`).join('')}
function setDay(id){cur=id;renderTrain()}

function renderTrain(){
 tabs();
 const d=DAYS.find(x=>x.id===cur);
 document.getElementById('dayhead').textContent=`День ${d.id} · ${d.t} — ${d.sub}`;
 const prev=lastOf(cur);
 let html=(d.rules?`<div class="ex ss"><h3>Правила безопасности</h3>${d.rules.map(r=>`<div class="note">• ${r}</div>`).join('')}</div>`:'')+d.ex.map((e,i)=>{
  const pset=(prev&&prev.ex[i])?prev.ex[i]:null;
  const hasAny=pset&&pset.some(p=>p&&p[0]!=='');
  return `
  <div class="ex ${e.ss?'ss':''}">
   <h3>${e.n}</h3>
   <div class="meta"><b>${e.s} × ${e.r}</b> · отдых ${e.rest}</div>
   <div class="note">${e.note}</div>
   ${hasAny?`<button class="copybtn" onclick="copyPrev(${i})">&lt;&lt; повторить прошлый раз</button>`:''}
   <div class="sets">${Array.from({length:e.s},(_,k)=>{
     const p=(pset&&pset[k]&&pset[k][0]!=='')?pset[k]:['',''];
     const hasP=p[0]!=='';
     return `<div class="srow">
       <span class="lab"><b>${k+1}</b> ПОДХОД</span>
       <input type="number" step="0.5" min="0" inputmode="decimal" placeholder="${hasP?p[0]:'вес'}" data-e="${i}" data-s="${k}" data-f="w" value="">
       <input type="number" step="1" min="0" inputmode="numeric" placeholder="${hasP?(p[1]||'–'):'повт'}" data-e="${i}" data-s="${k}" data-f="r" value="">
     </div>`}).join('')}
   </div>
  </div>`}).join('');
 const pc=prev&&prev.cardio?prev.cardio:null;
 const pcMin=(pc&&pc.min!=='')?pc.min:null;
 html+=`
  <div class="ex cardio">
   <h3>Кардио <u style="text-decoration:none;color:var(--mut);font-weight:500">(заминка)</u></h3>
   <div class="meta">низкая интенсивность · пульс 110–130 · после силовой</div>
   <label class="ckrow"><input type="checkbox" id="ck-done" ${pc&&pc.done?'checked':''}><span>выполнено</span></label>
   <div class="sets"><div class="srow one">
     <span class="lab">МИНУТЫ</span>
     <input type="number" step="1" min="0" inputmode="numeric" id="ck-min" placeholder="${pcMin?pcMin:'мин'}" value="">
   </div></div>
  </div>`;
 document.getElementById('workout').innerHTML=html;
 journal();
}

function copyPrev(i){
 const prev=lastOf(cur); if(!prev||!prev.ex[i])return;
 prev.ex[i].forEach((set,k)=>{
  const wi=document.querySelector(`input[data-e="${i}"][data-s="${k}"][data-f="w"]`);
  const ri=document.querySelector(`input[data-e="${i}"][data-s="${k}"][data-f="r"]`);
  if(wi&&set[0]!=='')wi.value=set[0];
  if(ri&&set[1]!=='')ri.value=set[1];
 });
 toast('[<<] ПОДСТАВЛЕНО ИЗ ПРОШЛОЙ ТРЕНИРОВКИ');
}

function collect(){
 const d=DAYS.find(x=>x.id===cur);
 return d.ex.map((e,i)=>Array.from({length:e.s},(_,k)=>{
   const w=document.querySelector(`input[data-e="${i}"][data-s="${k}"][data-f="w"]`);
   const r=document.querySelector(`input[data-e="${i}"][data-s="${k}"][data-f="r"]`);
   return [w.value===''?'':+w.value, r.value===''?'':+r.value];
 }));
}

function save(){
 const ex=collect();
 if(!ex.some(a=>a.some(([w])=>w!==''))){toast('[!] ЗАПОЛНИ ВЕСА');return}
 /* детект личного рекорда до записи */
 let pr=false;
 ex.forEach((sets,i)=>{
  const nm=Math.max(0,...sets.map(s=>+s[0]||0));
  if(nm>0){
   const old=Math.max(0,...S.sessions.filter(s=>s.day===cur).flatMap(s=>(s.ex[i]||[]).map(x=>+x[0]||0)));
   if(nm>old)pr=true;
  }
 });
 const mv=document.getElementById('ck-min').value;
 const cardio={done:document.getElementById('ck-done').checked, min:mv===''?'':+mv};
 S.sessions.push({ts:Date.now(),day:cur,ex,cardio});saveS();renderTrain();
 toast(pr?'[PR] НОВЫЙ РЕКОРД ВЕСА!':'[OK] ЗАПИСАНО В ЖУРНАЛ');
 /* разряд-награда из кнопки сохранения */
 const b=document.querySelector('#view-train .actions button');
 const r=b?b.getBoundingClientRect():null;
 fireReward(r?r.left+r.width/2:innerWidth/2, r?r.top+r.height/2:innerHeight/2, pr);
 scheduleSync();
}
function clearInputs(){document.querySelectorAll('#workout input').forEach(i=>{if(i.type==='checkbox')i.checked=false;else i.value=''});toast('ПОЛЯ ОЧИЩЕНЫ')}

function journal(){
 const el=document.getElementById('journal');
 if(!S.sessions.length){el.innerHTML='<div class="empty">// журнал пуст — сохрани первую тренировку</div>';return}
 el.innerHTML=[...S.sessions].sort((a,b)=>b.ts-a.ts).map(s=>{
   const d=DAYS.find(x=>x.id===s.day);
   const same=[...S.sessions].filter(x=>x.day===s.day&&x.ts<s.ts).sort((a,b)=>b.ts-a.ts)[0];
   const v=vol(s), pv=same?vol(same):null;
   const dl=pv===null?'<span class="dl eq">ПЕРВАЯ</span>':
     v>pv?`<span class="dl up">▲ +${v-pv} кг</span>`:v<pv?`<span class="dl dn">▼ ${v-pv} кг</span>`:'<span class="dl eq">= 0</span>';
   const c=s.cardio?`<li><span class="n">Кардио</span><span class="w">${s.cardio.done?(s.cardio.min!==''?s.cardio.min+' мин':'ДА'):'—'}</span></li>`:'';
   return `<div class="ses">
     <div class="sh"><span class="d">${new Date(s.ts).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${d.t}</span>
     <span class="v">ТОННАЖ ${v.toLocaleString('ru-RU')} кг</span>${dl}</div>
     <ul>${s.ex.map((sets,i)=>{
        const str=sets.filter(([w])=>w!=='').map(([w,r])=>`${w}×${r||'–'}`).join(', ');
        return str?`<li><span class="n">${d.ex[i].n}</span><span class="w">${str}</span></li>`:''}).join('')}${c}
     </ul></div>`}).join('');
}

function exportJ(){
 const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='iron-log.json';a.click();
 toast('[>>] ФАЙЛ СОХРАНЁН');
}
document.getElementById('fileIn').addEventListener('change',async e=>{
 const f=e.target.files[0]; if(!f)return;
 try{
   const data=JSON.parse(await f.text());
   if(!data||(!Array.isArray(data.sessions)&&!Array.isArray(data.measures)))throw 0;
   (data.sessions||[]).forEach(s=>{if(!S.sessions.some(x=>x.ts===s.ts))S.sessions.push(s)});
   (data.measures||[]).forEach(m=>{if(!S.measures.some(x=>x.ts===m.ts))S.measures.push(m)});
   S.sessions.sort((a,b)=>a.ts-b.ts);S.measures.sort((a,b)=>a.ts-b.ts);
   saveS();renderTrain();renderMeasure();toast('[<<] ИМПОРТИРОВАНО');scheduleSync();
 }catch(err){toast('[!] ФАЙЛ ПОВРЕЖДЁН')}
 e.target.value='';
});
function clearJ(){if(confirm('Удалить все тренировки журнала? (замеры останутся)')){S.sessions=[];saveS();renderTrain();toast('ЖУРНАЛ ОЧИЩЕН');scheduleSync()}}
