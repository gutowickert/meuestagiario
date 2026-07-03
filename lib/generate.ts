// =============================================================
// O cérebro (Fatia 1): compõe as 3 camadas de contexto e chama o Claude
// com structured output pra devolver a `spec` do carrossel + atributos.
// CLAUDE.md seções 6 e 8.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import { getFormato, getTipoAtivo, type FormatoId, type TipoPeca } from './formats'

// ---- Tipos da saída ----

export type PapelSlide = 'gancho' | 'desenvolvimento' | 'prova' | 'cta'

export interface Slide {
  ordem: number
  papel: PapelSlide
  titulo: string
  corpo: string
  topicos: string[] // se for lista/enumeração, cada item aqui; senão [] e usa corpo
  destaque: string // frase/estatística curta a realçar visualmente (vazio se não houver)
  foto_idx: number // índice da foto anexada a usar neste slide (-1 = sem foto)
  direcao_visual: string // instrução de imagem/layout pro template (não gera pixel)
}

export interface Atributos {
  angulo: string
  gancho: string
  formato: string
  cta: string
  oferta: string
  categoria: string // framework de copy usado (dor_solucao, prova_social, ...)
}

export interface Spec {
  legenda: string
  hashtags: string[]
  slides: Slide[]
  atributos: Atributos
}

export interface GerarInput {
  produto_id?: string | null
  produto?: Produto | null // contexto rico do produto (método/oferta/provas próprios)
  turma_id?: string | null
  cidade?: string | null
  briefing: string
  tipo: TipoPeca
  formato: FormatoId
  ctaObjetivo?: string | null // pra onde o CTA chama (whatsapp/site/inscricao/perfil/direct)
  exemplosAprovados?: { gancho: string; legenda: string }[] // few-shot da memória viva
  tendencia?: string | null // brief de newsjacking (surfar o que está em alta)
  fotos?: string[] // fotos reais anexadas (URLs) — o modelo VÊ e casa foto<->slide
}

// Pra onde a chamada final leva — orienta a copy do CTA (evita retrabalho).
export const CTA_INSTRUCAO: Record<string, string> = {
  whatsapp: 'chamar no WhatsApp (ex.: "Chama no WhatsApp", "Manda um oi no zap")',
  site: 'acessar o site / link na bio (ex.: "Acesse o site", "Link na bio")',
  inscricao: 'se inscrever / garantir a vaga na turma (ex.: "Garanta sua vaga", "Inscreva-se")',
  perfil: 'seguir o perfil e ativar as notificações',
  direct: 'chamar no direct do Instagram (ex.: "Chama no direct")',
}

// ---- Schema do structured output ----
// Restrições dos structured outputs: todo objeto precisa de additionalProperties:false
// e required; nada de minItems/minLength (controlamos a contagem via prompt).

