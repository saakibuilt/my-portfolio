import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  PROFILE, EXPERIENCE, PROJECTS, CERTIFICATIONS, CERT_NAMES,
  SKILLS, EDUCATION, HOBBIES,
} from "./data.js";

const el = (id) => document.getElementById(id);
const isTouch = matchMedia("(hover: none)").matches;

/* =========================================================
   SECTIONS  (sun + planets)
   ========================================================= */
const SECTIONS = [
  { key: "core",    name: "PROFILE",        color: "#ff9a52", radius: 0,  size: 6.0 },
  { key: "exp",     name: "EXPERIENCE",     color: "#2ff0d0", radius: 24, size: 2.7 },
  { key: "proj",    name: "PROJECTS",       color: "#ff5ea8", radius: 37, size: 3.6, ring: true },
  { key: "cert",    name: "CERTIFICATIONS", color: "#ffce5a", radius: 50, size: 2.5 },
  { key: "skill",   name: "SKILLS",         color: "#b388ff", radius: 63, size: 3.1 },
  { key: "edu",     name: "EDUCATION",      color: "#7cff6b", radius: 76, size: 2.9 },
  { key: "contact", name: "CONTACT",        color: "#5ad1ff", radius: 89, size: 2.3 },
];

/* =========================================================
   THREE SETUP
   ========================================================= */
const canvas = el("space");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(0, 72, 158);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.9;
controls.minDistance = 9;
controls.maxDistance = 320;
controls.target.set(0, 0, 0);

// ---- SELECTIVE BLOOM: only the sun glows; planets, images & text stay crisp ----
const renderScene = new RenderPass(scene, camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.45, 0.0);

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloom);

