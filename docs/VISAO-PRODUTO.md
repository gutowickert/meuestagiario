# Visão de Produto — MeuEstagiário (Coordenador de Marketing)

> Este documento estende o `CLAUDE.md`. Onde houver conflito com a descrição antiga ("gerar peças"), **esta visão prevalece**: o MeuEstagiário deixa de ser um *gerador de posts* e passa a ser um **coordenador de marketing** que **planeja, executa e aprende**.
>
> Status: **alinhado** — todas as decisões fundacionais fechadas (ver §10). Este documento é a bússola; refinamentos entram como edições pontuais.

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
- **Tudo editável.** Frequência, mix, cronograma, contexto, legendas e layouts são dados editáveis a qualquer momento — nenhuma escolha inicial prende o usuário.
- **Áudio é entrada de primeira classe.** O usuário pode explicar o negócio e os briefings **falando** (o sistema transcreve, via Deepgram). Menos digitação, mais contexto.
- **Plano é o padrão, não a prisão.** O cronograma organiza o dia a dia, mas o usuário sempre pode fazer um **pedido avulso** ("posta isso agora") e o sistema atende usando todo o contexto/histórico — sem re-briefing.
- **Motor separado do dado** (adapter) — preserva a revenda futura pros clientes da escola.

## 3. Os dois níveis de contexto: marca × produto

- **Marca / negócio** — posicionamento, tom, público, provas gerais, o que **não** pode falar. É a base do **orgânico**.
- **Produto** — cada produto (FC, ANL, Imersão…) tem **seu próprio** método, oferta, provas e objeções. É a base do **anúncio**.

Na revenda, cada cliente cadastra a própria marca e os próprios produtos — o motor não muda.

### Onboarding por áudio dirigido (definido)
O jeito de capturar contexto rico é: **o sistema faz as perguntas, o usuário responde por áudio** explicando o negócio. O áudio é transcrito e vira o contexto estruturado (marca + produtos). Perguntas de acompanhamento preenchem lacunas. Reeditável a qualquer momento.

O que a entrevista cobre (proposta — revisar ❓):
- **Negócio:** o que é, promessa central, diferencial, tom/identidade, restrições ("não falar X").
- **Público:** quem é, dores, objeções, linguagem.
- **Produtos (cada um):** método próprio, oferta, provas, objeções específicas, meta.
- **Provas:** depoimentos, números, cases (texto/áudio/vídeo).
- **Aparição em vídeo:** o dono/time aparece em vídeo? Quem? (define se dá pra planejar reels/vídeos com pessoa, no orgânico e no anúncio.)
- **Objetivo do período:** o que quer comunicar agora, sazonalidade, promoções ativas.
- **Referências:** o que admira / quer evitar; concorrentes.

> Consequência de roadmap: como o onboarding é por áudio, a **transcrição sobe de prioridade** (deixa de ser só "Fatia futura").

> **Decidido:** seguimos com essa lista por enquanto e vamos refinando com o uso. Não é definitiva — evolui conforme o método for validado na prática.

## 4. Os dois eixos de cada peça

Toda peça tem dois eixos independentes:

- **Objetivo** — `marca` | `produto` | `anuncio`
  - **Anúncio → sempre produto** (produto + oferta + CTA + urgência).
  - **Orgânico → mix escolhido:** N posts **de marca** (posicionamento, sem produto) + M posts **com produto** (educar/gerar desejo sem ser anúncio). O mix é **sempre manual** — o sistema **pergunta a preferência do usuário** a cada plano; não há default embutido.
- **Formato** — carrossel | imagem única | reel | (futuro) vídeo, em feed 1:1, feed 4:5 ou story 9:16.

O **objetivo** decide quais camadas de contexto entram no prompt; o **formato** decide o template/dimensão.

## 4.1 Dois módulos: Orgânico e Anúncios

São dois módulos que compartilham o mesmo contexto (marca/produtos) e o mesmo motor de criativos, mas com lógicas próprias.

### Módulo Orgânico
Um **cronograma de posts** (feed/story/reels) com o mix marca/produto. Cada post sugere um **CTA de topo de funil**:
- conhecer o site / "acesse pra saber mais";
- seguir o perfil;
- engajar / enviar (compartilhar) aquele post.
O sistema propõe legendas e, quando o post pede vídeo, **gera a legenda e pede o vídeo** pra editar; quando pede imagem, **diz o que a imagem precisa ter e pede a foto** ao usuário.

