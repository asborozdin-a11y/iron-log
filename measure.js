/* IRON WORLD · ЗАМЕРЫ v63: форма 9 метрик, графики, история */
function renderMeasure(){
 var host=document.getElementById('m-metrics');
 if(!host)return;
 var lm=S.measures.length?[...S.measures].sort(function(a,b){return b.ts-a.ts;})[0]:null;
 var h='';
 METRICS.forEach(function(mt){
  var val=lm&&lm.v[mt.k]!==undefined&&lm.v[mt.k]!==''?lm.v[mt.k]:'';
  h+='<div class="mcell"><label>'+esc(mt.l)+', '+mt.u+'</label>'
   +'<input type="number" step="0.1" min="0" inputmode="decimal" id="m-'+mt.k+'" placeholder="'+(val!==''?val:mt.l)+'" value="">'
   +'<span class="mrule">'+(mt.rule==='dn'?'меньше = лучше':'больше = лучше')+'</span></div>';
 });
 host.innerHTML=h;
 var d=document.getElementById('m-date');
 if(d&&!d.value)d.value=todayISO();
 renderMeasCharts();
 renderMeasList();
}
function saveMeasure(){
 var date=document.getElementById('m-date').value||todayISO();
 var v={};var any=false;
 METRICS.forEach(function(mt){
  var el=document.getElementById('m-'+mt.k);
  var raw=el?el.value:'';
  if(raw!==''){v[mt.k]=+raw;any=true;}
 });
 if(!any){toast('[!] ЗАПОЛНИ ХОТЯ БЫ ОДНУ МЕТРИКУ');return false;}
 S.measures.push({ts:Date.now(),date:date,v:v});
 S.measures.sort(function(a,b){return a.ts-b.ts;});
 if(!saveS()){S.measures.pop();return false;}
 renderMeasure();renderHome();
 toast('[OK] ЗАМЕР СОХРАНЁН');
 scheduleSync();
 return false;
}
function clearMeas(){if(confirm('Удалить все замеры?')){S.measures=[];if(saveS()){renderMeasure();renderHome();toast('ЗАМЕРЫ ОЧИЩЕНЫ');scheduleSync();}}}
function renderMeasCharts(){
 var host=document.getElementById('measHist');
 if(!host)return;
 var h='';
 METRICS.forEach(function(mt){
  var pts=[];
  [...S.measures].sort(function(a,b){return a.ts-b.ts;}).forEach(function(m){
   if(m.v[mt.k]!==undefined&&m.v[mt.k]!=='')pts.push({t:m.ts,v:+m.v[mt.k]});
  });
  if(pts.length<2)return;
  var last=pts[pts.length-1].v, prev=pts[pts.length-2].v;
  var df=Math.round((last-prev)*10)/10;
  var cls,sign;
  if(df===0){cls='eq';sign='= ';}
  else if(df>0){cls=(mt.rule==='dn'?'dn':'up');sign='▲ +';}
  else{cls=(mt.rule==='dn'?'up':'dn');sign='▼ ';}
  h+='<div class="chart"><div class="ch-head"><span>'+esc(mt.l)+', '+mt.u+'</span><b>'+last+'</b><i class="'+cls+'">'+sign+Math.abs(df)+'</i></div>'+sparkline(pts.slice(-12))+'</div>';
 });
 host.innerHTML=h||'<div class="empty">// мало данных для графиков — сделай второй замер</div>';
}
function renderMeasList(){
 var host=document.getElementById('measList');
 if(!host)return;
 if(!S.measures.length){host.innerHTML='<div class="empty">// замеров пока нет — сделай первый</div>';return;}
 var list=[...S.measures].sort(function(a,b){return b.ts-a.ts;});
 var h='';
 list.forEach(function(m){
  var cells='';
  METRICS.forEach(function(mt){
   var val=m.v[mt.k];
   if(val===undefined||val==='')return;
   cells+='<li><span class="n">'+esc(mt.l)+'</span><span class="w">'+val+' '+mt.u+'</span></li>';
  });
  h+='<div class="ses"><div class="sh"><span class="d">'+fmtDate(m.date)+'</span></div><ul>'+cells+'</ul></div>';
 });
 host.innerHTML=h;
}
