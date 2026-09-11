import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  PROFILE, EXPERIENCE, PROJECTS, CERTIFICATIONS, CERT_NAMES,
  SKILLS, EDUCATION, HOBBIES,
} from "./data.js";

const el = (id) => document.getElementById(id);
const isTouch = matchMedia("(hover: none)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============ SECTIONS: one globe, seven raised nodes ============ */
const SECTIONS = [
  { key:"core",    name:"PROFILE",        icon:"◆", color:"#ff9a52", lat: 18, lon:    0 },
  { key:"exp",     name:"EXPERIENCE",     icon:"▲", color:"#2ff0d0", lat: 45, lon:   58 },
  { key:"proj",    name:"PROJECTS",       icon:"■", color:"#ff5ea8", lat: -8, lon:  112 },
  { key:"cert",    name:"CERTIFICATIONS", icon:"★", color:"#ffce5a", lat:-46, lon:  166 },
  { key:"skill",   name:"SKILLS",         icon:"✦", color:"#b388ff", lat:  8, lon: -128 },
  { key:"edu",     name:"EDUCATION",      icon:"▰", color:"#7cff6b", lat: 52, lon:  -62 },
  { key:"contact", name:"CONTACT",        icon:"◉", color:"#5ad1ff", lat:-38, lon:  -14 },
];
const R = 10; // globe radius

/* ===================== THREE SETUP ===================== */
const canvas = el("space");
const wrap  = el("globeWrap");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.75 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 3000);
camera.position.set(0, 0, 34);

const world = new THREE.Group();      // holds globe + nodes; this is what rotates
scene.add(world);

scene.add(new THREE.AmbientLight(0x9c98d8, 1.25));
const key  = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(-1.1, 0.9, 1.3); scene.add(key);
const rim  = new THREE.DirectionalLight(0x6fc9ff, 1.5); rim.position.set(1.4, -0.5, -1); scene.add(rim);
const fill = new THREE.PointLight(0xff7ac0, 1.2, 160); fill.position.set(18, -14, 20); scene.add(fill);

/* ===================== BACKDROP ===================== */
function starfield(count, size, a, b, spread) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3), col = new Float32Array(count*3);
  const A = new THREE.Color(a), B = new THREE.Color(b), t = new THREE.Color();
  for (let i=0;i<count;i++){
    const r = spread*(0.5+Math.random());
    const th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph); pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    t.copy(A).lerp(B, Math.random()); col[i*3]=t.r; col[i*3+1]=t.g; col[i*3+2]=t.b;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos,3));
  g.setAttribute("color", new THREE.BufferAttribute(col,3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size, vertexColors:true, transparent:true,
    opacity:.75, depthWrite:false, sizeAttenuation:false, blending:THREE.AdditiveBlending }));
}
const stars  = starfield(isTouch?1600:2800, 1.5, "#d9ccff", "#ffffff", 420); scene.add(stars);
const stars2 = starfield(isTouch?500:900, 2.6, "#ff7ac0", "#5ad1ff", 620); scene.add(stars2);

