/* Conde Avisa · rolagem, entradas e a calculadora dos 60 minutos */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  window.__corr = 0;

  /* ---------- calculadora (mesma regra do RN08 em conde_avisa/regras.py) ---------- */
  const $ = (id) => document.getElementById(id);
  const toMin = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const hhmm = (min) => {
    const d = Math.floor(min / 1440), r = ((min % 1440) + 1440) % 1440;
    const t = String(Math.floor(r / 60)).padStart(2, '0') + 'h' + String(r % 60).padStart(2, '0');
    return d < 0 ? 'véspera ' + t : d > 0 ? 'dia seguinte ' + t : t;
  };
  const dur = (m) => { m = Math.abs(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ' ' + r + ' min' : ''}` : `${r} min`; };

  function calc() {
    const tipo = $('c-tipo').value;
    const inicio = toMin($('c-inicio').value || '08:00');
    const fonte = Number($('c-dia').value) * 1440 + toMin($('c-fonte').value || '05:50');
    let pico, prazo;
    if (tipo === 'obra') { pico = null; prazo = -1440 + 20 * 60; }
    else {
      pico = inicio < 540 ? 420 : inicio < 1140 ? 1020 : 1440 + 420;
      prazo = pico - 60;
    }
    const slots = [];
    for (let d = -1; d <= 1; d++) slots.push(d * 1440 + 390, d * 1440 + 990);
    const bol = slots.find((s) => s >= fonte);
    const okF = fonte <= prazo, okC = bol <= prazo;

    const vf = $('v-fonte'), vc = $('v-canal');
    vf.className = 'verdict ' + (okF ? 'ok' : 'late');
    vf.querySelector('.v').textContent = okF ? 'Fonte a tempo' : 'Fonte tarde';
    vf.querySelector('.d').textContent = `Publicou ${hhmm(fonte)}, ${okF ? dur(prazo - fonte) + ' antes' : dur(fonte - prazo) + ' depois'} do prazo.`;
    vc.className = 'verdict ' + (okC ? 'ok' : 'late');
    vc.querySelector('.v').textContent = okC ? 'Canal a tempo' : 'Canal tarde';
    vc.querySelector('.d').textContent = `Boletim das ${hhmm(bol)}, ${okC ? dur(prazo - bol) + ' antes' : dur(bol - prazo) + ' depois'} do prazo.`;

    const alvo = tipo === 'obra'
      ? `Obra programada que começa às ${hhmm(inicio)}: o prazo é <b>20h00 da véspera</b>.`
      : `O evento das ${hhmm(inicio)} atinge o pico das ${hhmm(pico)}. O prazo é <b>${hhmm(prazo)}</b>, 60 minutos antes.`;
    const fim = okF && !okC
      ? ' A fonte foi a tempo, mas o boletim fixo chega tarde: é o achado da seção 11 da documentação.'
      : !okF ? ' A fonte já publicou tarde: nenhuma curadoria chega antes dela (Cenário 2).' : ' Fonte e canal a tempo: o aviso pode mudar a decisão.';
    $('c-explain').innerHTML = alvo + fim;

    // linha do tempo
    const pts = [fonte, prazo, bol, pico == null ? inicio : pico];
    const a = Math.min(...pts) - 60, b = Math.max(...pts) + (pico == null ? 60 : 180);
    const pos = (m) => ((m - a) / (b - a)) * 100 + '%';
    const peak = $('tl-peak');
    if (pico == null) { peak.style.left = pos(inicio); peak.style.width = 'calc(' + pos(b) + ' - ' + pos(inicio) + ')'; }
    else { peak.style.left = pos(pico); peak.style.width = 'calc(' + pos(Math.min(pico + 120, b)) + ' - ' + pos(pico) + ')'; }
    let win = $('tl').querySelector('.win');
    if (!win) { win = document.createElement('div'); win.className = 'win'; $('tl').insertBefore(win, peak); }
    win.style.left = '0'; win.style.width = pos(prazo);
    $('tl-src').style.left = pos(fonte);
    $('tl-bol').style.left = pos(bol);
    $('tl-a').textContent = hhmm(a);
    $('tl-b').textContent = hhmm(b);
  }
  ['c-tipo', 'c-inicio', 'c-dia', 'c-fonte'].forEach((id) => $(id).addEventListener('input', calc));
  document.querySelectorAll('.chip[data-p]').forEach((c) => c.addEventListener('click', () => {
    const [t, i, d, f] = c.dataset.p.split('|');
    $('c-tipo').value = t; $('c-inicio').value = i; $('c-dia').value = d; $('c-fonte').value = f;
    calc();
  }));
  calc();

  /* ---------- navegação some ao descer, volta ao subir ---------- */
  const nav = $('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  const cards = [...document.querySelectorAll('.ccard')];
  const dots = [...document.querySelectorAll('.corridor-progress span')];
  const setCard = (p) => {
    const i = Math.min(cards.length - 1, Math.floor(p * cards.length));
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-on', k <= i));
  };

  if (!hasGsap || reduce) {
    document.querySelectorAll('.rv').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    if (!reduce) {
      const corr = $('corredor');
      window.addEventListener('scroll', () => {
        const r = corr.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
        window.__corr = p; setCard(p);
      }, { passive: true });
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* rolagem suave */
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -10 }); }
    }));
  }

  /* hero: o ponteiro anda até as 6h; a rolagem empurra até as 7h */
  const hand = document.querySelector('.dial .hand');
  gsap.fromTo('.dial', { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'expo.out' });
  // o ponteiro gira até as 6h ao abrir; a rolagem leva até as 7h
  const handTurn = { a: 0, s: 0 };
  const setHand = () => { hand.style.transform = `rotate(${handTurn.a + handTurn.s}deg)`; };
  gsap.to(handTurn, { a: 150, duration: 2.2, ease: 'power3.inOut', delay: 0.3, onUpdate: setHand });
  gsap.to(handTurn, { s: 60, ease: 'none', onUpdate: setHand, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.dial', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* entradas: título, texto e figura de cada seção, escalonados */
  document.querySelectorAll('main section, footer').forEach((sec) => {
    const els = sec.querySelectorAll('.rv');
    if (!els.length) return;
    gsap.to(els, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: sec, start: 'top 92%', once: true },
    });
  });

  /* assinatura: a foto do corredor abre como uma persiana */
  gsap.fromTo('.shutter', { clipPath: 'inset(100% 0 0 0)' }, {
    clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.shutter', start: 'top 80%', once: true },
  });
  gsap.fromTo('.shutter img', { scale: 1.12 }, {
    scale: 1, duration: 1.4, ease: 'power3.out',
    scrollTrigger: { trigger: '.shutter', start: 'top 80%', once: true },
  });
  gsap.to('.shutter img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.shutter', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* corredor 3D: progresso da rolagem vira posição da câmera */
  ScrollTrigger.create({
    trigger: '#corredor', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => { window.__corr = s.progress; setCard(s.progress); },
  });

  /* blocos que crescem, números em degrau e foto redonda */
  gsap.from('.tile .box', { scaleY: 0.6, transformOrigin: '50% 100%', ease: 'power3.out', duration: 1.1, stagger: 0.12, scrollTrigger: { trigger: '.tiles', start: 'top 80%', once: true } });
  gsap.from('.stat .fig', { yPercent: 18, opacity: 0, ease: 'power3.out', duration: 1, stagger: 0.12, scrollTrigger: { trigger: '.stats', start: 'top 75%', once: true } });
  gsap.fromTo('.features .round img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.features', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.panel .round', { rotation: -8 }, { rotation: 0, ease: 'none', scrollTrigger: { trigger: '.panel', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.blocks span:not(.gap)', { scaleY: 0, transformOrigin: '50% 100%', ease: 'expo.out', duration: 1.2, stagger: 0.05, scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });
})();
