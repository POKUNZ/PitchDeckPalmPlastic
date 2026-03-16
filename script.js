// ── CUSTOM CURSOR ─────────────────────────────────────────────────────
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
});

function lerpCursor() {
  rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
  ring.style.left = Math.round(rx) + 'px'; ring.style.top = Math.round(ry) + 'px';
  requestAnimationFrame(lerpCursor);
}
lerpCursor();

document.querySelectorAll('button,[onclick],.nav-dot,.biz-card,.comp-card,.flow-node,.close-badge,.fin-phase').forEach(el => {
  el.addEventListener('mouseenter', () => { cur.style.width = '20px'; cur.style.height = '20px'; ring.style.width = '60px'; ring.style.height = '60px'; });
  el.addEventListener('mouseleave', () => { cur.style.width = '12px'; cur.style.height = '12px'; ring.style.width = '40px'; ring.style.height = '40px'; });
});

// ── ANIMATED BLOB + PARTICLE BACKGROUND ──────────────────────────────
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let W, H;
let mouse = { x: -999, y: -999 };
let t = 0;

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);
document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

// ── BLOBS ──
const blobs = [
  { x: 0.2, y: 0.25, r: 0.38, hue: 130, speed: 0.00035, ox: 0, oy: 0, phase: 0 },
  { x: 0.75, y: 0.6,  r: 0.32, hue: 150, speed: 0.00028, ox: 0, oy: 0, phase: 2.1 },
  { x: 0.5,  y: 0.9,  r: 0.28, hue: 115, speed: 0.00042, ox: 0, oy: 0, phase: 4.2 },
  { x: 0.85, y: 0.15, r: 0.22, hue: 160, speed: 0.00055, ox: 0, oy: 0, phase: 1.0 },
  { x: 0.1,  y: 0.75, r: 0.20, hue: 140, speed: 0.00038, ox: 0, oy: 0, phase: 3.3 },
];

