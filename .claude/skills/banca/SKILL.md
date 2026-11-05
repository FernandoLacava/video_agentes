---
name: banca
description: Banca de 5 revisores que tenta reprovar o código antes de subir (hacker, usuário confuso, programador sênior, testador e chefe dos desenvolvedores, que dá o veredito APROVADO/REPROVADO). Use AUTOMATICAMENTE antes de todo commit/push/deploy de mudanças de código feitas na sessão, e também quando a pessoa pedir revisão, "revisa antes de subir" ou "tenta reprovar meu código".
argument-hint: "[o que esse código faz, em uma frase] [arquivos ou pasta, opcional]"
---

# Banca de 5 revisores

Monte uma banca de 5 revisores para tentar **reprovar** o código antes de subir. Cada um revisa separado, com um papel só, e **não suaviza**. Responda sempre em português.

**Não altere nada: só revise.** Nenhuma edição de arquivo, commit ou push durante a banca. (Rodar testes existentes é permitido; testes que faltam o testador escreve num diretório temporário fora do repositório, nunca dentro dele.)

## Antes de começar

1. **O que o código faz:** use a frase passada nos argumentos. Se não houver, deduza do README/código e diga em uma frase qual entendimento a banca usou.
2. **Escopo:** se a pessoa indicou arquivos ou pasta, revise só isso. Senão, revise as mudanças ainda não enviadas (`git status`, `git diff`, `git diff origin/<branch-padrão>...HEAD`); se não houver mudança, revise o projeto todo.
3. Se o código foi colado na conversa (app sem pasta), revise o que foi colado.
4. Se não houver código nenhum para revisar, diga isso e pare.

## Os revisores 1 a 4: em paralelo e separados

Lance os revisores 1 a 4 como **4 subagentes independentes, em paralelo** (Agent tool, numa única mensagem), para que um não influencie o outro. Passe a cada um: o que o código faz, o escopo exato, o papel dele (texto abaixo, completo), a regra "não altere nenhum arquivo do repositório" e o formato de saída. Se não houver ferramenta de subagente, faça os 4 papéis você mesmo, um de cada vez, sem misturar.

Formato que cada revisor devolve: lista de problemas, cada um com **gravidade** (CRÍTICO / ALTO / MÉDIO / BAIXO), **arquivo:linha**, o problema e como reproduzir/ver. Só problemas reais que ele verificou no código; nada de elogio.

1. **O hacker:** procure falhas de segurança. Senha, chave ou token escritos no código (inclusive em arquivos de config, `.env` versionado e histórico recente), dados do usuário expostos (logs, respostas de API, front-end), entrada sem validação (injeção de SQL/comando, XSS, path traversal, upload), autenticação e autorização (permissão sobrando, rota sem checagem, RLS/regra de banco aberta), dependências com falha conhecida.
2. **O usuário confuso:** use o sistema do jeito errado. Clique duas vezes, deixe campo vazio, digite texto onde é número, número negativo, texto gigante, emoji, volte no meio do fluxo, recarregue a página, perca a conexão. Para cada caso diga o que quebra e **que mensagem de erro aparece** (ou que não aparece nenhuma). Se der para rodar o app, rode e teste de verdade; se não, siga o código e diga que foi por leitura.
3. **O programador sênior:** aponte código repetido, nome que ninguém entende, função grande demais, acoplamento, código morto, tratamento de erro engolido e o que vai ser difícil de manter.
4. **O testador:** liste os casos que precisam funcionar. Rode os testes que existirem (descubra o comando no package.json, Makefile, pyproject etc.) e mostre a saída exata do que falha. Para os casos sem teste, escreva os testes que faltam fora do repositório (diretório temporário) e rode se possível; mostre exatamente o que falha. Diga claramente o que não conseguiu rodar e por quê.

## O revisor 5: o chefe dos desenvolvedores

Depois que os 4 relatórios chegarem, você é **o chefe dos desenvolvedores**. Leia os 4 relatórios, confira no código qualquer item duvidoso (descarte o que for falso e diga que descartou) e dê **UM** veredito:

- **REPROVADO** se existir qualquer item CRÍTICO ou ALTO, ou se os testes falham.
- **APROVADO PRA SUBIR** só se não houver nada disso.

## Entrega final

Em português, nesta ordem:

1. **Veredito:** `✅ APROVADO PRA SUBIR` ou `❌ REPROVADO`, com o motivo em uma frase.
2. **Resumo de cada revisor:** 2 a 4 linhas por revisor.
3. **Lista única do que corrigir**, do mais grave ao menos grave, sem duplicatas, cada item com gravidade, `arquivo:linha`, o problema e qual revisor achou.
4. Uma linha final perguntando se a pessoa quer que você corrija os itens. Não corrija sem ela pedir.
