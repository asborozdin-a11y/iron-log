/* IRON WORLD · РАЗДЕЛ «ПИТАНИЕ»: рендер памятки из пакета активной персоны */

function curPack(){
 try{
  const PK=(typeof PACKS!=='undefined')?PACKS:null;
  if(!PK)return null;
  return (ME&&PK[ME.pack])||PK.default||null;
 }catch(e){return null}
}
function renderFood(){
 const pk=curPack();
 const MAC=(pk&&pk.MACROS)?pk.MACROS:(typeof MACROS!=='undefined'?MACROS:[]);
 const FD=(pk&&pk.FOOD)?pk.FOOD:(typeof FOOD!=='undefined'?FOOD:[]);
 const SUP=(pk&&pk.SUPP)?pk.SUPP:[];
 const fm=document.getElementById('fmacros');
 const fw=document.getElementById('foodMeals');
 if(!fm||!fw)return;
 fm.innerHTML=MAC.map(m=>
  `<div class="fm ${m.cls||''}"><b>${m.v}</b><span>${m.l}</span><i style="width:${m.w||100}%"></i></div>`).join('');
 fw.innerHTML=
  FD.map(f=>`
  <div class="fmeal ${f.cls||''}">
   <span class="fn">${f.fn}</span>
   <p class="fgoal"><b>Цель:</b> ${f.goal}</p>
   ${f.items.map(it=>`<div class="frow"><span class="nm">${it.n}${it.h?` <u>${it.h}</u>`:''}${it.t||''}</span><span class="qt">${it.q}</span></div>`).join('')}
   ${f.note?`<div class="fnote"><b>${f.note.t}</b>${f.note.x}</div>`:''}
   ${f.alt?`<div class="falt"><em>Альт</em><p>${f.alt}</p></div>`:''}
  </div>`).join('')+
  `<div class="empty">Крупы — в сухом виде · Мясо и рыбу — в сыром · Сон 7–9 ч · Вода 2.5–3 л</div>`+
  (SUP.length?`<div class="fnote supp"><b>Нутрицевтическая поддержка</b>${SUP.map(s=>`<div class="supp-i">${s.n}${s.t?` <u>· ${s.t}</u>`:''}<div class="supp-x">${s.x}</div></div>`).join('')}</div>`:'');
}
renderFood();