// ── FIREFLY PARTICLES ──
class Firefly {
  constructor() { this.reset(true); }
  reset(init = false) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : H + 10;
    this.size = Math.random() * 2.2 + 0.4;
    this.speedY = -(Math.random() * 0.5 + 0.15);
    this.speedX = (Math.random() - 0.5) * 0.35;
    this.life = 0;
    this.maxLife = Math.random() * 280 + 180;
    this.opacity = init ? Math.random() * 0.5 : 0;
    this.hue = 115 + Math.random() * 50;
    this.twinkle = Math.random() * Math.PI * 2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life++;
    this.twinkle += 0.04;
    // subtle mouse repel
    const dx = mouse.x - this.x, dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) { this.x -= dx / dist * 0.5; this.y -= dy / dist * 0.5; }
    const twinkleOp = 0.5 + Math.sin(this.twinkle) * 0.3;
    if (this.life < 40) this.opacity = (this.life / 40) * 0.6 * twinkleOp;
    else if (this.life > this.maxLife - 40) this.opacity = ((this.maxLife - this.life) / 40) * 0.6 * twinkleOp;
    else this.opacity = 0.6 * twinkleOp;
    if (this.life >= this.maxLife || this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    // glow
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
    grd.addColorStop(0, `hsla(${this.hue},80%,75%,1)`);
    grd.addColorStop(1, `hsla(${this.hue},80%,75%,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2); ctx.fill();
    // core
    ctx.globalAlpha = Math.min(this.opacity * 1.5, 1);
    ctx.fillStyle = `hsl(${this.hue},90%,85%)`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── CONSTELLATION LINES ──
function drawConstellations(flies) {
  for (let i = 0; i < flies.length; i++) {
    for (let j = i + 1; j < flies.length; j++) {
      const dx = flies[i].x - flies[j].x, dy = flies[i].y - flies[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 110) {
        ctx.save();
        ctx.globalAlpha = (1 - d / 110) * 0.12;
        ctx.strokeStyle = `hsl(135,60%,65%)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(flies[i].x, flies[i].y); ctx.lineTo(flies[j].x, flies[j].y); ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ── MORPHING BLOB path using sin waves ──
function drawBlob(cx, cy, baseR, time, hue, phase) {
  const points = 8;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wobble =
      Math.sin(angle * 2 + time * 1.1 + phase) * 0.18 +
      Math.sin(angle * 3 - time * 0.7 + phase) * 0.10 +
      Math.sin(angle * 5 + time * 0.5 + phase) * 0.06;
    const r = baseR * (1 + wobble);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.2);
  grd.addColorStop(0, `hsla(${hue},70%,52%,0.22)`);
  grd.addColorStop(0.5, `hsla(${hue},65%,45%,0.14)`);
  grd.addColorStop(1, `hsla(${hue},60%,40%,0)`);
  ctx.fillStyle = grd;
  ctx.fill();
}

const flies = Array.from({ length: 80 }, () => new Firefly());

function animFrame() {
  ctx.clearRect(0, 0, W, H);
  t += 0.012;

  // draw blobs first (background layer)
  blobs.forEach(b => {
    b.ox += (Math.sin(t * b.speed * 3000 + b.phase) * 0.06 - b.ox) * 0.008;
    b.oy += (Math.cos(t * b.speed * 2000 + b.phase) * 0.05 - b.oy) * 0.008;
    const cx = (b.x + b.ox) * W;
    const cy = (b.y + b.oy) * H;
    const r = b.r * Math.min(W, H);
    drawBlob(cx, cy, r, t, b.hue, b.phase);
  });

  // mouse blob — follows cursor
  if (mouse.x > 0) {
    drawBlob(mouse.x, mouse.y, Math.min(W, H) * 0.18, t * 1.5, 145, 0);
  }

  // fireflies + constellations
  ctx.save();
  drawConstellations(flies);
  ctx.restore();
  flies.forEach(f => { f.update(); f.draw(); });

  requestAnimationFrame(animFrame);
}
animFrame();

// ── INTERSECTION OBSERVER & NAV ───────────────────────────────────────
const slides = document.querySelectorAll('.slide');
const navDots = document.querySelectorAll('.nav-dot');
const slideNum = document.getElementById('slideNum');
const navProgress = document.getElementById('navProgress');
let animated = new Set();
let current = 0;

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const idx = parseInt(e.target.dataset.slide);
      current = idx;
      navDots.forEach((d, i) => d.classList.toggle('active', i === idx));
      slideNum.textContent = String(idx + 1).padStart(2, '0') + ' / 09';
      navProgress.style.width = ((idx + 1) / 9 * 100) + '%';
      if (!animated.has(idx)) { animated.add(idx); triggerAnim(idx); }
    }
  });
}, { threshold: 0.35 });

slides.forEach(s => observer.observe(s));

function goToSlide(i) { slides[i].scrollIntoView({ behavior: 'smooth' }); }
navDots.forEach(d => d.addEventListener('click', () => goToSlide(parseInt(d.dataset.idx))));

