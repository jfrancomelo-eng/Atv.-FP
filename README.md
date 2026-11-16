# Conde Avisa — Documentação da entrega 1 da AV2

## Definições e planejamento da v0.1

**Disciplina:** AdmTech · **Docente:** José Adeilmo Nunes Barbosa Junior
**Etapa:** 17/11/2026 — definições e planejamento
**Lente:** 7 · Última Milha do Trabalho e do Estudo (Projeto Integrador — Mobilidade Urbana no Recife)

Base: Artefatos I, II e III e devolutiva do Artefato II. Os avisos usados nos exemplos são **fictícios**.

### Identificação do grupo

| Campo | Conteúdo |
|---|---|
| Projeto e equipe | Conde Avisa, Squad da Lente 7 |
| Lente | 7 · Última Milha do Trabalho e do Estudo — Av. Conde da Boa Vista, entre o Derby e a Ponte Duarte Coelho, picos 7h–9h e 17h–19h |
| Integrantes | Juan (coordenação e riscos) · Luiz Barreto (redação e defesa) · Arthur e Rafael (curadoria dos avisos) · Berto e Heitor (campo) · Breno (dados e análise) |
| Turma e docente | AdmTech, José Adeilmo Nunes Barbosa Junior |
| Versão e data | Planejamento da v0.1, 16/11/2026 |
| Repositório | https://github.com/jfrancomelo-eng/Atv.-FP (acesso de leitura liberado ao docente) |

---

## 1. Visão geral do projeto

**Contexto e problema.** No corredor da Conde da Boa Vista passam 49 linhas de ônibus e 4 de BRT. Avisos de desvio, obra, interdição, parada desativada e chuva vêm de órgãos diferentes (Grande Recife, CTTU, CBTU e APAC), cada um no seu canal. No caso da Rua do Hospício (2024), a obra, o desvio e os 184 cartazes vieram de três órgãos separados. O passageiro descobre a mudança no ponto, quando já saiu de casa (Artefato I, tensão T4).

No Artefato II, a equipe propôs o canal **Conde Avisa**: um integrante de plantão lê as quatro fontes, filtra o que afeta o trecho, escreve o aviso em formato fixo, faz dupla checagem e publica num canal de WhatsApp às 6h30 e às 16h30. Hoje esse trabalho é manual e espalhado em mensagens e planilhas. Com isso, (a) um aviso pode sair sem checagem ou fora do formato, e (b) a equipe não consegue medir com segurança **se o aviso chega a tempo**, que é a pergunta principal da devolutiva do Artefato II.

**Usuário principal.** O **plantonista da curadoria** (Arthur e Rafael, em rodízio com o squad). É quem registra o aviso, confere o aviso do colega, gera o boletim e consulta o relatório.
O **passageiro** do corredor é o beneficiário: ele recebe o boletim no WhatsApp e não usa o programa.

**Objetivo.** Permitir que o plantonista registre avisos válidos do trecho, faça a dupla checagem, gere o boletim acessível pronto para colar no canal e meça a **antecedência útil** de cada aviso, na fonte e no canal.

**Recorte da v0.1.** Um programa de terminal em Python, usado pelo plantonista, com fontes, tipos e paradas fixos, registro em planilha CSV e boletim em texto. A versão **não envia** mensagens ao WhatsApp e **não lê** os sites dos órgãos sozinha: o plantonista copia o boletim e o cola no canal.

## 2. História de usuário e esclarecimentos

> **Como** plantonista da curadoria, **quero** registrar e checar os avisos públicos que afetam o trecho e gerar o boletim no formato fixo, **para** publicar no canal só informação conferida e saber se ela chegou antes de o passageiro sair de casa.