/* ===================== GLOBE ===================== */
function globeTexture(){
  const W=2048, H=1024;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const c=cv.getContext("2d");
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#141a44"); g.addColorStop(.5,"#0e1336"); g.addColorStop(1,"#161045");
  c.fillStyle=g; c.fillRect(0,0,W,H);
  // continents: blobby clusters
  const blob=(x,y,r,fill,alpha)=>{
    c.save(); c.globalAlpha=alpha; c.fillStyle=fill; c.beginPath();
    const n=14; for(let i=0;i<=n;i++){
      const a=i/n*Math.PI*2, rr=r*(0.62+Math.random()*0.55);
      const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*0.7;
      i?c.lineTo(px,py):c.moveTo(px,py);
    }
    c.closePath(); c.fill(); c.restore();
  };
  for(let i=0;i<26;i++){
    const x=Math.random()*W, y=120+Math.random()*(H-240), r=50+Math.random()*150;
    blob(x,y,r, i%3? "#3c6bb8":"#4a83cf", .8);
    for(let k=0;k<4;k++) blob(x+(Math.random()-.5)*r*1.6, y+(Math.random()-.5)*r, r*0.5, "#5b9ae0", .55);
  }
  // coastal shimmer + micro detail
  for(let i=0;i<5200;i++){
    c.fillStyle=`rgba(${120+Math.random()*110|0},${160+Math.random()*90|0},255,${Math.random()*.13})`;
    c.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  }
  // graticule
  c.strokeStyle="rgba(170,205,255,.16)"; c.lineWidth=1.5;
  for(let i=1;i<12;i++){ const y=i*H/12; c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
  for(let i=1;i<24;i++){ const x=i*W/24; c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
const gTex = globeTexture();
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 64),
  new THREE.MeshStandardMaterial({ map:gTex, bumpMap:gTex, bumpScale:.45,
    roughness:.72, metalness:.18, emissive:new THREE.Color("#16225c"), emissiveIntensity:.42 })
);
world.add(globe);

// wire shell just above the surface — gives the "built" look
const wire = new THREE.Mesh(new THREE.SphereGeometry(R*1.004, 36, 24),
  new THREE.MeshBasicMaterial({ color:0x7fa6ff, wireframe:true, transparent:true, opacity:.09 }));
world.add(wire);

// atmosphere (fresnel rim)
const atmo = new THREE.Mesh(new THREE.SphereGeometry(R*1.09, 48, 32), new THREE.ShaderMaterial({
  transparent:true, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false,
  uniforms:{ uColor:{ value:new THREE.Color("#59a8ff") } },
  vertexShader:`varying vec3 vN; varying vec3 vP;
    void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.);
      vP=mv.xyz; gl_Position=projectionMatrix*mv; }`,
  fragmentShader:`uniform vec3 uColor; varying vec3 vN; varying vec3 vP;
    void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(-vP))),4.2);
      gl_FragColor=vec4(uColor, f*0.5); }`,
}));
world.add(atmo);

// slim equatorial halo ring (static, decorative)
const halo = new THREE.Mesh(new THREE.RingGeometry(R*1.3, R*1.35, 200),
  new THREE.MeshBasicMaterial({ color:0x9c8bff, transparent:true, opacity:.22,
    side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
halo.rotation.x = Math.PI/2 - 0.34; halo.rotation.z = 0.18;
scene.add(halo);
const halo2 = halo.clone(); halo2.scale.setScalar(1.12); halo2.material = halo.material.clone();
halo2.material.opacity = .1; halo2.rotation.x = Math.PI/2 + 0.22; halo2.rotation.z = -0.3; scene.add(halo2);

// orbiting dust motes (motion without any "planets")
const motes = starfield(260, 2.2, "#9ad8ff", "#ffb0e0", R*1.9);
motes.geometry.scale(1, .28, 1); scene.add(motes);

/* ===================== RAISED NODES ===================== */
const latLonToVec = (lat, lon, r) => {
  const p = (90-lat)*Math.PI/180, t = (lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t), r*Math.cos(p), r*Math.sin(p)*Math.sin(t));
};
const hitTargets = [];
const UP = new THREE.Vector3(0,1,0);

function glowSprite(color){
  const cv=document.createElement("canvas"); cv.width=cv.height=128;
  const c=cv.getContext("2d"); const g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,"rgba(255,255,255,.95)"); g.addColorStop(.25,"rgba(255,255,255,.45)");
  g.addColorStop(1,"rgba(255,255,255,0)");
  c.fillStyle=g; c.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(cv);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map:t, color:new THREE.Color(color),
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false }));
}