### Módulo Anúncios (estratégia de mídia paga)
Aqui o sistema monta a **estratégia**, não só a peça:
- **Produtos a anunciar agora** + **verba diária total** de investimento.
- Estrutura no padrão **ABO**: **campanhas por produto** → **1 conjunto por anúncio**.
- **Estrutura de teste padrão** por produto: **2 anúncios em imagem + 1 anúncio em vídeo**. O usuário pode **adicionar mais** se quiser.
- **Lógica de otimização (didática):** roda o teste, **quem performa melhor recebe mais tráfego, quem performa pior é morto**. O sistema **sugere** essa leitura; a execução do escalonamento fica com o usuário (é o que ele aprende na aula de tráfego ou repassa ao gestor dele).
- Cada criativo carrega o `content_id` no `utm_content` → fecha o loop de atribuição com o CRM (leads → matrículas).

**Escopo definido:** o sistema **só sugere a estrutura** (campanhas, conjuntos, verba, criativos). **Quem sobe as campanhas é a pessoa**, no Gerenciador do Meta. **Não** publicamos via API do Meta — isso simplifica bastante a arquitetura do módulo (sem integração de publicação, sem OAuth Meta, sem gestão de conta de anúncios). Fica como possibilidade distante, não na visão atual.

> O Módulo Anúncios é uma camada de **planejamento de mídia** (verba, campanhas, conjuntos, criativos sugeridos) acima do motor de criativos. É um bloco novo e substancial — merece sua própria fase.

## 4.2 Interfaces (como o usuário opera)

- **Planejamento em cards:** o sistema apresenta o bloco de posts/anúncios (semanal no início; mensal depois, conforme o usuário quiser) em **cards**. Em cada card o usuário pode: **pedir sugestões**, **enviar os arquivos/infos que a IA solicitou**, **aprovar** quando estiver ok e **baixar pra postar**.
- **Agenda de postagens (visual):** uma tela de calendário bem visual com o **status** de cada post: `aprovado` · `em construção` · `pendência do usuário` (falta enviar arquivo/informação).
- **Edição de layout:** o usuário pode enviar um layout/criativo e **pedir ajustes** — edição das peças (mais pesado; fase posterior, ver roadmap).
- **Pedido avulso (express):** além do cronograma, o usuário precisa ter **onde pedir algo na hora** — "aconteceu algo relevante, quero postar/anunciar isso agora". O sistema entende o pedido em linguagem natural e **usa todo o contexto e histórico dele** (marca, produtos, aprovados, performance) pra montar a peça/anúncio sem re-explicar nada. É um atalho que **entra fora do plano** mas nasce do mesmo cérebro; a peça gerada ainda passa pelo portão de aprovação e recebe `content_id`.

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

**Módulo Anúncios (a detalhar na sua fase):** estrutura de mídia paga — `campanhas` (por produto, com verba) → `conjuntos` (por anúncio) → criativos (que são `content_pieces` com `content_id`/utm). Modelagem detalhada quando chegarmos no passo 6.

A "fila de pendências" = `plano_itens` com `status = 'aguardando_input'`.

## 7. Entradas multimodais (texto, áudio, vídeo)

- **Briefing/planejamento por áudio:** grava → transcreve → vira texto. Serviço definido: **Deepgram** (pt-BR; o Claude não transcreve áudio).
- **Depoimentos (áudio/vídeo):** transcreve (Deepgram) → guarda o texto como `prova` + o arquivo original no Storage. Vídeo = extrai áudio → transcreve.

⚠️ Escopo novo (um serviço de IA a mais, como as Fatias 2–4). Entra **depois** da base de contexto e do planejador.

## 8. O que já está pronto (base da Fatia 1)

- Motor de geração ponta a ponta: `/api/generate` → Claude (structured output) → render (@vercel/og, templates lendo `tokens_visuais`) → Storage → `content_pieces`.
- Sistema de design por tokens (paleta/fontes/logo da marca), template fiel ao anúncio real.
- Studio (UI) pra gerar e visualizar.
- `content_id` pronto pra `utm_content`.

Isso tudo vira a **Etapa B (execução de uma peça)** do novo fluxo.

## 9. Roadmap (sequência proposta)

1. **Modelo de contexto** — `produtos` + campos de negócio + editor no Studio. *(ataca direto o "tá genérico")*
2. **Onboarding por áudio** — transcrição (**Deepgram**) + entrevista dirigida que monta o contexto rico.
3. **Planejador (orgânico) em cards** — frequência/mix/ideias → cronograma (`planos`/`plano_itens`) apresentado em cards.
4. **Execução com pendências** — o sistema pede os inputs por post (foto/vídeo/info) e dispara a geração.
5. **Agenda visual + aprovação** — calendário com status (aprovado/em construção/pendência) + portão de aprovação (`approved_examples`) + baixar pra postar.
6. **Módulo Anúncios** — estratégia de mídia: produtos, verba diária, estrutura ABO (campanhas/conjuntos), criativos, `utm_content`.
7. **Aprendizado** — anti-repetição (histórico) + performance do CRM (leads → matrículas).
8. **Edição de layout** — ajustar criativos enviados/gerados (mais pesado).