| Pergunta de esclarecimento | Resposta | Origem |
|---|---|---|
| Quem opera a solução? | O plantonista de curadoria, em dupla. | Artefato III, Pilar 1 (Operações) |
| O passageiro usa o programa? | Não. Ele lê o boletim no WhatsApp, sem app nem cadastro. | Artefato II, Pilar 2 |
| O programa envia ao WhatsApp? | Não na v0.1. O envio automático exige API paga e aprovação. O plantonista copia e cola. | Decisão do grupo |
| Quais fontes são aceitas? | Grande Recife, CTTU, CBTU e APAC. | Artefato II, Pilar 3 |
| O que é "antecedência útil"? | O aviso foi publicado pelo menos 60 min antes do início do pico que o evento atinge. Para obra programada, até 20h da véspera. | Artefato III, Pilar 3 e Anexo B |
| Publicar exatamente no limite conta como útil? | Sim. O limite é inclusivo (6h00 conta para o pico das 7h). | Decisão do grupo (CA10) |
| Quais paradas fazem parte do trecho? | Lista inicial de 7 pontos, mais "Todo o trecho" para alertas de chuva. | **Pendente:** confirmar em campo (T07) |
| O boletim das 6h30 chega a tempo para o pico das 7h? | Não. O prazo útil é 6h00. Para o pico da manhã, só é útil o aviso que já saiu no boletim das 16h30 da véspera (CA12). | **Pendente:** decisão do squad (ver seção 11) |
| O programa guarda dados dos passageiros? | Não. Só registra o nome do integrante que escreveu e conferiu o aviso (LGPD, Lei 13.709/2018). | Decisão do grupo |

## 3. Requisitos funcionais

Requisitos funcionais dizem **o que a solução deve fazer**.

| ID | Comportamento esperado | Entrada e saída | Regras | Prioridade |
|---|---|---|---|---|
| RF01 | Registrar um aviso com tipo, fonte, o quê, linhas, onde, início, até quando, link e horário de publicação na fonte. | **Entrada:** dados do aviso · **Saída:** aviso registrado aguardando checagem, ou mensagem de erro | RN01–RN05 | Essencial |
| RF02 | Recusar aviso de fonte, tipo ou parada fora das listas, com mensagem que mostra as opções aceitas. | **Entrada:** valor digitado · **Saída:** aviso de erro; registro inalterado | RN01–RN03 | Essencial |
| RF03 | Fazer a dupla checagem de um aviso por um integrante diferente do autor. | **Entrada:** número do aviso e nome do checador · **Saída:** aviso checado ou aviso de erro | RN06 | Essencial |
| RF04 | Listar os avisos com situação (checado ou não), horário na fonte, horário no canal e antecedência útil. | **Entrada:** consulta · **Saída:** lista de avisos | RN08 | Essencial |
| RF05 | Gerar o boletim das 6h30 ou das 16h30 no formato fixo, ou "Sem mudanças hoje" quando não houver aviso. | **Entrada:** data e horário · **Saída:** texto do boletim | RN07 | Essencial |
| RF06 | Marcar os avisos do boletim como publicados e registrar o horário no canal. | **Entrada:** confirmação · **Saída:** horário no canal salvo | RN07, RN09 | Essencial |
| RF07 | Calcular, para cada aviso, se houve antecedência útil na fonte e no canal, e o atraso entre fonte e canal. | **Entrada:** horários registrados · **Saída:** sim/não e minutos | RN08, RN09 | Essencial |
| RF08 | Gerar o relatório de antecedência: total de eventos, % útil na fonte e no canal, atraso médio, contagem por tipo e leitura do resultado. | **Entrada:** avisos registrados · **Saída:** relatório | RN10 | Essencial |
| RF09 | Guardar todos os avisos numa planilha CSV e carregá-los ao abrir o programa. | **Entrada:** arquivo `avisos.csv` · **Saída:** planilha atualizada | RN11 | Essencial |

## 4. Requisitos não funcionais

Condições de qualidade e uso, com uma forma de conferir.

