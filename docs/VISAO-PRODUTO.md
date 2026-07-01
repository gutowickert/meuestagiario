# Visão de Produto — MeuEstagiário (Coordenador de Marketing)

> Este documento estende o `CLAUDE.md`. Onde houver conflito com a descrição antiga ("gerar peças"), **esta visão prevalece**: o MeuEstagiário deixa de ser um *gerador de posts* e passa a ser um **coordenador de marketing** que **planeja, executa e aprende**.
>
> Status: **rascunho para revisão** (Guto). As decisões marcadas com ❓ dependem de você.

---

## 1. A virada: de gerador para coordenador

Um gerador espera um briefing e devolve uma peça. Um **coordenador**:

1. **Entende o negócio** a fundo (onboarding assertivo, uma vez).
2. **Planeja** o conteúdo do período (semana/mês) — um cronograma com mix de marca, produto e anúncio.
3. **Executa** o cronograma, **pedindo ativamente** ao usuário só o que falta de cada post (a foto tal, a promoção tal).
4. **Aprende** com o que foi postado e com o que vendeu, pra renovar e não repetir.

O motor de geração que já existe (Claude → spec → template → Storage → `content_pieces`) é a **Etapa de execução** de uma peça. O que estamos adicionando é o **cérebro ao redor**: contexto rico, planejamento e coleta ativa.

## 2. Princípios (herdados e novos)

- **Contexto antes de criatividade.** A qualidade vem das camadas de contexto; sem contexto assertivo, a saída é genérica. (Herdado do CLAUDE.md §8.)
- **Planejar, depois executar.** Nada é gerado no vácuo — toda peça nasce de um item de um plano.
- **Coletar sob demanda.** O sistema não exige um textão a cada peça; ele guarda o contexto pesado e **pergunta só o que falta**, por peça.
- **Aprender e renovar.** O histórico de peças evita repetição; a performance do CRM prioriza vencedores.
- **Motor separado do dado** (adapter) — preserva a revenda futura pros clientes da escola.

## 3. Os dois níveis de contexto: marca × produto

- **Marca / negócio** — posicionamento, tom, público, provas gerais, o que **não** pode falar. É a base do **orgânico**.
- **Produto** — cada produto (FC, ANL, Imersão…) tem **seu próprio** método, oferta, provas e objeções. É a base do **anúncio**.

Na revenda, cada cliente cadastra a própria marca e os próprios produtos — o motor não muda.

### O que capturar no onboarding (proposta — revisar ❓)
Entrevista dirigida (não um campo em branco; depois, por áudio):
- **Negócio:** o que é, promessa central, diferencial, tom/identidade, restrições ("não falar X").
- **Público:** quem é, dores, objeções, linguagem.
- **Produtos (cada um):** método próprio, oferta, provas, objeções específicas, meta.
- **Provas:** depoimentos, números, cases (texto/áudio/vídeo).
- **Objetivo do período:** o que quer comunicar agora, sazonalidade, promoções ativas.
- **Referências:** o que admira / quer evitar; concorrentes.

❓ **Decisão sua:** essa lista está completa e assertiva pro seu método? O que cortar/adicionar?

## 4. Os dois eixos de cada peça

Toda peça tem dois eixos independentes:

- **Objetivo** — `marca` | `produto` | `anuncio`
  - **Anúncio → sempre produto** (produto + oferta + CTA + urgência).
  - **Orgânico → mix escolhido:** N posts **de marca** (posicionamento, sem produto) + M posts **com produto** (educar/gerar desejo sem ser anúncio).
- **Formato** — carrossel | imagem única | reel | (futuro) vídeo, em feed 1:1, feed 4:5 ou story 9:16.

O **objetivo** decide quais camadas de contexto entram no prompt; o **formato** decide o template/dimensão.

## 5. O fluxo completo

### Etapa A — Planejamento (painel)
O usuário define **frequência**, **tipos de conteúdo**, **mix** (marca/produto/anúncio) e **ideias/temas** (ou pede sugestões). O sistema devolve um **cronograma** semanal/mensal: uma lista de posts planejados, cada um com data, objetivo, produto (se houver), ângulo/ideia e formato. O usuário aprova/ajusta o calendário.

### Etapa B — Execução (fila de pendências)
Para cada post planejado, o sistema sabe **o que precisa** (cada tipo de post declara seus inputs: foto do produto, promoção, depoimento…). Ele **pede ativamente** o que falta:
> "Post 3 (ANL, quarta): envie uma foto do produto X neste cenário. A promoção Y já está definida."