// ── THREE.JS MACHINE ──────────────────────────────────────────────────
function initMachine() {
  const canvas = document.getElementById('machCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.clientWidth || 520;
  const H = canvas.clientHeight || 380;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(4.5, 2.8, 5.5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x88ccaa, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5,8,6); sun.castShadow=true; scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4a9e58, 0.4);
  fill.position.set(-4,2,-3); scene.add(fill);
  const rim = new THREE.PointLight(0x8fd49a, 0.6, 12);
  rim.position.set(-3,4,2); scene.add(rim);

  const matSteel  = new THREE.MeshStandardMaterial({ color:0x8aaa90, metalness:0.8, roughness:0.25 });
  const matBase   = new THREE.MeshStandardMaterial({ color:0x2a4a30, metalness:0.5, roughness:0.5 });
  const matMotor  = new THREE.MeshStandardMaterial({ color:0x1a55cc, metalness:0.7, roughness:0.3 });
  const matHopper = new THREE.MeshStandardMaterial({ color:0x9ab09e, metalness:0.6, roughness:0.3 });
  const matCtrl   = new THREE.MeshStandardMaterial({ color:0x2a3a2a, metalness:0.4, roughness:0.6 });
  const matPellet = new THREE.MeshStandardMaterial({ color:0x90d99a, metalness:0.1, roughness:0.8 });
  const matGlow   = new THREE.MeshStandardMaterial({ color:0x8fd49a, emissive:0x4a9e58, emissiveIntensity:0.9, metalness:0.3, roughness:0.3 });

  const group = new THREE.Group();
  scene.add(group);

  const hopperM=[], motorM=[], tubeM=[], ctrlM=[];

  function box(w,h,d,mat,x,y,z) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
    group.add(m); return m;
  }
  function cyl(rt,rb,h,seg,mat,x,y,z,rx=0,ry=0,rz=0) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
    m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
    m.castShadow=true; m.receiveShadow=true;
    group.add(m); return m;
  }

  // Base platform
  box(4.2,0.18,1.1,matBase,0,-0.6,0);
  [-1.9,1.9].forEach(x=>[-0.4,0.4].forEach(z=>cyl(0.07,0.09,0.3,8,matBase,x,-0.82,z)));

  // Main body block
  box(3.2,0.7,0.95,matSteel,-0.3,-0.16,0);

  // Extruder tube
  tubeM.push(cyl(0.22,0.22,1.8,24,matSteel,0.2,0.2,0,0,0,Math.PI/2));
  cyl(0.22,0.18,0.08,24,matSteel,1.12,0.2,0,0,0,Math.PI/2);
  [-0.3,0.2,0.7].forEach(x=>cyl(0.25,0.25,0.06,24,matBase,x,0.2,0,0,0,Math.PI/2));

  // Motor (blue)
  motorM.push(box(0.55,0.55,0.55,matMotor,-1.35,0.1,0));
  cyl(0.06,0.06,0.35,12,matSteel,-1.05,0.1,0,0,0,Math.PI/2);
  [0.12,0.04,-0.04,-0.12].forEach(z=>box(0.55,0.04,0.04,matMotor,-1.35,0.38,z));

  // Hopper (funnel)
  const hTop=cyl(0.38,0.18,0.42,4,matHopper,-1.2,1.06,0);
  const hBot=cyl(0.18,0.28,0.35,4,matHopper,-1.2,0.7,0);
  hTop.rotation.y=Math.PI/4; hBot.rotation.y=Math.PI/4;
  hopperM.push(hTop,hBot);
  cyl(0.4,0.4,0.04,4,matBase,-1.2,1.29,0,0,Math.PI/4,0);
  cyl(0.05,0.05,0.5,8,matSteel,-1.2,0.42,0);

  // Pressure gauges
  cyl(0.1,0.1,0.05,16,matCtrl,-0.6,0.42,0.5);
  cyl(0.1,0.1,0.05,16,matCtrl,-0.3,0.42,0.5);
  const matScreen=new THREE.MeshStandardMaterial({color:0xddffdd});
  cyl(0.08,0.08,0.02,16,matScreen,-0.6,0.43,0.53);
  cyl(0.08,0.08,0.02,16,matScreen,-0.3,0.43,0.53);

  // Control box
  ctrlM.push(box(0.5,0.75,0.6,matCtrl,1.05,0.1,0));
  box(0.22,0.18,0.02,new THREE.MeshStandardMaterial({color:0x00cc66,emissive:0x00cc66,emissiveIntensity:0.5}),1.05,0.2,0.31);
  [[1.05,0.02],[1.14,-0.08],[0.96,-0.08]].forEach(([x,y],i)=>{
    const c=[0xff3333,0xffcc00,0x33ff66][i];
    cyl(0.03,0.03,0.02,12,new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.3}),x,y,0.31);
  });

  // Conveyor
  const cg=new THREE.Group(); cg.rotation.z=-0.22; cg.position.set(1.55,-0.05,0); group.add(cg);
  const cm=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.1,0.55),matCtrl); cm.castShadow=true; cg.add(cm);
  for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.02,0.08),new THREE.MeshStandardMaterial({color:0x445544}));s.position.z=-0.2+i*0.08;cg.add(s);}

  // Pellet bin + pellets
  box(0.55,0.5,0.55,new THREE.MeshStandardMaterial({color:0x1a3220,metalness:0.4,roughness:0.6,transparent:true,opacity:0.85}),2.15,-0.38,0);
  for(let i=0;i<14;i++) cyl(0.04,0.04,0.07,8,matPellet,2.05+Math.random()*0.2,-0.28+Math.random()*0.15,-0.15+Math.random()*0.3);

  // Extra pipe
  cyl(0.04,0.04,0.3,8,matSteel,0.8,0.05,0.45,Math.PI/3,0,0);

  // Floor shadow plane
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshStandardMaterial({color:0x0a1a0c,transparent:true,opacity:0.4,roughness:1}));
  fl.rotation.x=-Math.PI/2; fl.position.y=-0.72; fl.receiveShadow=true; scene.add(fl);

  // Highlight parts on hover
  const partGroups=[hopperM, motorM, tubeM, ctrlM];
  const origMats=[matHopper, matMotor, matSteel, matCtrl];
  let hlIdx=-1;

  function highlight(idx) {
    if(hlIdx===idx) return;
    partGroups.forEach((g,i)=>g.forEach(m=>m.material=i===idx?matGlow:origMats[i]));
    hlIdx=idx;
  }
  function resetHL() {
    partGroups.forEach((g,i)=>g.forEach(m=>m.material=origMats[i]));
    hlIdx=-1;
  }

  document.querySelectorAll('.mach-part-row').forEach(row=>{
    row.addEventListener('mouseenter',()=>{
      document.querySelectorAll('.mach-part-row').forEach(r=>r.classList.remove('active'));
      row.classList.add('active');
      highlight(parseInt(row.dataset.part));
    });
    row.addEventListener('mouseleave',()=>{ row.classList.remove('active'); resetHL(); });
  });

  // Drag orbit
  let rotY=0.3, rotX=0.25, drag=false, px=0, py=0, autoSpin=true, autoT;
  group.rotation.y=rotY; group.rotation.x=rotX;

  canvas.addEventListener('mousedown',e=>{drag=true;px=e.clientX;py=e.clientY;autoSpin=false;clearTimeout(autoT);});
  document.addEventListener('mousemove',e=>{
    if(!drag)return;
    rotY+=(e.clientX-px)*0.008; rotX+=(e.clientY-py)*0.005;
    rotX=Math.max(-0.6,Math.min(0.7,rotX));
    group.rotation.y=rotY; group.rotation.x=rotX; px=e.clientX; py=e.clientY;
  });
  document.addEventListener('mouseup',()=>{drag=false;autoT=setTimeout(()=>autoSpin=true,2200);});
  canvas.addEventListener('wheel',e=>{camera.position.multiplyScalar(e.deltaY>0?1.08:0.93);camera.position.clampLength(3,12);},{passive:true});
  canvas.addEventListener('touchstart',e=>{autoSpin=false;clearTimeout(autoT);px=e.touches[0].clientX;py=e.touches[0].clientY;},{passive:true});
  canvas.addEventListener('touchmove',e=>{
    rotY+=(e.touches[0].clientX-px)*0.008; rotX+=(e.touches[0].clientY-py)*0.005;
    rotX=Math.max(-0.6,Math.min(0.7,rotX));
    group.rotation.y=rotY; group.rotation.x=rotX; px=e.touches[0].clientX; py=e.touches[0].clientY;
  },{passive:true});
  canvas.addEventListener('touchend',()=>{autoT=setTimeout(()=>autoSpin=true,2200);});

  window.addEventListener('resize',()=>{
    const w=canvas.clientWidth,h=canvas.clientHeight;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  });

  (function render(){
    requestAnimationFrame(render);
    if(autoSpin){rotY+=0.004;group.rotation.y=rotY;}
    renderer.render(scene,camera);
  })();
}