| ID | Condição exigida | Como conferir |
|---|---|---|
| RNF01 | Menus, mensagens e boletim estão em português. | Percorrer o menu e ler os textos que aparecem. |
| RNF02 | Roda com Python 3.10 ou mais novo, sem biblioteca externa, sem internet e sem serviço pago. | Numa máquina só com Python, rodar `python main.py`. |
| RNF03 | O registro abre em planilha comum (Excel ou Google Planilhas). | Abrir `avisos.csv` e ver uma coluna por campo. |
| RNF04 | Datas e horas usam sempre o formato DD/MM/AAAA HH:MM. | Conferir as perguntas do menu, o CSV e o boletim. |
| RNF05 | Uma entrada inválida não altera a planilha, e a mensagem diz o campo e o formato esperado. | Digitar uma data errada e conferir que o CSV não mudou. |
| RNF06 | O boletim é texto puro, pronto para colar no WhatsApp. | Copiar o boletim e colar numa conversa de teste. |
| RNF07 | Os critérios de aceitação podem ser conferidos de forma automática. | Rodar `python -m unittest -v` na pasta do projeto. |

## 5. Regras de negócio e dados

Regras de negócio dizem **as condições que determinam o comportamento da solução**.

### Dados fixos de referência

| Dado | Valores | Origem |
|---|---|---|
| Fontes (RN01) | Grande Recife, CTTU, CBTU, APAC | Artefato II, Pilar 3 |
| Tipos (RN02) | obra, desvio, interdição, parada desativada, mudança de linha, chuva forte | Devolutiva do Artefato II |
| Paradas (RN03) | Todo o trecho, Derby, Rua Dom Bosco, Rua do Hospício, Rua Gervásio Pires, Shopping Boa Vista, Rua Sete de Setembro, Ponte Duarte Coelho | Lista inicial, **a confirmar em campo** |
| Picos | 7h–9h e 17h–19h | Recorte da Lente 7 |
| Horários do boletim | 6h30 e 16h30 | Artefato II, Pilar 3 |

### Regras

| ID | Regra | Origem |
|---|---|---|
| RN01 | O aviso só é aceito se a fonte for uma das quatro fontes oficiais. | Artefato II |
| RN02 | O tipo do aviso deve ser um dos seis tipos da lista. | Devolutiva do Artefato II |
| RN03 | O local ("onde") deve ser uma parada do trecho ou "Todo o trecho". Aviso fora do trecho é recusado. | Recorte da Lente 7 |
| RN04 | "O quê", link da fonte e autor são obrigatórios. "O quê" tem no máximo 100 caracteres. As linhas são obrigatórias, exceto em "chuva forte", que fica como "todas". | Artefato II (leitura em 20 s) |
| RN05 | Início, fim e horário na fonte usam DD/MM/AAAA HH:MM. O fim deve ser igual ou posterior ao início. | Decisão do grupo |
| RN06 | Todo aviso precisa de dupla checagem feita por um integrante **diferente** do autor. | Risco R2 do Artefato II |
| RN07 | O boletim inclui só avisos **checados**, **vigentes** (fim igual ou depois do horário do boletim) e **já publicados pela fonte** até esse horário. Sem aviso, publica "Sem mudanças hoje no trecho Derby - Ponte Duarte Coelho." Todo boletim termina com "Projeto acadêmico da CESAR School, não oficial. Confira sempre a fonte." | Artefato II, risco R6 |
| RN08 | **Antecedência útil:** o aviso deve sair até 60 min antes do início do pico atingido pelo evento (o limite conta como útil). O pico atingido é o das 7h se o evento começa antes das 9h, o das 17h se começa antes das 19h, e o das 7h do dia seguinte nos demais casos. Para **obra**, o prazo é 20h da véspera do início. A regra vale para o horário na fonte e para o horário no canal. | Artefato III, Pilar 3 |
| RN09 | Atraso fonte → canal = horário no canal menos horário na fonte, em minutos. O horário no canal é gravado uma vez, no primeiro boletim que publica o aviso. | Artefato II, Pilar 3 (passo 4) |
| RN10 | Leitura do relatório: menos de 10 eventos = **inconclusivo**; 60% ou mais com antecedência útil na fonte = **fonte publica a tempo**; menos de 40% = **sinal do Cenário 2** (o dado público nasce tarde); entre 40% e 60% = **decisão escrita do squad**. | Artefato III, Pilar 3 e Pilar 4 |
| RN11 | Não se guarda nome, telefone nem outro dado de passageiro. | LGPD (Lei 13.709/2018) |