const SPEC_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    legenda: { type: 'string', description: 'Legenda do post (caption), com CTA ao final.' },
    hashtags: { type: 'array', items: { type: 'string' }, description: '3 a 6 hashtags relevantes ao público/cidade.' },
    slides: {
      type: 'array',
      description: 'Slides na ordem de leitura.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ordem: { type: 'integer', description: 'Posição do slide (1 = primeiro).' },
          papel: { type: 'string', enum: ['gancho', 'desenvolvimento', 'prova', 'cta'] },
          titulo: { type: 'string', description: 'Headline curta do slide.' },
          corpo: { type: 'string', description: 'Texto de apoio em PROSA. Use quando NÃO for uma lista. Se preencher "topicos", deixe curto ou vazio.' },
          topicos: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Se o slide for uma enumeração (ex.: "Dia 1: ...", "Dia 2: ...", passos, itens), coloque cada item como uma string curta AQUI (um por linha). Senão, array vazio []. Não repita isso no corpo.',
          },
          destaque: {
            type: 'string',
            description:
              'Frase OU estatística MUITO curta (2-5 palavras) pra realçar visualmente neste slide, ex.: "R$40 vira R$65 mil", "3 dias presenciais", "sai vendendo". Puxe do CORPO e NÃO repita o título. Só letras, números e pontuação comum (sem setas/emojis). Vazio ("") se o título já for a frase de impacto ou não houver nada forte a destacar.',
          },
          foto_idx: {
            type: 'integer',
            description:
              'Índice (0..N-1) da foto anexada que MELHOR combina com este slide, olhando o que a foto mostra e o papel do slide. -1 se o slide fica melhor só com texto ou não há fotos.',
          },
          direcao_visual: {
            type: 'string',
            description: 'Direção de imagem/layout pro template (ex.: "foto da turma sorrindo, logo no canto"). Não descreve pixels finais.',
          },
        },
        required: ['ordem', 'papel', 'titulo', 'corpo', 'topicos', 'destaque', 'foto_idx', 'direcao_visual'],
      },
    },
    atributos: {
      type: 'object',
      additionalProperties: false,
      properties: {
        angulo: { type: 'string', description: 'Ângulo estratégico da peça.' },
        gancho: { type: 'string', description: 'Tipo/estilo do gancho usado.' },
        formato: { type: 'string', description: 'Formato da peça (será normalizado pelo sistema).' },
        cta: { type: 'string', description: 'Chamada para ação principal.' },
        oferta: { type: 'string', description: 'Oferta destacada.' },
        categoria: {
          type: 'string',
          description:
            'Framework de copy usado: dor_solucao | prova_social | quebra_objecao | oferta_urgencia | storytelling | comparacao | educativo.',
        },
      },
      required: ['angulo', 'gancho', 'formato', 'cta', 'oferta', 'categoria'],
    },
  },
  required: ['legenda', 'hashtags', 'slides', 'atributos'],
}

// ---- Composição do prompt (3 camadas) ----

function blocoMarca(brand: Brand): string {
  // Camada 1 (marca) + Camada 2 primária (metodo). Estável por marca -> cacheável.
  return [
    'PERFIL DA MARCA (fonte de assertividade — respeite tom, provas e objeções):',
    JSON.stringify(
      {
        nome: brand.nome,
        nicho: brand.nicho,
        oferta: brand.oferta,
        publico: brand.publico,
        tom: brand.tom,
        provas: brand.provas,
        objecoes: brand.objecoes,
        exemplos_vencedores: brand.exemplos_vencedores,
        regras_design: brand.regras_design,
      },
      null,
      2,
    ),
    '',
    'MÉTODO DA ESCOLA (use como framework de marketing — Camada 2):',
    brand.metodo ?? '(método não preenchido — use boas práticas de carrossel/anúncio.)',
  ].join('\n')
}

function blocoProduto(produto: Produto | null | undefined): string | null {
  // Camada 2 específica: cada produto tem seu método/oferta/objeções próprios (VISAO §3).
  if (!produto) return null
  return [
    'PRODUTO EM FOCO (a peça é sobre este produto — priorize o método, a oferta e as objeções DELE):',
    JSON.stringify(
      {
        nome: produto.nome,
        metodo: produto.metodo,
        oferta: produto.oferta,
        publico: produto.publico,
        provas: produto.provas,
        objecoes: produto.objecoes,
        meta: produto.meta,
      },
      null,
      2,
    ),
  ].join('\n')
}

function blocoExemplos(exemplos: GerarInput['exemplosAprovados']): string | null {
  // Camada de exemplos aprovados (§12): copy que o curador já aprovou -> few-shot.
  if (!exemplos || exemplos.length === 0) return null
  const itens = exemplos
    .map((e, i) => `${i + 1}. Gancho: ${e.gancho}\n   Legenda: ${e.legenda}`)
    .join('\n')
  return [
    'EXEMPLOS APROVADOS (peças que o dono da marca JÁ aprovou — siga este padrão de gancho e voz; inspire-se, não copie literalmente):',
    itens,
  ].join('\n')
}

function blocoTendencia(tendencia: string | null | undefined): string | null {
  if (!tendencia || !tendencia.trim()) return null
  return [
    'TENDÊNCIA PRA SURFAR (newsjacking — puxe este assunto quente e conecte ao negócio de forma inteligente e natural, sem forçar):',
    tendencia.trim(),
  ].join('\n')
}