const mixPass = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: { baseTexture: { value: null }, bloomTexture: { value: bloomComposer.renderTarget2.texture } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv;
    void main(){ gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv); }`,
}), "baseTexture");
mixPass.needsSwap = true;

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(mixPass);
finalComposer.addPass(new OutputPass());

// during the bloom pass, hide everything except the sun & its corona
let _sunRef = null, _coronaRef = null;
function setBloomDarken(on) {
  scene.traverse((o) => {
    if (o === _sunRef || o === _coronaRef) return;
    if (o.isMesh || o.isSprite || o.isPoints) {
      if (on) { o.userData._pv = o.visible; o.visible = false; }
      else if ("_pv" in o.userData) { o.visible = o.userData._pv; }
    }
  });
}

scene.add(new THREE.AmbientLight(0x5560a0, 0.55));
scene.add(new THREE.HemisphereLight(0xbfd2ff, 0x3a2a55, 0.5));
// no distance falloff so every planet is evenly, clearly lit
const sunLight = new THREE.PointLight(0xfff0d8, 2.8, 0, 0);
scene.add(sunLight);

/* =========================================================
   STARFIELD + NEBULA
   ========================================================= */
function starfield(count, spread, size, ca, cb) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const A = new THREE.Color(ca), B = new THREE.Color(cb), t = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 300 + Math.random() * 900;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.cos(ph);
    pos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
    t.copy(A).lerp(B, Math.random());
    col[i*3] = t.r; col[i*3+1] = t.g; col[i*3+2] = t.b;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
}
const stars = starfield(isTouch ? 2200 : 3800, 1, 1.6, "#cdbfff", "#ffffff"); scene.add(stars);
const starsFar = starfield(isTouch ? 900 : 1500, 1, 3.0, "#ff7ac0", "#5ad1ff"); scene.add(starsFar);

/* =========================================================
   CANVAS PANEL HELPERS
   ========================================================= */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrap(ctx, text, maxW) {
  const words = text.split(" "); const lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Generic info panel → billboarded Mesh. Single layout pass: measures exactly
// what it draws and wraps every text element, so content is never clipped.
function infoPanel({ title, sub, body = "", accent = "#ffffff", stats = [], pills = [], worldW = 16 }) {
  const W = 960, pad = 56, innerW = W - pad * 2;
  const m = document.createElement("canvas").getContext("2d");
  const TITLE_F = "700 50px 'Orbitron', sans-serif";
  const SUB_F   = "500 30px 'Space Grotesk', sans-serif";
  const BODY_F  = "300 30px 'Space Grotesk', sans-serif";
  const PILL_F  = "500 26px 'Space Grotesk', sans-serif";

  // ---- layout pass (records draw ops + tracks height) ----
  const ops = [];
  let y = pad;
  ops.push({ t: "tag", x: pad, y }); y += 8 + 28;

  m.font = TITLE_F;
  for (const ln of wrap(m, title, innerW)) { ops.push({ t: "title", x: pad, y, text: ln }); y += 58; }

  if (sub) {
    m.font = SUB_F; y += 6;
    for (const ln of wrap(m, sub, innerW)) { ops.push({ t: "sub", x: pad, y, text: ln }); y += 40; }
  }
  if (body) {
    m.font = BODY_F; y += 14;
    for (const ln of wrap(m, body, innerW)) { ops.push({ t: "body", x: pad, y, text: ln }); y += 42; }
  }
  if (stats.length) {
    y += 26;
    const gap = 20, sw = (innerW - gap * (stats.length - 1)) / stats.length;
    stats.forEach((s, i) => ops.push({ t: "stat", x: pad + i * (sw + gap), y, w: sw, s }));
    y += 112;
  }
  if (pills.length) {
    y += 24; m.font = PILL_F;
    let x = pad;
    for (const p of pills) {
      const w = m.measureText(p).width + 40;
      if (x + w > pad + innerW) { x = pad; y += 56; }
      ops.push({ t: "pill", x, y, w, text: p });
      x += w + 12;
    }
    y += 50;
  }
  const H = Math.ceil(y + pad);

  // ---- draw pass ----
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.textBaseline = "alphabetic";
  rr(ctx, 4, 4, W - 8, H - 8, 34);
  ctx.fillStyle = "rgba(16,10,30,0.94)"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(180,150,255,0.30)"; ctx.stroke();

  for (const op of ops) {
    if (op.t === "tag") { ctx.fillStyle = accent; rr(ctx, op.x, op.y, 70, 8, 4); ctx.fill(); }
    else if (op.t === "title") { ctx.fillStyle = "#f7f2ff"; ctx.font = TITLE_F; ctx.fillText(op.text, op.x, op.y + 44); }
    else if (op.t === "sub") { ctx.fillStyle = accent; ctx.font = SUB_F; ctx.fillText(op.text, op.x, op.y + 26); }
    else if (op.t === "body") { ctx.fillStyle = "#cdc3e8"; ctx.font = BODY_F; ctx.fillText(op.text, op.x, op.y + 24); }
    else if (op.t === "stat") {
      rr(ctx, op.x, op.y, op.w, 100, 16); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
      ctx.fillStyle = op.s.color; ctx.font = "700 44px 'Orbitron', sans-serif"; ctx.fillText(op.s.percent + "%", op.x + 18, op.y + 52);
      ctx.fillStyle = "#a99fc8"; ctx.font = "400 18px 'Space Grotesk', sans-serif";
      ctx.fillText((wrap(ctx, op.s.title, op.w - 36)[0]) || "", op.x + 18, op.y + 82);
    }
    else if (op.t === "pill") {
      rr(ctx, op.x, op.y, op.w, 44, 22); ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fill();
      ctx.strokeStyle = "rgba(180,150,255,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#e4dcff"; ctx.font = PILL_F; ctx.fillText(op.text, op.x + 20, op.y + 29);
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide,
    depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldW * H / W), mat);
  mesh.userData.billboard = true;
  return mesh;
}

// detailed procedural planet surface (no external textures needed)
function planetTexture(hex, variant) {
  const S = 512;
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const ctx = cv.getContext("2d");
  const base = new THREE.Color(hex); const hsl = {}; base.getHSL(hsl);
  const col = (l, s = hsl.s, a = 1) =>
    `hsla(${hsl.h * 360},${Math.round(s * 100)}%,${Math.max(0, Math.min(100, l * 100))}%,${a})`;
  ctx.fillStyle = col(hsl.l); ctx.fillRect(0, 0, S, S);

  if (variant === "gas") {
    // banded gas-giant with turbulent stripes
    for (let y = 0; y < S; y += 3) {
      const n = Math.sin(y * 0.045) + Math.sin(y * 0.13 + 1.3) * 0.5 + Math.sin(y * 0.31) * 0.2;
      const l = hsl.l + n * 0.13 + (Math.random() - 0.5) * 0.03;
      ctx.fillStyle = col(l); ctx.fillRect(0, y, S, 3 + Math.random() * 3);
    }
    for (let i = 0; i < 18; i++) { // swirls / storms
      ctx.save(); ctx.globalAlpha = 0.22;
      ctx.fillStyle = col(hsl.l + (Math.random() - 0.5) * 0.35);
      const x = Math.random() * S, y = Math.random() * S, rx = 24 + Math.random() * 70, ry = 7 + Math.random() * 16;
      ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.28); ctx.fill(); ctx.restore();
    }
  } else {
    // rocky / cratered terrain
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = col(hsl.l + (Math.random() - 0.5) * 0.24);
      ctx.beginPath(); ctx.arc(Math.random() * S, Math.random() * S, Math.random() * 3 + 0.5, 0, 6.28); ctx.fill();
    }
    for (let i = 0; i < 16; i++) { // landmass continents
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.fillStyle = col(hsl.l + 0.12);
      const x = Math.random() * S, y = Math.random() * S, r = 30 + Math.random() * 60;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + Math.random()), Math.random() * 6.28, 0, 6.28); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 30; i++) { // craters with rim highlight
      const x = Math.random() * S, y = Math.random() * S, r = 4 + Math.random() * 15;
      ctx.fillStyle = col(hsl.l - 0.2); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
      ctx.fillStyle = col(hsl.l + 0.14); ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.7, 0, 6.28); ctx.fill();
      ctx.fillStyle = col(hsl.l - 0.06); ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 6.28); ctx.fill();
    }
  }
  // soft spherical shading
  const g = ctx.createRadialGradient(S * 0.35, S * 0.32, S * 0.1, S * 0.5, S * 0.5, S * 0.75);
  g.addColorStop(0, "rgba(255,255,255,0.18)"); g.addColorStop(0.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// crisp, readable planet label (solid plate, no glow/blur)
function label(text, color) {
  const pad = 30, fs = 50, H = 92;
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = `700 ${fs}px 'Orbitron', sans-serif`;
  const tw = meas.measureText(text).width;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(tw + pad * 2 + 30); cv.height = H;
  const ctx = cv.getContext("2d");
  rr(ctx, 2, 16, cv.width - 4, H - 32, 14);
  ctx.fillStyle = "rgba(10,7,20,0.9)"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pad - 4, H / 2, 7, 0, 6.28); ctx.fill();
  ctx.font = `700 ${fs}px 'Orbitron', sans-serif`;
  ctx.textBaseline = "middle"; ctx.fillStyle = "#ffffff";
  ctx.fillText(text, pad + 16, H / 2 + 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true,
    depthTest: false, depthWrite: false }));
  const s = 2.8; sp.scale.set(cv.width / cv.height * s, s, 1); sp.renderOrder = 10;
  return sp;
}

// image card (project / cert) — clickable
const imageTargets = [];
const texLoader = new THREE.TextureLoader();
function imageCard(path, link, title, isMobile, accent) {
  const g = new THREE.Group();
  const w = isMobile ? 2.6 : 4.2, h = isMobile ? 5.2 : 2.9;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, h + 0.3),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.9 }));
  frame.position.z = -0.02; g.add(frame);
  const mat = new THREE.MeshBasicMaterial({ color: 0x1a1430, side: THREE.DoubleSide });
  const img = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  texLoader.load(path, (t) => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t;
    mat.color.set(0xffffff); mat.needsUpdate = true; });
  img.userData = { link, title, isImage: true, baseS: 1, targetS: 1 };
  imageTargets.push(img);
  g.add(img);
  g.userData.billboard = true;
  return g;
}

// clickable text card (contact links)
function linkCard(label1, sub, link, accent) {
  const W = 520, H = 150;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  rr(ctx, 3, 3, W - 6, H - 6, 26);
  ctx.fillStyle = "rgba(18,12,34,0.95)"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = accent; ctx.stroke();
  ctx.fillStyle = "#f7f2ff"; ctx.font = "700 40px 'Orbitron'"; ctx.fillText(label1, 36, 66);
  ctx.fillStyle = "#a99fc8"; ctx.font = "400 26px 'Space Grotesk'"; ctx.fillText(sub, 36, 110);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7, 7 * H / W), mat);
  mesh.userData = { link, title: label1, isImage: true, baseS: 1, targetS: 1, billboard: true };
  imageTargets.push(mesh);
  return mesh;
}

/* =========================================================
   BUILD SUN + PLANETS
   ========================================================= */
const planetMeshes = []; // raycast for navigation

// SUN
const sunTex = planetTexture("#ff8a3c", "gas");
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(SECTIONS[0].size, 64, 64),
  new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffd9a0 }));
sun.userData.sectionIndex = 0; scene.add(sun); planetMeshes.push(sun);
// sun corona glow
const glowTex = (() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const ctx = cv.getContext("2d");
  const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,200,140,0.55)");
  grd.addColorStop(0.3, "rgba(255,120,90,0.28)");
  grd.addColorStop(1, "rgba(255,90,120,0)");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
})();
const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true,
  blending: THREE.AdditiveBlending, depthWrite: false }));
corona.scale.set(15, 15, 1); scene.add(corona);
_sunRef = sun; _coronaRef = corona; // bloom targets
const sunLabel = label("SAKSHAM NIRULA", "#ffb066");
sunLabel.position.set(0, SECTIONS[0].size + 5, 0); scene.add(sunLabel);

// planets
SECTIONS.forEach((sec, i) => {
  if (i === 0) return;
  const pivot = new THREE.Object3D();
  pivot.rotation.x = (Math.random() - 0.5) * 0.18;       // slight inclination
  pivot.rotation.y = Math.random() * Math.PI * 2;        // start angle
  scene.add(pivot);
  sec.pivot = pivot;
  sec.speed = 0.06 / Math.sqrt(sec.radius / 20);

  // orbit ring
  const ringGeo = new THREE.RingGeometry(sec.radius - 0.06, sec.radius + 0.06, 160);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(sec.color), transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2 + pivot.rotation.x;
  ring.userData.flat = true;
  // place ring under its own tilt: simplest add to scene tilted like pivot
  const ringWrap = new THREE.Object3D(); ringWrap.rotation.copy(pivot.rotation);
  ring.rotation.set(-Math.PI / 2, 0, 0); ringWrap.add(ring); scene.add(ringWrap);
  sec.ringWrap = ringWrap;

  // planet — detailed procedural surface
  const col = new THREE.Color(sec.color);
  const variant = i % 2 === 0 ? "gas" : "rocky";
  const ptex = planetTexture(sec.color, variant);
  const mat = new THREE.MeshStandardMaterial({ map: ptex, bumpMap: ptex, bumpScale: 0.35,
    emissive: col.clone().multiplyScalar(0.05), roughness: 0.82, metalness: 0.12 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(sec.size, 64, 64), mat);
  planet.rotation.z = (Math.random() - 0.5) * 0.5;
  planet.position.set(sec.radius, 0, 0);
  planet.userData.sectionIndex = i;
  pivot.add(planet);
  sec.mesh = planet; planetMeshes.push(planet);

  // atmosphere halo
  const halo = new THREE.Mesh(new THREE.SphereGeometry(sec.size * 1.22, 32, 32),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12,
      side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  planet.add(halo);

  // planet ring (Saturn-style for projects)
  if (sec.ring) {
    const pr = new THREE.Mesh(new THREE.RingGeometry(sec.size * 1.5, sec.size * 2.4, 64),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    pr.rotation.x = -Math.PI / 2.3; planet.add(pr);
  }

  // moons for experience & education
  if (sec.key === "exp" || sec.key === "edu") {
    const n = 2;
    for (let m = 0; m < n; m++) {
      const moonPivot = new THREE.Object3D();
      moonPivot.rotation.z = m * 1.2;
      const moon = new THREE.Mesh(new THREE.SphereGeometry(sec.size * 0.32, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: col, emissiveIntensity: 0.4 }));
      moon.position.x = sec.size * (2 + m * 0.7);
      moonPivot.add(moon); moonPivot.userData.moon = true; planet.add(moonPivot);
    }
  }

  // label
  const lab = label(sec.name, sec.color);
  lab.position.set(sec.radius, sec.size + 4, 0);
  pivot.add(lab);
  sec.labelSprite = lab;
});

/* =========================================================
   CONTENT (built lazily, parented to scene, shown on focus)
   ========================================================= */
function buildContent(sec, i) {
  if (sec.content) return sec.content;
  const grp = new THREE.Group();

  if (sec.key === "core") {
    grp.add(positioned(infoPanel({
      title: "SAKSHAM NIRULA", sub: PROFILE.role, body: PROFILE.summary,
      accent: sec.color, worldW: 20 }), 0, 0, 0));
  } else if (sec.key === "exp") {
    EXPERIENCE.forEach((e, k) => {
      const p = infoPanel({ title: e.company, sub: `${e.role} · ${e.duration}`,
        body: e.details, accent: sec.color, stats: e.stats, worldW: 17 });
      positioned(p, k === 0 ? -10 : 10, 0, 0); grp.add(p);
    });
  } else if (sec.key === "proj") {
    const info = infoPanel({ title: "PROJECTS", sub: "Tap a card to open ↗",
      body: "Analytics dashboards, AI products and shipped apps.", accent: sec.color, worldW: 13 });
    positioned(info, 0, 13, 0); grp.add(info);
    const items = PROJECTS;
    const R = 16;
    items.forEach((p, k) => {
      const a = (k / items.length) * Math.PI * 2;
      const card = imageCard(p.path, p.link, p.title, p.isMobile, sec.color);
      positioned(card, Math.cos(a) * R, Math.sin(a) * (R * 0.55) - 1, Math.sin(a) * 3);
      grp.add(card);
    });
  } else if (sec.key === "cert") {
    const info = infoPanel({ title: "CERTIFICATIONS", sub: "Verified expertise",
      pills: CERT_NAMES, accent: sec.color, worldW: 14 });
    positioned(info, 0, 11, 0); grp.add(info);
    CERTIFICATIONS.forEach((c, k) => {
      const card = imageCard(c.path, "", CERT_NAMES[k] || "Certification", false, c.accent);
      positioned(card, (k - 1) * 7, -1, 0); grp.add(card);
    });
  } else if (sec.key === "skill") {
    grp.add(positioned(infoPanel({ title: "SKILLS", sub: `${SKILLS.length}+ competencies`,
      body: "Analytics, machine learning, product and delivery.", pills: SKILLS,
      accent: sec.color, worldW: 22 }), 0, 0, 0));
  } else if (sec.key === "edu") {
    EDUCATION.forEach((e, k) => {
      const p = infoPanel({ title: e.school, sub: `${e.duration} · ${e.location}`,
        body: e.degree, accent: sec.color, worldW: 15 });
      positioned(p, k === 0 ? -9 : 9, 4, 0); grp.add(p);
    });
    grp.add(positioned(infoPanel({ title: "BEYOND WORK", sub: "Hobbies & interests",
      pills: HOBBIES, accent: sec.color, worldW: 16 }), 0, -9, 0));
  } else if (sec.key === "contact") {
    grp.add(positioned(infoPanel({ title: "LET'S CONNECT", sub: PROFILE.role,
      body: "Open to roles in business analytics, product and AI.", accent: sec.color, worldW: 16 }), 0, 9, 0));
    const links = [
      ["Email", PROFILE.email, "mailto:" + PROFILE.email],
      ["LinkedIn", "in/sakshamn", PROFILE.linkedinUrl],
      ["GitHub", "saakibuilt", PROFILE.githubUrl],
      ["Résumé", "view / download", PROFILE.resumeUrl],
    ];
    links.forEach(([l, s, u], k) => {
      const card = linkCard(l, s, u, sec.color);
      positioned(card, (k % 2 ? 5 : -5), (k < 2 ? 0 : -4.2), 0); grp.add(card);
    });
  }

  grp.visible = false;
  scene.add(grp);
  sec.content = grp;
  return grp;
}
function positioned(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

/* =========================================================
   FOCUS / CAMERA TWEEN
   ========================================================= */
let revolve = true;
let focusIdx = -1;
const tween = { active: false, t: 0, dur: 1.4, fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(), fromTar: new THREE.Vector3(), toTar: new THREE.Vector3() };
const overviewPos = new THREE.Vector3(0, 72, 158);
const easeIO = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

// field-of-view warp (used for the launch zoom-in)
let fovAnim = null;
function animateFov(to, dur) { fovAnim = { from: camera.fov, to, t: 0, dur }; }

function startTween(toPos, toTar, dur = 1.4) {
  tween.fromPos.copy(camera.position); tween.toPos.copy(toPos);
  tween.fromTar.copy(controls.target); tween.toTar.copy(toTar);
  tween.t = 0; tween.dur = dur; tween.active = true;
  controls.enabled = false;
}

// show/hide a planet (sphere + halo/ring/moons + its label) — sun for index 0
function setPlanetVis(i, v) {
  if (i === 0) { sun.visible = v; corona.visible = v; sunLabel.visible = v; }
  else { const s = SECTIONS[i]; if (s.mesh) s.mesh.visible = v; if (s.labelSprite) s.labelSprite.visible = v;
    if (s.ringWrap) s.ringWrap.visible = v; }
}
const restoreAllPlanets = () => SECTIONS.forEach((_, i) => setPlanetVis(i, true));

function focusSection(i) {
  const sec = SECTIONS[i];
  focusIdx = i; revolve = false;
  buildContent(sec, i);
  // hide other contents
  SECTIONS.forEach(s => { if (s.content) s.content.visible = (s === sec); });

  // the focused planet is hidden completely so only its scorecard shows
  restoreAllPlanets();
  setPlanetVis(i, false);

  const planetPos = new THREE.Vector3();
  (i === 0 ? sun : sec.mesh).getWorldPosition(planetPos);
  sec.content.position.copy(planetPos);
  sec.content.updateWorldMatrix(true, true);

  // fit the camera to the WHOLE scorecard so nothing is off-screen
  const box = new THREE.Box3().setFromObject(sec.content);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const fovV = THREE.MathUtils.degToRad(camera.fov);
  const distV = (size.y / 2) / Math.tan(fovV / 2);
  const distH = (size.x / 2) / Math.tan(fovV / 2) / camera.aspect;
  const dist = Math.max(distV, distH) * 1.18 + 6;
  let dir = planetPos.clone();
  if (dir.length() < 0.001) dir.set(0, 0.25, 1);
  dir.normalize();
  const camPos = center.clone().add(dir.multiplyScalar(dist));
  startTween(camPos, center);

  el("focusName").textContent = sec.name;
  el("backBtn").classList.remove("hidden");
  el("hudHint").textContent = sec.key === "contact" || sec.key === "proj"
    ? "tap a card to open · drag to orbit · ◂ SYSTEM to return"
    : "drag to orbit · scroll to zoom · ◂ SYSTEM to return";
  [...el("planetNav").children].forEach((b, k) => b.classList.toggle("active", k === i));
  bloom.strength = 0.4;
}

function toSystem() {
  focusIdx = -1; revolve = true;
  SECTIONS.forEach(s => { if (s.content) s.content.visible = false; });
  restoreAllPlanets();
  startTween(overviewPos, new THREE.Vector3(0, 0, 0), 1.6);
  el("focusName").textContent = "SYSTEM VIEW";
  el("backBtn").classList.add("hidden");
  el("hudHint").textContent = "drag to orbit · scroll to zoom · click a planet";
  [...el("planetNav").children].forEach(b => b.classList.remove("active"));
  bloom.strength = 0.55;
}

/* =========================================================
   HUD NAV
   ========================================================= */
el("planetNav").innerHTML = SECTIONS.map((s, i) =>
  `<button data-i="${i}"><span class="dot" style="background:${s.color}"></span><span>${s.name}</span></button>`).join("");
el("planetNav").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return; focusSection(+b.dataset.i);
});
el("backBtn").addEventListener("click", toSystem);

addEventListener("keydown", (e) => {
  if (!started) return;
  if (e.key === "Escape" || e.key === "0") toSystem();
  const n = parseInt(e.key);
  if (n >= 1 && n <= SECTIONS.length) focusSection(n - 1);
  if (e.key === "ArrowRight") focusSection(Math.min((focusIdx < 0 ? 0 : focusIdx) + 1, SECTIONS.length - 1));
  if (e.key === "ArrowLeft") focusSection(Math.max((focusIdx < 0 ? 0 : focusIdx) - 1, 0));
});

/* =========================================================
   RAYCAST  (tap to navigate / open links)
   ========================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null;
const tip = el("tip");
let downX = 0, downY = 0, downT = 0;

canvas.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; downT = performance.now(); });
canvas.addEventListener("pointerup", (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved > 8 || performance.now() - downT > 450) return; // was a drag
  ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  raycaster.setFromCamera(ndc, camera);
  // image/link cards first (only when focused)
  if (focusIdx >= 0) {
    const hit = raycaster.intersectObjects(imageTargets, false)
      .find(h => h.object.parent.visible !== false && isVisibleContent(h.object));
    if (hit) { if (hit.object.userData.link) window.open(hit.object.userData.link, "_blank"); return; }
  }
  // planets
  const ph = raycaster.intersectObjects(planetMeshes, false)[0];
  if (ph) focusSection(ph.object.userData.sectionIndex);
});
function isVisibleContent(obj) {
  let p = obj; while (p) { if (p.visible === false) return false; p = p.parent; } return true;
}

addEventListener("pointermove", (e) => {
  ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  if (isTouch) return;
  raycaster.setFromCamera(ndc, camera);
  let newHover = null;
  if (focusIdx >= 0) {
    const hit = raycaster.intersectObjects(imageTargets, false).find(h => isVisibleContent(h.object));
    if (hit) newHover = hit.object;
  }
  if (!newHover) {
    const ph = raycaster.intersectObjects(planetMeshes, false)[0];
    if (ph) newHover = ph.object;
  }
  if (newHover !== hovered) {
    if (hovered && hovered.userData.isImage) hovered.userData.targetS = 1;
    hovered = newHover;
    if (hovered && hovered.userData.isImage) {
      hovered.userData.targetS = 1.12;
      const ttl = hovered.userData.title ? hovered.userData.title : "";
      const action = hovered.userData.link ? "click to open ↗" : "credential";
      tip.innerHTML = ttl ? `${ttl}<small>${action}</small>` : `${action}`;
      tip.classList.add("show"); canvas.style.cursor = hovered.userData.link ? "pointer" : "grab";
    } else if (hovered && hovered.userData.sectionIndex !== undefined) {
      const s = SECTIONS[hovered.userData.sectionIndex];
      tip.innerHTML = `${s.name}<small>click to explore</small>`;
      tip.classList.add("show"); canvas.style.cursor = "pointer";
    } else { tip.classList.remove("show"); canvas.style.cursor = "grab"; }
  }
  tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px";
});

/* =========================================================
   RENDER LOOP
   ========================================================= */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(), t = clock.elapsedTime;

  // sun
  sun.rotation.y += dt * 0.15;
  corona.material.rotation += dt * 0.05;
  corona.scale.setScalar(15 + Math.sin(t * 1.5) * 0.8);

  // revolve + spin planets
  SECTIONS.forEach((s, i) => {
    if (i === 0) return;
    if (revolve) s.pivot.rotation.y += s.speed * dt;
    s.mesh.rotation.y += dt * 0.4;
    s.mesh.children.forEach(c => { if (c.userData.moon) c.rotation.z += dt * 0.8; });
  });

  stars.rotation.y += dt * 0.004;
  starsFar.rotation.y -= dt * 0.006;

  // camera tween
  if (tween.active) {
    tween.t += dt / tween.dur;
    const k = Math.min(1, tween.t), e = easeIO(k);
    camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
    controls.target.lerpVectors(tween.fromTar, tween.toTar, e);
    camera.lookAt(controls.target);
    if (k >= 1) { tween.active = false; controls.enabled = true; controls.update(); }
  } else {
    controls.update();
  }

  // FOV warp (launch zoom)
  if (fovAnim) {
    fovAnim.t += dt / fovAnim.dur;
    const k = Math.min(1, fovAnim.t);
    camera.fov = fovAnim.from + (fovAnim.to - fovAnim.from) * easeIO(k);
    camera.updateProjectionMatrix();
    if (k >= 1) fovAnim = null;
  }

  // billboard focused content + scale image cards
  if (focusIdx >= 0) {
    const sec = SECTIONS[focusIdx];
    if (sec.content) sec.content.traverse(o => {
      if (o.userData.billboard) o.lookAt(camera.position);
    });
  }
  imageTargets.forEach(m => {
    m.userData.baseS += ((m.userData.targetS || 1) - m.userData.baseS) * 0.15;
    m.scale.setScalar(m.userData.baseS);
  });

  // selective bloom: render sun-only glow, then full crisp scene + glow
  setBloomDarken(true);
  bloomComposer.render();
  setBloomDarken(false);
  finalComposer.render();
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  bloomComposer.setSize(innerWidth, innerHeight);
  finalComposer.setSize(innerWidth, innerHeight);
});

/* =========================================================
   INTRO → LAUNCH
   ========================================================= */
let started = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// letter-by-letter typed intro, then reveal the Launch button
async function typeIntro() {
  const host = el("typed");
  const lines = [
    { cls: "t-kicker", text: "A Self Built Portfolio",          speed: 46 },
    { cls: "t-name",   text: "Saksham Nirula",                  speed: 95 },
    { cls: "t-role",   text: "Business Analyst · A.I. Analyst", speed: 40 },
  ];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const div = document.createElement("div");
    div.className = "t-line " + ln.cls;
    const txt = document.createElement("span"); txt.className = "txt";
    const caret = document.createElement("span"); caret.className = "caret"; caret.textContent = "|";
    div.append(txt, caret); host.appendChild(div);
    for (const ch of ln.text) { txt.textContent += ch; await sleep(ln.speed + Math.random() * 45); }
    caret.remove();
    await sleep(i < lines.length - 1 ? 240 : 360);
  }
  el("launch").classList.add("ready");
  el("introHint").classList.add("ready");
}
typeIntro();

el("launch").addEventListener("click", () => {
  if (started) return;
  started = true;
  const intro = el("intro");
  intro.classList.add("gone");
  setTimeout(() => (intro.style.display = "none"), 1100);
  // reveal the HUD partway through the warp
  setTimeout(() => {
    el("hud").classList.remove("hidden");
    requestAnimationFrame(() => el("hud").classList.add("show"));
  }, 1500);
  // 3D warp zoom: hurtle in from deep space with a wide FOV, settle into the system
  controls.enabled = false;
  camera.position.set(0, 40, 1150);
  controls.target.set(0, 0, 0);
  camera.fov = 102; camera.updateProjectionMatrix();
  startTween(overviewPos, new THREE.Vector3(0, 0, 0), 3.2);
  animateFov(55, 3.2);
});