**Requisito × regra × critério.** O RF07 pede que a solução calcule a antecedência. A RN08 define o prazo e o limite. O CA10 usa um aviso publicado exatamente às 6h00 para conferir que o limite conta como útil.

## 6. Critérios de acessibilidade

O passageiro recebe o boletim no celular, inclusive com leitor de tela, e o plantonista usa o programa só pelo teclado. As referências são WCAG 2.2, eMAG e a Lei Brasileira de Inclusão (Lei 13.146/2015).

| ID | Critério | Como conferir |
|---|---|---|
| AC01 | O boletim é só texto. Nenhuma informação depende de imagem, cor, emoji ou negrito. | Ouvir o boletim com TalkBack (Android) ou VoiceOver (iPhone) e conferir que todo o conteúdo é lido. |
| AC02 | Cada informação fica em linha própria, com rótulo por extenso (O quê, Linhas, Onde, Até quando, Fonte). Cada aviso começa com "Aviso 1 de 2" para orientar quem escuta. | Ler o boletim gerado no CA09. |
| AC03 | Horários aparecem como "16h30" e datas como DD/MM/AAAA. Cada sigla de órgão vem explicada ("CTTU, trânsito do Recife"). | Conferir o campo Fonte no boletim. |
| AC04 | "O quê" tem no máximo 100 caracteres, para uma leitura curta (cerca de 20 s por aviso) e em linguagem simples. | CA05. |
| AC05 | O programa usa opções numeradas e só o teclado, sem depender de cor. Quando a opção é inválida, a pergunta se repete sem apagar o que já foi digitado. | Percorrer o menu sem mouse e errar uma opção de propósito. |
| AC06 | *(Fora do programa, conferido em campo.)* O cartaz de mão tem letra grande e alto contraste, e traz o link escrito ao lado do QR code. A abordagem falada atende quem não lê o cartaz ou não tem smartphone. | Checklist de campo de Berto e Heitor. |

## 7. Critérios de aceitação

Cada cenário segue Dado / Quando / Então. Nesta etapa registramos o **resultado esperado**. Como o rascunho já existe, cada critério também tem um teste em `tests/test_conde_avisa.py`.

Aviso-base dos exemplos *(fictício)*: desvio da CTTU na Rua do Hospício, linhas 040 e 043, início em 25/11/2026 08:00, fim em 28/11/2026 18:00, publicado na fonte às 05:50, autor Arthur.