/* ---------- little 3D objects that stand on the globe ---------- */
function paintTex(draw, w=128, h=128){
  const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
  draw(cv.getContext("2d"), w, h);
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
const std = (o) => new THREE.MeshStandardMaterial(o);
function put(g, mesh, x, y, z, rx=0, ry=0, rz=0){
  mesh.position.set(x,y,z); mesh.rotation.set(rx,ry,rz); g.add(mesh); return mesh;
}

function buildObject(key, col){
  const g = new THREE.Group();
  const metal = std({ color:0xb9c2d6, roughness:.35, metalness:.85 });
  const dark  = std({ color:0x2b2f45, roughness:.6,  metalness:.4 });
  const accent= std({ color:col, emissive:col, emissiveIntensity:.45, roughness:.35, metalness:.5 });

  if (key === "core"){                       // a person standing on their world
    const skin = std({ color:0xf3c9a2, roughness:.7, metalness:.05 });
    const suit = std({ color:col, roughness:.55, metalness:.25 });
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.26,24,24), skin), 0, 1.52, 0);
    put(g, new THREE.Mesh(new THREE.CapsuleGeometry(.24,.46,8,18), suit), 0, 1.02, 0);
    put(g, new THREE.Mesh(new THREE.CapsuleGeometry(.085,.4,6,12), suit), -.3, 1.02, 0, 0,0, .35);
    put(g, new THREE.Mesh(new THREE.CapsuleGeometry(.085,.4,6,12), suit),  .3, 1.02, 0, 0,0,-.35);
    put(g, new THREE.Mesh(new THREE.CapsuleGeometry(.1,.44,6,12), dark), -.13, .38, 0);
    put(g, new THREE.Mesh(new THREE.CapsuleGeometry(.1,.44,6,12), dark),  .13, .38, 0);
  }

  else if (key === "exp"){                   // an office tower
    const winTex = paintTex((c,w,h) => {
      c.fillStyle="#26304d"; c.fillRect(0,0,w,h);
      for(let y=6;y<h-6;y+=14) for(let x=6;x<w-6;x+=13){
        c.fillStyle = Math.random()>.35 ? "rgba(255,226,150,.95)" : "rgba(90,120,180,.5)";
        c.fillRect(x,y,8,9);
      }
    });
    const glass = std({ map:winTex, emissiveMap:winTex, emissive:0xffffff, emissiveIntensity:.5,
      roughness:.3, metalness:.6 });
    put(g, new THREE.Mesh(new THREE.BoxGeometry(.78,1.5,.78), glass), 0, .75, 0);
    put(g, new THREE.Mesh(new THREE.BoxGeometry(.5,.55,.5), glass), 0, 1.78, 0);
    put(g, new THREE.Mesh(new THREE.BoxGeometry(.9,.08,.9), metal), 0, 1.52, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.42,6), metal), 0, 2.26, 0);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.06,12,12), accent), 0, 2.5, 0);
  }

  else if (key === "proj"){                  // an open laptop showing a dashboard
    const scrTex = paintTex((c,w,h) => {
      c.fillStyle="#0d1330"; c.fillRect(0,0,w,h);
      c.fillStyle="rgba(255,255,255,.08)"; c.fillRect(6,6,w-12,16);
      const bars=[.5,.8,.35,.95,.65,.45];
      bars.forEach((v,i)=>{ c.fillStyle=["#ff5ea8","#2ff0d0","#b388ff","#ffce5a","#5ad1ff","#7cff6b"][i];
        c.fillRect(12+i*18, h-14-v*70, 12, v*70); });
      c.strokeStyle="rgba(255,255,255,.25)"; c.beginPath(); c.moveTo(8,h-12); c.lineTo(w-8,h-12); c.stroke();
    }, 160, 110);
    const screen = std({ map:scrTex, emissiveMap:scrTex, emissive:0xffffff, emissiveIntensity:.85,
      roughness:.4, metalness:.2 });
    put(g, new THREE.Mesh(new THREE.BoxGeometry(1.25,.07,.86), metal), 0, .34, .12);
    const lid = put(g, new THREE.Mesh(new THREE.BoxGeometry(1.25,.82,.05), metal), 0, .74, -.3, -.32);
    put(lid, new THREE.Mesh(new THREE.PlaneGeometry(1.1,.68), screen), 0, 0, .032);
    put(g, new THREE.Mesh(new THREE.PlaneGeometry(1.05,.62), std({ color:0x1b2138, roughness:.8 })), 0, .38, .16, -Math.PI/2);
  }

  else if (key === "cert"){                  // a trophy on a plinth
    const g2 = std({ color:0xffc85a, roughness:.22, metalness:.95, emissive:0x5a3c00, emissiveIntensity:.35 });
    put(g, new THREE.Mesh(new THREE.BoxGeometry(.72,.18,.72), dark), 0, .09, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.16,.26,.3,20), g2), 0, .33, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.42,.2,.62,24), g2), 0, .79, 0);
    put(g, new THREE.Mesh(new THREE.TorusGeometry(.14,.045,8,20), g2), -.46, .95, 0, 0, Math.PI/2, 0);
    put(g, new THREE.Mesh(new THREE.TorusGeometry(.14,.045,8,20), g2),  .46, .95, 0, 0, Math.PI/2, 0);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.1,16,16), accent), 0, 1.2, 0);
  }

  else if (key === "skill"){                 // a turning gear + wrench
    const gear = new THREE.Group();
    gear.add(new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.18,28), metal));
    for (let k=0;k<9;k++){
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(.17,.19,.16), metal);
      const a = k/9*Math.PI*2;
      tooth.position.set(Math.cos(a)*.55, 0, Math.sin(a)*.55); tooth.rotation.y = -a;
      gear.add(tooth);
    }
    gear.add(new THREE.Mesh(new THREE.TorusGeometry(.17,.06,10,24), accent).rotateX(Math.PI/2));
    gear.rotation.x = Math.PI/2; gear.position.y = .95; g.add(gear);
    g.userData.gear = gear;
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.95,12), metal), 0, .46, 0);
    put(g, new THREE.Mesh(new THREE.BoxGeometry(.66,.12,.5), dark), 0, .07, 0);
  }

  else if (key === "edu"){                   // a graduation cap over a stack of books
    const board = std({ color:0x1c1e3a, roughness:.7, metalness:.2 });
    const cols = [0xff5ea8, 0x2ff0d0, 0xffce5a];
    cols.forEach((c0,k) => put(g, new THREE.Mesh(new THREE.BoxGeometry(.9-k*.08,.16,.62),
      std({ color:c0, roughness:.75 })), 0, .09+k*.17, 0, 0, (k-1)*.18, 0));
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.3,20,16,0,6.28,0,Math.PI/2), board), 0, .62, 0);
    put(g, new THREE.Mesh(new THREE.BoxGeometry(1.0,.06,1.0), board), 0, .92, 0, 0, .5, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.34,6), accent), .34, .78, .2);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.07,12,12), accent), .34, .6, .2);
  }

  else {                                     // contact: a satellite dish
    const dish = std({ color:0xe6ebf5, roughness:.45, metalness:.5, side:THREE.DoubleSide });
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.14,20), dark), 0, .07, 0);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.6,12), metal), 0, .44, 0);
    const d = put(g, new THREE.Mesh(new THREE.SphereGeometry(.6,28,18,0,6.28,0,Math.PI/2.6), dish),
      0, .95, 0, Math.PI*0.78, 0, .25);
    d.scale.set(1,.55,1);
    put(g, new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.5,8), metal), .12, 1.05, .3, .9);
    put(g, new THREE.Mesh(new THREE.SphereGeometry(.09,14,14), accent), .2, 1.22, .5);
  }
  return g;
}