let machineInited = false;
// ── SLIDE ANIMATIONS ──────────────────────────────────────────────────
function triggerAnim(i) {
  const t = (delay, targets, props) => anime({ targets, easing: 'easeOutExpo', delay, ...props });

  switch (i) {
    case 0:
      t(0, '.eyebrow', { opacity: [0, 1], translateY: [15, 0], duration: 700 });
      anime({ targets: '.hero-title .word', translateY: ['115%', '0%'], duration: 1000, delay: anime.stagger(120, { start: 200 }), easing: 'easeOutExpo' });
      t(600, '.hero-desc', { opacity: [0, 1], translateY: [20, 0], duration: 700 });
      t(850, '.hero-cta', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(1000, '.hero-stats', { opacity: [0, 1], translateX: [30, 0], duration: 700 });
      break;

    case 1:
      t(0, '#s2 .sec-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.problem-headline', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      anime({ targets: '.prob-card', opacity: [0, 1], translateY: [50, 0], duration: 700, delay: anime.stagger(130, { start: 600 }), easing: 'easeOutCubic' });
      break;

    case 2:
      t(0, '.sol-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.sol-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      anime({ targets: '.flow-node', opacity: [0, 1], translateY: [30, 0], duration: 600, delay: anime.stagger(120, { start: 600 }), easing: 'easeOutCubic' });
      setTimeout(() => {
        anime({ targets: '#flowLine', opacity: [0, 1], scaleX: [0, 1], duration: 1000, easing: 'easeOutExpo' });
      }, 900);
      break;

    case 3: // MACHINE
      t(0, '#mach-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.mach-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      t(450, '.mach-sub', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(600, '.mach-specs', { opacity: [0, 1], translateY: [20, 0], duration: 700 });
      t(800, '.mach-parts-list', { opacity: [0, 1], translateX: [-20, 0], duration: 600 });
      t(500, '.mach-3d-wrap', { opacity: [0, 1], scale: [0.9, 1], duration: 800, easing: 'easeOutBack' });
      if (!machineInited) { machineInited = true; setTimeout(initMachine, 600); }
      break;

    case 4:
      t(0, '#s4 .sec-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.mkt-left-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      setTimeout(() => {
        anime({
          targets: { val: 0 }, val: 24, round: 1, duration: 1500, easing: 'easeOutCubic',
          update: a => { document.getElementById('mktCounter').textContent = Math.round(a.animations[0].currentValue); }
        });
        t(0, '.mkt-big-num', { opacity: [0, 1], translateY: [20, 0], duration: 700 });
      }, 400);
      t(600, '.mkt-big-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(700, '.mkt-cagr', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(500, '.mkt-right', {
        opacity: [0, 1], translateX: [30, 0], duration: 700, complete: () => {
          document.querySelectorAll('.mkt-bar-fill').forEach(b => {
            anime({ targets: b, width: [0, b.dataset.w + '%'], duration: 1200, easing: 'easeOutCubic' });
          });
        }
      });
      break;

    case 5:
      t(0, '#s5 .sec-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.comp-main-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      t(400, '.comp-insight', { opacity: [0, 1], translateY: [20, 0], duration: 700 });
      anime({ targets: '.comp-card', opacity: [0, 1], translateY: [40, 0], duration: 700, delay: anime.stagger(150, { start: 600 }), easing: 'easeOutCubic' });
      break;

    case 6:
      t(0, '#s6 .sec-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.biz-main-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      anime({ targets: '.biz-card', opacity: [0, 1], translateY: [50, 0], duration: 700, delay: anime.stagger(150, { start: 600 }), easing: 'easeOutCubic' });
      break;

    case 7:
      t(0, '#s7 .sec-label', { opacity: [0, 1], translateY: [15, 0], duration: 600 });
      t(200, '.fin-title', { opacity: [0, 1], translateY: [30, 0], duration: 800 });
      anime({ targets: '.fin-metric', opacity: [0, 1], translateX: [-30, 0], duration: 600, delay: anime.stagger(100, { start: 500 }), easing: 'easeOutCubic' });
      setTimeout(() => {
        anime({
          targets: '.fin-alloc', opacity: [0, 1], translateX: [30, 0], duration: 700, easing: 'easeOutCubic', complete: () => {
            document.querySelectorAll('.fin-alloc-bar').forEach(b => {
              anime({ targets: b, width: [0, b.dataset.w + '%'], duration: 1000, easing: 'easeOutCubic' });
            });
          }
        });
        t(400, '.fin-timeline', { opacity: [0, 1], translateY: [20, 0], duration: 600 });
      }, 600);
      break;

    case 8:
      t(0, '.close-tag', { opacity: [0, 1], duration: 600 });
      anime({ targets: '.close-title .word', translateY: ['115%', '0%'], duration: 1000, delay: anime.stagger(150, { start: 300 }), easing: 'easeOutExpo' });
      t(700, '.close-sub', { opacity: [0, 1], translateY: [20, 0], duration: 700 });
      anime({ targets: '.close-badge', opacity: [0, 1], translateY: [15, 0], duration: 500, delay: anime.stagger(80, { start: 900 }), easing: 'easeOutCubic' });
      break;
  }
}