| ID | Dado | Quando | Então | RF e RN |
|---|---|---|---|---|
| CA01 | Planilha sem avisos. | O plantonista registra o aviso-base com a fonte digitada "cttu". | O aviso é salvo com fonte "CTTU" e situação "aguardando checagem". | RF01 · RN01 |
| CA02 | Um aviso em registro. | A fonte digitada é "Grupo de bairro". | Aparece uma mensagem com as quatro fontes aceitas, e nada é salvo. | RF02 · RN01 |
| CA03 | Um aviso em registro. | O local digitado é "Boa Viagem". | Aparece uma mensagem de parada fora do trecho, e nada é salvo. | RF02 · RN03 |
| CA04 | Um aviso em registro. | O fim é 24/11/2026 18:00 (antes do início), ou a data foi digitada como "2026-11-25". | O programa informa o campo e o formato esperado, e nada é salvo. | RF01 · RN05 |
| CA05 | Um aviso em registro. | "O quê" tem 101 caracteres. | Aparece "use no máximo 100 caracteres", e nada é salvo. | RF01 · RN04 |
| CA06 | Um alerta de chuva forte da APAC em "Todo o trecho". | As linhas ficam em branco. | O aviso é aceito com linhas = "todas". Um desvio com linhas em branco é recusado. | RF01 · RN04 |
| CA07 | O aviso-base, escrito por Arthur. | "arthur" tenta checar o próprio aviso; depois Rafael checa. | A primeira tentativa é recusada ("deve ser feita por outra pessoa"). A segunda marca o aviso como checado por Rafael. | RF03 · RN06 |
| CA08 | Só existe um aviso não checado. | O plantonista gera o boletim de 25/11/2026 às 6h30. | O boletim mostra "Sem mudanças hoje no trecho Derby - Ponte Duarte Coelho." e o rodapé "não oficial". | RF05 · RN07 |
| CA09 | Há o aviso-base checado, um aviso não checado, um aviso vencido em 24/11 e um aviso que a fonte só publica às 07:00. | O plantonista gera o boletim de 25/11/2026 às 6h30. | Só o aviso-base aparece, como "Aviso 1 de 1: Desvio", com as linhas O quê, Linhas, Onde, "Até quando: 28/11/2026 às 18h00" e "Fonte: CTTU, trânsito do Recife." | RF05 · RN07 · AC02 · AC03 |
| CA10 | O aviso-base (evento às 08:00, pico das 7h, prazo às 06:00). | A fonte publicou às 05:50, às 06:00 e às 06:01. | Antecedência útil = sim, sim (limite) e não. | RF07 · RN08 |
| CA11 | Uma obra com início em 26/11/2026 07:00. | A fonte publicou em 25/11 às 20:00 ou às 21:00. | Antecedência útil = sim (limite da véspera) e não. | RF07 · RN08 |
| CA12 | O aviso-base checado, publicado na fonte às 05:50. | O boletim de 25/11 às 6h30 é marcado como publicado. | Horário no canal = 25/11/2026 06:30. Atraso = 40 min. Útil na fonte = sim. Útil no canal = **não**. | RF06 · RF07 · RN08 · RN09 |
| CA13 | 4 avisos registrados. | O plantonista abre o relatório. | A leitura é "Inconclusivo: menos de 10 eventos registrados." | RF08 · RN10 |
| CA14 | 10 avisos: 7 publicados pela fonte às 05:50 e 3 às 07:30. Depois, 3 às 05:50 e 7 às 07:30. | O plantonista abre o relatório. | No primeiro caso, "7 (70%)" e "Fonte publica a tempo". No segundo, 30% e "Sinal do Cenário 2". | RF08 · RN10 |

**Conferência do caso de limite (CA10).** O evento começa às 08:00, antes das 9h, então atinge o pico das 7h. O prazo é 7h00 − 60 min = 6h00. Se a fonte publica às 06:00, ainda está dentro do prazo (útil). Às 06:01, já passou.

**Conferência do CA12.** O canal publica às 06:30, depois do prazo de 06:00. Mesmo com a fonte a tempo, o boletim das 6h30 chega tarde para o pico das 7h. Atraso = 06:30 − 05:50 = 40 min.

## 8. Escopo e tecnologia da v0.1

| Incluído na v0.1 | Fora da v0.1 (e por quê) |
|---|---|
| Registro de avisos com fontes, tipos e paradas fixos. | Envio automático ao WhatsApp: a API é paga e exige aprovação. |
| Validação de campos, datas, trecho e tamanho do texto. | Leitura automática dos sites dos órgãos: só faz sentido quando a fonte publicar dado estruturado (apoptose, Artefato III). |
| Dupla checagem por outro integrante. | Lotação e atraso em tempo real: o squad decidiu não prometer o que não tem (Cenário 1). |
| Boletim de 6h30 e 16h30, e "Sem mudanças hoje". | Cadastro de passageiros, telefones e login (LGPD e "sem cadastro"). |
| Registro do horário na fonte e no canal, com antecedência e atraso. | Boletim da véspera às 19h/20h (fase 2 do Artefato III). |
| Relatório de antecedência por tipo de aviso. | Correção de aviso publicado e meta de erro ≤ 2%. |
| Planilha CSV. | Feed aberto CSV/RSS para terceiros (Cenário 3) e relatório para instituições apoiadoras. |

