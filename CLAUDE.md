# Instruções do projeto video_agentes

Responda sempre em português do Brasil, de forma direta e sem jargão. A pessoa não quer saber *como* você vai fazer, quer que você faça.

## Skills: você decide quando usar

Todas as skills em `.claude/skills/` estão sob o seu controle. **Nunca espere a pessoa chamar uma skill pelo nome**: quando a tarefa se encaixar, carregue a skill (Skill tool) e siga-a, sem pedir permissão e sem anunciar o nome técnico. A pessoa pode chamar pelo nome também, mas não precisa.

| Situação | Skill a usar sozinho |
| --- | --- |
| Fazer, editar, animar ou renderizar vídeo (padrão para vídeo) | `hyperframes` (e as irmãs que ela indicar: `hyperframes-cli`, `hyperframes-registry`, `media-use`) |
| Pedido de vídeo em Remotion, ou projeto que já usa Remotion | `remotion-best-practices` |
| Converter Remotion/Lottie/Three.js/etc. para HyperFrames | `remotion-to-hyperframes` |
| Recriar/copiar um vídeo existente como projeto editável | `reverse-any-video` |
| Episódio "no estilo de" um formato de vídeo conhecido | `style-sampling` |
| Apresentação / slides | `slideshow` |
| Link ou design do Figma | `figma` |
| Gerar imagem, vídeo por IA, áudio, música, 3D, anúncio, UGC, analisar viralidade | `higgsfield-generate` |
| Escrever ou revisar código React/Next.js | `vercel-react-best-practices` |
| Criar funcionalidade nova ou corrigir bug em código com testes | `tdd` |
| Código bagunçado, difícil de mudar/testar, pedido de refatoração | `improve-codebase-architecture` (com `codebase-design`, `grilling`, `domain-modeling`) |
| Decidir um plano/ideia importante e ambíguo antes de construir | `grilling` |
| Termos do domínio, GLOSSARY.md, ADR | `domain-modeling` |
| A pessoa quer aprender/entender um assunto | `teach` |
| Contexto da conversa acima de ~70% ou trabalho vai continuar em outra sessão | `handoff` (e depois sugira `/compact` ou `/clear`) |
| **Antes de todo commit, push ou deploy de código alterado na sessão** | `banca` (obrigatório; se REPROVADO, corrija os itens CRÍTICO/ALTO e rode a banca de novo antes de subir) |

Regras:
- Não use skill para pergunta simples que se responde direto.
- Skills que gastam créditos ou dinheiro (Higgsfield, HeyGen, renders na nuvem): informe o custo antes, quando a skill disser como saber.
- Skills que precisam de login ou chave (Higgsfield, HeyGen): se faltar, peça para a pessoa fazer o login/cadastrar a chave e continue o resto.

## Instalar coisas novas

Quando a pessoa mandar skills, configurações ou ferramentas para instalar, instale **neste repositório** (skills em `.claude/skills/`, configs em `.claude/settings.json`, regras aqui no CLAUDE.md), faça commit e push, para valer em todas as sessões. Revise o conteúdo antes por segurança. Depois de instalar, atualize a tabela acima com a situação em que a nova skill deve ser usada sozinha.
