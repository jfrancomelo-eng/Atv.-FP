// Interface do Safepark v0.1. Lê a camada de dados, aplica as regras e desenha a tela.
import { criarEstado, resumo, zonaAzul, maisLivres, avisarSaida, denunciar, diasGratis, regiao, fmtVagas } from './logic.js';
import { REGIOES, REGRAS } from './data.js';
import { CRITERIOS } from './criterios.js';

const $ = (s) => document.querySelector(s);
const REDUZIR = matchMedia('(prefers-reduced-motion: reduce)').matches;

let estado = criarEstado();
let destino = null;
let motorista = 'A';
let cenaHero = null, cenaApp = null, moeda = null;

/* ---------------- Labels 3D ---------------- */
function criarLabels(container, clicavel) {
  const map = {};
  for (const r of REGIOES) {
    const el = document.createElement(clicavel ? 'button' : 'div');
    el.className = 'pin';
    if (clicavel) { el.type = 'button'; el.addEventListener('click', () => escolher(r.id)); }
    else el.setAttribute('aria-hidden', 'true');
    container.appendChild(el);
    map[r.id] = el;
  }
  return map;
}
const labelsHero = criarLabels($('#labels-hero'), false);
const labelsApp = criarLabels($('#labels-app'), true);

/* ---------------- Botões de destino ---------------- */
const botoes = {};
for (const r of REGIOES) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'destino-btn'; b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => escolher(r.id));
  $('#botoes-destino').appendChild(b);
  botoes[r.id] = b;
}

function escolher(id) { destino = id; render(); }