### Fluxo principal planejado

1. Às 5h30 ou às 15h30, o plantonista confere as quatro fontes e registra cada aviso que afeta o trecho (RF01, RF02).
2. O segundo plantonista abre a lista de pendentes e faz a dupla checagem (RF03).
3. O plantonista gera o boletim das 6h30 ou das 16h30 e o confere (RF05).
4. Ele copia o texto para o canal Conde Avisa e marca como publicado (RF06).
5. No fim da semana, Breno abre o relatório de antecedência (RF07, RF08) para a decisão Kill / Pivot / Scale do Artefato III.

**Condição de sucesso do recorte:** percorrer esse fluxo com avisos válidos e obter boletim e relatório coerentes com as regras. Não é preciso construir um sistema completo.

### Tecnologia e ambiente

**Python 3** puro, no terminal, sem bibliotecas externas. Os dados ficam em `avisos.csv`. **Motivo:** o fluxo é curto, roda em qualquer computador da equipe e do docente sem custo, a planilha já é a ferramenta do squad e a lógica fica fácil de explicar.

### Estrutura do repositório

```
Atv.-FP/
├── main.py                  # menu do plantonista (RF01-RF09)
├── conde_avisa/
│   ├── regras.py            # RN01-RN06, RN08, RN09: validação, checagem, antecedência
│   ├── boletim.py           # RN07 e RN10: boletim e relatório
│   └── dados.py             # RF09 / RN11: leitura e gravação do CSV
├── tests/test_conde_avisa.py  # CA01-CA14
├── dados/exemplo.csv        # 3 avisos FICTÍCIOS para demonstração
└── docs/                    # documento .docx
```

### Como executar

```bash
python main.py
```

```bash
python main.py dados/exemplo.csv
```

```bash
python -m unittest -v
```

## 9. Backlog e responsabilidades

A pessoa responsável responde pela tarefa, mas não precisa fazê-la sozinha. Apoio e revisão ficam registrados.

| ID | Resultado esperado | Responsável | Apoio ou revisão | Previsão |
|---|---|---|---|---|
| T01 | Visão geral, usuário, problema e recorte (seções 1 e 2). | Luiz Barreto | Juan | 16/11 |
| T02 | RF01–RF04 e RN01–RN06 (registro e checagem). | Arthur | Rafael | 16/11 |
| T03 | RF05–RF06, RN07 e critérios de acessibilidade (boletim). | Rafael | Berto | 16/11 |
| T04 | RF07–RF09 e RN08–RN11 (antecedência, relatório e dados). | Breno | Juan | 16/11 |
| T05 | Critérios de aceitação CA01–CA14, com os cálculos conferidos à mão. | Heitor | Breno | 16/11 |
| T06 | Repositório, acesso do docente, RNF e backlog. | Juan | Luiz Barreto | 16/11 |
| T07 | Confirmar em campo a lista de paradas e as páginas das quatro fontes. | Berto e Heitor | Arthur | 20/11 |
| T08 | Revisar e assumir `regras.py`: registro e checagem (RF01–RF03). | Arthur | Rafael | 23/11 |
| T09 | Revisar e assumir `boletim.py`: boletim e publicação (RF05–RF06), testado com leitor de tela (AC01). | Rafael | Berto | 23/11 |
| T10 | Revisar e assumir antecedência e relatório (RF07–RF08). | Breno | Heitor | 23/11 |
| T11 | Revisar e assumir `main.py` e `dados.py`: menu e CSV (RF04, RF09). | Juan | Luiz Barreto | 23/11 |
| T12 | Manter os testes CA01–CA14 e registrar os resultados observados. | Heitor | Breno | 23/11 |

As tarefas com previsão para 23/11 formam o plano de implementação da v0.1.

