/* Conde Avisa · cenas 3D: o corredor da Conde da Boa Vista e o celular que recebe o boletim */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = { bg: 0x111110, ink: 0xf2efe6, accent: 0xffc629, road: 0x2a2a27, lane: 0x34342f, walk: 0x4a4943 };

function makeRenderer(alpha) {
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    return r;
  } catch (e) { return null; }
}

function whenVisible(el, cb) {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '200px' });
  io.observe(el);
}

/* ======================= CORREDOR ======================= */
function corridor() {
  const stage = document.querySelector('.corridor-stage');
  if (!stage) return;
  const renderer = makeRenderer(false);
  if (!renderer) return;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);
  stage.querySelector('.corridor-fallback').style.display = 'none';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 70, 190);
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 600);

  scene.add(new THREE.HemisphereLight(0xf6f1e4, 0x2a2822, 1.15));
  const sun = new THREE.DirectionalLight(0xffe6b8, 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 220 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });
  const X0 = -30, X1 = 140, LEN = X1 - X0;

  // avenida, faixa exclusiva, calçadas
  const road = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 24), std(C.road));
  road.rotation.x = -Math.PI / 2; road.position.x = X0 + LEN / 2; road.receiveShadow = true; scene.add(road);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 7), std(C.lane));
  lane.rotation.x = -Math.PI / 2; lane.position.set(X0 + LEN / 2, 0.02, 0); lane.receiveShadow = true; scene.add(lane);
  const dashGeo = new THREE.BoxGeometry(3, 0.04, 0.22);
  const dashMat = std(C.accent, { emissive: C.accent, emissiveIntensity: 0.15 });
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, 2 * Math.ceil(LEN / 6));
  let di = 0; const m4 = new THREE.Matrix4();
  for (let x = X0; x < X1; x += 6) for (const z of [-3.6, 3.6]) { m4.makeTranslation(x, 0.05, z); dashes.setMatrixAt(di++, m4); }
  scene.add(dashes);
  for (const z of [-14.5, 14.5]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.5, 5), std(C.walk));
    w.position.set(X0 + LEN / 2, 0.25, z); w.receiveShadow = true; scene.add(w);
  }

  // prédios dos dois lados, com algumas janelas acesas
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const tones = [0x3a3833, 0x45433d, 0x4f4c45, 0x3f3d37, 0x58554d];
  const winGeo = new THREE.BoxGeometry(0.9, 0.7, 0.08);
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffc96a, emissiveIntensity: 1.1 });
  const wins = new THREE.InstancedMesh(winGeo, winMat, 900); let wi = 0;
  for (const side of [-1, 1]) {
    for (let x = X0; x < X1 - 8;) {
      // do lado da câmera os prédios são baixos, para não tapar a avenida
      const w = 6 + rnd() * 7, d = 8 + rnd() * 10, h = side > 0 ? 2.5 + rnd() * 5 : 8 + Math.pow(rnd(), 1.4) * 38;
      const b = new THREE.Mesh(bGeo, std(tones[Math.floor(rnd() * tones.length)]));
      b.scale.set(w, h, d);
      const z = side * (17.5 + d / 2);
      b.position.set(x + w / 2, h / 2, z);
      b.castShadow = b.receiveShadow = true; scene.add(b);
      const face = z - side * (d / 2 + 0.05);
      for (let yy = 3; yy < h - 1 && wi < 900; yy += 2.6) for (let xx = x + 1.2; xx < x + w - 0.8 && wi < 900; xx += 1.8) {
        if (rnd() < 0.16) { m4.makeTranslation(xx, yy, face); wins.setMatrixAt(wi++, m4); }
      }
      x += w + 0.8 + rnd() * 1.5;
    }
  }
  wins.count = wi; scene.add(wins);

  // rio Capibaribe e Ponte Duarte Coelho no fim do trecho
  const river = new THREE.Mesh(new THREE.PlaneGeometry(90, 200), std(0x18262b, { roughness: 0.25, metalness: 0.2 }));
  river.rotation.x = -Math.PI / 2; river.position.set(X1 + 45, -1.6, 0); scene.add(river);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 24), std(0x3b3a35));
  deck.position.set(X1 + 20, -0.6, 0); deck.receiveShadow = deck.castShadow = true; scene.add(deck);
  for (const z of [-12, 12]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(40, 1.1, 0.5), std(C.ink));
    rail.position.set(X1 + 20, 0.55, z); rail.castShadow = true; scene.add(rail);
  }

  // paradas: o círculo (o motivo do site) no canteiro central
  const STOPS = [0, 22, 44, 66, 88, 110, 132];
  const stopMat = () => std(C.ink, { emissive: C.accent, emissiveIntensity: 0 });
  const stops = STOPS.map((x) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 48), stopMat());
    disc.position.y = 0.15; disc.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 2.6), std(0x3c3b36));
    roof.position.set(0, 3.2, 0); roof.castShadow = true;
    const posts = [-3, 3].map((px) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), std(0x8a877d)); p.position.set(px, 1.6, 0); return p; });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 8), std(0x8a877d)); pole.position.set(4.2, 2.6, 0.8);
    const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 40), std(C.accent, { emissive: C.accent, emissiveIntensity: 0.2 }));
    sign.rotation.x = Math.PI / 2; sign.position.set(4.2, 5.4, 0.8); sign.castShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.9, 64), new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.35;
    g.add(disc, roof, ...posts, pole, sign, ring);
    g.position.set(x, 0, 0);
    scene.add(g);
    return { g, disc, ring, sign };
  });

  // ônibus nas duas mãos da faixa exclusiva
  const busGeo = new RoundedBoxGeometry(11, 3.1, 2.6, 4, 0.45);
  const bandGeo = new THREE.BoxGeometry(10.2, 1.1, 2.66);
  const buses = [];
  for (let i = 0; i < 9; i++) {
    const dir = i % 2 ? -1 : 1;
    const body = new THREE.Mesh(busGeo, std(i % 3 === 0 ? 0xd9d4c7 : 0xeeeae0, { roughness: 0.45, metalness: 0.15 }));
    const band = new THREE.Mesh(bandGeo, std(0x15181a, { roughness: 0.2, metalness: 0.4 }));
    band.position.y = 0.45;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(11.02, 0.35, 2.64), std(C.accent));
    stripe.position.y = -0.75;
    const bus = new THREE.Group(); bus.add(body, band, stripe);
    body.castShadow = true;
    bus.position.set(X0 + rnd() * LEN, 1.85, dir > 0 ? -1.7 : 1.7);
    bus.userData = { dir, speed: 7 + rnd() * 6 };
    scene.add(bus); buses.push(bus);
  }

  // câmera: segura em cada parada contada pelos cartões
  const KEY = [STOPS[0], STOPS[2], STOPS[4], STOPS[6]];
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const targetX = (p) => {
    const s = Math.min(KEY.length - 1, Math.max(0, p * KEY.length - 0.5));
    const i = Math.min(KEY.length - 2, Math.floor(s)), f = s - i;
    return KEY[i] + (KEY[i + 1] - KEY[i]) * smooth(0.2, 0.8, f);
  };
  let camX = targetX(0);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 44 : 30;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let on = false, last = performance.now();
  whenVisible(stage, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(loop); } });
  function loop(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const p = window.__corr || 0;
    const tx = targetX(p);
    camX += (tx - camX) * (reduce ? 1 : 1 - Math.pow(0.0015, dt));
    const narrow = camera.aspect < 1;
    camera.position.set(camX - (narrow ? 18 : 30), narrow ? 58 : 46, narrow ? 50 : 44);
    camera.lookAt(camX + (narrow ? 2 : 8), 0, -2);
    sun.position.set(camX + 30, 70, 40); sun.target.position.set(camX, 0, 0);

    if (!reduce) for (const b of buses) {
      b.position.x += b.userData.dir * b.userData.speed * dt;
      if (b.position.x > X1 + 30) b.position.x = X0 - 10;
      if (b.position.x < X0 - 10) b.position.x = X1 + 30;
    }
    const t = now / 1000;
    stops.forEach((s, i) => {
      const d = Math.abs(STOPS[i] - camX);
      const k = Math.max(0, 1 - d / 9);
      s.disc.material.color.lerpColors(new THREE.Color(C.ink), new THREE.Color(C.accent), k);
      s.disc.material.emissiveIntensity = k * 0.35;
      const ph = (t * 0.6) % 1;
      s.ring.scale.setScalar(1 + ph * 1.6);
      s.ring.material.opacity = k * (1 - ph) * 0.9;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
}

/* ======================= CELULAR ======================= */
function phone() {
  const box = document.getElementById('phone-box');
  const canvas = document.getElementById('phone-canvas');
  if (!box || !canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.documentElement.classList.add('has-webgl');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 17);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 6, 8); scene.add(key);

  // tela desenhada num canvas 2D: o canal, a notificação e o boletim (dados fictícios do CA09)
  const W = 600, H = 1280;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const F = (w, s) => `${w} ${s}px Archivo, system-ui, sans-serif`;
  const LINES = [
    ['b', 'Conde Avisa. Boletim de'], ['b', '25/11/2026 às 06h30.'], ['', ''],
    ['b', 'Aviso 1 de 1: Desvio'],
    ['', 'O quê: linhas desviadas pela'], ['', 'Rua da Aurora por obra na via'],
    ['', 'Linhas: 040, 043'], ['', 'Onde: Rua do Hospício'],
    ['', 'Até quando: 28/11/2026 às 18h00'], ['', 'Fonte: CTTU, trânsito do Recife.'], ['', ''],
    ['m', 'Projeto acadêmico da CESAR School,'], ['m', 'não oficial. Confira sempre a fonte.'],
  ];
  function draw(k) { // k: 0 → 1, andamento da chegada da mensagem
    g.fillStyle = '#0d0d0c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f2efe6'; g.font = F(600, 30); g.fillText('06:30', 44, 70);
    g.fillStyle = '#1c1c1a'; g.fillRect(0, 100, W, 120);
    g.fillStyle = '#ffc629'; g.beginPath(); g.arc(84, 160, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111110'; g.beginPath(); g.moveTo(84, 160); g.arc(84, 160, 34, Math.PI / 2, Math.PI / 2 + Math.PI / 6); g.closePath(); g.fill();
    g.fillStyle = '#f2efe6'; g.font = F(800, 34); g.fillText('Conde Avisa', 138, 152);
    g.fillStyle = '#bdb8ac'; g.font = F(400, 24); g.fillText('canal de avisos · não oficial', 138, 186);
    // bolha
    const e = Math.min(1, Math.max(0, (k - 0.35) / 0.4)); const ease = 1 - Math.pow(1 - e, 3);
    if (e > 0) {
      g.globalAlpha = ease;
      const y0 = 300 + (1 - ease) * 60;
      g.fillStyle = '#f2efe6'; g.fillRect(36, y0, W - 72, 640);
      g.fillStyle = '#ffc629'; g.fillRect(36, y0, 12, 640);
      let y = y0 + 64;
      const shown = Math.floor(LINES.length * Math.min(1, Math.max(0, (k - 0.5) / 0.35)) + 0.999);
      LINES.slice(0, shown).forEach(([s, t]) => {
        g.fillStyle = s === 'm' ? '#5c584f' : '#111110';
        g.font = s === 'b' ? F(800, 31) : s === 'm' ? F(400, 23) : F(500, 27);
        g.fillText(t, 76, y); y += s === 'm' ? 34 : 44;
      });
      g.fillStyle = '#5c584f'; g.font = F(400, 22); g.fillText('06:30', W - 120, y0 + 620);
      g.globalAlpha = 1;
    }
    // notificação que desce do topo
    const n = Math.min(1, k / 0.25) * (k < 0.85 ? 1 : Math.max(0, 1 - (k - 0.85) / 0.15));
    if (n > 0) {
      const ny = -150 + 190 * (1 - Math.pow(1 - n, 3));
      g.fillStyle = '#ffc629'; g.fillRect(24, ny, W - 48, 132);
      g.fillStyle = '#111110'; g.font = F(800, 28); g.fillText('Conde Avisa', 56, ny + 52);
      g.font = F(500, 26); g.fillText('Desvio na Rua do Hospício: 040, 043', 56, ny + 94);
    }
    tex.needsUpdate = true;
  }

  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x141413, metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.3, 6.8, 0.38, 8, 0.48), bodyMat);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 6.4), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.195;
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x000000 }));
  cam.rotation.x = Math.PI / 2; cam.position.set(0, 3.02, 0.205);
  const phoneG = new THREE.Group(); phoneG.add(body, screen, cam);
  scene.add(phoneG);

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = camera.aspect < 0.7 ? 24 : 20;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let on = false, t0 = 0;
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => draw(reduce ? 0.9 : 0));
  whenVisible(box, (v) => { if (v && !on) { on = true; t0 = performance.now(); requestAnimationFrame(loop); } else if (!v) on = false; });
  function loop(now) {
    if (!on) return;
    const t = (now - t0) / 1000;
    const k = reduce ? 0.9 : Math.min(1, (t % 9) / 5.2);
    draw(k);
    const r = box.getBoundingClientRect();
    const sc = (r.top + r.height / 2) / innerHeight - 0.5; // -0.5..0.5 conforme a rolagem
    phoneG.rotation.y = reduce ? -0.25 : -0.3 + Math.sin(t * 0.6) * 0.12 + sc * 0.5;
    phoneG.rotation.x = reduce ? 0.05 : 0.08 + sc * -0.25;
    phoneG.position.y = reduce ? 0 : Math.sin(t * 0.9) * 0.12;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
}

corridor();
phone();
