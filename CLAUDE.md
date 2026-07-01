@AGENTS.md

# CLAUDE.md — MeuEstagiario

Este arquivo é o contexto permanente do projeto. Leia por inteiro antes de escrever ou alterar código. Se algo aqui conflitar com um pedido, aponte o conflito antes de agir.

---

## 1. O que estamos construindo

**MeuEstagiario** é um assistente de marketing que gera o conteúdo de um negócio de ponta a ponta — estratégia, copy, imagens, vídeos — para orgânico e anúncios. O diferencial não é gerar conteúdo, é **gerar conteúdo que aprende com o que vende**: cada peça é rastreável até a venda no CRM, e o que performou realimenta a próxima geração.

O modelo (Claude) é o cérebro/orquestrador. Ele **não gera pixels**: imagens e vídeos vêm de modelos especializados chamados por API. O papel deste sistema é a inteligência ao redor do pixel + a montagem + o loop de aprendizado.

**Uso hoje:** o próprio negócio (Carreira No Digital — ver seção 9). **Futuro:** virar produto revendável aos alunos da escola (negócios locais). Por isso, mantenha o código do motor separado do acesso a dados (ver seção 4).

## 2. Regras de trabalho neste repo

- Faça mudanças pequenas e commits frequentes com mensagens claras.
- **NUNCA** escreva nas tabelas do CRM (`public.*`). Na Fatia 1 elas são somente-leitura, usadas só para JOIN de performance.
- Nada de `localStorage`/estado de browser para dados que precisam persistir — a fonte de verdade é o Supabase.
- Segredos só via variáveis de ambiente. `SUPABASE_SERVICE_KEY` e chaves de IA jamais no front.
- Sempre trate erros de chamadas externas (Claude, Supabase, APIs de imagem/vídeo) com try/catch e status legível.
- Quando estiver em dúvida sobre escopo, priorize a Fatia atual (seção 7) e não antecipe fatias futuras.

## 3. Stack

- **Next.js (App Router) + TypeScript + Tailwind**, hospedado na **Vercel** (deploy automático via GitHub `main`).
- **Supabase** (Postgres + Storage), o **mesmo projeto do CRM**. Tabelas do MeuEstagiario no schema `estagiario`.
- **Anthropic SDK** para o cérebro (structured outputs + prompt caching).
- Render de imagem: **@vercel/og** (nativo, Flexbox apenas) por padrão; migrar para uma **API de HTML→imagem** (Chromium completo) se um template exigir CSS além de Flexbox.
- **Fluid Compute** ligado; `maxDuration` ~300s nas rotas de geração.

## 4. Decisões de arquitetura

- **Serviço separado, banco compartilhado.** Repo/deploy próprios; lê o mesmo Supabase do CRM para fechar o loop hoje sem criar ilha.
- **Adapter de dados.** Todo acesso a dados passa por uma camada `lib/data/` (ex.: `getBrand()`, `getPerformanceByAttribute()`). Hoje o adapter aponta para o Supabase do CRM. Para revenda futura, troca-se só o adapter (fonte do aluno), sem tocar no motor. **Não espalhe queries Supabase pelo código** — centralize no adapter.
- **Assíncrono por webhook.** Jobs que esperam APIs externas (render, e futuramente enhancement/vídeo) não bloqueiam: dispara, responde, e a API externa chama de volta por webhook. Use `waitUntil`/`after` do Next para continuar em background. Só introduza fila (pgmq/Trigger.dev) quando houver jobs realmente longos (>13 min) — não antes.
- **content_id = utm_content.** O identificador de cada peça é o elo de atribuição. Ele viaja no UTM do anúncio e volta pela esteira do CRM (`wa_clicks` → `leads` → `matriculas`). Não crie um sistema de medição paralelo; use o que o CRM já coleta.

## 5. Modelo de dados (schema `estagiario`)

**`estagiario.brands`** — perfil de marca (o contexto que gera assertividade — ver seção 8).
Campos: `id`, `nome`, `nicho`, `oferta`, `publico`, `tom`, `provas` (jsonb), `objecoes` (jsonb), `exemplos_vencedores` (jsonb), `tokens_visuais` (jsonb: cores/fontes/logo/espaçamento — **fonte única da verdade visual**), `regras_design` (jsonb: padrões como "máx 2 fontes", "headline ≤ 8 palavras", "logo no canto"), `metodo` (texto — o método da escola, ver seção 8), timestamps.

