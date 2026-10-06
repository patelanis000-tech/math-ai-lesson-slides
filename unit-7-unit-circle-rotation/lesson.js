'use strict';
(() => {
const TAU=2*Math.PI, HALF=Math.PI/2, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const slides=[...document.querySelectorAll('main > .slide')], menu=document.querySelector('#menu'), dialog=document.querySelector('#answer');
let current=0,returnFocus=null;
const stopAll=()=>document.querySelectorAll('.widget').forEach(w=>w.stopMotion?.());
function go(n){stopAll();if(dialog.open)dialog.close();current=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current));});menu.value=String(current);document.querySelector('#count').textContent=`${current+1} / ${slides.length}`;document.querySelector('#prev').disabled=current===0;document.querySelector('#next').disabled=current===slides.length-1;document.querySelector('#progress').style.width=`${100*(current+1)/slides.length}%`;history.replaceState(null,'',`#slide-${current+1}`);window.scrollTo({top:0,behavior:'instant'});}
slides.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${s.dataset.title}`;menu.append(o);});
menu.addEventListener('change',()=>go(+menu.value));document.querySelector('#prev').onclick=()=>go(current-1);document.querySelector('#next').onclick=()=>go(current+1);
document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{stopAll();const t=document.getElementById('answer-'+b.dataset.answer);if(!t)return;returnFocus=b;document.querySelector('#answerTitle').textContent=t.dataset.title;document.querySelector('#answerBody').replaceChildren(t.querySelector('.solution').cloneNode(true));dialog.showModal();dialog.scrollTop=0;document.querySelector('#answerClose').focus({preventScroll:true});});
document.querySelector('#answerClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||dialog.open||e.target.closest('input,select,button,a,summary,[role=slider]'))return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(current+1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(current-1);}});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#slide-(\d+)$/);if(m)go(+m[1]-1);});
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.querySelector('#fullscreen').title='Use your browser fullscreen command (usually F11).';}};
window.addEventListener('blur',stopAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});reduced.addEventListener('change',stopAll);
const fixed=(v,d=3)=>{if(Math.abs(v)<0.5*10**-d)v=0;return v.toFixed(d).replace('-','−');};
const clean=v=>Math.abs(v)<1e-12?0:v;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function piName(t){const q=t/Math.PI;for(const d of [1,2,3,4,6,8,12]){const n=Math.round(q*d);if(Math.abs(q-n/d)<1e-8){if(!n)return '0';return `${n<0?'−':''}${Math.abs(n)===1?'':Math.abs(n)}π${d===1?'':'/'+d}`;}}return fixed(t,3);}
function parseAngle(raw){const s=raw.trim().toLowerCase().replace(/−/g,'-').replace(/π/g,'pi').replace(/\s/g,'').replace(/\*/g,'');const m=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)?)(pi)?(?:\/([+-]?(?:\d+(?:\.\d*)?|\.\d+)))?$/);if(!m||(!m[2]&&!/\d/.test(m[1])))return NaN;const a=m[1]===''||m[1]==='+'?1:m[1]==='-'?-1:Number(m[1]), b=m[3]===undefined?1:Number(m[3]);return b===0?NaN:a*(m[2]?Math.PI:1)/b;}
const line=(x1,y1,x2,y2,c='#85e3c5',w=2,d='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:''}/>`;
const text=(x,y,s,c='#dae8e9',size=17,anchor='start')=>`<text class="label" x="${x}" y="${y}" fill="${c}" font-size="${size}" text-anchor="${anchor}">${escape(s)}</text>`;
function arrow(cx,cy,px,py,c,w=3){const a=Math.atan2(py-cy,px-cx),h=10;return line(cx,cy,px,py,c,w)+`<path d="M${px-h*Math.cos(a-.45)} ${py-h*Math.sin(a-.45)} L${px} ${py} L${px-h*Math.cos(a+.45)} ${py-h*Math.sin(a+.45)}" fill="none" stroke="${c}" stroke-width="${w}"/>`;}
const button=(a,label)=>`<button type="button" data-action="${a}">${label}</button>`;
const field=(val,min,max)=>`<div class="angle-row"><label>Move the angle (radians)<input data-angle="range" type="range" aria-label="Angle in radians" min="${min}" max="${max}" step="0.001" value="${val}"></label><label>θ / rad · e.g. 3pi/2<input data-angle="text" type="text" spellcheck="false" autocomplete="off" aria-label="Angle in radians; pi fractions accepted" value="${val}"></label></div>`;
let uid=0;
document.querySelectorAll('.widget').forEach(el=>{
 const id='w'+(++uid),kind=el.dataset.kind,graph=kind==='graph',initial=Number(el.dataset.theta)||0,min=graph?0:-TAU,max=2*TAU;
 const state={theta:initial,pin:initial,normalized:false,second:false,magnitude:false,full:false,mode:el.dataset.mode||'sin',n:0,moving:false};el.model=state;el.classList.add(kind);
 let controls='',angle=true;
 if(kind==='normalize'){controls=button('normalize','Show unit vector')+button('reset','Reset');angle=false;}
 else if(kind==='quarter'){controls=button('apply','Apply J')+button('reset','Reset');angle=false;}
 else if(graph)controls=button('sin','Sine')+button('cos','Cosine')+button('both','Both')+button('play','Play / pause')+button('full','Full curves')+button('trace','Trace only')+button('reset','Reset');
 else if(kind==='transform')controls=button('pin','Pin this point')+button('reset','Reset')+button('reflect-y','Reflect in y-axis')+button('half','Half-turn')+button('reflect-x','Reflect in x-axis')+button('quarter','Quarter-turn');
 else if(kind==='vertical')controls=button('before','Before π/2')+button('axis','At π/2')+button('after','After π/2');
 else if(kind==='basis')controls=button('second','Show second image')+button('reset','Reset')+button('play','Play / pause');
 else if(kind==='identity')controls=button('magnitude','Check magnitude')+button('reset','Reset')+button('play','Play / pause');
 else controls=button('play','Play / pause')+button('reset','Reset')+button('opposite',kind==='tangent'?'Opposite direction':'Add π/2');
 const hint=graph?'The trace runs from 0 to the selected angle. Playback pauses at each quarter-turn.':kind==='normalize'?'The dashed circle has radius 5. The smaller mint circle has radius 1.':kind==='quarter'?'One application makes one anticlockwise quarter-turn. Reset after four applications.':'Drag the point, use the slider, or type radians and press Enter. Arrow keys move a focused point; Shift makes a larger step.';
 el.innerHTML=(graph?`<div class="tracePlots"><svg data-circle viewBox="0 0 400 330" role="img" aria-label="Rotating unit vector"></svg><svg data-graph viewBox="0 0 660 330" role="img" aria-label="Coordinate against angle"></svg></div>`:`<div class="drawing"><svg data-circle viewBox="0 0 620 330" role="img" aria-label="Interactive unit circle"></svg></div>`)+`<div class="readouts" aria-live="off"></div>`+(angle?field(initial,min,max):'')+`<div class="controls ${kind==='transform'?'four':angle?'':'two'}">${controls}</div><p class="status" role="status"></p><p class="caption">${hint}</p>`;
 const svg=el.querySelector('[data-circle]'),out=el.querySelector('.readouts'),status=el.querySelector('.status'),range=el.querySelector('[data-angle=range]'),input=el.querySelector('[data-angle=text]');
 let raf=0,last=0,target=0;
 function stop(){cancelAnimationFrame(raf);state.moving=false;el.querySelector('[data-action=play]')?.setAttribute('aria-pressed','false');}el.stopMotion=stop;
 function render(){
  const focused=document.activeElement?.matches('[data-handle]')&&el.contains(document.activeElement);
  const sw=Math.max(250,svg.clientWidth),sh=Math.max(180,svg.clientHeight);if(graph)svg.setAttribute('viewBox',`0 0 ${sw} ${sh}`);const t=state.theta,x=clean(Math.cos(t)),y=clean(Math.sin(t)),cx=graph?sw/2:310,cy=graph?sh/2:165,r=graph?Math.min(sw/2-40,sh/2-28):121;
  let s='';
  if(kind==='normalize'){
   const sc=25;
   s=`<circle cx="${cx}" cy="${cy}" r="125" fill="none" stroke="#557887" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${cx}" cy="${cy}" r="25" fill="none" stroke="#85e3c5" stroke-width="2"/>`;
   s+=line(cx-150,cy,cx+150,cy,'#91afba',1)+line(cx,15,cx,315,'#91afba',1);
   s+=arrow(cx,cy,cx+3*sc,cy-4*sc,'#f1c97d');s+=text(cx+83,cy-101,'v = (3, 4)','#f1c97d',19);
   if(state.normalized){s+=arrow(cx,cy,cx+.6*sc,cy-.8*sc,'#85e3c5',4);s+=text(cx-15,cy-30,'u','#85e3c5',19,'end');}
   s+=text(cx-10,cy+23,'O','#d9e7e8',15,'end')+text(cx+145,cy-10,'x')+text(cx+12,24,'y');
   out.innerHTML=`<div>v = (3, 4)<br>|v| = 5</div><div>${state.normalized?'u = (0.6, 0.8)<br>|u| = 1':'Unit vector:<br>predict before revealing'}</div>`;
  }else{
   for(let k=-1;k<=1;k++){s+=line(cx-r*1.23,cy-k*r,cx+r*1.23,cy-k*r,'#284955',1)+line(cx+k*r,cy-r*1.23,cx+k*r,cy+r*1.23,'#284955',1);}
   s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#658895" stroke-width="2"/>`;
   s+=line(cx-r*1.28,cy,cx+r*1.28,cy,'#9bb6c0',1.4)+line(cx,cy-r*1.27,cx,cy+r*1.27,'#9bb6c0',1.4);
   s+=text(cx+r+10,cy+23,'1','#c4d9dc',14)+text(cx-r-9,cy+23,'−1','#c4d9dc',14,'end')+text(cx-12,cy-r+7,'1','#c4d9dc',14,'end')+text(cx-12,cy+r+4,'−1','#c4d9dc',14,'end')+text(cx+ r*1.3,cy-10,'x','#e2eeee',17)+text(cx+12,18,'y','#e2eeee',17)+text(cx-10,cy+22,'O','#c4d9dc',14,'end');
   const px=cx+r*x,py=cy-r*y;
   if(kind==='level')s+=line(cx-r*1.25,cy-.6*r,cx+r*1.25,cy-.6*r,'#c6a9e9',2,'6 4')+text(cx-r*1.24,cy-.6*r-10,'y = 0.6','#c6a9e9',16);
   if(kind==='transform'){
    const a=state.pin;s+=line(cx,cy,cx+r*Math.cos(a),cy-r*Math.sin(a),'#c6a9e9',3,'6 4')+`<circle cx="${cx+r*Math.cos(a)}" cy="${cy-r*Math.sin(a)}" r="8" fill="none" stroke="#c6a9e9" stroke-width="2"/>`;
   }
   if(kind==='tangent'||kind==='vertical'){
    s+=`<defs><clipPath id="${id}-clip"><rect x="${cx-r*1.22}" y="12" width="${r*2.44}" height="306"/></clipPath></defs><g clip-path="url(#${id}-clip)">${line(cx-r*x*3,cy+r*y*3,cx+r*x*3,cy-r*y*3,'#c6a9e9',2,'7 5')}</g>`;
    s+=`<circle cx="${cx-r*x}" cy="${cy+r*y}" r="5" fill="#c6a9e9"/>`;
   }
   if(kind==='basis'){
    s+=arrow(cx,cy,cx+r,cy,'#5a8089',2)+arrow(cx,cy,cx,cy-r,'#5a8089',2);
    s+=text(cx+r-4,cy-10,'e₁','#96b3ba',16)+text(cx+14,cy-r+13,'e₂','#96b3ba',16);
    if(state.second){const qx=cx-r*y,qy=cy-r*x;s+=arrow(cx,cy,qx,qy,'#c6a9e9',3)+text(qx+(y>0?-12:12),Math.max(20,Math.min(310,qy+(x>=0?-12:24))),'Rθe₂','#c6a9e9',16,y>0?'end':'start');}
   }else{
    s+=`<polygon points="${cx},${cy} ${px},${cy} ${px},${py}" fill="#85e3c5" fill-opacity=".06"/>`+line(cx,cy,px,cy,'#85e3c5',3)+line(px,cy,px,py,'#91b8dc',3)+line(cx,py,px,py,'#91b8dc',1.4,'5 5');
   }
   let a=t%TAU;if(Math.abs(t)>1e-9&&Math.abs(a)<1e-9)a=Math.sign(t)*TAU;
   const ar=36,steps=Math.max(2,Math.ceil(Math.abs(a)*15)),pts=[];for(let j=0;j<=steps;j++){const u=a*j/steps;pts.push(`${cx+ar*Math.cos(u)},${cy-ar*Math.sin(u)}`);}s+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#f1c97d" stroke-width="1.6"/>`;
   s+=arrow(cx,cy,px,py,kind==='basis'?'#85e3c5':'#f1c97d',3);
   const interactive=angle&&!graph;
   s+=`<circle ${interactive?`data-handle tabindex="0" role="slider" aria-label="Point angle in radians" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${t}" aria-valuetext="${escape(piName(t))} radians"`:''} cx="${px}" cy="${py}" r="8" fill="#f1c97d" stroke="#112d3a" stroke-width="2"/>`;
   s+=text(px+(x>=0?13:-13),Math.max(20,Math.min(315,py+(y>=0?-13:25))),kind==='basis'?'Rθe₁':'P','#f1c97d',17,x>=0?'start':'end');
   const pair=`(${fixed(x)}, ${fixed(y)})`,angleLabel=piName(t);
   if(graph){out.innerHTML=`<div>θ = ${angleLabel} rad</div><div>x = cos θ = ${fixed(x)}</div><div>y = sin θ = ${fixed(y)}</div><div>Turns = ${fixed(t/TAU,2)}</div>`;renderGraph(t,x,y);}
   else if(kind==='quarter'){out.innerHTML=`<div>Applications: ${state.n} of 4<br>P = (${Math.round(x)}, ${Math.round(y)})</div><div>Rotation = ${angleLabel}<br>|OP| = 1</div>`;el.querySelector('[data-action=apply]').disabled=state.n>=4;}
   else if(kind==='basis'){out.innerHTML=`<div>Image of e₁<br>${pair}</div><div>Image of e₂<br>${state.second?`(${fixed(-y)}, ${fixed(x)})`:'Predict, then reveal'}</div>`;}
   else if(kind==='transform'){out.innerHTML=`<div>P = ${pair}<br>θ = ${angleLabel} rad</div><div>Pinned α = ${piName(state.pin)}<br>(${fixed(Math.cos(state.pin))}, ${fixed(Math.sin(state.pin))})</div>`;}
   else if(kind==='identity'&&state.magnitude){out.innerHTML=`<div>x² = ${fixed(x*x,4)}<br>y² = ${fixed(y*y,4)}</div><div>x² + y² = ${fixed(x*x+y*y,4)}<br>|OP| = 1</div>`;}
   else{out.innerHTML=`<div>x = cos θ = ${fixed(x)}<br>y = sin θ = ${fixed(y)}</div><div>θ = ${angleLabel} rad<br>${kind==='tangent'||kind==='vertical'?`tan θ = ${Math.abs(x)<1e-10?'undefined':fixed(y/x,3)}`:`${fixed(t*180/Math.PI,1)}° · |OP| = 1`}</div>`;}
   svg.setAttribute('aria-label',`Unit circle. Angle ${piName(t)} radians. Point ${pair}. ${kind==='basis'?'Rotated basis vectors.':''}`);
  }
  svg.innerHTML=s;
  if(focused)svg.querySelector('[data-handle]')?.focus({preventScroll:true});
  if(range)range.value=state.theta;
  if(input&&document.activeElement!==input)input.value=piName(state.theta).replace('−','-');
 }
 function renderGraph(t,x,y){const g=el.querySelector('[data-graph]'),gw=Math.max(300,g.clientWidth),gh=Math.max(180,g.clientHeight),x0=44,x1=gw-23,y0=gh/2-3,ys=(gh-95)/2,span=4*Math.PI;g.setAttribute('viewBox',`0 0 ${gw} ${gh}`);
  const X=q=>x0+(x1-x0)*q/span,Y=q=>y0-ys*q;let p='';
  for(let k=0;k<=8;k++){const xx=X(k*HALF);p+=line(xx,35,xx,gh-42,'#284955',1);const label=k%2===0?(k===0?'0':k===2?'π':`${k/2}π`):'';if(label)p+=text(xx,gh-21,label,'#bfd3d6',15,'middle');}
  for(const v of [-1,0,1]){p+=line(x0,Y(v),x1,Y(v),'#284955',1)+text(x0-13,Y(v)+6,String(v),'#bfd3d6',17,'end');}
  p+=line(x0,32,x0,gh-42,'#95afb9',1.4)+line(x0,y0,x1+5,y0,'#95afb9',1.4)+text(x1,gh-3,'θ / rad','#bfd3d6',14,'end')+text(x0,17,'value','#bfd3d6',14);
  const end=state.full?span:t;
  for(const [mode,fn,col]of[['sin',Math.sin,'#91b8dc'],['cos',Math.cos,'#85e3c5']]){if(state.mode!==mode&&state.mode!=='both')continue;let d='';const n=Math.max(1,Math.ceil(end*55));for(let j=0;j<=n;j++){const a=end*j/n;d+=(j?'L':'M')+X(a)+' '+Y(fn(a))+' ';}p+=`<path d="${d}" stroke="${col}" stroke-width="3" fill="none"/>`;p+=`<circle cx="${X(t)}" cy="${Y(fn(t))}" r="6" fill="${col}"/>`;p+=text(x0+(x1-x0)*(mode==='sin'?.32:.78),20,mode==='sin'?'sin θ (vertical)':'cos θ (horizontal)',col,gw<450?12:15,'middle');}
  p+=line(X(t),35,X(t),gh-42,'#f1c97d',1.5,'4 4');g.innerHTML=p;
  el.querySelectorAll('[data-action=sin],[data-action=cos],[data-action=both]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state.mode)));
  el.querySelector('[data-action=full]').setAttribute('aria-pressed',String(state.full));el.querySelector('[data-action=trace]').setAttribute('aria-pressed',String(!state.full));
 }
 function set(t,msg=''){stop();if(!Number.isFinite(t)){status.textContent='Enter a number in radians or a fraction such as 3pi/2.';input?.setAttribute('aria-invalid','true');return false;}input?.removeAttribute('aria-invalid');state.theta=Math.max(min,Math.min(max,t));status.textContent=t<min||t>max?'The display accepts angles from '+piName(min)+' to '+piName(max)+'.':msg;render();return true;}el.setAngle=set;
 if(range)range.addEventListener('input',()=>set(Number(range.value)));
 if(input){const commit=()=>{const ok=set(parseAngle(input.value));if(ok)input.value=piName(state.theta).replace('−','-');};input.addEventListener('change',commit);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();}});}
 function turn(t,msg=''){let v=t;while(v<min)v+=TAU;while(v>max)v-=TAU;set(v,msg+(v!==t?' An equivalent angle is shown.':''));}
 function play(){if(state.moving){stop();status.textContent='Paused. Predict the next coordinate before continuing.';return;}if(reduced.matches){status.textContent='Reduced motion is on. Use the slider or radians box.';return;}if(state.theta>=max-1e-8)state.theta=graph?0:initial;target=Math.min(max,(Math.floor((state.theta+1e-8)/HALF)+1)*HALF);state.moving=true;last=performance.now();el.querySelector('[data-action=play]')?.setAttribute('aria-pressed','true');status.textContent='Playback stops at the next quarter-turn.';const frame=now=>{if(!state.moving)return;state.theta=Math.min(target,state.theta+(now-last)*0.00065);last=now;render();if(state.theta>=target-1e-9){stop();status.textContent='Paused at '+piName(state.theta)+'. Predict the next part.';}else raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);}
 el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='play'){play();return;}stop();if(a==='reset'){Object.assign(state,{theta:initial,pin:initial,normalized:false,second:false,magnitude:false,full:false,mode:el.dataset.mode||'sin',n:0});status.textContent='The diagram has been reset.';}else if(a==='normalize'){state.normalized=true;status.textContent='Both components are divided by the positive magnitude 5.';}else if(a==='pin'){state.pin=state.theta;status.textContent='This point is the starting point for every transformation button.';}else if(a==='reflect-y')turn(Math.PI-state.pin,'Reflection in the y-axis, from the pinned point.');else if(a==='reflect-x')turn(-state.pin,'Reflection in the x-axis, from the pinned point.');else if(a==='half')turn(state.pin+Math.PI,'Half-turn, from the pinned point.');else if(a==='quarter')turn(state.pin+HALF,'Anticlockwise quarter-turn, from the pinned point.');else if(a==='opposite')turn(state.theta+(kind==='tangent'?Math.PI:HALF));else if(a==='before')set(HALF-.05,'Just before π/2: the horizontal coordinate is positive.');else if(a==='axis')set(HALF,'At π/2: the horizontal coordinate is zero.');else if(a==='after')set(HALF+.05,'Just after π/2: the horizontal coordinate is negative.');else if(a==='second'){state.second=true;status.textContent='The second image stays a quarter-turn ahead of the first.';}else if(a==='magnitude'){state.magnitude=true;status.textContent='The calculation uses unrounded coordinates.';}else if(a==='apply'){state.n=Math.min(4,state.n+1);state.theta=state.n*HALF;status.textContent=state.n===4?'Four quarter-turns return the vector to its starting point.':'Predict the next image before applying J again.';}else if(['sin','cos','both'].includes(a))state.mode=a;else if(a==='full')state.full=true;else if(a==='trace')state.full=false;render();});
 if(angle&&!graph){function move(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=svg.getScreenCTM();if(!m)return;const q=p.matrixTransform(m.inverse());let a=Math.atan2(165-q.y,q.x-310);if(a<0)a+=TAU;a+=Math.round((state.theta-a)/TAU)*TAU;set(a);}svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;svg.setPointerCapture(e.pointerId);move(e);});svg.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId))move(e);});for(const event of ['pointerup','pointercancel'])svg.addEventListener(event,e=>{if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);});svg.addEventListener('keydown',e=>{if(!e.target.matches('[data-handle]'))return;const step=e.shiftKey?Math.PI/12:Math.PI/180;if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();set(e.key==='Home'?0:e.key==='End'?TAU:state.theta+(['ArrowRight','ArrowUp'].includes(e.key)?step:-step));}});}
 render();new ResizeObserver(()=>{if(el.clientWidth)render();}).observe(el);
});
document.documentElement.classList.add('js');const match=location.hash.match(/^#slide-(\d+)$/);go(match?+match[1]-1:0);
})();