SECTIONS.forEach((s, i) => {
  const col = new THREE.Color(s.color);
  const dir = latLonToVec(s.lat, s.lon, 1);
  const node = new THREE.Group();
  node.position.copy(dir).multiplyScalar(R);
  node.quaternion.setFromUnitVectors(UP, dir);       // +Y points away from the globe
  world.add(node);

  // base plate sunk into the surface
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.8, .26, 40),
    new THREE.MeshStandardMaterial({ color:col.clone().multiplyScalar(.34), emissive:col,
      emissiveIntensity:.32, roughness:.5, metalness:.5 }));
  plate.position.y = .05; node.add(plate);

  const ringBase = new THREE.Mesh(new THREE.TorusGeometry(1.9, .075, 10, 60),
    new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.6 }));
  ringBase.rotation.x = Math.PI/2; ringBase.position.y = .14; node.add(ringBase);

  // the raised part — a lifted group so hover/select can animate it
  const lift = new THREE.Group(); node.add(lift);

  // a small pedestal, then the real object standing on it
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, .45, 30),
    new THREE.MeshStandardMaterial({ color:col.clone().multiplyScalar(.35), emissive:col,
      emissiveIntensity:.28, roughness:.45, metalness:.55 }));
  pedestal.position.y = .42; lift.add(pedestal);

  const obj = buildObject(s.key, col);
  obj.position.y = .66; obj.scale.setScalar(2.05); lift.add(obj);   // large enough to read at a glance

  const gl = glowSprite(s.color); gl.scale.setScalar(4.2); gl.position.y = 2.0; lift.add(gl);

  // pulse ring that rides outward across the plate
  const pulse = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.1, 48),
    new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.5,
      side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false }));
  pulse.rotation.x = -Math.PI/2; pulse.position.y = .2; node.add(pulse);

  // generous invisible hit volume — easy to tap
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 5.6, 10),
    new THREE.MeshBasicMaterial({ visible:false }));
  hit.position.y = 2.4; hit.userData.index = i; node.add(hit);
  hitTargets.push(hit);

  Object.assign(s, { node, lift, obj, pulse, gl, ringBase, dir, labelY:5.2,
    liftY:0, liftTarget:0, pulseT:Math.random() });

  // projected HTML label
  const lab = document.createElement("button");
  lab.className = "mlabel";
  lab.style.color = s.color;
  lab.innerHTML = `<span class="md" style="background:${s.color}"></span>${s.name}`;
  lab.addEventListener("click", (e) => { e.stopPropagation(); select(i); });
  el("labels").appendChild(lab);
  s.labelEl = lab;
});

/* ===================== POST ===================== */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1,1), 0.34, 0.5, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ===================== SIZING: always fits ===================== */
let viewW = 1, viewH = 1;
function syncTopbar(){
  const h = el("topbar").offsetHeight || 66;
  document.documentElement.style.setProperty("--topH", h + "px");
}
function fit(){
  syncTopbar();
  viewW = Math.max(1, wrap.clientWidth); viewH = Math.max(1, wrap.clientHeight);
  renderer.setSize(viewW, viewH, false);
  composer.setSize(viewW, viewH);
  camera.aspect = viewW/viewH;
  // headroom for labels/nodes + the top bar, so nothing ever gets cropped
  // room for rings, nodes and labels — tighter in portrait, where width is the limit
  const portrait = camera.aspect < 0.85;
  const need = R * (portrait ? 1.62 : (viewH < 560 ? 1.86 : 1.76));
  // pull the decorative rings in on narrow screens so they stay fully on-screen
  halo.scale.setScalar(portrait ? 0.86 : 1);
  halo2.scale.setScalar(portrait ? 0.97 : 1.12);
  const half = THREE.MathUtils.degToRad(camera.fov)/2;
  const dV = need/Math.tan(half);
  const dH = need/(Math.tan(half)*camera.aspect);
  camDist = Math.max(dV, dH);
  camera.updateProjectionMatrix();
}
let camDist = 34, camDistNow = 34;
new ResizeObserver(fit).observe(wrap);
addEventListener("resize", fit);
addEventListener("orientationchange", () => setTimeout(fit, 240));
fit(); camDistNow = camDist;