## 10. Revisão e contribuições individuais

### Registro da revisão

- Na revisão da RN07, o grupo viu que o boletim incluía um aviso de obra **antes** de a fonte publicá-lo, o que dava um atraso negativo. Por isso entrou a condição "já publicado pela fonte até o horário do boletim", com teste no CA09.
- Na revisão da RN08, o grupo calculou o CA12 à mão e viu que o boletim das 6h30 nunca chega a tempo para o pico das 7h. A questão ficou registrada como pendente na seção 2.

**Uso de IA.** O grupo usou o Claude para transformar os Artefatos I–III no formato do modelo e para gerar o rascunho do código e dos testes. Cada integrante revisa a parte sob sua responsabilidade (T08–T12), confere os cálculos dos CAs à mão e deve saber explicar a regra correspondente.

### Evidências de autoria e coautoria

Cada integrante diz o que escreveu ou revisou, cita os IDs e explica como conferiu. Cada pessoa indica ao menos um commit de autoria ou coautoria.

| Integrante (GitHub) | Contribuição | Como conferiu | Commit |
|---|---|---|---|
| Juan `@jfrancomelo-eng` | T06 e T11: repositório, RNF, backlog, menu e CSV. | Abriu o CSV no Excel e conferiu o acesso do docente. | https://github.com/jfrancomelo-eng/Atv.-FP/commit/511d407 |
| Luiz Barreto `@____` | T01: visão geral, usuário, recorte e história de usuário. | Conferiu se o recorte segue a devolutiva (foco informacional). | |
| Arthur `@____` | T02 e T08: RF01–RF04 e RN01–RN06. | Testou fonte, parada e checagem inválidas (CA02, CA03, CA07). | |
| Rafael `@____` | T03 e T09: boletim, RN07 e AC01–AC05. | Ouviu o boletim com leitor de tela no celular. | |
| Berto `@____` | T07: paradas e fontes em campo; AC06. | Percorreu o trecho e comparou com a lista da RN03. | |
| Heitor `@____` | T05 e T12: critérios de aceitação. | Recalculou CA10–CA12 à mão. | |
| Breno `@____` | T04 e T10: antecedência, relatório, RN08–RN10. | Comparou os limites com o Artefato III, Pilar 3 e Pilar 4. | |

Se duas pessoas usarem o mesmo commit, registrem a coautoria e o papel de cada uma.

## 11. O que pesquisamos e melhoramos em relação aos artefatos

| Ponto da devolutiva ou risco | Como a v0.1 responde |
|---|---|
| "Observar se os avisos chegam cedo o suficiente para permitir alguma decisão." | A RN08 e o RF07 medem a antecedência útil na fonte **e** no canal, separadamente. |
| "Separar falta de dor de baixa ocorrência de eventos." | A RN10 classifica como **inconclusivo** quando há menos de 10 eventos. |
| "Registrar quais tipos de aviso realmente geram valor." | O relatório mostra a antecedência por tipo de aviso. |
| R2: aviso errado derruba a confiança. | A dupla checagem por outra pessoa é obrigatória (RN06). |
| R6: o participante entende o canal como oficial. | O rodapé "não oficial" aparece em todo boletim (RN07). |
| Lacuna: o modelo pede acessibilidade, e os artefatos não tratavam disso. | Seção 6: boletim legível por leitor de tela, rótulos, siglas explicadas e cartaz com link escrito. |
| Lacuna: dados pessoais dos participantes. | A RN11 proíbe guardar dados de passageiros. |
| **Achado novo:** o prazo útil do pico das 7h é 6h00, e o boletim sai às 6h30. | Para o pico da manhã, o canal só ajuda com avisos que já saíram no boletim da véspera. Isso reforça o boletim de véspera da fase 2 e a apoptose do horário fixo (Artefato III, Pilar 2). **Decisão pendente:** antecipar os boletins (ex.: 5h45 e 15h45) ou criar o boletim das 20h. |
