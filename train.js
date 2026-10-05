/* IRON WORLD · ТРЕНИРОВКИ v2.7: черновик по ключам, таймер на метке, wake-lock в Кардио */

function tabs(){
 var h='';
 for(var i=0;i<DAYS.length;i++){
  var d=DAYS[i];
  h+='<button class="'+(d.id===cur?'on':'')+'" onclick="setDay('+d.id+')">'+d.t+'</button>';
 }
 document.getElementById('tabs').innerHTML=h;
}
function setDay(id){cur=id;renderTrain()}

/* ==== черновики (по ключам упражнений, тост один раз на черновик) ==== */
function debounce(fn,ms){var t=null;var f=function(){clearTimeout(t);t=setTimeout(fn,ms);};f.flush=function(){clearTimeout(t);fn();};return f}
function DRAFT_KEY(){return ME?('ironlog_draft_'+ME.id+'_'+cur):'ironlog_draft_x'}
var draftToastForKey='';
function saveDraft(){
 if(!ME)return;
 try{
  var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
  if(!d)return;
  var data=[];
  for(var i=0;i<d.ex.length;i++){
   var row=[];
   for(var k=0;k<d.ex[i].s;k++){
    var w=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="w"]');
    var r=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="r"]');
    row.push([w?w.value:'', r?r.value:'']);
   }
   data.push({key:exKey(d.ex[i].n), sets:row});
  }
  var ckDone=document.getElementById('ck-done'), ckMin=document.getElementById('ck-min');
  localStorage.setItem(DRAFT_KEY(),JSON.stringify({ex:data, cardio:{done:ckDone?ckDone.checked:false, min:ckMin?ckMin.value:''}}));
 }catch(e){}
}
var saveDraftDebounced = debounce(saveDraft, 400);
function restoreDraft(){
 if(!ME)return false;
 var raw=localStorage.getItem(DRAFT_KEY());
 if(!raw)return false;
 try{
  var data=JSON.parse(raw);
  if(!data||!Array.isArray(data.ex))return false;
  var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
  if(!d)return false;
  var any=false;
  for(var n=0;n<data.ex.length;n++){
   var item=data.ex[n];
   if(!item||!item.key||!Array.isArray(item.sets))continue;
   var idx=-1;
   for(var i=0;i<d.ex.length;i++){if(exKey(d.ex[i].n)===item.key){idx=i;break;}}
   if(idx<0)continue;
   for(var k=0;k<item.sets.length;k++){
    var pair=item.sets[k];
    if(!Array.isArray(pair))continue;
    var w=document.querySelector('input[data-e="'+idx+'"][data-s="'+k+'"][data-f="w"]');
    var r=document.querySelector('input[data-e="'+idx+'"][data-s="'+k+'"][data-f="r"]');
    if(w&&pair[0]!==''){w.value=pair[0];w.dataset.inherited='false';any=true;}
    if(r&&pair[1]!==''){r.value=pair[1];r.dataset.inherited='false';}
   }
  }
  if(data.cardio&&typeof data.cardio==='object'){
   var ckDone=document.getElementById('ck-done'), ckMin=document.getElementById('ck-min');
   if(ckDone){ckDone.checked=!!data.cardio.done; if(data.cardio.done)any=true;}
   if(ckMin&&data.cardio.min!==''){ckMin.value=data.cardio.min; ckMin.dataset.inherited='false';}
  }
  if(any&&draftToastForKey!==DRAFT_KEY()){toast('[<<] ВОССТАНОВЛЕН НЕЗАВЕРШЁННЫЙ ВВОД');draftToastForKey=DRAFT_KEY();}
  return any;
 }catch(e){return false}
}
function dropDraft(){if(!ME)return;try{localStorage.removeItem(DRAFT_KEY());}catch(e){}}

