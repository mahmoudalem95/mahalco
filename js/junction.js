/* Shared decorative intersection. One clock drives lights and vehicles. */
(function () {
  'use strict';
  const hero = document.querySelector('.hero');
  if (!hero || hero.querySelector('.junction-world')) return;
  const lang = document.documentElement.lang.slice(0, 2);
  const labels = ({he:['הנפשת תנועה','השהיית תנועה','הפעלת תנועה','מהירות'],ar:['حركة المرور','إيقاف الحركة','تشغيل الحركة','السرعة']})[lang] || ['Traffic animation','Pause traffic','Play traffic','Speed'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const world = document.createElement('div');
  world.className = 'junction-world';
  world.setAttribute('aria-hidden', 'true');
  const rect = (x,y,w,h,cls,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${extra}/>`;
  let city = rect(-300,-300,1100,1100,'ground');
  city += '<path class="sidewalk" d="M-300 164H800V336H-300ZM164-300H336V800H164Z"/><path class="road" d="M-300 178H800V322H-300ZM178-300H322V800H178Z"/>';
  city += '<path class="median" d="M-300 246H164V254H-300ZM336 246H800V254H336ZM246-300H254V164H246ZM246 336H254V800H246Z"/>';
  for (const c of [212,288]) {
    city += `<path class="mark" stroke-dasharray="14 18" d="M-300 ${c}H164M336 ${c}H800M${c}-300V164M${c} 336V800"/>`;
  }
  for(let n=0;n<14;n++) {
    const p=182+n*10;
    city += rect(p,166,5,12,'zebra')+rect(p,322,5,12,'zebra')+rect(166,p,12,5,'zebra')+rect(322,p,12,5,'zebra');
  }
  city += '<path class="mark" stroke-width="3" d="M151 256V320M349 180V244M180 151H244M256 349H320"/>';
  // Low-rise blocks, rooftop details and warm windows.
  for(const [x,y,w,h] of [[20,12,112,115],[365,0,128,125],[5,374,124,142],[376,376,120,96],[-150,12,130,112],[20,-164,110,122],[-160,375,125,120]]) {
    city += rect(x+3,y+5,w,h,'sidewalk','rx="5"')+rect(x,y,w,h,'building','rx="4"')+rect(x+10,y+10,w-20,h-20,'roof','rx="2"');
    city += rect(x+20,y+22,28,22,'building','rx="2"');
    for(let i=0;i<4;i++) city += rect(x+13+i*23,y+h-13,12,4,'window')+rect(x+13+i*23,y+h-13,12,4,'lit-window','fill="#ffd38a"');
  }
  for(const p of [-120,-65,-10,45,100,395,450,505,560,615]) {
    for(const [x,y] of [[p,148],[p,352],[148,p],[352,p]]) city+=`<circle class="trunk" cx="${x+2}" cy="${y+3}" r="12"/><circle class="tree" cx="${x}" cy="${y}" r="11"/><circle class="tree" cx="${x-3}" cy="${y-3}" r="7" opacity=".6"/>`;
  }
  for(const [x,y] of [[155,155],[345,155],[155,345],[345,345],[45,155],[455,345]]) city+=`<circle class="pool" cx="${x}" cy="${y}" r="56" fill="url(#junction-lamp)"/><circle class="lamp" cx="${x}" cy="${y}" r="3"/><circle class="lit-window" cx="${x}" cy="${y}" r="2" fill="#ffe2a0"/>`;
  const signals = [[146,329,'ew'],[354,171,'ew'],[171,146,'ns'],[329,354,'ns']].map(([x,y,axis])=>`<g class="signal" data-axis="${axis}" transform="translate(${x} ${y})"><rect class="signal-case" x="-6" y="-14" width="12" height="28" rx="5"/>${['red','amber','green'].map((c,i)=>`<circle data-color="${c}" class="bulb" cy="${i*8-8}" r="2.8" style="--light:${['#ff655c','#ffd66a','#62e6a1'][i]}"/>`).join('')}</g>`).join('');
  const colors=['#f5efe0','#6d91ac','#cc7167','#8aab9b','#dbb873','#e6e9e3'];
  const vehicles=[];
  let carMarkup='';
  // Travel on the right, two lanes per approach. Distances are measured from entry.
  ['east','west','south','north'].forEach((dir,d)=>{
    for(let lane=0;lane<2;lane++) for(let i=0;i<5;i++) {
      const id=vehicles.length;
      vehicles.push({dir,lane,pos:20-i*66-lane*22,speed:0,axis:d<2?'ew':'ns'});
      carMarkup+=`<g class="vehicle" data-car="${id}" style="--paint:${colors[(id+d)%colors.length]}"><path class="beam" d="M13-6L85-27Q98 0 85 27L13 6Z" fill="url(#junction-beam)"/><rect class="tire" x="-10" y="-8" width="18" height="16" rx="3"/><rect class="car-body" x="-15" y="-7" width="30" height="14" rx="4"/><rect class="glass" x="-7" y="-5.6" width="15" height="11.2" rx="2.5"/><rect class="car-body" x="-4" y="-5.8" width="6" height="11.6" rx="1"/><path class="car-trim" d="M-10-5h-2v10h2Z"/><rect class="headlight" x="12" y="-6" width="2" height="3" rx="1"/><rect class="headlight" x="12" y="3" width="2" height="3" rx="1"/><rect class="tail" x="-15" y="-6" width="2" height="3" rx="1"/><rect class="tail" x="-15" y="3" width="2" height="3" rx="1"/></g>`;
    }
  });
  world.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" focusable="false"><defs><radialGradient id="junction-lamp"><stop stop-color="#ffd598" stop-opacity=".55"/><stop offset="1" stop-color="#ffd598" stop-opacity="0"/></radialGradient><linearGradient id="junction-beam"><stop stop-color="#fff4cc" stop-opacity=".7"/><stop offset="1" stop-color="#fff4cc" stop-opacity="0"/></linearGradient></defs>${city}${carMarkup}${signals}</svg>`;
  hero.prepend(world);
  hero.classList.add('motion-hero');
  const controls=document.createElement('div');
  controls.className='junction-controls';
  controls.setAttribute('role','group'); controls.setAttribute('aria-label',labels[0]);
  controls.innerHTML=`<button type="button" class="traffic-pause"></button>${[1,2,4].map(n=>`<button type="button" data-speed="${n}" aria-label="${labels[3]} ${n}×" aria-pressed="${n===1}">${n}×</button>`).join('')}`;
  hero.append(controls);
  let paused=reduced.matches, visible=true, multiplier=1, elapsed=0, frame=0, previous=0, lastPhase='';
  const pause=controls.querySelector('.traffic-pause');
  const nodes=[...world.querySelectorAll('.vehicle')];
  const bulbs=[...world.querySelectorAll('.bulb')];
  // Green 0–8s, amber 8–10s, all-red clearance 10–13s; repeat for NS.
  function phase(t){t%=26;return {ew:t<8?'green':t<10?'amber':'red',ns:t>=13&&t<21?'green':t>=21&&t<23?'amber':'red'};}
  function render(dt){
    const lights=phase(elapsed), key=lights.ew+lights.ns;
    if(key!==lastPhase){bulbs.forEach(b=>b.classList.toggle('on',b.dataset.color===lights[b.parentNode.dataset.axis]));lastPhase=key;}
    for(const dir of ['east','west','south','north']) for(let lane=0;lane<2;lane++) {
      const group=vehicles.filter(v=>v.dir===dir&&v.lane===lane).sort((a,b)=>b.pos-a.pos);
      let leader=Infinity;
      for(const v of group){
        // Front bumper stops before the crossing. Committed cars clear amber.
        let limit=leader-40;
        if(lights[v.axis]!=='green'&&v.pos<=136) limit=Math.min(limit,136);
        const gap=Math.max(0,limit-v.pos);
        const target=Math.min(53,Math.sqrt(2*65*gap));
        v.speed=Math.max(0,Math.min(target,v.speed+30*dt));
        v.pos=Math.min(limit,v.pos+v.speed*dt);
        leader=v.pos;
      }
      const tail=Math.min(...group.map(v=>v.pos));
      group.forEach(v=>{if(v.pos>660){v.pos=Math.min(-140,tail-66);v.speed=0;}});
    }
    vehicles.forEach((v,i)=>{
      const p=v.pos, low=v.lane===0?195:230, high=v.lane===0?270:305;
      const coords=({east:[p,high,0],west:[500-p,low,180],south:[low,p,90],north:[high,500-p,-90]})[v.dir];
      nodes[i].setAttribute('transform',`translate(${coords[0]} ${coords[1]}) rotate(${coords[2]})`);
      nodes[i].classList.toggle('braking',v.speed<8);
    });
  }
  function tick(now){
    frame=0;
    const dt=previous?Math.min((now-previous)/1000,.05)*multiplier:0;previous=now;
    elapsed+=dt;render(dt);frame=requestAnimationFrame(tick);
  }
  function sync(){
    pause.innerHTML=paused?'&#9654;':'&#10074;&#10074;';pause.setAttribute('aria-label',paused?labels[2]:labels[1]);pause.setAttribute('aria-pressed',String(paused));
    if(frame){cancelAnimationFrame(frame);frame=0;}previous=0;
    if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  controls.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{multiplier=Number(b.dataset.speed);controls.querySelectorAll('[data-speed]').forEach(s=>s.setAttribute('aria-pressed',String(s===b)));}));
  reduced.addEventListener('change',e=>{paused=e.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(hero);
  // Warm up queues so the first frame already looks like a living street.
  for(let i=0;i<180;i++){elapsed+=1/60;render(1/60);}sync();
})();