Enquanto falta input → status `aguardando_input`. Quando o usuário entrega → o post é **gerado** (o pipeline atual) → vai ao **portão de aprovação**.

### Etapa C — Aprovação e publicação
Revisão humana obrigatória. Aprovado → entra em `approved_examples` (memória que melhora as próximas) e fica pronto pra publicar com o `content_id` no `utm_content`. Rejeitado → grava o motivo (sinal de "não faça").

### Etapa D — Aprendizado
- **Anti-repetição:** o próximo cronograma lê o histórico de peças da marca/produto e evita repetir ângulo/gancho.
- **Performance:** quando o CRM plugar, os atributos que converteram (por produto × cidade) viram prioridade.

## 6. Modelo de dados (evolução do schema `estagiario`)

**Novas tabelas:**
- **`produtos`** — `id`, `brand_id`, `nome`, `metodo`, `oferta`, `publico`, `provas` (jsonb), `objecoes` (jsonb), `meta`, timestamps.
- **`planos`** — o cronograma: `id`, `brand_id`, `periodo_inicio`, `periodo_fim`, `frequencia`, `config` (jsonb: mix marca/produto/anúncio, tipos), `status`.
- **`plano_itens`** — cada post planejado: `id`, `plano_id`, `data_prevista`, `objetivo` (`marca`|`produto`|`anuncio`), `produto_id` (nulo p/ marca), `tipo`, `formato`, `ideia`/`angulo`, `inputs_necessarios` (jsonb), `inputs_recebidos` (jsonb), `status` (`planejado`→`aguardando_input`→`gerado`→`aprovado`→`publicado`), `content_piece_id`.

**Existentes (papel atualizado):**
- **`brands`** — contexto da marca/negócio (não mais o dono do método de produto).
- **`content_pieces`** — a peça renderizada de um `plano_item`.
- **`templates`**, **`approved_examples`** — como no CLAUDE.md §12.

A "fila de pendências" = `plano_itens` com `status = 'aguardando_input'`.

## 7. Entradas multimodais (texto, áudio, vídeo)

- **Briefing/planejamento por áudio:** grava → transcreve → vira texto. (Precisa de serviço de transcrição — Whisper/Deepgram; o Claude não transcreve áudio.)
- **Depoimentos (áudio/vídeo):** transcreve → guarda o texto como `prova` + o arquivo original no Storage. Vídeo = extrai áudio → transcreve.

⚠️ Escopo novo (um serviço de IA a mais, como as Fatias 2–4). Entra **depois** da base de contexto e do planejador.

## 8. O que já está pronto (base da Fatia 1)

- Motor de geração ponta a ponta: `/api/generate` → Claude (structured output) → render (@vercel/og, templates lendo `tokens_visuais`) → Storage → `content_pieces`.
- Sistema de design por tokens (paleta/fontes/logo da marca), template fiel ao anúncio real.
- Studio (UI) pra gerar e visualizar.
- `content_id` pronto pra `utm_content`.

Isso tudo vira a **Etapa B (execução de uma peça)** do novo fluxo.

## 9. Roadmap (sequência proposta)

1. **Modelo de contexto** — `produtos` + campos de negócio + **onboarding/entrevista** (assertivo) + editor no Studio. *(ataca direto o "tá genérico")*
2. **Planejador** — painel de frequência/mix/ideias → cronograma (`planos`/`plano_itens`).
3. **Execução com pendências** — o sistema pede inputs por post e dispara a geração.
4. **Aprovação + publicação** (com `content_id`/utm + `approved_examples`).
5. **Aprendizado** — anti-repetição (histórico) + performance (CRM).
6. **Multimodal** — áudio/vídeo no briefing e nos depoimentos.

## 10. Decisões em aberto (preciso de você) ❓

1. **Onboarding:** a lista de contexto da §3 está completa/assertiva? O que muda?
2. **Mix orgânico:** existe um padrão (ex.: 60% marca / 40% produto) ou é sempre manual?
3. **Frequência típica:** posts/semana que você imagina (define o tamanho do cronograma)?
4. **Papéis:** hoje é você operando pela escola. Na revenda, o cliente opera sozinho ou você opera pra ele? (afeta o painel)
5. **Transcrição:** preferência de serviço/idioma pro áudio (quando chegarmos lá)?

---

*Quando este documento estiver alinhado, ele guia a implementação. Próximo passo recomendado: **§9 passo 1 (modelo de contexto + onboarding)**.*
