// Cenas 3D do Safepark: maquete do Centro do Recife, câmera da Etapa 2 e moeda de pontos.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const REDUZIR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const COR_CLASSE = { Livre: 0x34d399, Moderada: 0xf5b83d, Cheia: 0xf2545b };

// Maquete esquemática (não geográfica): ilhas e rio inspirados no Centro do Recife
const SX = 0.26, SZ = 0.46;
const LAYOUT = {
  'boa-vista': { x: -6.3, z: -1.6, cols: 18, rows: 10 },
  'santo-antonio': { x: 0.2, z: -1.0, cols: 15, rows: 8 },
  'sao-jose': { x: 0.2, z: 4.6, cols: 10, rows: 10 },
  'recife-antigo': { x: 6.9, z: -1.4, cols: 20, rows: 10 },
};
const PALETA_CARROS = [0xe8ecf5, 0xb7c0d3, 0x2b3448, 0x4c8dff, 0xc9473d, 0x8a94a8, 0xdfe5ee, 0x1d2333, 0x6f7b93, 0xd9a441];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

function baseRenderer(canvas, alpha = true) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}

// Liga/desliga o loop quando sai da tela ou a aba fica oculta
function loop(canvas, tick, renderer, camera, onResize) {
  let visivel = false, raf = 0, last = performance.now();
  const frame = (t) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    tick(dt, t / 1000);
  };
  const start = () => { if (!raf && visivel && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; visivel ? start() : stop(); }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    onResize?.(w, h);
    if (!raf) tick(0, performance.now() / 1000);
  });
  ro.observe(canvas);
}

