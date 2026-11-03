/* IRON WORLD · ПИТАНИЕ v63: КБЖУ-плитки и приёмы из data.js */
function renderFood(){
 var mh=document.getElementById('macros');
 if(mh){
  mh.innerHTML='<div class="macro-grid">'+MACROS.map(function(m){
   return '<div class="macro"><span class="ml">'+esc(m.l)+'</span><b>'+m.v+' '+esc(m.u)+'</b><i style="background:'+m.c+'"></i></div>';
  }).join('')+'</div>';
 }
 var fh=document.getElementById('meals');
 if(fh){
  fh.innerHTML=FOOD.map(function(meal){
   return '<div class="meal"><h3>'+esc(meal.t)+'</h3><ul>'+meal.items.map(function(it){
    return '<li><span class="n">'+esc(it.n)+'</span><span class="w">'+esc(it.g)+'</span></li>';
   }).join('')+'</ul></div>';
  }).join('');
 }
}