function instrucaoSistema(): string {
  return [
    'Você é um COPYWRITER SÊNIOR de resposta direta, especialista em negócios locais. Sua copy faz a pessoa parar o dedo e agir.',
    '',
    'PRINCÍPIOS DE COPY (siga à risca):',
    '- O 1º slide é um SCROLL-STOPPER: tensão, pergunta afiada, número ou verdade inconveniente. Nada de saudação ("Você sabia?") nem clichê.',
    '- Uma ideia por slide. Frases curtas, ritmo, voz de quem fala na região (pt-BR informal, direto). Fale "você".',
    '- Seja ESPECÍFICO: números, cidade, situações reais > adjetivo vago. Prova concreta vence promessa.',
    '- PROIBIDO clichê de guru: "transforme sua vida", "descomplicar", "o segredo que ninguém te conta", "mude seu mindset", emoji em excesso.',
    '- Nada de métrica ou depoimento inventado — use só o que veio no contexto (provas/oferta). Se não tem prova, não invente.',
    '',
    'FRAMEWORK: escolha o mais adequado ao briefing e ESTRUTURE a peça por ele. Registre qual usou em atributos.categoria:',
    '- "dor_solucao" (PAS): dor → agita → vira a chave pra solução.',
    '- "prova_social": resultados/casos reais que geram desejo e confiança.',
    '- "quebra_objecao": pega a objeção mais forte e desmonta.',
    '- "oferta_urgencia": oferta clara + motivo real pra agir agora (turma, vagas).',
    '- "storytelling": um caso/jornada que ilustra a virada.',
    '- "comparacao": nós x eles / jeito antigo x jeito certo.',
    '- "educativo": ensina algo útil de verdade e posiciona como autoridade.',
    '',
    'A "direcao_visual" orienta o template com FOTOS REAIS — não descreva geração de imagem.',
    'Devolva SEMPRE no schema estruturado pedido.',
  ].join('\n')
}

function mensagemUsuario(brand: Brand, input: GerarInput): string {
  const tipo = getTipoAtivo(input.tipo)
  const formato = getFormato(input.formato)
  const nslides =
    tipo.minSlides === tipo.maxSlides
      ? `${tipo.minSlides} slide(s)`
      : `entre ${tipo.minSlides} e ${tipo.maxSlides} slides`

  const ehAnuncioImagem = input.tipo === 'anuncio_imagem'

  // Regra específica de anúncio de imagem única: pouco texto forte na arte,
  // copy pesada na legenda (feedback do Guto — a arte não é textão).
  const regraAnuncio = [
    'ESTA É UMA IMAGEM DE ANÚNCIO (peça única). O texto NA ARTE tem que ser MÍNIMO e IMPACTANTE:',
    '- "titulo": uma HEADLINE curta e forte (idealmente ≤ 6 palavras) — a coisa que a pessoa PRECISA ver.',
    '- "corpo": no MÁXIMO uma linha curta (≤ 10 palavras) de apoio/oferta — ou vazio. NADA de parágrafo.',
    '- "topicos": VAZIO. "destaque": vazio (não é usado na arte de anúncio).',
    '- Toda a persuasão (dor, oferta, prova, urgência e o CTA) vai na LEGENDA, que deve ser uma COPY DE ANÚNCIO completa e forte.',
    'Use papel "gancho" no slide único.',
  ].join('\n')

  const regraCarrossel = [
    'Estruture os slides com papéis claros (gancho -> desenvolvimento/prova -> cta). O primeiro slide é o gancho.',
    'Termine com EXATAMENTE UM slide de papel "cta" (o último). NÃO faça dois slides de CTA seguidos.',
    'Em cada slide, escolha um "destaque" curto (a frase ou número mais forte) pra ser realçado no layout — ou deixe vazio se o slide não tiver um ponto forte único.',
    'Quando o slide for uma lista (dias, passos, itens), use "topicos" (um item por entrada) em vez de jogar tudo no corpo — o layout formata como lista.',
  ].join('\n')

  const n = input.fotos?.length ?? 0
  const regraFotos =
    n > 0
      ? [
          `FOTOS ANEXADAS: ${n} foto(s) reais seguem como blocos de imagem, na ordem (índice 0 a ${n - 1}). VOCÊ AS VÊ.`,
          'Para CADA slide, escolha em "foto_idx" o índice da foto que melhor combina com a MENSAGEM e o PAPEL do slide (a capa/gancho normalmente pede a foto mais forte/representativa). Use -1 quando o slide fica melhor só com texto.',
          'A copy e a "direcao_visual" devem CASAR com o que a foto escolhida REALMENTE mostra (pessoas, cenário, objeto). Não descreva algo que não está na foto.',
          'Evite repetir a mesma foto em vários slides sem motivo. Se uma foto for ruim (escura, cortada, fora de contexto), não use (-1).',
        ].join('\n')
      : 'Não há fotos anexadas: preencha "foto_idx" com -1 em TODOS os slides.'

  return [
    `Gere uma peça do tipo "${tipo.nome}" (${nslides}) no formato ${formato.nome} (${formato.proporcao}, ${formato.largura}x${formato.altura}px).`,
    input.cidade ? `Cidade/turma alvo: ${input.cidade}.` : '',
    input.produto ? `Produto alvo: ${input.produto.nome} (veja "PRODUTO EM FOCO" no contexto).` : '',
    input.ctaObjetivo
      ? `OBJETIVO DO CTA: a chamada (na arte quando fizer sentido, e no fim da legenda) deve levar a pessoa a ${CTA_INSTRUCAO[input.ctaObjetivo] ?? input.ctaObjetivo}.`
      : '',
    '',
    'BRIEFING:',
    input.briefing,
    '',
    ehAnuncioImagem ? regraAnuncio : regraCarrossel,
    '',
    regraFotos,
    `Preencha atributos.formato exatamente com "${formato.id}".`,
  ]
    .filter(Boolean)
    .join('\n')
}