/* ------------------------------------------------------------------ */
/* Maquete do Centro                                                    */
/* ------------------------------------------------------------------ */
export function createCity(canvas, { regioes, labels, interativo = false, onPick, orbita = true } = {}) {
  const renderer = baseRenderer(canvas);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b16, 26, 52);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const alvo = new THREE.Vector3(0.4, 0, 1.0);
  const alvoDesejado = alvo.clone();
  camera.position.set(4, 15, 21);

  // Luz
  scene.add(new THREE.HemisphereLight(0x9db8ff, 0x0b1020, 0.55));
  const sol = new THREE.DirectionalLight(0xfff1dc, 2.2);
  sol.position.set(-9, 16, 8);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 50 });
  sol.shadow.bias = -0.0004; sol.shadow.radius = 4;
  scene.add(sol);
  const contra = new THREE.DirectionalLight(0x4c8dff, 0.9);
  contra.position.set(10, 6, -12);
  scene.add(contra);

  // Água (rios Capibaribe e Beberibe, estilizados)
  const agua = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x0a1a35, roughness: 0.18, metalness: 0.35 })
  );
  agua.rotation.x = -Math.PI / 2; agua.position.y = -0.42; agua.receiveShadow = true;
  scene.add(agua);

  const matAsfalto = new THREE.MeshStandardMaterial({ color: 0x1a2131, roughness: 0.92 });
  const matBorda = new THREE.MeshStandardMaterial({ color: 0x2a3348, roughness: 0.8 });
  const matPredio = new THREE.MeshStandardMaterial({ color: 0xc8d1e2, roughness: 0.65, metalness: 0.05 });
  const matPredio2 = new THREE.MeshStandardMaterial({ color: 0x8592ab, roughness: 0.7 });
  const matVaga = new THREE.MeshStandardMaterial({ color: 0x323c54, roughness: 0.85 });
  const matPonte = new THREE.MeshStandardMaterial({ color: 0x5b6680, roughness: 0.7 });

  const plataformas = [];
  const info = {}; // por região: centro, offset de índices, pino, anel
  let offset = 0;
  const total = regioes.reduce((s, r) => s + r.total, 0);

  // Vagas e carros (instanciados: um carro por vaga ocupada)
  const geoVaga = new THREE.PlaneGeometry(SX * 0.84, SZ * 0.86); geoVaga.rotateX(-Math.PI / 2);
  const vagas = new THREE.InstancedMesh(geoVaga, matVaga, total);
  vagas.receiveShadow = true;
  const geoCorpo = new RoundedBoxGeometry(0.17, 0.075, 0.34, 2, 0.03);
  const geoCabine = new RoundedBoxGeometry(0.145, 0.065, 0.17, 2, 0.025);
  const corpos = new THREE.InstancedMesh(geoCorpo, new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.55 }), total);
  const cabines = new THREE.InstancedMesh(geoCabine, new THREE.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.08, metalness: 0.9 }), total);
  corpos.castShadow = cabines.castShadow = true;
  scene.add(vagas, corpos, cabines);

  const slots = []; // {x,z,rot,s,alvo,regiao}
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const cor = new THREE.Color();

  for (const r of regioes) {
    const L = LAYOUT[r.id];
    const rand = rng(hash(r.id));
    const gw = L.cols * SX, gd = L.rows * SZ;
    const pw = gw + 0.9, pd = gd + 2.1;
    const pz = L.z - 0.6; // faixa de prédios ao fundo

    const base = new THREE.Mesh(new RoundedBoxGeometry(pw, 0.6, pd, 4, 0.16), matAsfalto);
    base.position.set(L.x, -0.3, pz);
    base.receiveShadow = true; base.castShadow = true;
    base.userData.id = r.id;
    scene.add(base); plataformas.push(base);

    const borda = new THREE.Mesh(new RoundedBoxGeometry(pw + 0.12, 0.2, pd + 0.12, 3, 0.08), matBorda);
    borda.position.set(L.x, -0.5, pz);
    scene.add(borda);

    // Prédios ao fundo da quadra
    const fundoZ = L.z - gd / 2 - 0.75;
    let x = L.x - pw / 2 + 0.3;
    while (x < L.x + pw / 2 - 0.3) {
      const w = 0.35 + rand() * 0.55, h = 0.35 + rand() * (r.id === 'boa-vista' ? 2.2 : 1.2), d = 0.5 + rand() * 0.35;
      if (x + w > L.x + pw / 2 - 0.2) break;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rand() > 0.3 ? matPredio : matPredio2);
      b.position.set(x + w / 2, h / 2, fundoZ + (rand() - 0.5) * 0.2);
      b.castShadow = b.receiveShadow = true;
      scene.add(b);
      x += w + 0.06 + rand() * 0.1;
    }

    // Ordem determinística de ocupação das vagas
    const ordem = [...Array(r.total).keys()];
    for (let i = ordem.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }

    for (let i = 0; i < r.total; i++) {
      const col = i % L.cols, row = Math.floor(i / L.cols);
      const sx = L.x + (col - (L.cols - 1) / 2) * SX;
      const sz = L.z + (row - (L.rows - 1) / 2) * SZ + 0.25;
      const idx = offset + i;
      m4.makeTranslation(sx, 0.006, sz);
      vagas.setMatrixAt(idx, m4);
      cor.setHex(PALETA_CARROS[Math.floor(rand() * PALETA_CARROS.length)]);
      corpos.setColorAt(idx, cor);
      slots[idx] = { x: sx, z: sz, rot: rand() > 0.5 ? 0 : Math.PI, s: 0, alvo: 0 };
    }

    // Pino de ocupação (altura e cor seguem a classificação)
    const pinoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x34d399, emissiveIntensity: 1.4, roughness: 0.3 });
    const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 16), pinoMat);
    const topo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), pinoMat);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.4, 48), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    scene.add(pino, topo, halo);

    // Anel de destino selecionado
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(gw, gd) * 0.62, Math.max(gw, gd) * 0.62 + 0.09, 96),
      new THREE.MeshBasicMaterial({ color: 0x4c8dff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    anel.rotation.x = -Math.PI / 2; anel.position.set(L.x, 0.03, L.z + 0.25);
    scene.add(anel);

    info[r.id] = { L, offset, ordem, pino, topo, halo, anel, pinoMat, alturaAtual: 1, alturaAlvo: 1, centro: new THREE.Vector3(L.x, 0, L.z) };
    offset += r.total;
  }
  vagas.instanceMatrix.needsUpdate = true;
  corpos.instanceColor.needsUpdate = true;

  // Pontes
  const ponte = (x1, x2, z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 0.12, 0.5), matPonte);
    p.position.set((x1 + x2) / 2, -0.12, z); p.castShadow = p.receiveShadow = true; scene.add(p);
  };
  ponte(-3.6, -1.6, -0.2); ponte(-3.6, -1.6, -2.4); ponte(2.0, 3.9, -0.6); ponte(2.0, 3.9, -2.6);

  // Labels HTML acompanham os pinos
  const tmp = new THREE.Vector3();
  function posicionarLabels() {
    if (!labels) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const [id, el] of Object.entries(labels)) {
      const I = info[id]; if (!I) continue;
      tmp.copy(I.topo.position); tmp.y += 0.45; tmp.project(camera);
      el.style.transform = `translate(-50%,-100%) translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px)`;
      el.style.opacity = tmp.z < 1 ? '' : '0';
    }
  }

  // Controles
  let controls = null;
  if (interativo) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 9; controls.maxDistance = 34;
    controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.2;
    controls.enablePan = false;
    controls.target.copy(alvo);
    let down = null;
    canvas.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
    canvas.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const rect = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera({ x: ((e.clientX - rect.left) / rect.width) * 2 - 1, y: -((e.clientY - rect.top) / rect.height) * 2 + 1 }, camera);
      const hit = ray.intersectObjects(plataformas)[0];
      if (hit) onPick?.(hit.object.userData.id);
    });
  }

  let selecionado = null, primeira = true;
  function setData(regs, destino) {
    selecionado = destino;
    for (const r of regs) {
      const I = info[r.id]; if (!I) continue;
      const ocupadosSet = new Set(I.ordem.slice(0, r.ocupadas));
      for (let i = 0; i < r.total; i++) {
        const s = slots[I.offset + i];
        s.alvo = ocupadosSet.has(i) ? 1 : 0;
        if (primeira || REDUZIR) s.s = s.alvo;
      }
      const p = r.total ? Math.round((r.ocupadas / r.total) * 100) : 0;
      const k = p >= 85 ? 'Cheia' : p >= 60 ? 'Moderada' : 'Livre';
      I.pinoMat.emissive.setHex(COR_CLASSE[k]);
      I.halo.material.color.setHex(COR_CLASSE[k]);
      I.alturaAlvo = 0.6 + (p / 100) * 2.6;
      if (primeira || REDUZIR) I.alturaAtual = I.alturaAlvo;
    }
    if (interativo && destino && info[destino]) alvoDesejado.copy(info[destino].centro).lerp(new THREE.Vector3(0.4, 0, 1), 0.45);
    primeira = false;
    atualizarCarros(true);
  }

  function atualizarCarros(forcar) {
    let mudou = forcar;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (Math.abs(s.s - s.alvo) > 0.001) { s.s += (s.alvo - s.s) * 0.12; if (Math.abs(s.s - s.alvo) < 0.01) s.s = s.alvo; mudou = true; }
      else if (!forcar) continue;
      const e = s.s;
      const y = 0.05 + (1 - e) * 0.9;
      q.setFromAxisAngle(v.set(0, 1, 0), s.rot);
      sc.setScalar(e < 0.02 ? 0 : 0.6 + e * 0.4);
      m4.compose(v.set(s.x, y, s.z), q, sc); corpos.setMatrixAt(i, m4);
      m4.compose(v.set(s.x + Math.sin(s.rot) * -0.02, y + 0.065 * sc.x, s.z + Math.cos(s.rot) * -0.02), q, sc); cabines.setMatrixAt(i, m4);
    }
    if (mudou) { corpos.instanceMatrix.needsUpdate = true; cabines.instanceMatrix.needsUpdate = true; }
  }

  let az = -0.35;
  function tick(dt, t) {
    atualizarCarros(false);
    for (const [id, I] of Object.entries(info)) {
      I.alturaAtual += (I.alturaAlvo - I.alturaAtual) * Math.min(1, dt * 6 || 1);
      const h = I.alturaAtual, cx = I.L.x + I.L.cols * SX * 0.5 - 0.15, cz = I.L.z - I.L.rows * SZ * 0.5 + 0.4;
      I.pino.scale.y = h; I.pino.position.set(cx, h / 2, cz);
      I.topo.position.set(cx, h + 0.05, cz);
      I.halo.position.copy(I.topo.position); I.halo.lookAt(camera.position);
      I.halo.scale.setScalar(1 + (REDUZIR ? 0 : Math.sin(t * 2.2 + I.offset) * 0.12));
      const op = id === selecionado ? 0.55 + (REDUZIR ? 0 : Math.sin(t * 3) * 0.3) : 0;
      I.anel.material.opacity += (op - I.anel.material.opacity) * 0.15;
    }
    if (controls) {
      controls.target.lerp(alvoDesejado, Math.min(1, dt * 2.5));
      controls.update();
    } else {
      if (orbita && !REDUZIR) az += dt * 0.045;
      const raio = 27, polar = 0.98;
      camera.position.set(alvo.x + raio * Math.sin(polar) * Math.sin(az), raio * Math.cos(polar), alvo.z + raio * Math.sin(polar) * Math.cos(az));
      camera.lookAt(alvo);
    }
    renderer.render(scene, camera);
    posicionarLabels();
  }

  if (interativo) {
    const ajustar = () => { const a = canvas.clientWidth / Math.max(1, canvas.clientHeight); if (a < 1) camera.position.set(alvo.x + 21, 39, alvo.z + 1.2); // em pé: eixo leste-oeste na vertical
      else { const d = a < 1.4 ? 1.3 : 1.02; camera.position.set(1.5 * d, 18 * d, 21 * d); }
      const d = a < 1 ? 1.6 : 1.3; controls.maxDistance = 34 * d; controls.update(); };
    ajustar(); new ResizeObserver(ajustar).observe(canvas);
  }
  setData(regioes, null);
  // No hero, em telas largas, a maquete fica à direita para não disputar com o título
  loop(canvas, tick, renderer, camera, (w, h) => {
    if (interativo) return;
    if (w / h > 1.15) camera.setViewOffset(w, h, -w * 0.2, -h * 0.02, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.18, w, h);
  });
  return { setData };
}