**`estagiario.content_pieces`** — cada peça gerada.
Campos: `id`, `content_id` (único, vira `utm_content`), `brand_id`, `produto_id`, `turma_id`, `cidade`, `tipo` (carrossel/anuncio_imagem/reel/organico), `spec` (jsonb — o JSON estruturado que o Claude devolveu), `atributos` (jsonb: angulo, gancho, formato, cta, oferta), `assets` (jsonb: URLs no Storage), `status`, `criado_em`.

**`estagiario.templates`** — moldes de layout **versionados**. Campos: `id`, `slug` (ex.: `slide-gancho`), `versao`, `engine` (`vercel-og` | `html-api`), `codigo` (o componente/HTML com slots), `regras` (jsonb), `ativo`. Versionar permite atribuir performance a uma versão e reverter. Templates leem os tokens da marca — **nunca** codifiquem cor/fonte na mão.

**`estagiario.approved_examples`** — a **memória viva**: peças aprovadas no portão de revisão. Campos: `id`, `brand_id`, `content_piece_id`, `tipo`, `atributos` (jsonb), `nota_curadoria`, `aprovado_em`. Alimenta o prompt como few-shot de copy **e** de direção visual. Rejeições entram como sinal negativo (`status='rejeitado'` + `motivo`). Esta tabela é o que faz a qualidade subir com o tempo.

**Performance (leitura, não coluna):** não guarde resultado dentro da peça. Leia por JOIN, agregando por atributo × etapa de funil:
```
estagiario.content_pieces.content_id
  → public.wa_clicks.utm_content
  → public.leads (etapa, valor_venda, matricula_id)
  → public.matriculas (valor_pago)
```
Métricas do funil por atributo: leads → agendamentos → matrículas → receita. Atribuição = **last-touch** na Fatia 1 (a peça que trouxe o lead leva o crédito). Não construa multi-touch agora.

## 6. Fluxo de geração (Fatia 1)

Rota `POST /api/generate`:
1. Recebe `{ brand_id, produto_id, turma_id, cidade, briefing }`.
2. `getBrand()` no adapter — carrega o perfil.
3. Monta o prompt (seção 8) e chama o Claude com **structured output** — devolve a `spec` do carrossel (slide a slide: texto + direção visual) + `atributos`.
4. Gera um `content_id` único.
5. Renderiza cada slide (template @vercel/og preenchido com tokens da marca + copy).
6. Sobe os PNGs para `estagiario-media` no Storage.
7. Grava a peça em `estagiario.content_pieces` com `content_id`, `spec`, `atributos`, `assets`.
8. Retorna as URLs + o `content_id` (para virar `utm_content` no anúncio).

Rota `POST /api/performance` (stub agora, real depois): recebe/agrega performance por atributo lendo o JOIN da seção 5. Alimenta o passo 3 das próximas gerações com os vencedores.

## 7. Roadmap por fatias (foco atual = Fatia 1)

- **Fatia 1 (ATUAL):** cérebro + carrossel via template, usando fotos reais + copy. Sem geração de imagem, sem enhancement, sem vídeo. Depende só da `ANTHROPIC_API_KEY`. Já inclui o schema integration-ready e a query de performance.
- **Fatia 2:** melhoria de foto real (iluminação/nitidez) via Claid/Replicate, antes de entrar no template.
- **Fatia 3:** geração de imagem por script (GPT Image/FLUX) quando não há foto.
- **Fatia 4:** vídeo — o usuário envia clipes, IA faz cortes + legenda + trilha (ZapCap/Submagic/Shotstack).

Não comece uma fatia antes da anterior estar redonda e testada.

## 8. As três camadas de contexto (de onde vem a assertividade)

O prompt de geração deve compor três camadas — este é o coração da qualidade:

1. **Marca/negócio:** injete o `brands` inteiro (nicho, oferta, público, tom, provas, objeções, ofertas). Use prompt caching neste bloco (é estável por marca).
2. **Ofício/marketing:** frameworks de gancho, estrutura de carrossel, padrões de anúncio. **Fonte primária: o campo `metodo` da marca** — a metodologia da própria escola. Isso diferencia a saída e, na revenda, ensina com o método da escola.
3. **Performance:** os vencedores reais lidos do CRM, **filtrados por `produto_id` × `cidade`** (o que converte para ANL em Porto Alegre ≠ FC em Caxias). Vazio no início; cresce a cada ciclo.