// Conteúdo do turno do usuário: o texto + as fotos como blocos de imagem (o
// modelo VÊ as fotos pra casar foto<->slide e a copy com o que aparece).
type BlocoUsuario =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } }

function conteudoUsuario(brand: Brand, input: GerarInput): BlocoUsuario[] {
  const blocos: BlocoUsuario[] = [{ type: 'text', text: mensagemUsuario(brand, input) }]
  for (const url of input.fotos ?? []) {
    blocos.push({ type: 'image', source: { type: 'url', url } })
  }
  return blocos
}

// ---- Chamada principal ----

/** Gera a spec do carrossel/imagem a partir da marca + briefing. Não renderiza nem persiste. */
export async function gerarSpec(brand: Brand, input: GerarInput): Promise<Spec> {
  const anthropic = getAnthropic()

  const system: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [
    { type: 'text', text: instrucaoSistema() },
    // Bloco da marca é estável por marca -> prompt caching (CLAUDE.md seção 8).
    { type: 'text', text: blocoMarca(brand), cache_control: { type: 'ephemeral' } },
  ]
  const produtoBloco = blocoProduto(input.produto)
  // Contexto do produto: estável por produto -> segundo breakpoint de cache.
  if (produtoBloco) system.push({ type: 'text', text: produtoBloco, cache_control: { type: 'ephemeral' } })
  // Exemplos aprovados: mudam a cada aprovação -> sem cache.
  const exemplosBloco = blocoExemplos(input.exemplosAprovados)
  if (exemplosBloco) system.push({ type: 'text', text: exemplosBloco })
  // Tendência (newsjacking): muda a cada peça -> sem cache.
  const tendenciaBloco = blocoTendencia(input.tendencia)
  if (tendenciaBloco) system.push({ type: 'text', text: tendenciaBloco })

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: conteudoUsuario(brand, input) }],
    output_config: { format: { type: 'json_schema', schema: SPEC_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O Claude não retornou conteúdo de texto (possível refusal).')
  }

  const spec = JSON.parse(textBlock.text) as Spec

  // Normaliza o formato: a fonte da verdade é o input, não o que o modelo escreveu.
  spec.atributos.formato = input.formato
  // Garante ordenação dos slides por segurança.
  spec.slides.sort((a, b) => a.ordem - b.ordem)

  return spec
}
