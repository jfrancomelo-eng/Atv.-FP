// Camada de dados do Safepark (RF08).
// A interface só lê daqui. Na Etapa 2, basta trocar a fonte (origem: "camera")
// e os números chegam pela mesma estrutura, sem refazer a tela.

export const FONTE = {
  origem: 'simulado',
  descricao: 'Dados simulados para a v0.1. Não representam o inventário real de vagas do Recife.',
  atualizadoEm: '16/11/2026',
};

export const REGIOES = [
  { id: 'recife-antigo', nome: 'Recife Antigo', apelido: 'CESAR School', total: 200, ocupadas: 120, origem: 'simulado' },
  { id: 'santo-antonio', nome: 'Santo Antônio', apelido: 'Pátio do Livramento', total: 120, ocupadas: 60, origem: 'simulado' },
  { id: 'sao-jose', nome: 'São José', apelido: 'Mercado de São José', total: 100, ocupadas: 85, origem: 'simulado' },
  { id: 'boa-vista', nome: 'Boa Vista', apelido: 'Rua da Aurora', total: 180, ocupadas: 72, origem: 'simulado' },
];

export const REGRAS = {
  pontosPorAviso: 10,     // RN07
  pontosPorDiaGratis: 100, // RN07
  perdaPorDenuncia: 30,   // RN09 (10 do aviso + 20 de penalidade)
  limiteModerada: 60,     // RN04
  limiteCheia: 85,        // RN04
};
