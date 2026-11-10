/* Living Background Engine - independent add-on; does not replace existing site scripts. */
(() => {
  'use strict';
  const canvas = document.getElementById('living-bg');
  const control = document.getElementById('background-control');
  const toggle = document.getElementById('background-toggle');
  const panel = document.getElementById('background-panel');
  const close = document.getElementById('background-close');
  if (!canvas || !control || !toggle || !panel) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const themes = ['aurora', 'neural', 'cosmic', 'hybrid'];
  const colors = { aurora: [0,255,145], neural: [38,225,190], cosmic: [150,125,255], hybrid: [0,255,160] };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let theme = 'hybrid', width = 0, height = 0, dpr = 1, frame = 0, pointer = { x: -1000, y: -1000 }, particles = [];
  const isMobile = () => window.innerWidth < 700;
  const particleCount = () => Math.min(isMobile() ? 38 : 78, Math.max(22, Math.floor(window.innerWidth / (isMobile() ? 12 : 18))));
  const rand = (a,b) => Math.random() * (b-a) + a;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.35 : 1.7);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.floor(width*dpr); canvas.height = Math.floor(height*dpr);
    canvas.style.width = width+'px'; canvas.style.height = height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = particleCount();
    particles = Array.from({length: count}, () => ({ x:rand(0,width), y:rand(0,height), vx:rand(-.22,.22), vy:rand(-.2,.2), r:rand(.7,2.1), phase:rand(0,Math.PI*2), twinkle:rand(.7,1.5) }));
    draw(true);
  }
  function setTheme(next) {
    if (!themes.includes(next)) return;
    theme = next; document.body.dataset.bgTheme = theme;
    document.querySelectorAll('.background-option').forEach(btn => {
      const active = btn.dataset.theme === theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('writarion-bg-theme', theme); } catch (_) {}
    draw(true);
  }
  function line(a,b,alpha) {
    ctx.strokeStyle = `rgba(${colors[theme].join(',')},${alpha})`;
    ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  }
  function draw(staticFrame=false) {
    if (!width || !height) return;
    ctx.clearRect(0,0,width,height);
    const t = frame * (reducedMotion ? 0 : .008);
    const rgb = colors[theme];
    // Flowing aurora ribbons: subtle layered curves create depth without obscuring content.
    if (theme === 'aurora' || theme === 'hybrid') {
      for (let band=0; band<3; band++) {
        ctx.beginPath();
        const base = height*(.24 + band*.23);
        for (let x=-30; x<=width+30; x+=18) {
          const y = base + Math.sin(x*.004 + t*(1+band*.18) + band)*height*.055 + Math.cos(x*.009-t*.7)*height*.018;
          if (x===-30) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = `rgba(${rgb.join(',')},${.045-band*.008})`;
        ctx.lineWidth = 30-band*7; ctx.shadowBlur = 28; ctx.shadowColor = `rgba(${rgb.join(',')},.18)`; ctx.stroke(); ctx.shadowBlur = 0;
      }
    }
    // Floating particles, with touch/mouse repulsion and proximity links.
    for (let i=0;i<particles.length;i++) {
      const p=particles[i];
      if (!staticFrame && !reducedMotion) { p.x += p.vx; p.y += p.vy; p.phase += .012*p.twinkle; }
      if (p.x < -8) p.x=width+8; if (p.x>width+8) p.x=-8;
      if (p.y < -8) p.y=height+8; if (p.y>height+8) p.y=-8;
      const dx=p.x-pointer.x, dy=p.y-pointer.y, dist=Math.hypot(dx,dy);
      if (dist<125 && dist>0 && !reducedMotion) { p.x += dx/dist*.22; p.y += dy/dist*.22; }
      const alpha = .28 + (Math.sin(p.phase)+1)*.22;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(.85+Math.sin(p.phase)*.18),0,Math.PI*2);
      ctx.fillStyle = `rgba(${rgb.join(',')},${alpha})`; ctx.shadowBlur=theme==='cosmic'?8:10; ctx.shadowColor=`rgba(${rgb.join(',')},.55)`; ctx.fill(); ctx.shadowBlur=0;
      if (theme==='neural' || theme==='hybrid') {
        for (let j=i+1;j<particles.length;j++) {
          const q=particles[j], d=Math.hypot(p.x-q.x,p.y-q.y);
          if (d< (isMobile()?92:132)) line(p,q,(1-d/(isMobile()?92:132))*.19);
        }
      }
    }
    // Occasional shooting stars in cosmic/hybrid modes.
    if ((theme==='cosmic'||theme==='hybrid') && !reducedMotion && Math.floor(frame)%150===0) {
      const sx=rand(0,width), sy=rand(0,height*.45);
      const grad=ctx.createLinearGradient(sx,sy,sx+95,sy+34); grad.addColorStop(0,'rgba(255,255,255,.0)'); grad.addColorStop(1,'rgba(190,220,255,.65)');
      ctx.strokeStyle=grad; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+95,sy+34); ctx.stroke();
    }
    if (!staticFrame && !reducedMotion) frame++;
  }
  let raf = 0;
  function animate() { draw(); raf=requestAnimationFrame(animate); }
  function openPanel(open) { control.classList.toggle('open',open); toggle.setAttribute('aria-expanded',String(open)); panel.setAttribute('aria-hidden',String(!open)); }
  toggle.addEventListener('click', () => openPanel(!control.classList.contains('open')));
  close.addEventListener('click', () => openPanel(false));
  document.querySelectorAll('.background-option').forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.theme)));
  document.addEventListener('click', e => { if (!control.contains(e.target)) openPanel(false); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') openPanel(false); });
  const movePointer = e => { pointer.x=e.clientX; pointer.y=e.clientY; };
  window.addEventListener('pointermove', movePointer, {passive:true});
  window.addEventListener('pointerdown', movePointer, {passive:true});
  window.addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reducedMotion) animate();
  });
  try { const saved=localStorage.getItem('writarion-bg-theme'); if (themes.includes(saved)) theme=saved; } catch (_) {}
  setTheme(theme); resize();
  if (!reducedMotion) animate();
})();
