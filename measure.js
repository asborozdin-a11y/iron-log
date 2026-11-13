/* IRON WORLD · ЗАМЕРЫ v63: форма 9 метрик, графики, история */
function renderMeasure(){
 var host=document.getElementById('m-metrics');
 if(!host)return;
 var newest=[...S.measures].sort(function(a,b){return byMeas(b,a);});
 /* последнее известное значение показателя (из самого свежего замера, где он есть) */
 function lastVal(k){for(var i=0;i<newest.length;i++){var x=newest[i].v[k];if(x!==undefined&&x!=='')return x;}return '';}
 var h='';
 METRICS.forEach(function(mt,idx){
  var val=lastVal(mt.k);
  h+='<div class="mcell'+(idx===0?' hero':'')+'" data-rule="'+mt.rule+'">'
   +'<label for="m-'+mt.k+'"><span>'+esc(mt.l)+'</span><i class="mdir" title="'+(mt.rule==='dn'?'меньше - лучше':'больше - лучше')+'">'+(mt.rule==='dn'?'↓':'↑')+'</i></label>'
   +'<div class="mfield"><input type="number" step="0.1" min="0" inputmode="decimal" enterkeyhint="next" id="m-'+mt.k+'" placeholder="'+(val!==''?fmtNum(val):'—')+'" data-last="'+val+'" value=""><span class="munit">'+esc(mt.u)+'</span></div>'
   +'<div class="mdelta" id="md-'+mt.k+'" aria-live="polite"></div></div>';
 });
 host.innerHTML=h;
 var d=document.getElementById('m-date');
 if(d&&!d.value)d.value=todayISO();
 renderMeasCharts();
 renderMeasList();
 remStatus();
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
 S.measures.sort(byMeas);
 if(!saveS()){S.measures.pop();return false;}
 renderMeasure();renderHome();
 toast('[OK] ЗАМЕР СОХРАНЁН');
 scheduleSync();
 return false;
}
/* изменение к прошлому замеру считается прямо во время ввода; зелёный - в нужную сторону */
document.addEventListener('input',function(e){
 var inp=e.target;
 if(!inp||!inp.id||inp.id.indexOf('m-')!==0||!inp.closest)return;
 var cell=inp.closest('.mcell'); if(!cell)return;
 var out=cell.querySelector('.mdelta'), last=inp.dataset.last, v=parseFloat(inp.value);
 if(!out)return;
 if(isNaN(v)||last===''){out.textContent='';out.className='mdelta';return;}
 var d=Math.round((v-(+last))*10)/10, good=cell.dataset.rule==='dn'?d<0:d>0;
 out.className='mdelta'+(d===0?'':(good?' good':' bad'));
 out.textContent=(d===0?'= как в прошлый раз':(d>0?'▲ +':'▼ −')+fmtNum(Math.abs(d))+' к прошлому');
});
/* Enter переходит к следующему полю замера */
document.addEventListener('keydown',function(e){
 if(e.key!=='Enter'||!e.target||!e.target.closest||!e.target.closest('#m-metrics'))return;
 var all=[].slice.call(document.querySelectorAll('#m-metrics input')), i=all.indexOf(e.target);
 e.preventDefault();
 if(i>=0&&i<all.length-1)all[i+1].focus();else e.target.blur();
});
function delMeasure(ts){
 var i=-1;for(var n=0;n<S.measures.length;n++){if(S.measures[n].ts===ts){i=n;break;}}
 if(i<0)return;
 if(!confirm('Удалить этот замер?'))return;
 var removed=S.measures.splice(i,1)[0];
 allowOverwrite();
 if(!saveS()){S.measures.splice(i,0,removed);return;}
 renderMeasure();renderHome();toast('ЗАМЕР УДАЛЁН');scheduleSync();
}
function clearMeas(){if(confirm('Удалить все замеры?')){S.measures=[];allowOverwrite();if(saveS()){renderMeasure();renderHome();toast('ЗАМЕРЫ ОЧИЩЕНЫ');scheduleSync();}}}
function renderMeasCharts(){
 var host=document.getElementById('measHist');
 if(!host)return;
 var h='';
 METRICS.forEach(function(mt){
  var pts=[];
  [...S.measures].sort(byMeas).forEach(function(m){
   if(m.v[mt.k]!==undefined&&m.v[mt.k]!=='')pts.push({t:measKey(m),v:+m.v[mt.k]});
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
 var host=document.getElementById('measList'), last=document.getElementById('measLast'), det=document.getElementById('secMH');
 if(!host||!last)return;
 if(!S.measures.length){
  last.innerHTML='<div class="empty">// замеров пока нет — сделай первый</div>';
  host.innerHTML='';if(det)det.hidden=true;return;
 }
 var list=[...S.measures].sort(function(a,b){return byMeas(b,a);});
 function card(m){
  var cells='';
  METRICS.forEach(function(mt){
   var val=m.v[mt.k];
   if(val===undefined||val==='')return;
   cells+='<li><span class="n">'+esc(mt.l)+'</span><span class="w">'+fmtNum(val)+' '+esc(mt.u)+'</span></li>';
  });
  return '<div class="ses"><div class="sh"><span class="d">'+fmtDateFull(m.date)+'</span>'
   +'<button class="delbtn" aria-label="удалить замер" onclick="delMeasure('+m.ts+')">✕</button></div><ul>'+cells+'</ul></div>';
 }
 /* три последних - сразу на экране, остальные - в раскрывающемся списке */
 last.innerHTML=list.slice(0,3).map(card).join('');
 var older=list.slice(3);
 host.innerHTML=older.map(card).join('');
 if(det){det.hidden=!older.length;var sm=det.querySelector('summary');if(sm)sm.textContent='ЕЩЁ ЗАМЕРЫ ('+older.length+')';}
}