/* ===================== INTERACTION: drag to rotate ===================== */
const rot = { yaw:0.5, pitch:-0.12, vYaw:0, vPitch:0, tYaw:null, tPitch:null };
let dragging = false, px=0, py=0, moved=0, downT=0, idle=0;

canvas.addEventListener("pointerdown", (e) => {
  dragging = true; moved = 0; downT = performance.now();
  px = e.clientX; py = e.clientY; idle = 0;
  rot.tYaw = rot.tPitch = null;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (dragging){
    const dx = e.clientX-px, dy = e.clientY-py; px=e.clientX; py=e.clientY;
    moved += Math.hypot(dx,dy);
    rot.vYaw = dx*0.005; rot.vPitch = dy*0.004;
    rot.yaw += rot.vYaw;
    rot.pitch = THREE.MathUtils.clamp(rot.pitch + rot.vPitch, -1.15, 1.15);
  }
  hoverAt(e.clientX, e.clientY);
});
const endDrag = () => { dragging = false; };
canvas.addEventListener("pointerup", (e) => {
  if (moved < 9 && performance.now()-downT < 500) clickAt(e.clientX, e.clientY);
  endDrag();
});
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("pointerleave", () => { endDrag(); clearHover(); });
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoom = THREE.MathUtils.clamp(zoom + e.deltaY*0.0011, -0.28, 0.5);
}, { passive:false });
let zoom = 0;

/* ===================== PICKING ===================== */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = el("tip");
let hovered = -1;

