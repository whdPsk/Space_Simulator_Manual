(() => {
  'use strict';
  const root = document.documentElement;
  const $ = selector => document.querySelector(selector);
  const themeButton = $('#theme');
  let redraw = () => {};
  const setTheme = value => {
    root.dataset.theme = value === 'light' ? 'light' : 'dark';
    themeButton.textContent = root.dataset.theme === 'dark' ? '밝은 화면으로' : '어두운 화면으로';
    document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#071224' : '#f2f5fa';
    redraw();
  };
  setTheme(root.dataset.theme);
  themeButton.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('research.theme', root.dataset.theme); } catch (_) {}
  });

  const chapters = [...document.querySelectorAll('.chapter')];
  const searchIndex = new Map(chapters.map(section => [section, section.textContent.toLocaleLowerCase()]));
  const detailsIndex = new Map([...document.querySelectorAll('details')].map(detail => [detail, detail.textContent.toLocaleLowerCase()]));
  const search = $('#search');
  const rail = $('#manual-rail'), menu = $('#menu-toggle'), backdrop = $('.menu-backdrop');
  const mobile = matchMedia('(max-width: 900px)');
  let menuOpen = false;
  function setMenu(open, returnFocus = true) {
    menuOpen = mobile.matches && open;
    document.body.classList.toggle('menu-open', menuOpen);
    menu.setAttribute('aria-expanded', String(menuOpen));
    backdrop.hidden = !menuOpen;
    rail.inert = mobile.matches && !menuOpen;
    $('#main').inert = menuOpen;
    if (menuOpen) {
      rail.setAttribute('role', 'dialog'); rail.setAttribute('aria-modal', 'true');
      $('#menu-close').focus();
    } else {
      rail.removeAttribute('role'); rail.removeAttribute('aria-modal');
      if (returnFocus && mobile.matches) menu.focus();
    }
  }
  setMenu(false, false);
  menu.addEventListener('click', () => setMenu(!menuOpen));
  $('#menu-close').addEventListener('click', () => setMenu(false));
  backdrop.addEventListener('click', () => setMenu(false));
  mobile.addEventListener('change', () => setMenu(false, false));

  const detailsBeforeSearch = new Map();
  function searchDocs() {
    const q = search.value.trim().toLocaleLowerCase(); let count = 0;
    chapters.forEach(section => {
      section.hidden = !!q && !searchIndex.get(section).includes(q);
      if (!section.hidden) count++;
    });
    document.querySelectorAll('details').forEach(detail => {
      if (q) {
        if (!detailsBeforeSearch.has(detail)) detailsBeforeSearch.set(detail, detail.open);
        if (detailsIndex.get(detail).includes(q)) detail.open = true;
      } else if (detailsBeforeSearch.has(detail)) {
        detail.open = detailsBeforeSearch.get(detail); detailsBeforeSearch.delete(detail);
      }
    });
    $('#no-results').hidden = count > 0;
    $('#search-status').textContent = q ? count + '개 문서 섹션에서 찾았습니다.' : '전체 문서';
  }
  search.addEventListener('input', searchDocs);
  $('#clear-search').addEventListener('click', () => {
    search.value = ''; searchDocs();
    if (mobile.matches) setMenu(true); else search.focus();
  });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    search.value = ''; searchDocs();
    if (menuOpen) {
      setMenu(false, false);
      const target = document.getElementById(a.hash.slice(1));
      if (target) { target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); }
    }
  }));
  document.addEventListener('keydown', event => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); if(mobile.matches) setMenu(true); search.focus();
    }
    if (event.key === 'Escape') {
      if (menuOpen) setMenu(false);
      else if (document.activeElement === search) { search.value = ''; searchDocs(); search.blur(); }
    }
    if (event.key === 'Tab' && menuOpen) {
      const focusable = [...rail.querySelectorAll('a,button,input')].filter(e => !e.disabled && e.getClientRects().length);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  const copyStatus = document.createElement('div');
  copyStatus.className = 'visually-hidden'; copyStatus.setAttribute('role', 'status');
  copyStatus.setAttribute('aria-live', 'polite'); document.body.append(copyStatus);
  document.querySelectorAll('pre').forEach(pre => {
    pre.tabIndex = 0; pre.setAttribute('role','region');
    pre.setAttribute('aria-label', pre.classList.contains('tree') ? '저장 폴더 구조' : '복사 가능한 명령어');
    if(pre.classList.contains('tree'))return;
    const wrapper=document.createElement('div');wrapper.className='code-block';
    const toolbar=document.createElement('div');toolbar.className='code-toolbar';
    const label=document.createElement('span');label.textContent='명령어';toolbar.append(label);
    pre.before(wrapper);wrapper.append(toolbar,pre);
    const b=document.createElement('button');b.type='button';b.className='copy';b.textContent='명령 복사';
    b.addEventListener('click',async()=>{
      copyStatus.textContent='';
      try{await navigator.clipboard.writeText(pre.querySelector('code').textContent);b.textContent='복사됨';copyStatus.textContent='명령어를 복사했습니다.';}
      catch(_){b.textContent='직접 선택해 복사하세요';copyStatus.textContent='복사하지 못했습니다. 명령어를 직접 선택해 복사하세요.';}
      setTimeout(()=>b.textContent='명령 복사',2200);
    });toolbar.append(b);
  });
  document.querySelectorAll('.table-wrap').forEach((table,i)=>{
    table.tabIndex=0;table.setAttribute('role','region');table.setAttribute('aria-label','표 '+(i+1)+' · 좁은 화면에서 가로로 스크롤');
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting)document.querySelectorAll('nav a').forEach(a=>{
          const active=a.hash==='#'+entry.target.id;
          a.classList.toggle('active',active);
          if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
        });
      });
    },{rootMargin:'-12% 0px -65% 0px'});
    chapters.forEach(section=>observer.observe(section));
  }
  let printState;
  function beforePrint(){
    if(printState)return;
    printState={query:search.value,details:[...document.querySelectorAll('details')].map(d=>[d,d.open])};
    search.value='';searchDocs();setMenu(false,false);
    document.querySelectorAll('details').forEach(d=>d.open=true);
  }
  function afterPrint(){
    if(!printState)return;
    const previous=printState;printState=null;
    previous.details.forEach(([d,open])=>d.open=open);search.value=previous.query;searchDocs();
  }
  window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
  $('#print').addEventListener('click',()=>{beforePrint();window.print();});

  // A fixed-seed conceptual illustration, deliberately independent of research outputs.
  const canvas=$('#cosmos'),stage=$('.cosmos-stage'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  $('.cosmos-controls').hidden=false;stage.classList.add('ready');
  let seed=9173;
  const random=()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-8)))*Math.cos(2*Math.PI*random());
  const nodes=[];
  while(nodes.length<18){
    const n=[(random()-.5)*2.1,(random()-.5)*1.8,(random()-.5)*1.65];
    if(nodes.every(p=>Math.hypot(...p.map((v,i)=>v-n[i]))>.49))nodes.push(n);
  }
  const edges=[],seen=new Set();
  nodes.forEach((n,i)=>{
    nodes.map((p,j)=>({j,d:Math.hypot(...p.map((v,k)=>v-n[k]))})).filter(x=>x.j!==i).sort((a,b)=>a.d-b.d).slice(0,3).forEach(({j})=>{
      const key=[i,j].sort((a,b)=>a-b).join('-');
      if(!seen.has(key)){seen.add(key);edges.push([n,nodes[j]]);}
    });
  });
  const points=[];
  const waveVectors=[[9,5,2],[4,-11,6],[-7,3,10],[6,8,-6]];
  const count=matchMedia('(max-width:600px)').matches||navigator.hardwareConcurrency<=4?1100:2600;
  for(let i=0;i<count;i++){
    const mode=random();let pos;
    if(mode<.7){
      const [a,b]=edges[Math.floor(random()*edges.length)],t=random();
      pos=a.map((v,k)=>v+(b[k]-v)*t+gaussian()*.027+Math.sin(t*Math.PI)*.09*Math.sin(k*2.3+i%7));
    }else if(mode<.94){const node=nodes[Math.floor(random()*nodes.length)];pos=node.map(v=>v+gaussian()*.065);}
    else pos=[(random()-.5)*2.6,(random()-.5)*2.1,(random()-.5)*2];
    points.push({p:pos,start:[(random()-.5)*3,(random()-.5)*2.7,(random()-.5)*2.4],size:.5+random()*.9,
      phases:new Float32Array(waveVectors.map(k=>k[0]*pos[0]+k[1]*pos[1]+k[2]*pos[2]))});
  }
  const stars=Array.from({length:60},()=>({x:random(),y:random(),alpha:.15+random()*.3,size:.35+random()*.6}));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),forced=matchMedia('(forced-colors: active)');
  let paused=reduced.matches,visible=true,frame=0,lastFrame=0,elapsed=0,view='particles',width=1,height=1;
  let assembled=reduced.matches?1:0;
  const field=document.createElement('canvas'),fc=field.getContext('2d');
  const glow=document.createElement('canvas');glow.width=40;glow.height=40;
  const gc=glow.getContext('2d'),projected=new Float32Array(count*3);
  const motion=$('#motion');
  function motionLabel(){motion.textContent=paused?'움직임 재생':'움직임 멈춤';}
  motionLabel();
  function palette(){const s=getComputedStyle(root);return {cyan:s.getPropertyValue('--brand').trim(),gold:s.getPropertyValue('--gold').trim(),dark:root.dataset.theme!=='light'};}
  let colors=palette();
  function makeGlow(){
    gc.clearRect(0,0,40,40);const g=gc.createRadialGradient(20,20,0,20,20,20);
    g.addColorStop(0,colors.dark?'rgba(230,194,119,.45)':'rgba(138,98,16,.2)');g.addColorStop(1,'rgba(230,194,119,0)');
    gc.fillStyle=g;gc.fillRect(0,0,40,40);
  }
  makeGlow();
  function project(p){
    const yaw=.32+elapsed*.016,cy=Math.cos(yaw),sy=Math.sin(yaw);
    const x=p[0]*cy-p[2]*sy,z=p[0]*sy+p[2]*cy;
    const y=p[1]*Math.cos(.27)-z*Math.sin(.27),depth=p[1]*Math.sin(.27)+z*Math.cos(.27);
    const scale=2.75/(3.15+depth*.55),unit=Math.min(width,height)*.46;
    return {x:width*.5+x*unit*scale,y:height*.49+y*unit*scale,s:scale};
  }
  function draw(){
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation='source-over';ctx.fillStyle=colors.cyan;
    stars.forEach(s=>{ctx.globalAlpha=s.alpha*.55;ctx.fillRect(s.x*width,s.y*height,s.size,s.size);});
    ctx.globalAlpha=1;
    for(let i=0;i<count;i++){
      const point=points[i],p=assembled<1?point.p.map((v,k)=>point.start[k]+(v-point.start[k])*assembled):point.p;
      const q=project(p);projected[i*3]=q.x;projected[i*3+1]=q.y;projected[i*3+2]=q.s;
    }
    if(view==='wave'){
      fc.clearRect(0,0,field.width,field.height);fc.globalCompositeOperation=colors.dark?'lighter':'source-over';
      const fx=field.width/width,fy=field.height/height;
      points.forEach((point,i)=>{
        let re=0,im=0;
        for(let j=0;j<4;j++){const phase=point.phases[j]-elapsed*(.3+j*.07);re+=Math.cos(phase);im+=Math.sin(phase);}
        const value=(re*re+im*im)/16;
        fc.globalAlpha=colors.dark?.025+value*.26:.02+value*.18;fc.fillStyle=colors.dark?'#5caecf':'#0b1a30';
        fc.fillRect(projected[i*3]*fx-1,projected[i*3+1]*fy-1,2.6,2.6);
      });
      fc.globalAlpha=1;
      ctx.imageSmoothingEnabled=true;ctx.globalAlpha=colors.dark?.9:.8;ctx.drawImage(field,0,0,width,height);ctx.globalAlpha=1;
    }
    ctx.globalCompositeOperation=colors.dark?'lighter':'source-over';ctx.fillStyle=colors.cyan;
    for(let i=0;i<count;i++){
      const scale=projected[i*3+2],size=points[i].size*scale;
      ctx.globalAlpha=(view==='wave'?.1:.65)*Math.min(scale,1.3);
      ctx.fillRect(projected[i*3],projected[i*3+1],size,size);
    }
    if(view==='particles'){
      nodes.forEach(p=>{
        const q=project(p);
        ctx.globalAlpha=1;ctx.drawImage(glow,q.x-11,q.y-11,22,22);
        ctx.fillStyle=colors.gold;ctx.beginPath();ctx.arc(q.x,q.y,1.25*q.s,0,Math.PI*2);ctx.fill();
      });
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function loop(now){
    frame=0;
    if(paused||!visible||document.hidden||forced.matches)return;
    if(now-lastFrame>=1000/30){
      const delta=lastFrame?Math.min((now-lastFrame)/1000,.1):0;
      elapsed+=delta;lastFrame=now;
      assembled=1-Math.pow(1-Math.min(elapsed/1.8,1),3);
      draw();
    }
    frame=requestAnimationFrame(loop);
  }
  function schedule(){if(!frame&&!paused&&visible&&!document.hidden&&!forced.matches){lastFrame=0;frame=requestAnimationFrame(loop);}}
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=0;}
  function resize(){
    const r=stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    field.width=Math.max(1,Math.round(width/4));field.height=Math.max(1,Math.round(height/4));draw();schedule();
  }
  redraw=()=>{colors=palette();makeGlow();draw();};
  new ResizeObserver(resize).observe(stage);
  motion.addEventListener('click',()=>{paused=!paused;assembled=1;elapsed=Math.max(elapsed,1.8);motionLabel();if(paused){stop();draw();}else schedule();});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    view=button.dataset.view;assembled=1;elapsed=Math.max(elapsed,1.8);
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('#cosmos-caption').textContent=view==='wave'?'겹쳐지는 파동, 드러나는 간섭의 패턴.':'작은 점들이 이어져 이루는 거대한 구조.';
    draw();
  }));
  reduced.addEventListener('change',()=>{paused=reduced.matches;assembled=1;elapsed=Math.max(elapsed,1.8);motionLabel();stop();draw();schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;if(visible)schedule();else stop();
  }).observe(stage);
  forced.addEventListener('change',()=>{stop();schedule();});
})();
