/* IRON WORLD · РАЗДЕЛ «ПИТАНИЕ»: рендер памятки из данных FOOD */

function renderFood(){
 document.getElementById('fmacros').innerHTML=MACROS.map(m=>
  `<div class="fm ${m.cls}"><b>${m.v}</b><span>${m.l}</span><i style="width:${m.w}%"></i></div>`).join('');
 document.getElementById('foodMeals').innerHTML=FOOD.map(f=>`
  <div class="fmeal ${f.cls}">
   <span class="fn">${f.fn}</span>
   <p class="fgoal"><b>Цель:</b> ${f.goal}</p>
   ${f.items.map(it=>`<div class="frow"><span class="nm">${it.n}${it.h?` <u>${it.h}</u>`:''}${it.t||''}</span><span class="qt">${it.q}</span></div>`).join('')}
   ${f.note?`<div class="fnote"><b>${f.note.t}</b>${f.note.x}</div>`:''}
   ${f.alt?`<div class="falt"><em>Альт</em><p>${f.alt}</p></div>`:''}
  </div>`).join('')+
  `<div class="empty">Крупы — в сухом виде · Мясо и рыбу — в сыром · Сон 7–9 ч · Вода 2.5–3 л</div>`;
}
renderFood();
