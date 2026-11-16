# Como registrar a sua contribuição (autoria ou coautoria)

O professor confere a contribuição pelo **commit no GitHub**. Cada integrante precisa ter pelo menos um commit no próprio nome.

## 1. Uma vez só: configure o seu nome no git

```bash
git config --global user.name "Seu Nome"
```

```bash
git config --global user.email "email-da-sua-conta@github.com"
```

Use o mesmo e-mail da sua conta do GitHub. Sem isso, o commit não aparece ligado ao seu perfil.

## 2. Pegue o repositório e altere a sua parte

```bash
git clone https://github.com/jfrancomelo-eng/Atv.-FP.git
```

Edite a sua parte no `README.md` (ver tabela da seção 9) e preencha a sua linha na seção 10.

## 3. Faça o commit e envie

```bash
git add README.md
```

```bash
git commit -m "T03: revisa RN07 e critérios de acessibilidade do boletim"
```

```bash
git push
```

## 4. Coautoria (duas pessoas no mesmo commit)

Coloque uma linha em branco e depois uma linha por coautor no fim da mensagem:

```
T05: confere cálculos dos CA10 a CA12

Co-authored-by: Nome do Colega <email-do-colega@github.com>
```

## 5. Pegue o link do commit

No GitHub, abra **Commits**, clique no seu commit e copie a URL, no formato `https://github.com/jfrancomelo-eng/Atv.-FP/commit/<código>`.

## 6. O que enviar no Classroom

- O link do **seu** commit.
- Duas ou três linhas: o que você fez (IDs, por exemplo RN07, AC01–AC05) e como conferir (ex.: "abra o commit e veja a seção 6 do README").
- O link do repositório e o documento final da equipe (`docs/AV2_Entrega_1_Conde_Avisa.docx`).

**Antes:** em Settings → Collaborators, adicione o professor com acesso de leitura (ou deixe o repositório público).
