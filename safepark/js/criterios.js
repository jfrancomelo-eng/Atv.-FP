// Critérios de aceitação CA01 a CA10, executados contra as mesmas regras do app.
import { criarEstado, regiao, resumo, zonaAzul, maisLivres, avisarSaida, denunciar, diasGratis, pct } from './logic.js';
import { FONTE } from './data.js';

const R = (e, id) => resumo(regiao(e, id));

export const CRITERIOS = [
  {
    id: 'CA01', ref: 'RF01 · RN01 · RNF06',
    dado: 'O aplicativo aberto com os dados de referência.',
    quando: 'O motorista consulta o mapa.',
    entao: 'Mostra as quatro micro-regiões com vagas totais e ocupadas e o aviso de dados simulados.',
    run() {
      const e = criarEstado();
      const ok = e.regioes.length === 4 && e.regioes.every((r) => r.total > 0 && r.ocupadas >= 0) && FONTE.origem === 'simulado';
      return { ok, obtido: `${e.regioes.length} micro-regiões · fonte "${FONTE.origem}"` };
    },
  },
  {
    id: 'CA02', ref: 'RF02 · RF03 · RN02–RN04',
    dado: 'O mapa carregado.',
    quando: 'O motorista escolhe Recife Antigo como destino.',
    entao: 'Mostra 60% (120 de 200), classificação Moderada e Zona Azul em 56% (337 de 600).',
    run() {
      const e = criarEstado(); const r = R(e, 'recife-antigo'); const z = zonaAzul(e);
      const ok = r.pct === 60 && r.ocupadas === 120 && r.total === 200 && r.classe === 'Moderada' && z.pct === 56 && z.ocupadas === 337 && z.total === 600;
      return { ok, obtido: `${r.pct}% (${r.ocupadas} de ${r.total}), ${r.classe} · Zona Azul ${z.pct}% (${z.ocupadas} de ${z.total})` };
    },
  },
  {
    id: 'CA03', ref: 'RF03 · RF04 · RN02–RN05',
    dado: 'O mapa carregado.',
    quando: 'O motorista escolhe São José como destino.',
    entao: 'Mostra 85% (85 de 100) e classificação Cheia, e indica Boa Vista (40%) como a mais livre.',
    run() {
      const e = criarEstado(); const r = R(e, 'sao-jose'); const top = maisLivres(e)[0];
      const ok = r.pct === 85 && r.classe === 'Cheia' && top.nome === 'Boa Vista' && top.pct === 40;
      return { ok, obtido: `${r.pct}% (${r.ocupadas} de ${r.total}), ${r.classe} · mais livre: ${top.nome} (${top.pct}%)` };
    },
  },
  {
    id: 'CA04', ref: 'RF04 · RN05',
    dado: 'O mapa carregado.',
    quando: 'O motorista abre a lista de micro-regiões mais livres.',
    entao: 'Mostra a ordem Boa Vista (40%), Santo Antônio (50%), Recife Antigo (60%) e São José (85%).',
    run() {
      const lista = maisLivres(criarEstado());
      const txt = lista.map((r) => `${r.nome} (${r.pct}%)`).join(', ');
      return { ok: txt === 'Boa Vista (40%), Santo Antônio (50%), Recife Antigo (60%), São José (85%)', obtido: txt };
    },
  },
  {
    id: 'CA05', ref: 'RF05 · RF06 · RN06 · RN07',
    dado: 'O Motorista A com 0 pontos.',
    quando: 'O Motorista A avisa a saída de uma vaga em Santo Antônio.',
    entao: 'Santo Antônio passa a 59 de 120 (49%, Livre) e o Motorista A fica com 10 pontos.',
    run() {
      const e = criarEstado(); avisarSaida(e, 'A', 'santo-antonio'); const r = R(e, 'santo-antonio'); const p = e.motoristas.A.pontos;
      return { ok: r.ocupadas === 59 && r.pct === 49 && r.classe === 'Livre' && p === 10, obtido: `${r.ocupadas} de ${r.total} (${r.pct}%, ${r.classe}) · ${p} pontos` };
    },
  },
  {
    id: 'CA06', ref: 'RF05 · RF06 · RN07',
    dado: 'O Motorista A com 90 pontos.',
    quando: 'O Motorista A avisa uma saída válida.',
    entao: 'O saldo chega a 100 pontos e o aplicativo mostra 1 dia grátis.',
    run() {
      const e = criarEstado(); e.motoristas.A.pontos = 90; avisarSaida(e, 'A', 'boa-vista');
      const p = e.motoristas.A.pontos; const d = diasGratis(p);
      return { ok: p === 100 && d === 1, obtido: `${p} pontos · ${d} dia grátis` };
    },
  },
  {
    id: 'CA07', ref: 'RF05 · RN06',
    dado: 'Uma micro-região sem vaga ocupada registrada.',
    quando: 'O motorista tenta avisar uma saída nela.',
    entao: 'Informa que não há vaga ocupada nessa micro-região. A ocupação segue em 0% e os pontos não mudam.',
    run() {
      const e = criarEstado(); regiao(e, 'santo-antonio').ocupadas = 0;
      const res = avisarSaida(e, 'A', 'santo-antonio'); const r = R(e, 'santo-antonio');
      return { ok: !res.ok && r.pct === 0 && e.motoristas.A.pontos === 0, obtido: `"${res.msg.split('.')[0]}." · ${r.pct}% · ${e.motoristas.A.pontos} pontos` };
    },
  },
  {
    id: 'CA08', ref: 'RF07 · RN06 · RN09',
    dado: 'Um aviso do Motorista A em Santo Antônio (59 de 120) e o Motorista A com 50 pontos.',
    quando: 'O Motorista B denuncia que a vaga está ocupada.',
    entao: 'O aviso fica contestado, Santo Antônio volta a 60 de 120 (50%) e o Motorista A fica com 20 pontos.',
    run() {
      const e = criarEstado(); const { aviso } = avisarSaida(e, 'A', 'santo-antonio'); e.motoristas.A.pontos = 50;
      denunciar(e, 'B', aviso.id); const r = R(e, 'santo-antonio');
      return { ok: aviso.status === 'contestado' && r.ocupadas === 60 && r.pct === 50 && e.motoristas.A.pontos === 20, obtido: `aviso ${aviso.status} · ${r.ocupadas} de ${r.total} (${r.pct}%) · ${e.motoristas.A.pontos} pontos` };
    },
  },
  {
    id: 'CA09', ref: 'RF07 · RN08',
    dado: 'Um aviso de saída do Motorista A.',
    quando: 'O Motorista A tenta denunciar o próprio aviso.',
    entao: 'Informa que não é possível denunciar o próprio aviso. Ocupação e pontos não mudam.',
    run() {
      const e = criarEstado(); const { aviso } = avisarSaida(e, 'A', 'boa-vista');
      const antes = [regiao(e, 'boa-vista').ocupadas, e.motoristas.A.pontos];
      const res = denunciar(e, 'A', aviso.id);
      const depois = [regiao(e, 'boa-vista').ocupadas, e.motoristas.A.pontos];
      return { ok: !res.ok && antes[0] === depois[0] && antes[1] === depois[1], obtido: `"${res.msg}" · ${depois[0]} ocupadas · ${depois[1]} pontos` };
    },
  },
  {
    id: 'CA10', ref: 'RF07 · RN09',
    dado: 'O Motorista A com 25 pontos e um aviso seu denunciado.',
    quando: 'A denúncia é aceita.',
    entao: 'O Motorista A fica com 0 pontos, sem saldo negativo.',
    run() {
      const e = criarEstado(); const { aviso } = avisarSaida(e, 'A', 'recife-antigo'); e.motoristas.A.pontos = 25;
      denunciar(e, 'B', aviso.id);
      return { ok: e.motoristas.A.pontos === 0, obtido: `${e.motoristas.A.pontos} pontos` };
    },
  },
];

export { pct };
