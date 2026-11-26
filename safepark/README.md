# Safepark: Inteligência de Vagas na Zona Azul

Projeto da AV2 de ADM Tech (CESAR School), Lente 8 · Mobilidade Inteligente & Programação.
O motorista escolhe o destino antes de sair de casa e vê a ocupação da Zona Azul do Centro do Recife por micro-região. Os próprios motoristas mantêm a ocupação atualizada, de forma colaborativa e gamificada.

Todos os dados de vagas, ocupação e pontos são **simulados** para a v0.1.

## Conteúdo da pasta

| Caminho | O que é |
|---|---|
| `docs/AV2_Entrega_1_Safepark.docx` | Documento da entrega 1: recorte, requisitos, regras e critérios de aceitação |
| `index.html` | Página do site |
| `css/styles.css` | Visual |
| `js/data.js` | Camada de dados simulados, com campo `origem` (RF08). Na Etapa 2, a fonte troca aqui |
| `js/logic.js` | Regras de negócio RN01–RN09 |
| `js/criterios.js` | Critérios de aceitação CA01–CA10 executáveis |
| `js/app.js` | Interface do aplicativo |
| `js/scene.js` | Modelos 3D (maquete do Centro, câmera da Etapa 2, moeda de pontos) com Three.js |
| `assets/` | Logo da CESAR School |
| `dist/safepark.html` | O site inteiro em um arquivo só, para abrir com dois cliques |

## Requisitos atendidos na v0.1

- **RF01–RF04:** mapa com as quatro micro-regiões, escolha de destino, % de ocupação do destino e da Zona Azul, classificação (Livre, Moderada, Cheia) e lista das mais livres.
- **RF05–RF06:** aviso de saída de vaga, +10 pontos por aviso e 1 dia grátis a cada 100 pontos.
- **RF07:** denúncia de vaga ocupada, com aviso contestado e perda de 30 pontos (nunca abaixo de 0).
- **RF08:** dados separados da interface.
- **CA01–CA10:** o botão "Rodar CA01 a CA10" na página executa os dez cenários contra o mesmo código do app.

## Como rodar

`index.html` usa módulos JavaScript, então precisa de um servidor local:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000` dentro desta pasta. Para só ver o site, abra `dist/safepark.html` com dois cliques (precisa de internet para as fontes e o 3D).

## Tecnologia

HTML, CSS e JavaScript, sem servidor e sem banco de dados. Three.js para o 3D e GSAP para animação, carregados por CDN. Publicação prevista no GitHub Pages.