/* ==== ТАЙМЕР ОТДЫХА (абсолютная метка) ==== */
var restTimer={endsAt:0,total:0,iv:null};
var restAC=null;
function restParse(str){var m=String(str||'').match(/(\d+)/);return m?+m[1]:0}
function restWidget(){
 var w=document.getElementById('restwidget');
 if(!w){
  w=document.createElement('div');w.id='restwidget';w.setAttribute('role','timer');
  w.innerHTML='<div id="rt-label">ОТДЫХ</div><div id="rt-time">00:00</div><div id="rt-bar"><i></i></div>'
   +'<div class="rt-btns"><button onclick="addRest(30)">+30 сек</button><button onclick="stopRest()">Пропустить</button></div>';
  document.body.appendChild(w);
 }
 return w;
}
function restBeep(){
 try{
  if(!restAC)return;
  if(restAC.state==='suspended')restAC.resume();
  var o=restAC.createOscillator(),g=restAC.createGain();
  o.connect(g);g.connect(restAC.destination);
  o.frequency.value=880;g.gain.value=0.15;
  o.start();o.stop(restAC.currentTime+0.18);
 }catch(e){}
}
function startRestFor(i){
 var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
 var e=d&&d.ex&&d.ex[i]; if(!e)return;
 var sec=restParse(e.rest);
 if(!sec){toast('[!] ДЛЯ ЭТОГО УПРАЖНЕНИЯ ОТДЫХ НЕ ЗАДАН');return;}
 startRest(sec,e.n);
}
function startRest(sec,label){
 stopRest();
 restTimer.total=sec;
 restTimer.endsAt=Date.now()+sec*1000;
 var w=restWidget();
 w.querySelector('#rt-label').textContent=esc(label||'ОТДЫХ');
 w.classList.add('on');
 try{
  if(!restAC)restAC=new (window.AudioContext||window.webkitAudioContext)();
  if(restAC.state==='suspended')restAC.resume();
 }catch(e){}
 restTimer.iv=setInterval(tickRest,250);
 tickRest();
}
function tickRest(){
 if(!restTimer.iv)return;
 var w=document.getElementById('restwidget'); if(!w)return;
 var leftMs=Math.max(0,restTimer.endsAt-Date.now());
 var left=Math.ceil(leftMs/1000);
 var mm=String(Math.floor(left/60));if(mm.length<2)mm='0'+mm;
 var ss=String(left%60);if(ss.length<2)ss='0'+ss;
 w.querySelector('#rt-time').textContent=mm+':'+ss;
 var p=restTimer.total?leftMs/1000/restTimer.total:0;
 w.querySelector('#rt-bar i').style.width=(Math.max(0,Math.min(1,p))*100)+'%';
 if(left<=0)finishRest();
}
function addRest(sec){
 if(!restTimer.iv)return;
 restTimer.endsAt+=sec*1000;
 restTimer.total+=sec;
 tickRest();
}
function finishRest(){
 stopRest();
 try{if(navigator.vibrate)navigator.vibrate([250,120,250]);}catch(e){}
 restBeep();
 toast('[T] ОТДЫХ ОКОНЧЕН — РАБОТАТЬ!');
 eyeFlare();
}
function stopRest(){
 if(restTimer.iv){clearInterval(restTimer.iv);restTimer.iv=null;}
 var w=document.getElementById('restwidget'); if(w)w.classList.remove('on');
}
document.addEventListener('visibilitychange',function(){
 if(!document.hidden&&restTimer.iv)tickRest();
});

/* ==== WAKE LOCK (чип живёт в блоке Кардио, не fixed) ==== */
var wl=null, wlEnabled=(localStorage.getItem('ironlog_wl')!=='0');
function keepAwake(on){
 if(on&&!wl&&navigator.wakeLock){navigator.wakeLock.request('screen').then(function(l){wl=l;updateWlChip();}).catch(function(){wl=null;updateWlChip();});}
 else if(!on&&wl){wl.release().then(function(){wl=null;updateWlChip();}).catch(function(){wl=null;updateWlChip();});}
}
function updateWlChip(){var c=document.getElementById('wl-chip');if(c)c.textContent=wl?'☀ экран: не гаснет':'☀ экран: как обычно';}
function toggleWake(){wlEnabled=!wlEnabled;try{localStorage.setItem('ironlog_wl',wlEnabled?'1':'0');}catch(e){}keepAwake(wlEnabled&&document.body.dataset.view==='train');}
new MutationObserver(function(){
 var inTrain=document.body.dataset.view==='train';
 if(inTrain){if(wlEnabled)keepAwake(true);}
 else{keepAwake(false);}
}).observe(document.body,{attributes:true,attributeFilter:['data-view']});
document.addEventListener('visibilitychange',function(){
 if(!document.hidden&&wlEnabled&&document.body.dataset.view==='train')keepAwake(true);
});