## 10. Decisões

**Definidas (fundacionais):**
- **Onboarding por áudio** — sistema pergunta, usuário responde falando; transcreve e monta o contexto. Inclui "quem aparece em vídeo".
- **Frequência/período editáveis** — começa **semanal**; mensal depois. Nada é fixo (princípio "tudo editável").
- **Anúncios = sempre produto**, com estratégia de mídia (verba diária, ABO, campanhas/conjuntos, criativos vídeo+imagem).
- **Orgânico** = mix marca/produto, com CTAs de topo (conhecer o site, seguir, engajar/enviar).
- **UI** = cards de planejamento (pedir sugestão / enviar arquivos / aprovar / baixar) + agenda visual com status.

**Definidas nesta rodada (as 5 que estavam em aberto):**
1. **Lista de onboarding (§3):** seguimos com a proposta atual por enquanto e refinamos com o uso — não é definitiva.
2. **Mix orgânico:** **sempre manual** — o sistema pergunta a preferência do usuário a cada plano. Sem default embutido.
3. **Papéis:** o **cliente opera sozinho**. Alunos podem ser **implantados** por você — abre espaço pra um **produto de implantação** (serviço à parte). O painel é desenhado para autoatendimento.
4. **Anúncios — escopo:** o sistema **só sugere** a estrutura; **a pessoa sobe as campanhas** no Gerenciador do Meta. **Sem publicação via API do Meta.** Estrutura de teste padrão: **ABO, 1 conjunto por anúncio, 2 ads imagem + 1 ad vídeo**; escala quem performa, mata quem não performa (usuário pode adicionar mais criativos). Ver §4.1.
5. **Transcrição:** **Deepgram** (pt-BR).

**Novo requisito capturado nesta rodada:**
- **Pedido avulso (express):** o usuário precisa de um lugar pra pedir conteúdo/anúncio **na hora**, fora do cronograma, e o sistema atende usando todo o contexto e histórico. Ver §4.2. Impacta a UI (um ponto de entrada de pedido livre) e o roteamento do pedido pro motor certo (orgânico vs anúncio).

---

## 11. Camada de refinamento e aprendizado (copy + design)

Direção do Guto (2026-07-02), a partir do uso real: o sistema não deve só **gerar e pronto** — deve **entregar um modelo pronto e deixar refinar barato**, e **aprender com o feedback**. Isso ataca o retrabalho (regerar tudo do zero) e faz a qualidade subir com o tempo.

**a) Opções e substituição de copy (barato, sem gastar imagem).** Separar a geração de **copy** da **renderização da imagem**: gerar 2–3 **variações** de headline, corpo e **CTA**, o usuário escolhe/troca peça por peça, e só rende a imagem quando estiver bom. Texto é barato; pixel não. Reduz custo e retrabalho.

**b) Feedback que ensina (memória viva).** O usuário precisa poder **marcar o que é bom** ("essa copy ficou incrível") e o que é ruim, por peça E por variação. Aprovado → entra em `estagiario.approved_examples` (few-shot de copy e visual); rejeitado → sinal de "não faça". É o portão do CLAUDE.md §12 + roadmap passo 5/7, trazido pra frente e no nível da **copy/variação**, não só da peça inteira.

**c) Categorias de copy.** O sistema deve ter uma **taxonomia de frameworks de copy** (ex.: educativo, prova social, quebra de objeção, oferta/urgência, storytelling, comparação) e **classificar** cada post numa categoria. Isso dá vocabulário pra: variar com intenção, aprender preferências **por categoria × produto × cidade**, e escolher o layout que encaixa naquela ideia.

**d) Biblioteca de templates com volume + inteligência de composição.** Reforço da meta de design: sem **muitos** templates, o agente não tem opções pra encaixar o texto e a ideia do post. Além do volume, o agente deve virar um **especialista em composição** — decidir tamanho/posição de logo e imagem conforme o conteúdo. Cresce como trilho contínuo (design deliberado, §12 do CLAUDE.md; nunca inventar identidade).

> Sequência sugerida: **(a) copy/CTA em opções sem re-render** → **(b) marcar bom/ruim → approved_examples** → **(c) categorias de copy** → **(d) mais templates + composição**. (a) e (b) são as de maior retorno imediato (menos retrabalho, começa a aprender).

---

*Documento alinhado — decisões fundacionais fechadas; §11 registra a camada de refinamento/aprendizado (direção viva). Próximo passo de implementação a combinar com o Guto (ver §11 sequência sugerida).*