/* ---------------- Contadores ---------------- */
function contar(el, para, sufixo = '') {
  const de = parseInt(el.textContent, 10);
  const token = (el._tk = (el._tk || 0) + 1);
  const final = () => { if (el._tk === token) el.textContent = para + sufixo; };
  if (REDUZIR || isNaN(de) || de === para || document.hidden) return final();
  const t0 = performance.now(), dur = 520;
  const passo = (t) => {
    if (el._tk !== token) return;
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(de + (para - de) * e) + sufixo;
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  setTimeout(final, dur + 80); // garante o valor final mesmo se o rAF for pausado
}

/* ---------------- Render ---------------- */
function render() {
  const regs = estado.regioes.map(resumo);
  const z = zonaAzul(estado);

  for (const r of regs) {
    for (const [map, extra] of [[labelsHero, ''], [labelsApp, '']]) {
      const el = map[r.id];
      el.dataset.c = r.classe;
      el.innerHTML = `${r.nome}<b>${r.pct}% · ${r.classe}</b><small>${fmtVagas(r.ocupadas, r.total)} vagas${extra}</small>`;
    }
    labelsApp[r.id].setAttribute('aria-pressed', String(r.id === destino));
    labelsApp[r.id].setAttribute('aria-label', `${r.nome}: ${r.pct}%, ${r.classe}, ${fmtVagas(r.ocupadas, r.total)} vagas ocupadas`);
    const b = botoes[r.id];
    b.innerHTML = `${r.nome}<small>${fmtVagas(r.ocupadas, r.total)} · ${r.pct}%</small>`;
    b.setAttribute('aria-pressed', String(r.id === destino));
  }

  // Destino (RF02, RF03)
  if (destino) {
    const d = resumo(regiao(estado, destino));
    $('#d-nome').textContent = `${d.nome} · ${d.apelido}`;
    contar($('#d-pct'), d.pct, '%');
    $('#d-classe').textContent = d.classe; $('#d-classe').dataset.c = d.classe;
    $('#d-vagas').textContent = `${fmtVagas(d.ocupadas, d.total)} vagas ocupadas`;
    $('#d-barra').style.width = d.pct + '%';
    $('#d-barra').style.background = `var(--${d.classe.toLowerCase()})`;
  }

  // Zona Azul
  contar($('#z-pct'), z.pct, '%');
  $('#z-classe').textContent = z.classe; $('#z-classe').dataset.c = z.classe;
  $('#z-vagas').textContent = fmtVagas(z.ocupadas, z.total);
  $('#hero-zona').textContent = z.pct + '%';
  $('#hero-zona-classe').textContent = z.classe;
  $('#hero-zona-classe').style.color = `var(--${z.classe.toLowerCase()})`;

  // Mais livres (RF04)
  $('#lista-livres').innerHTML = maisLivres(estado).map((r, i) =>
    `<li data-c="${r.classe}" class="${r.id === destino ? 'sel' : ''}"><span class="pos">${i + 1}º</span><span>${r.nome}</span><span class="v">${fmtVagas(r.ocupadas, r.total)}</span><span class="p">${r.pct}% ${r.classe}</span></li>`
  ).join('');

  // Motorista (RF06)
  const m = estado.motoristas[motorista];
  contar($('#m-pontos'), m.pontos);
  const dias = diasGratis(m.pontos);
  $('#m-dias').textContent = dias;
  $('#m-dias-txt').textContent = dias === 1 ? 'dia grátis' : 'dias grátis';
  $('#m-prog').style.width = (m.pontos % REGRAS.pontosPorDiaGratis) + '%';
  document.querySelectorAll('.motorista-toggle button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.m === motorista)));

  // Ação
  const btn = $('#avisar');
  btn.disabled = !destino;
  btn.textContent = destino ? `Liberei uma vaga em ${regiao(estado, destino).nome}` : 'Liberei uma vaga';
  $('#avisar-dica').textContent = destino ? `Você está como ${m.nome}. O aviso vale ${REGRAS.pontosPorAviso} pontos.` : 'Escolha acima a micro-região onde você liberou a vaga.';

  // Feed (RF07)
  const feed = $('#feed');
  if (!estado.avisos.length) feed.innerHTML = '<li class="vazio">Nenhum aviso ainda. Seja o primeiro a liberar uma vaga.</li>';
  else feed.innerHTML = estado.avisos.map((a) => {
    const r = regiao(estado, a.regiao);
    const podeDenunciar = a.status !== 'contestado';
    return `<li><div>${estado.motoristas[a.autor].nome} liberou em ${r.nome}<small>Aviso #${a.id}</small></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="estado ${a.status === 'contestado' ? 'contestado' : ''}">${a.status === 'contestado' ? 'Contestado' : 'Válido'}</span>
      ${podeDenunciar ? `<button class="denunciar" type="button" data-aviso="${a.id}">Denunciar</button>` : ''}</div></li>`;
  }).join('');

  cenaHero?.setData(estado.regioes, null);
  cenaApp?.setData(estado.regioes, destino);
}

let toastT;
function toast(res) {
  const t = $('#toast');
  t.textContent = res.msg; t.className = `toast on ${res.ok ? 'ok' : 'erro'}`;
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 4200);
}

/* ---------------- Eventos ---------------- */
$('#avisar').addEventListener('click', () => {
  const res = avisarSaida(estado, motorista, destino);
  toast(res);
  if (res.ok) moeda?.burst();
  render();
});
$('#feed').addEventListener('click', (e) => {
  const b = e.target.closest('[data-aviso]'); if (!b) return;
  const res = denunciar(estado, motorista, Number(b.dataset.aviso));
  toast({ ...res, msg: res.ok ? res.msg : res.msg + (res.msg.includes('próprio') ? ' Troque para o outro motorista para testar a denúncia.' : '') });
  render();
});
document.querySelectorAll('.motorista-toggle button').forEach((b) => b.addEventListener('click', () => { motorista = b.dataset.m; render(); }));
$('#reiniciar').addEventListener('click', () => { estado = criarEstado(); destino = null; render(); toast({ ok: true, msg: 'Dados simulados reiniciados.' }); });

/* ---------------- Critérios de aceitação ---------------- */
const listaT = $('#lista-testes');
listaT.innerHTML = CRITERIOS.map((c) => `
  <li class="teste" id="t-${c.id}">
    <p class="id">${c.id}<small>${c.ref}</small></p>
    <dl><dt>Dado</dt><dd>${c.dado}</dd><dt>Quando</dt><dd>${c.quando}</dd><dt>Então</dt><dd>${c.entao}</dd><dt>Obtido</dt><dd class="obtido">—</dd></dl>
    <p class="res">Aguardando</p>
  </li>`).join('');

$('#rodar').addEventListener('click', async () => {
  const btn = $('#rodar'); btn.disabled = true;
  let ok = 0;
  for (const c of CRITERIOS) {
    const li = $(`#t-${c.id}`);
    li.classList.remove('passou', 'falhou');
    li.querySelector('.res').textContent = 'Rodando…';
  }
  for (const c of CRITERIOS) {
    await new Promise((r) => setTimeout(r, REDUZIR ? 0 : 140));
    const li = $(`#t-${c.id}`);
    let r;
    try { r = c.run(); } catch (err) { r = { ok: false, obtido: 'Erro: ' + err.message }; }
    if (r.ok) ok++;
    li.classList.add(r.ok ? 'passou' : 'falhou');
    li.querySelector('.obtido').textContent = r.obtido;
    li.querySelector('.res').textContent = r.ok ? 'Passou' : 'Falhou';
  }
  $('#placar').textContent = `${ok} de ${CRITERIOS.length} cenários passaram`;
  $('#placar').style.color = ok === CRITERIOS.length ? 'var(--livre)' : 'var(--cheia)';
  btn.disabled = false; btn.textContent = 'Rodar de novo';
});

render();

/* ---------------- 3D (carrega depois; a página funciona sem ele) ---------------- */
import('./scene.js').then(({ createCity, createCameraModel, createCoin }) => {
  try {
    cenaHero = createCity($('#cena-hero'), { regioes: estado.regioes, labels: labelsHero });
    cenaApp = createCity($('#cena-app'), { regioes: estado.regioes, labels: labelsApp, interativo: true, onPick: escolher });
    createCameraModel($('#cena-camera'));
    moeda = createCoin($('#cena-moeda'));
    render();
  } catch (err) {
    console.warn('3D indisponível', err);
    document.querySelectorAll('.pin').forEach((p) => (p.style.display = 'none'));
  }
}).catch((err) => console.warn('Falha ao carregar o 3D', err));

/* ---------------- Movimento ---------------- */
function animarEntrada() {
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || REDUZIR) return;
  gsap.registerPlugin(ST);
  document.documentElement.classList.add('js-on');
  gsap.fromTo('[data-intro]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.1 });
  const io = new IntersectionObserver((ents) => {
    let i = 0;
    for (const en of ents) {
      if (!en.isIntersecting) continue;
      en.target.style.transitionDelay = `${(i++) * 70}ms`;
      en.target.classList.add('visto');
      io.unobserve(en.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  // a maquete do hero recua levemente ao rolar
  gsap.to('.hero-3d', { yPercent: 12, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}
if (document.readyState === 'complete') animarEntrada();
else window.addEventListener('load', animarEntrada);
