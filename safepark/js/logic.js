// Regras de negócio do Safepark v0.1 (RN01 a RN09). Funções puras sobre um estado.
import { REGIOES, REGRAS, FONTE } from './data.js';

// RN02 e RN03: ocupação arredondada ao inteiro mais próximo
export const pct = (ocupadas, total) => (total ? Math.round((ocupadas / total) * 100) : 0);

// RN04: Livre < 60; Moderada 60–84; Cheia >= 85
export function classe(p) {
  if (p >= REGRAS.limiteCheia) return 'Cheia';
  if (p >= REGRAS.limiteModerada) return 'Moderada';
  return 'Livre';
}

export function criarEstado(regioes = REGIOES) {
  return {
    fonte: FONTE,
    regioes: regioes.map((r) => ({ ...r })),
    motoristas: {
      A: { id: 'A', nome: 'Motorista A', pontos: 0 },
      B: { id: 'B', nome: 'Motorista B', pontos: 0 },
    },
    avisos: [],
    seq: 0,
  };
}

export const regiao = (e, id) => e.regioes.find((r) => r.id === id);

export function resumo(r) {
  const p = pct(r.ocupadas, r.total);
  return { ...r, pct: p, classe: classe(p) };
}

// RN03
export function zonaAzul(e) {
  const total = e.regioes.reduce((s, r) => s + r.total, 0);
  const ocupadas = e.regioes.reduce((s, r) => s + r.ocupadas, 0);
  const p = pct(ocupadas, total);
  return { total, ocupadas, pct: p, classe: classe(p) };
}

// RN05: menor ocupação primeiro; empate em ordem alfabética
export function maisLivres(e) {
  return e.regioes
    .map(resumo)
    .sort((a, b) => a.pct - b.pct || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export const diasGratis = (pontos) => Math.floor(pontos / REGRAS.pontosPorDiaGratis);

// RN06 e RN07
export function avisarSaida(e, motoristaId, regiaoId) {
  const r = regiao(e, regiaoId);
  if (!r) return { ok: false, msg: 'Micro-região não encontrada.' };
  if (r.ocupadas <= 0) {
    return { ok: false, msg: `Não há vaga ocupada em ${r.nome}. A ocupação e os pontos não mudaram.` };
  }
  r.ocupadas -= 1;
  const m = e.motoristas[motoristaId];
  m.pontos += REGRAS.pontosPorAviso;
  const aviso = { id: ++e.seq, autor: motoristaId, regiao: regiaoId, status: 'válido', denunciadoPor: null };
  e.avisos.unshift(aviso);
  return { ok: true, aviso, msg: `Saída registrada em ${r.nome}. ${m.nome} ganhou ${REGRAS.pontosPorAviso} pontos.` };
}

// RN08 e RN09
export function denunciar(e, denuncianteId, avisoId) {
  const a = e.avisos.find((x) => x.id === avisoId);
  if (!a) return { ok: false, msg: 'Aviso não encontrado.' };
  if (a.autor === denuncianteId) return { ok: false, msg: 'Não é possível denunciar o próprio aviso.' };
  if (a.status === 'contestado') return { ok: false, msg: 'Este aviso já foi denunciado.' };
  const r = regiao(e, a.regiao);
  a.status = 'contestado';
  a.denunciadoPor = denuncianteId;
  r.ocupadas = Math.min(r.total, r.ocupadas + 1);
  const autor = e.motoristas[a.autor];
  const antes = autor.pontos;
  autor.pontos = Math.max(0, autor.pontos - REGRAS.perdaPorDenuncia);
  return { ok: true, msg: `Denúncia aceita. O aviso em ${r.nome} ficou contestado, a vaga voltou a contar como ocupada e ${autor.nome} perdeu ${antes - autor.pontos} pontos.` };
}

export const fmtVagas = (o, t) => `${o} de ${t}`; // RNF02