/* ==== СПАРКЛАЙН ==== */
function sparkline(points){
 if(!points||points.length<2)return '';
 var w=260,h=54,pad=6;
 var xs=[],ys=[];
 for(var i=0;i<points.length;i++){xs.push(points[i].t);ys.push(points[i].v);}
 var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs);
 var y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
 var d='';
 for(var j=0;j<points.length;j++){
  var sx=pad+((xs[j]-x0)/((x1-x0)||1))*(w-pad*2);
  var sy=h-pad-((ys[j]-y0)/((y1-y0)||1))*(h-pad*2);
  d+=(j?'L':'M')+sx.toFixed(1)+','+sy.toFixed(1);
 }
 var lx=(pad+((xs[xs.length-1]-x0)/((x1-x0)||1))*(w-pad*2)).toFixed(1);
 var ly=(h-pad-((ys[ys.length-1]-y0)/((y1-y0)||1))*(h-pad*2)).toFixed(1);
 return '<svg viewBox="0 0 '+w+' '+h+'" class="spark" role="img" aria-label="динамика с '+ys[0]+' до '+ys[ys.length-1]+'">'
  +'<path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  +'<circle cx="'+lx+'" cy="'+ly+'" r="3.5" fill="currentColor"/></svg>';
}
function renderVolChart(){
 var host=document.getElementById('volchart');
 if(!host){
  host=document.createElement('div');host.id='volchart';
  var anchor=document.querySelector('#view-train .actions');
  if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(host,anchor.nextSibling); else return;
 }
 var asc=S.sessions.slice().sort(function(a,b){return a.ts-b.ts;});
 var pts=[];
 for(var i=0;i<asc.length;i++){var v=vol(asc[i]);if(v>0)pts.push({t:asc[i].ts,v:v});}
 if(pts.length<2){host.innerHTML='';return;}
 var last=pts[pts.length-1].v, prev=pts[pts.length-2].v, df=last-prev;
 var cls=df>=0?'up':'dn', sign=df>=0?'▲':'▼';
 host.innerHTML='<div class="chart wide"><div class="ch-head"><span>тоннаж за тренировку</span><b>'
  +last.toLocaleString('ru-RU')+' кг</b><i class="'+cls+'">'+sign+Math.abs(df).toLocaleString('ru-RU')+'</i></div>'
  +sparkline(pts.slice(-12))+'</div>';
}

/* ==== рендер тренировки ==== */
function renderTrain(){
 tabs();
 var d=null;
 for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
 if(!d)return;
 document.getElementById('dayhead').textContent='День '+d.id+' · '+d.t+' — '+d.sub;
 var prev=lastOf(cur);
 var html='';
 if(d.rules){
  html+='<div class="ex ss"><h3>Правила безопасности</h3>';
  for(var r=0;r<d.rules.length;r++)html+='<div class="note">• '+esc(d.rules[r])+'</div>';
  html+='</div>';
 }
 for(var i=0;i<d.ex.length;i++){
  var e=d.ex[i];
  var key=exKey(e.n);
  var prevRec=null;
  if(prev&&prev.ex){for(var z=0;z<prev.ex.length;z++){if(prev.ex[z].key===key){prevRec=prev.ex[z];break;}}}
  var hasAny=false;
  if(prevRec&&prevRec.sets){for(var y=0;y<prevRec.sets.length;y++){if(prevRec.sets[y]&&prevRec.sets[y][0]!==''){hasAny=true;break;}}}
  var btns='';
  if(hasAny)btns+='<button class="copybtn" onclick="copyPrev('+i+')">&lt;&lt; прошлый раз</button>';
  if(restParse(e.rest))btns+='<button class="copybtn" onclick="startRestFor('+i+')">⏱ '+esc(e.rest)+'</button>';
  var sets='';
  for(var k=0;k<e.s;k++){
   var p=['',''];
   if(prevRec&&prevRec.sets&&prevRec.sets[k]&&prevRec.sets[k][0]!=='')p=prevRec.sets[k];
   var hasP=p[0]!=='';
   sets+='<div class="srow"><span class="lab"><b>'+(k+1)+'</b> ПОДХОД</span>'
    +'<input type="number" step="0.5" min="0" inputmode="decimal" placeholder="'+(hasP?esc(String(p[0])):'вес')+'" data-e="'+i+'" data-s="'+k+'" data-f="w" data-inherited="'+(hasP?'true':'false')+'" value="">'
    +'<input type="number" step="1" min="0" inputmode="numeric" placeholder="'+(hasP?esc(String(p[1]||'–')):'повт')+'" data-e="'+i+'" data-s="'+k+'" data-f="r" data-inherited="'+(hasP?'true':'false')+'" value="">'
    +'</div>';
  }
  html+='<div class="ex '+(e.ss?'ss':'')+'">'
   +'<h3>'+esc(e.n)+'</h3>'
   +'<div class="meta"><b>'+e.s+' × '+esc(e.r)+'</b> · отдых '+esc(e.rest)+'</div>'
   +'<div class="note">'+esc(e.note||'')+'</div>'
   +'<div class="ex-btns">'+btns+'</div>'
   +'<div class="sets">'+sets+'</div>'
   +'</div>';
 }
 var pc=prev?prev.cardio:null;
 var pcMin=(pc&&pc.min!=='')?pc.min:null;
 html+='<div class="ex cardio"><h3>Кардио <u style="text-decoration:none;color:var(--mut);font-weight:500">(заминка)</u></h3>'
  +'<div class="meta">низкая интенсивность · пульс 110–130 · после силовой</div>'
  +'<div class="ex-btns"><button class="copybtn" id="wl-chip" onclick="toggleWake()">☀ экран: …</button></div>'
  +'<label class="ckrow"><input type="checkbox" id="ck-done" '+((pc&&pc.done)?'checked':'')+'><span>выполнено</span></label>'
  +'<div class="sets"><div class="srow one"><span class="lab">МИНУТЫ</span>'
  +'<input type="number" step="1" min="0" inputmode="numeric" id="ck-min" placeholder="'+(pcMin?pcMin:'мин')+'" value="">'
  +'</div></div></div>';
 document.getElementById('workout').innerHTML=html;
 updateWlChip();
 restoreDraft();
 journal();
}