/* ------------------------------------------------------------------ */
/* Câmera com visão computacional (Etapa 2)                             */
/* ------------------------------------------------------------------ */
export function createCameraModel(canvas) {
  const renderer = baseRenderer(canvas);
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(5.4, 3.6, 6.4); camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.HemisphereLight(0xaac4ff, 0x0b1020, 0.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2); sol.position.set(4, 8, 5); sol.castShadow = true; scene.add(sol);

  const chao = new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.2, 3.6, 3, 0.1), new THREE.MeshStandardMaterial({ color: 0x1a2131, roughness: 0.9 }));
  chao.position.set(0.6, -0.1, 0.6); chao.receiveShadow = true; scene.add(chao);
  const matVaga = new THREE.MeshStandardMaterial({ color: 0x323c54 });
  const livres = [];
  for (let i = 0; i < 6; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.01, 1.3), matVaga.clone());
    v.position.set(-1.3 + i * 0.85, 0.01, 1.2); v.receiveShadow = true; scene.add(v); livres.push(v);
    if (i % 3 !== 1) {
      const car = new THREE.Group();
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.22, 1.0, 3, 0.08), new THREE.MeshStandardMaterial({ color: PALETA_CARROS[i + 1], metalness: 0.5, roughness: 0.3 }));
      const c = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.18, 0.5, 3, 0.07), new THREE.MeshStandardMaterial({ color: 0x0c1220, metalness: 0.9, roughness: 0.1 }));
      b.position.y = 0.13; c.position.set(0, 0.3, -0.05); b.castShadow = c.castShadow = true;
      car.add(b, c); car.position.copy(v.position); scene.add(car);
    } else v.userData.livre = true;
  }

  const metal = new THREE.MeshStandardMaterial({ color: 0xdde3ee, metalness: 0.7, roughness: 0.28 });
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 24), metal);
  poste.position.set(-1.9, 1.6, -0.6); poste.castShadow = true; scene.add(poste);
  const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16), metal);
  braco.rotation.z = Math.PI / 2; braco.position.set(-1.55, 3.05, -0.6); scene.add(braco);

  const cabeca = new THREE.Group(); cabeca.position.set(-1.15, 2.92, -0.6); scene.add(cabeca);
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.34, 0.8, 4, 0.1), new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.35, metalness: 0.1 }));
  corpo.position.z = 0.25; corpo.castShadow = true; cabeca.add(corpo);
  const viseira = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.06, 0.95, 3, 0.03), metal);
  viseira.position.set(0, 0.2, 0.3); cabeca.add(viseira);
  const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0x050810, metalness: 1, roughness: 0.05 }));
  lente.rotation.x = Math.PI / 2; lente.position.z = 0.67; cabeca.add(lente);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 3 }));
  led.position.set(0.14, -0.08, 0.66); cabeca.add(led);

  // Cone de visão
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 3.4, 48, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x4c8dff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  cone.rotation.x = -Math.PI / 2; cone.position.z = 0.67 + 1.7;
  const pivoCone = new THREE.Group(); pivoCone.add(cone); cabeca.add(pivoCone);
  cabeca.rotation.x = 0.62;

  function tick(dt, t) {
    const yaw = REDUZIR ? 0.55 : 0.55 + Math.sin(t * 0.6) * 0.55;
    cabeca.rotation.y = yaw;
    led.material.emissiveIntensity = REDUZIR ? 2 : (Math.sin(t * 4) > 0 ? 3 : 0.3);
    // vaga livre "detectada" acende em verde quando o cone passa
    livres.forEach((v, i) => {
      if (!v.userData.livre) return;
      const ang = Math.atan2(v.position.x - cabeca.position.x, v.position.z - cabeca.position.z);
      const perto = Math.abs(ang - yaw) < 0.28;
      v.material.color.lerp(new THREE.Color(perto ? 0x34d399 : 0x323c54), 0.12);
    });
    renderer.render(scene, camera);
  }
  loop(canvas, tick, renderer, camera);
}

