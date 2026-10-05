/* IRON WORLD · ЗАМЕРЫ P2-fix: форма, история, графики динамики */

function renderMeasure(){
 var di=document.getElementById('m-date');
 if(!di.value)di.value=todayISO();
 var lastM=null;
 if(S.measures.length){
  var asc0=S.measures.slice().sort(function(a,b){return b.ts-a.ts;});
  lastM=asc0[0];
 }
 var html='';
 for(var i=0;i<METRICS.length;i++){
  var m=METRICS[i];
  var pv=(lastM&&lastM.v[m.k]!==''&&lastM.v[m.k]!==undefined)?lastM.v[m.k]:null;
  html+='<div class="mcell"><label>'+m.l+', '+m.u+'</label>'
   +'<input type="number" step="0.1" min="0" inputmode="decimal" id="mz-'+m.k+'" placeholder="'+(pv!==null?pv:m.u)+'"></div>';
 }
 document.getElementById('mform').innerHTML=html;
 remStatus();
 renderCharts();
 mhist();
}
function saveMeasure(){
 var v={};var any=false;
 for(var i=0;i<METRICS.length;i++){
  var m=METRICS[i];
  var el=document.getElementById('mz-'+m.k);
  v[m.k]=el.value===''?'':+el.value;
  if(v[m.k]!=='')any=true;
 }
 if(!any){toast('[!] ЗАПОЛНИ ХОТЯ БЫ ОДНО ПОЛЕ');return}
 S.measures.push({ts:Date.now(),date:document.getElementById('m-date').value||todayISO(),v:v});
 if(!saveS()){S.measures.pop();return;}
 renderMeasure();toast('[OK] ЗАМЕР СОХРАНЁН');
 eyeFlare();
 scheduleSync();
}
function delMeasure(ts){if(confirm('Удалить этот замер?')){S.measures=S.measures.filter(function(m){return m.ts!==ts;});if(saveS()){renderMeasure();toast('ЗАМЕР УДАЛЁН');scheduleSync();}}}
function dcls(rule,d){if(d===0)return'nt';if(rule==='nt')return'nt';if(rule==='dn')return d<0?'up':'dn';return d>0?'up':'dn'}

function renderCharts(){
 var host=document.getElementById('mcharts');
 if(!host){
  host=document.createElement('div');host.id='mcharts';
  var h2=document.querySelector('#view-measure h2.sec');
  if(h2&&h2.parentNode)h2.parentNode.insertBefore(host,h2); else return;
 }
 var asc=S.measures.slice().sort(function(a,b){return a.ts-b.ts;});
 if(asc.length<2){host.innerHTML='';return;}
 var html='<h2 class="sec">Динамика <span>//</span> графики</h2><div class="charts">';
 for(var i=0;i<METRICS.length;i++){
  var mt=METRICS[i];var pts=[];
  for(var j=0;j<asc.length;j++){
   var val=asc[j].v[mt.k];
   if(val!==''&&val!==undefined)pts.push({t:asc[j].ts,v:+val});
  }
  if(pts.length<2)continue;
  var first=pts[0].v,lastV=pts[pts.length-1].v;
  var df=Math.round((lastV-first)*10)/10;
  html+='<div class="chart"><div class="ch-head"><span>'+mt.l+', '+mt.u+'</span><b>'+lastV+'</b><i class="'+dcls(mt.rule,df)+'">'+(df>0?'▲':'▼')+Math.abs(df)+'</i></div>'+sparkline(pts)+'</div>';
 }
 html+='</div>';
 host.innerHTML=html;
}

function mhist(){
 var el=document.getElementById('mhist');
 if(!S.measures.length){el.innerHTML='<div class="empty">// замеров пока нет — сделай первый утром натощак</div>';return;}
 var asc=S.measures.slice().sort(function(a,b){return a.ts-b.ts;});
 var html='';
 for(var n=asc.length-1;n>=0;n--){
  var m=asc[n];
  var prevM=n>0?asc[n-1]:null;
  var head='<div class="sh"><span class="d">'+fmtDate(m.date)+'</span>'
   +(prevM?'<span class="dl eq">vs '+fmtDate(prevM.date)+'</span>':'<span class="dl eq">ПЕРВЫЙ</span>')
   +'<button class="delbtn" onclick="delMeasure('+m.ts+')" title="удалить" aria-label="Удалить замер">✖</button></div>';
  var grid='';
  for(var i=0;i<METRICS.length;i++){
   var mt=METRICS[i];
   var val=m.v[mt.k];
   if(val===''||val===undefined)continue;
   var d='';
   if(prevM&&prevM.v[mt.k]!==''&&prevM.v[mt.k]!==undefined){
    var df=Math.round((val-prevM.v[mt.k])*10)/10;
    if(df!==0)d=' <i class="'+dcls(mt.rule,df)+'">'+(df>0?'▲':'▼')+Math.abs(df)+'</i>';
   }
   grid+='<div class="mzv"><span>'+mt.l+'</span><b>'+val+'</b>'+d+'</div>';
  }
  html+='<div class="ses">'+head+'<div class="grid">'+grid+'</div></div>';
 }
 el.innerHTML=html;
}