function copyPrev(i){
 var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
 var currentEx=d&&d.ex&&d.ex[i]; if(!currentEx)return;
 var key=exKey(currentEx.n);
 var prev=null;
 for(var n=S.sessions.length-1;n>=0;n--){
  var s=S.sessions[n];
  if(s.dayId===cur&&s.ex){for(var z=0;z<s.ex.length;z++){if(s.ex[z].key===key){prev=s;break;}}}
  if(prev)break;
 }
 if(!prev)return;
 var prevEx=null;
 for(var z2=0;z2<prev.ex.length;z2++){if(prev.ex[z2].key===key){prevEx=prev.ex[z2];break;}}
 if(!prevEx||!Array.isArray(prevEx.sets))return;
 for(var k=0;k<prevEx.sets.length;k++){
  var set=prevEx.sets[k];
  var wi=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="w"]');
  var ri=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="r"]');
  if(wi&&set[0]!==''){wi.value=set[0];wi.dataset.inherited='false';}
  if(ri&&set[1]!==''){ri.value=set[1];ri.dataset.inherited='false';}
 }
 toast('[<<] ПОДСТАВЛЕНО ПО НАЗВАНИЮ УПРАЖНЕНИЯ');
 saveDraftDebounced();
}

function collect(){
 var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
 var out=[];
 for(var i=0;i<d.ex.length;i++){
  var e=d.ex[i];var sets=[];
  for(var k=0;k<e.s;k++){
   var w=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="w"]');
   var r=document.querySelector('input[data-e="'+i+'"][data-s="'+k+'"][data-f="r"]');
   sets.push([w.value===''?'':+w.value, r.value===''?'':+r.value]);
  }
  out.push({ key:exKey(e.n), name:e.n, note:e.note||'', sets:sets });
 }
 return out;
}