/* ------------------------------------------------------------------ */
/* Moeda de pontos                                                      */
/* ------------------------------------------------------------------ */
export function createCoin(canvas) {
  const renderer = baseRenderer(canvas);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 0, 4.4);
  scene.add(new THREE.DirectionalLight(0xffffff, 1.6).translateX(2).translateY(3).translateZ(4));

  const ouro = new THREE.MeshStandardMaterial({ color: 0x4c8dff, metalness: 1, roughness: 0.22 });
  const face = new THREE.MeshStandardMaterial({ color: 0x2f6fe8, metalness: 0.9, roughness: 0.35 });
  const moeda = new THREE.Group(); scene.add(moeda);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.16, 64), [ouro, face, face]);
  disco.rotation.x = Math.PI / 2; moeda.add(disco);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.055, 16, 80), ouro); moeda.add(aro);

  const P = new THREE.Shape();
  P.moveTo(-0.25, -0.45); P.lineTo(-0.25, 0.45); P.lineTo(0.06, 0.45);
  P.absarc(0.06, 0.2, 0.25, Math.PI / 2, -Math.PI / 2, true);
  P.lineTo(-0.08, -0.05); P.lineTo(-0.08, -0.45); P.closePath();
  const furo = new THREE.Path();
  furo.moveTo(-0.08, 0.3); furo.lineTo(0.05, 0.3); furo.absarc(0.05, 0.2, 0.1, Math.PI / 2, -Math.PI / 2, true); furo.lineTo(-0.08, 0.1); furo.closePath();
  P.holes.push(furo);
  const geoP = new THREE.ExtrudeGeometry(P, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 });
  geoP.translate(0, 0, 0.08);
  const p1 = new THREE.Mesh(geoP, ouro); moeda.add(p1);
  const p2 = new THREE.Mesh(geoP, ouro); p2.rotation.y = Math.PI; moeda.add(p2);

  let vel = 0.6;
  function tick(dt) {
    moeda.rotation.y += dt * (REDUZIR ? 0 : vel);
    vel += (0.6 - vel) * Math.min(1, dt * 1.5);
    moeda.position.y = Math.sin(performance.now() / 900) * (REDUZIR ? 0 : 0.05);
    renderer.render(scene, camera);
  }
  loop(canvas, tick, renderer, camera);
  return { burst: () => { vel = 14; } };
}