Modelo: use **Opus** para a estratégia/brief de campanha (raciocínio pesado, 1x) e **Sonnet/Haiku** para volume de copy e variações. Structured outputs em toda geração para saída parseável.

## 9. Contexto do negócio (Carreira No Digital)

Escola de **marketing digital** que vende **cursos presenciais** (turmas) em cidades do RS (Porto Alegre, Novo Hamburgo, Canoas, Lajeado, Caxias do Sul, Santa Cruz do Sul).

- **Produtos:** Formação Completa em Marketing Digital (FC), Anúncios para Negócios Locais (ANL), Imersão Mapa Digital, Imersão IA para Conteúdo. Cada um roda em turmas por cidade/data, com meta de matrículas.
- **Público:** donos de negócio local / pessoas querendo entrar no marketing digital, no interior/região metropolitana do RS.
- **Funil:** anúncio Meta → landing → botão WhatsApp (`/wa`, grava `wa_clicks` com UTM) → conversa → `lead` no CRM → funil → `matricula`. UTM/`content_id` é o elo de atribuição.
- **Nuance de atribuição:** o comprador (aluno) pode ser diferente do lead (ex.: cônjuge). A medição usa `leads.matricula_id`/`matriculas`, não presume aluno = lead.

Conteúdo gerado deve falar a linguagem desse público (negócio local, resultado prático, presencial, cidades específicas) e apoiar a captação de turmas por cidade.

## 10. Guardrails

- Fatia 1 **não** toca em WhatsApp, disparos, nem escreve no CRM. Escopo = gerar peças + medir por leitura.
- LGPD: dados de leads/mensagens são sensíveis; o MeuEstagiario só lê agregados de performance, não expõe dado pessoal em peça nenhuma.
- Nada de inventar métrica: se a query de performance não tem dado, o prompt roda sem a Camada 3 (não fabrique "vencedores").

## 11. Definição de pronto — Fatia 1

- [ ] Schema `estagiario.brands` e `estagiario.content_pieces` criado.
- [ ] Perfil da Carreira No Digital cadastrado (com `metodo` preenchido).
- [ ] `/api/generate` produz um carrossel completo (spec + PNGs no Storage + registro com `content_id`).
- [ ] Template de carrossel renderizando fiel aos `tokens_visuais` da marca.
- [ ] `/api/performance` retornando a agregação por atributo × funil (mesmo que zerada no início).
- [ ] `content_id` no formato pronto para virar `utm_content` no Meta.
- [ ] Sistema de design com tokens como fonte única, ao menos 1 template versionado, e o portão de aprovação gravando em `approved_examples`.

---

## 12. Sistema de design — memória viva

O design é um **sistema guardado como dado e lido a cada geração**, não uma coleção de imagens. Quatro camadas:

1. **Tokens** (`brands.tokens_visuais`): cores, fontes, logo, espaçamento. Fonte única da verdade. Todo template lê daqui; nada de valores fixos no template. Garante padrão de marca mecanicamente.
2. **Templates** (`estagiario.templates`): moldes versionados com slots. Qualidade mora aqui.
3. **Regras** (`brands.regras_design` + `templates.regras`): padrões escritos como dado, respeitados pela geração e pelo render.
4. **Exemplos aprovados** (`estagiario.approved_examples`): a memória que cresce; few-shot de copy e de visual.

**Portão de aprovação (obrigatório no fluxo):** toda peça passa por revisão humana antes de publicar. Aprovar → entra em `approved_examples` (memória sobe). Rejeitar → grava motivo (sinal de "não faça"). Hoje o curador é o dono do negócio; na revenda, cada cliente constrói a própria biblioteca.

**Dois tipos de evolução — não confundir:**
- **Deliberada (humana):** mudanças em tokens/regras/templates são versionadas e controladas pelo dono da marca. A identidade só muda quando o humano muda.
- **Emergente (dados):** o sistema aprende quais templates/estilos *já on-brand* performam melhor (por produto×cidade) e os prioriza; a biblioteca de aprovados cresce. **Nunca** invente elementos de marca novos nem deixe a identidade "derivar" sozinha — a evolução emergente é só melhor seleção entre opções aprovadas.

**Claude Design** é a ferramenta de autoria/refino do visual (design-time); o Supabase é onde o sistema vive e evolui (runtime). O que sai do Claude Design vira template parametrizado compatível com o `engine` escolhido.