function save(){
 var ex=collect();
 var has=false;
 for(var h1=0;h1<ex.length;h1++){for(var h2=0;h2<ex[h1].sets.length;h2++){if(ex[h1].sets[h2][0]!=='')has=true;}}
 if(!has){toast('[!] ЗАПОЛНИ ВЕСА');return}
 var pr=false;
 for(var c1=0;c1<ex.length;c1++){
  var c=ex[c1];var nm=0;
  for(var c2=0;c2<c.sets.length;c2++){var wv=+c.sets[c2][0]||0;if(wv>nm)nm=wv;}
  if(nm>0){
   var old=0;
   for(var s1=0;s1<S.sessions.length;s1++){
    var s=S.sessions[s1];
    if(s.dayId!==cur||!s.ex)continue;
    for(var s2=0;s2<s.ex.length;s2++){
     if(s.ex[s2].key!==c.key||!s.ex[s2].sets)continue;
     for(var s3=0;s3<s.ex[s2].sets.length;s3++){var ov=+s.ex[s2].sets[s3][0]||0;if(ov>old)old=ov;}
    }
   }
   if(nm>old)pr=true;
  }
 }
 var mv=document.getElementById('ck-min').value;
 var cardio={done:document.getElementById('ck-done').checked, min:mv===''?'':+mv};
 var d=null;for(var q=0;q<DAYS.length;q++){if(DAYS[q].id===cur)d=DAYS[q];}
 S.sessions.push({
  ts:Date.now(), v:2,
  packId:(ME&&ME.pack)||'default',
  dayId:cur,
  dayTitle:(d?d.t:'День '+cur),
  ex:ex, cardio:cardio
 });
 if(!saveS()){S.sessions.pop();return;}
 dropDraft();
 renderTrain();
 toast(pr?'[PR] НОВЫЙ РЕКОРД ВЕСА!':'[OK] ЗАПИСАНО В ЖУРНАЛ');
 var b=document.querySelector('#view-train .actions button');
 var r=b?b.getBoundingClientRect():null;
 fireReward(r?r.left+r.width/2:innerWidth/2, r?r.top+r.height/2:innerHeight/2, pr);
 scheduleSync();
}
function clearInputs(){
 document.querySelectorAll('#workout input').forEach(function(i){if(i.type==='checkbox')i.checked=false;else{i.value='';if(i.dataset)i.dataset.inherited='false';}});
 dropDraft();
 toast('ПОЛЯ ОЧИЩЕНЫ');
}

function journal(){
 renderVolChart();
 var el=document.getElementById('journal');
 if(!S.sessions.length){el.innerHTML='<div class="empty">// журнал пуст — сохрани первую тренировку</div>';return;}
 var list=S.sessions.slice().sort(function(a,b){return b.ts-a.ts;});
 var html='';
 for(var n=0;n<list.length;n++){
  var s=list[n];
  var same=null;
  for(var m=0;m<S.sessions.length;m++){
   var x=S.sessions[m];
   if(x.dayId===s.dayId&&x.ts<s.ts){if(!same||x.ts>same.ts)same=x;}
  }
  var v=vol(s), pv=same?vol(same):null;
  var dl;
  if(pv===null)dl='<span class="dl eq">ПЕРВАЯ</span>';
  else if(v>pv)dl='<span class="dl up">▲ +'+(v-pv)+' кг</span>';
  else if(v<pv)dl='<span class="dl dn">▼ '+(v-pv)+' кг</span>';
  else dl='<span class="dl eq">= 0</span>';
  var rows='';
  for(var e2=0;e2<(s.ex||[]).length;e2++){
   var ex=s.ex[e2];var str='';
   for(var t2=0;t2<(ex.sets||[]).length;t2++){
    var set=ex.sets[t2];
    if(set[0]==='')continue;
    if(str)str+=', ';
    str+=set[0]+'×'+(set[1]||'–');
   }
   if(str)rows+='<li><span class="n">'+esc(ex.name)+'</span><span class="w">'+str+'</span></li>';
  }
  var c='';
  if(s.cardio)c='<li><span class="n">Кардио</span><span class="w">'+esc(s.cardio.done?(s.cardio.min!==''?s.cardio.min+' мин':'ДА'):'—')+'</span></li>';
  html+='<div class="ses"><div class="sh"><span class="d">'+new Date(s.ts).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+esc(s.dayTitle||'')+'</span>'
   +'<span class="v">ТОННАЖ '+v.toLocaleString('ru-RU')+' кг</span>'+dl+'</div>'
   +'<ul>'+rows+c+'</ul></div>';
 }
 el.innerHTML=html;
}

