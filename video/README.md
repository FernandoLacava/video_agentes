# QG Central: uma quinta-feira com o meu time de agentes

Este é um vídeo para o LinkedIn: 4:5 (1080x1350), mais uma variação 9:16 (1080x1920), a 30 fps, com ~64 s. O roteiro está em `../source/PROMPT.md` e o briefing em `BRIEF.md`.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `data/timeline.json` | Guarda tudo o que é dado, separado do layout: mensagens já sanitizadas, horários, revelação em blocos, destaques, legendas, barra de status/bateria, estados do painel de quests, câmera e prova real. |
| `index.html` + `style.css` | Raiz da composição no estilo HyperFrames (`data-composition-id="qg-central"`). As fontes vêm junto em `assets/fonts`. |
| `compositions/engine.js` | Faz o timing determinístico (easing, tracks e markup inline). |
| `compositions/chat.js` | Monta o chat do Telegram: balão recebido/enviado, bloco de código, anexo, digitando…, revelação em blocos e rolagem com easing. |
| `compositions/phone.js` | Cuida da moldura do celular, da barra de status, do cabeçalho, das telas de bloqueio reais com o cartão de notificação, da transição de relógio e do trecho real gravado. |
| `compositions/overlay.js` | Cuida de tudo fora do celular: legendas, seleção de personagem, painel de quests, roteamento, rótulos da prova e card final. |
| `compositions/main.js` | Define o layout relativo por formato (`?fmt=916`), a câmera (zoom contínuo e aproximações) e a timeline seekable registrada em `window.__timelines["qg-central"]`. |
| `scripts/render.mjs` | Faz o render quadro a quadro (seek → screenshot → ffmpeg), os snapshots e a exportação da lista de cues de som. |
| `scripts/audio.py` | Gera os efeitos e uma trilha lo-fi discreta, tudo por síntese (sem downloads), e faz o ducking sob os efeitos. |
| `scripts/build.sh` | Junta imagem e áudio e normaliza com loudnorm (−16 LUFS, pico ≤ −1,5 dBTP), saindo em H.264 yuv420p + AAC com faststart. |
| `scripts/contact.sh` | Gera uma folha de contato com 1 quadro a cada 0,5 s. |

## Comandos

```bash
node scripts/render.mjs snapshot --fmt 45 --at 1,20,42 --out snapshots
scripts/build.sh 45  delivery out/linkedin-4x5.mp4
scripts/build.sh 916 delivery out/linkedin-9x16.mp4
```

## Privacidade

- Os prints e a gravação originais ficam em `../source` e não vão para o git.
- A comanda das 14:24 aparece como esqueleto.
- Os blocos de prompt usam um texto genérico de preenchimento, com blur.
- Os nomes de pessoas foram trocados por papéis ("seu chefe", "o responsável").
- As descrições internas de tarefas e frentes foram generalizadas.