function pick(cx, cy){
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx-r.left)/r.width)*2-1, -((cy-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(hitTargets, false)[0];
  if (!h) return -1;
  // only pick nodes on the visible hemisphere
  const i = h.object.userData.index;
  return facing(SECTIONS[i]) > 0.02 ? i : -1;
}
const _n = new THREE.Vector3();
function facing(s){
  _n.copy(s.dir).applyQuaternion(world.quaternion).normalize();
  return _n.dot(new THREE.Vector3(0,0,1));
}
function hoverAt(cx, cy){
  if (isTouch) return;
  const i = pick(cx, cy);
  if (i !== hovered){
    hovered = i;
    canvas.style.cursor = i >= 0 ? "pointer" : "grab";
    if (i >= 0){
      tip.innerHTML = `${SECTIONS[i].name}<small>click to open</small>`;
      tip.classList.add("show");
    } else tip.classList.remove("show");
  }
  tip.style.left = cx+"px"; tip.style.top = cy+"px";
}
function clearHover(){ hovered = -1; tip.classList.remove("show"); }
function clickAt(cx, cy){ const i = pick(cx, cy); if (i >= 0) select(i); }

/* ===================== PANEL CONTENT (responsive HTML) ===================== */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
const delay = (i) => `animation-delay:${Math.min(i*55, 600)}ms`;

function contentFor(key, color){
  if (key === "core") return `
    <div class="card" style="${delay(0)}">
      <h3>${esc(PROFILE.name)}</h3>
      <div class="meta">${esc(PROFILE.role)}</div>
      <p>${esc(PROFILE.summary)}</p>
    </div>
    <div class="card" style="${delay(1)}">
      <h3>AT A GLANCE</h3>
      <div class="stats">
        ${[["4+","Years in analytics"],["8M+","Cost savings driven"],["20M+","Client revenue impact"],["13+","Projects delivered"]]
          .map(([b,t]) => `<div class="stat"><b style="color:${color}">${b}</b><span>${t}</span></div>`).join("")}
      </div>
    </div>`;

  if (key === "exp") return EXPERIENCE.map((e,i) => `
    <div class="card" style="${delay(i)}">
      <h3>${esc(e.company)}</h3>
      <div class="meta">${esc(e.role)} · ${esc(e.duration)}</div>
      <p>${esc(e.details)}</p>
      <div class="stats">
        ${e.stats.map((s) => `<div class="stat"><b style="color:${s.color}">${s.percent}%</b>
          <span>${esc(s.title)}</span>
          <div class="bar"><i style="--w:${s.percent}%;background:${s.color}"></i></div></div>`).join("")}
      </div>
    </div>`).join("");

  if (key === "proj") return `
    <p class="lede">Analytics dashboards, AI products and shipped apps — tap any card to open it.</p>
    <div class="grid">
      ${PROJECTS.map((p,i) => {
        const inner = `<img src="${p.path}" alt="Project ${i+1}" loading="lazy" />
          ${p.link ? `<span class="go">open ↗</span>` : ""}`;
        const cls = `shot${p.isMobile ? " tall" : ""}`;
        return p.link
          ? `<a class="${cls}" style="${delay(i)}" href="${p.link}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="${cls}" style="${delay(i)}">${inner}</div>`;
      }).join("")}
    </div>`;

  if (key === "cert") return `
    <p class="lede">Verified credentials across analytics, cloud and data engineering.</p>
    <div class="pills">${CERT_NAMES.map((c,i) =>
      `<span class="pill" style="${delay(i)};color:${color}">${esc(c)}</span>`).join("")}</div>
    <div class="grid">${CERTIFICATIONS.map((c,i) =>
      `<div class="shot" style="${delay(i)}"><img src="${c.path}" alt="Certification ${i+1}" loading="lazy" /></div>`).join("")}</div>`;

  if (key === "skill") return `
    <p class="lede">${SKILLS.length}+ competencies across analytics, machine learning, product and delivery.</p>
    <div class="pills">${SKILLS.map((s,i) =>
      `<span class="pill" style="${delay(i)};color:${color}">${esc(s)}</span>`).join("")}</div>`;

  if (key === "edu") return `
    ${EDUCATION.map((e,i) => `
      <div class="card" style="${delay(i)}">
        <h3>${esc(e.school)}</h3>
        <div class="meta">${esc(e.duration)} · ${esc(e.location)}</div>
        <p>${esc(e.degree)}</p>
      </div>`).join("")}
    <div class="card" style="${delay(2)}">
      <h3>BEYOND WORK</h3>
      <div class="meta">Hobbies &amp; interests</div>
      <div class="pills" style="margin-top:12px">${HOBBIES.map((h,i) =>
        `<span class="pill" style="${delay(i+3)};color:${color}">${esc(h)}</span>`).join("")}</div>
    </div>`;

  if (key === "contact") return `
    <p class="lede">Open to roles in business analytics, product and AI. Let's build something.</p>
    <div class="links">
      ${[["✉","Email",PROFILE.email,"mailto:"+PROFILE.email],
         ["in","LinkedIn","in/sakshamn",PROFILE.linkedinUrl],
         ["{ }","GitHub","saakibuilt",PROFILE.githubUrl],
         ["☎","Phone",PROFILE.phone,"tel:"+PROFILE.phone.replace(/[^\d+]/g,"")],
         ["▤","Résumé","view / download",PROFILE.resumeUrl]]
        .map(([ic,t,s,u],i) => `<a class="link" style="${delay(i)};color:${color}" href="${u}" target="_blank" rel="noopener">
          <span class="ic">${ic}</span><span><b>${t}</b><small>${esc(s)}</small></span><span class="arr">→</span></a>`).join("")}
    </div>`;
  return "";
}

/* ===================== SELECT / PANEL ===================== */
const panel = el("panel");
let active = -1;


/* Solve the globe rotation that puts a marker's normal along VIEW_AIM, i.e. tilted away
   from the camera so its object is viewed in profile. world.rotation = Rx(pitch)*Ry(yaw). */
const VIEW_AIM = new THREE.Vector3(0.50, 0.44, 0.74).normalize();
function frameSide(d){
  const A = VIEW_AIM.y, B = VIEW_AIM.z;
  const hyp = Math.hypot(A, B);
  let pitch = 0;
  if (hyp > 1e-6){
    const k = THREE.MathUtils.clamp(d.y / hyp, -1, 1);
    pitch = Math.asin(k) - Math.atan2(A, B);
  }
  pitch = THREE.MathUtils.clamp(pitch, -1.05, 1.05);
  // u = Rx(-pitch) * VIEW_AIM
  const c = Math.cos(pitch), sn = Math.sin(pitch);
  const u = new THREE.Vector3(VIEW_AIM.x, c*VIEW_AIM.y + sn*VIEW_AIM.z, -sn*VIEW_AIM.y + c*VIEW_AIM.z);
  const yaw = Math.atan2(u.x, u.z) - Math.atan2(d.x, d.z);
  return { yaw, pitch };
}

function select(i){
  const s = SECTIONS[i];
  if (active === i){ close(); return; }
  active = i;

  // turn the globe so the node faces the viewer
  // swing the globe so this object is seen from the SIDE (a building reads as a building,
  // not as a rooftop): aim its surface normal up-and-across the view instead of at the camera.
  const aim = frameSide(s.dir);
  rot.tYaw = aim.yaw; rot.tPitch = aim.pitch;
  rot.vYaw = rot.vPitch = 0;

  el("panelKicker").textContent = s.name;
  el("panelTitle").textContent = titleFor(s.key);
  document.querySelector(".panel-dot").style.background = s.color;
  const body = el("panelBody");
  body.innerHTML = contentFor(s.key, s.color);
  body.scrollTop = 0;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden","false");
  SECTIONS.forEach((x,k) => { x.labelEl.classList.toggle("active", k===i); });
  [...el("nav").children].forEach((b,k) => b.classList.toggle("active", k===i));
  el("nav").classList.remove("open");
}
function titleFor(key){
  return ({ core:"Who I Am", exp:"Where I've Worked", proj:"What I've Built",
    cert:"What I'm Certified In", skill:"What I Work With", edu:"How I Got Here",
    contact:"Say Hello" })[key] || "";
}
function close(){
  active = -1;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden","true");
  SECTIONS.forEach((x) => x.labelEl.classList.remove("active"));
  [...el("nav").children].forEach((b) => b.classList.remove("active"));
}
el("panelClose").addEventListener("click", close);

/* nav */
el("nav").innerHTML = `<div class="nav-title">EXPLORE THE GLOBE</div>` + SECTIONS.map((s,i) =>
  `<button data-i="${i}" style="color:${s.color}" title="${s.name}">
     <span class="d" style="background:${s.color}"></span>
     <span class="ic">${s.icon}</span><span class="t">${s.name}</span></button>`).join("");
el("nav").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (b) select(+b.dataset.i);
});
el("navToggle").addEventListener("click", () => el("nav").classList.toggle("open"));

addEventListener("keydown", (e) => {
  if (!started) return;
  if (e.key === "Escape") close();
  const n = parseInt(e.key);
  if (n >= 1 && n <= SECTIONS.length) select(n-1);
  if (e.key === "ArrowRight") select(((active<0?-1:active)+1) % SECTIONS.length);
  if (e.key === "ArrowLeft")  select((((active<0?0:active)-1)+SECTIONS.length) % SECTIONS.length);
});

/* ===================== LABEL PROJECTION (no overlap) ===================== */
const _v = new THREE.Vector3();
const placed = [];
function updateLabels(){
  placed.length = 0;
  // reserve the on-screen UI so a label can never cover it
  const wr = wrap.getBoundingClientRect();
  for (const sel of [".brand", "#nav", ".globe-hint"]){
    const n = document.querySelector(sel);
    if (!n) continue;
    const r = n.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(n).display === "none") continue;
    placed.push({ x1:r.left-wr.left-8, y1:r.top-wr.top-8, x2:r.right-wr.left+8, y2:r.bottom-wr.top+8 });
  }
  const order = SECTIONS.map((s,i) => ({ s, i, f: facing(s) })).sort((a,b) => b.f - a.f);
  const small = viewW < 560;
  for (const { s, f } of order){
    const lab = s.labelEl;
    if (f < 0.3 || (small && s !== SECTIONS[active] && f < 0.6)){ lab.classList.remove("vis"); continue; }
    _v.set(0, s.labelY + s.liftY, 0).applyMatrix4(s.node.matrixWorld).project(camera);
    if (_v.z > 1){ lab.classList.remove("vis"); continue; }
    const cx = (_v.x*0.5+0.5)*viewW, cy = (-_v.y*0.5+0.5)*viewH;
    const w = lab.offsetWidth, h = lab.offsetHeight;
    if (!w || !h){ lab.classList.add("vis"); continue; }   // measure on the next frame
    // the label tracks the object exactly — it is hidden rather than pinned to an edge
    if (cx - w/2 < 4 || cx + w/2 > viewW-4 || cy - h/2 < 4 || cy + h/2 > viewH-4){
      lab.classList.remove("vis"); continue;
    }
    const box = { x1:cx-w/2-8, y1:cy-h/2-9, x2:cx+w/2+8, y2:cy+h/2+9 };
    const clash = placed.some(p => !(box.x2<p.x1 || box.x1>p.x2 || box.y2<p.y1 || box.y1>p.y2));
    if (clash){ lab.classList.remove("vis"); continue; }
    placed.push(box);
    lab.style.left = cx+"px"; lab.style.top = cy+"px";
    lab.style.opacity = String(Math.min(1, 0.45 + f));
    lab.classList.add("vis");
  }
}

/* ===================== RENDER LOOP ===================== */
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;

  // rotation: tween to a target, else inertia + slow idle drift
  const SPIN = 0.075;                       // the globe always turns
  if (rot.tYaw !== null){
    const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    rot.tYaw += dt*SPIN;                    // …even while swinging a marker into view
    rot.yaw   += wrapAngle(rot.tYaw - rot.yaw) * Math.min(1, dt*3.4);
    rot.pitch += (rot.tPitch - rot.pitch) * Math.min(1, dt*3.4);
    if (Math.abs(wrapAngle(rot.tYaw-rot.yaw)) < .002) rot.tYaw = null;
  } else if (!dragging){
    rot.yaw += rot.vYaw; rot.pitch = THREE.MathUtils.clamp(rot.pitch + rot.vPitch, -1.15, 1.15);
    rot.vYaw *= 0.93; rot.vPitch *= 0.93;
    if (!reduced) rot.yaw += dt * SPIN;
  }
  world.rotation.set(rot.pitch, rot.yaw, 0);
  world.updateMatrixWorld();

  // camera breathes toward the fitted distance
  camDistNow += (camDist*(1+zoom) - camDistNow) * Math.min(1, dt*4);
  camera.position.set(0, 0, camDistNow);
  camera.lookAt(0,0,0);

  // nodes: raise on hover/active, idle bob, spin the crystal, pulse the ring
  SECTIONS.forEach((s, i) => {
    const on = (i === active) ? 1 : (i === hovered ? 0.6 : 0);
    s.liftTarget = on * 1.3 + Math.sin(t*1.3 + i)*0.06;
    s.liftY += (s.liftTarget - s.liftY) * Math.min(1, dt*7);
    s.lift.position.y = s.liftY;
    s.lift.scale.setScalar(1 + on*0.16);
    s.obj.rotation.y += dt*(0.12 + on*0.75);          // a slow turn, faster when you touch it
    s.obj.position.y = 0.66 + Math.sin(t*1.6 + i)*0.05; // gentle float
    if (s.obj.userData.gear) s.obj.userData.gear.rotation.y += dt*(0.5 + on*2.2);
    s.gl.material.opacity = 0.4 + on*0.45;
    s.ringBase.material.opacity = 0.45 + on*0.5;

    s.pulseT = (s.pulseT + dt*(0.34 + on*0.5)) % 1;
    const k = s.pulseT;
    s.pulse.scale.setScalar(0.7 + k*1.5);
    s.pulse.material.opacity = (1-k) * (0.25 + on*0.45);
  });

  wire.rotation.y += dt*0.02;
  const STAR_SPEED = 0.02;                  // one speed for every star
  stars.rotation.y += dt*STAR_SPEED;
  stars2.rotation.y += dt*STAR_SPEED;
  motes.rotation.y += dt*STAR_SPEED;
  halo.rotation.z += dt*0.03; halo2.rotation.z -= dt*0.02;
  atmo.material.uniforms.uColor.value.setHSL(0.58 + Math.sin(t*0.2)*0.02, 0.85, 0.62);

  updateLabels();
  composer.render();
}
animate();

/* ===================== INTRO ===================== */
let started = false;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let skipIntro = false;
async function typeIntro(){
  const host = el("typed");
  const lines = [
    { cls:"t-kicker", text:"A Self Built Portfolio",           speed:26 },
    { cls:"t-name",   text:"Saksham Nirula",                   speed:52 },
    { cls:"t-role",   text:"Business Analyst · A.I. Analyst",  speed:22 },
  ];
  for (let i=0;i<lines.length;i++){
    const ln = lines[i];
    const div = document.createElement("div"); div.className = "t-line "+ln.cls;
    const txt = document.createElement("span"); txt.className="txt";
    const car = document.createElement("span"); car.className="caret"; car.textContent="|";
    div.append(txt, car); host.appendChild(div);
    for (const ch of ln.text){
      if (skipIntro){ txt.textContent = ln.text; break; }
      txt.textContent += ch; await sleep(ln.speed + Math.random()*25);
    }
    car.remove(); if (!skipIntro) await sleep(i < lines.length-1 ? 180 : 260);
  }
  el("launch").classList.add("ready");
  el("introHint").classList.add("ready");
}
typeIntro();
// tap anywhere during the intro to skip straight to the button
el("intro").addEventListener("pointerdown", (e) => {
  if (e.target.closest("#launch")) return;
  skipIntro = true;
  el("launch").classList.add("ready"); el("introHint").classList.add("ready");
});

el("launch").addEventListener("click", () => {
  if (started) return;
  started = true;
  const intro = el("intro");
  intro.classList.add("gone");
  setTimeout(() => intro.style.display = "none", 1200);
  // fly-in: start far and wide, settle into the fitted framing
  camDistNow = camDist * 6.5;
  rot.yaw -= 1.6;
  setTimeout(() => {
    el("topbar").classList.remove("hidden");
    requestAnimationFrame(() => el("topbar").classList.add("show"));
    el("globeHint").classList.add("show");
  }, 700);
  setTimeout(() => el("globeHint").classList.remove("show"), 7000);
});