function exportJ(){
 var b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
 var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='iron-log.json';a.click();
 toast('[>>] ФАЙЛ СОХРАНЁН');
}
document.getElementById('fileIn').addEventListener('change',function(e){
 var f=e.target.files[0]; if(!f)return;
 f.text().then(function(txt){
  try{
   var data=JSON.parse(txt);
   if(!data||(!Array.isArray(data.sessions)&&!Array.isArray(data.measures)))throw 0;
   var imported=0, skipped=0;
   (data.sessions||[]).forEach(function(s){
     var clean=sanitizeSession(s);
     if(clean&&!S.sessions.some(function(x){return x.ts===clean.ts;})){S.sessions.push(clean);imported++;}
     else skipped++;
   });
   (data.measures||[]).forEach(function(m){
     var clean=sanitizeMeasure(m);
     if(clean&&!S.measures.some(function(x){return x.ts===clean.ts;})){S.measures.push(clean);imported++;}
     else skipped++;
   });
   S.sessions.sort(function(a,b){return a.ts-b.ts;});
   S.measures.sort(function(a,b){return a.ts-b.ts;});
   if(!saveS()){toast('[!] ОШИБКА СОХРАНЕНИЯ');e.target.value='';return;}
   renderTrain();renderMeasure();
   toast('[<<] ИМПОРТ: '+imported+' записей'+(skipped?', отклонено '+skipped:''));
   scheduleSync();
  }catch(err){toast('[!] ФАЙЛ ПОВРЕЖДЁН ИЛИ СОДЕРЖИТ НЕДОПУСТИМЫЕ ДАННЫЕ');}
  e.target.value='';
 }).catch(function(){toast('[!] НЕ ЧИТАЕТСЯ ФАЙЛ');e.target.value='';});
});
function clearJ(){if(confirm('Удалить все тренировки журнала? (замеры останутся)')){S.sessions=[];if(saveS()){renderTrain();toast('ЖУРНАЛ ОЧИЩЕН');scheduleSync();}}}

/* ==== ВОССТАНОВЛЕНИЕ ИЗ ОБЛАКА ==== */
function csvSplit(line){
 var out=[],cur='',q=false;
 for(var i=0;i<line.length;i++){
  var ch=line[i];
  if(q){
   if(ch=='"'){if(line[i+1]=='"'){cur+='"';i++;}else q=false;}
   else cur+=ch;
  }else{
   if(ch=='"')q=true;
   else if(ch==','){out.push(cur);cur='';}
   else cur+=ch;
  }
 }
 out.push(cur);return out;
}
function parseTrainCSV(text){
 var lines=text.split(/\r?\n/).filter(function(l){return l.trim()!=='';});
 if(lines.length<2)return [];
 var sessions=[],curS=null,curEx=null;
 for(var n=1;n<lines.length;n++){
  var r=csvSplit(lines[n]);
  var ds=r[0]||'',tm=r[1]||'',dayT=r[2]||'',exName=r[3]||'',w=r[5]||'',rep=r[6]||'',note=r[7]||'';
  if(!ds||!exName)continue;
  var keyS=ds+'|'+tm+'|'+dayT;
  if(!curS||curS._k!==keyS){
   var dmy=ds.split('.');
   var yy=+dmy[2];if(yy<100)yy+=2000;
   var hm=(tm||'00:00').split(':');
   var ts=new Date(yy,+dmy[1]-1,+dmy[0],+hm[0]||0,+hm[1]||0).getTime();
   var dayId=1;
   for(var q=0;q<DAYS.length;q++){if(DAYS[q].t===dayT){dayId=DAYS[q].id;break;}}
   curS={_k:keyS,ts:ts,v:2,packId:(ME&&ME.pack)||'default',dayId:dayId,dayTitle:dayT,ex:[],cardio:null};
   sessions.push(curS);curEx=null;
  }
  if(exName.indexOf('Кардио')===0){
   var done=note!=='пропущено';
   var mm=String(note).match(/(\d+)\s*мин/);
   curS.cardio={done:done,min:mm?+mm[1]:''};
   continue;
  }
  if(!curEx||curEx.name!==exName){
   curEx={key:exKey(exName),name:exName,note:'',sets:[]};
   curS.ex.push(curEx);
  }
  curEx.sets.push([w===''?'':+w, rep===''?'':+rep]);
 }
 return sessions.map(function(s){delete s._k;return s;});
}
function parseMeasCSV(text){
 var lines=text.split(/\r?\n/).filter(function(l){return l.trim()!=='';});
 if(lines.length<2)return [];
 var head=csvSplit(lines[0]);
 var cols=[];
 for(var h=1;h<head.length;h++){
  var lab=head[h].trim();
  if(!lab)continue;
  var key=null;
  if(typeof PACKS!=='undefined'){
   Object.keys(PACKS).forEach(function(pk){
    (PACKS[pk].METRICS||[]).forEach(function(mt){
     if(!key&&(mt.l+'_'+mt.u)===lab)key=mt.k;
    });
   });
  }
  if(!key)key='x_'+lab.toLowerCase().replace(/[^a-zа-яё0-9]+/g,'_');
  cols.push({idx:h,key:key});
 }
 var out=[];
 for(var n=1;n<lines.length;n++){
  var r=csvSplit(lines[n]);
  var raw=(r[0]||'').trim();
  var iso='';
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)){
   iso=raw.slice(0,10);
  }else{
   var dm=raw.split('.');
   if(dm.length===3){
    var yy=+dm[2];if(yy<100)yy+=2000;
    var mm=dm[1];if(mm.length<2)mm='0'+mm;
    var dd=dm[0];if(dd.length<2)dd='0'+dd;
    iso=yy+'-'+mm+'-'+dd;
   }
  }
  if(!iso)continue;
  var v={};
  cols.forEach(function(c){
   var cell=(r[c.idx]||'').trim();
   v[c.key]=cell===''?'':+cell;
  });
  out.push({ts:new Date(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10),8,0).getTime(),date:iso,v:v});
 }
 return out;
}
function ghGet(path){
 return fetch('https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path,{
  headers:{'Authorization':'Bearer '+GH.token,'Accept':'application/vnd.github+json'}
 }).then(function(r){
  if(r.status===404)return null;
  if(!r.ok)throw r.status;
  return r.text();
 }).then(function(txt){
  if(txt===null)return null;
  var t=String(txt).trim();
  if(t.charAt(0)==='{'){
   try{
    var j=JSON.parse(t);
    if(j&&j.content){
     var bin=atob(j.content.replace(/\s/g,''));
     var bytes=new Uint8Array(bin.length);
     for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
     return new TextDecoder('utf-8').decode(bytes);
    }
    if(j&&j.size&&j.size>1048576)throw new Error('ФАЙЛ >1МБ — ИСПОЛЬЗУЙ ЭКСПОРТ/ИМПОРТ JSON');
    return null;
   }catch(e){
    if(String(e.message||'').indexOf('>1МБ')>=0)throw e;
    return txt;
   }
  }
  return txt;
 });
}
function ghRestore(){
 if(!GH.token){toast('[!] СНАЧАЛА ПОДКЛЮЧИ ТОКЕН');return;}
 var sl=slugName(ME?ME.name:'persona');
 ghGet('trainings-'+sl+'.csv').then(function(tTxt){
  return ghGet('measures-'+sl+'.csv').then(function(mTxt){
   var ses=(tTxt?parseTrainCSV(tTxt):[]).map(sanitizeSession).filter(function(x){return x;});
   var mes=(mTxt?parseMeasCSV(mTxt):[]).map(sanitizeMeasure).filter(function(x){return x;});
   if(!ses.length&&!mes.length){toast('[!] В ОБЛАКЕ ПУСТО');return;}
   if(!confirm('Восстановить из облака: тренировок '+ses.length+', замеров '+mes.length+'. Локальные записи не удаляются — будет слияние.'))return;
   var localSessionKeys={};
   S.sessions.forEach(function(x){localSessionKeys[x.dayId+'|'+Math.floor(x.ts/60000)]=true;});
   var localMeasureDates={};
   S.measures.forEach(function(x){localMeasureDates[x.date]=true;});
   var addS=0,addM=0;
   ses.forEach(function(s){
    var key=s.dayId+'|'+Math.floor(s.ts/60000);
    if(localSessionKeys[key])return;
    localSessionKeys[key]=true;
    S.sessions.push(s);addS++;
   });
   mes.forEach(function(m){
    if(localMeasureDates[m.date])return;
    localMeasureDates[m.date]=true;
    S.measures.push(m);addM++;
   });
   S.sessions.sort(function(a,b){return a.ts-b.ts;});
   S.measures.sort(function(a,b){return a.ts-b.ts;});
   if(!saveS()){toast('[!] ОШИБКА СОХРАНЕНИЯ');return;}
   renderTrain();renderMeasure();renderHome();
   toast('[CLOUD] ВОССТАНОВЛЕНО: '+addS+' трен., '+addM+' зам.');
  });
 }).catch(function(e){toast('[CLOUD] ОШИБКА: '+e);});
}
