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
  direcao_visual: string // instrução de imagem/layout pro template (não gera pixel)
}

export interface Atributos {
  angulo: string
  gancho: string
  formato: string
  cta: string
  oferta: string
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
          direcao_visual: {
            type: 'string',
            description: 'Direção de imagem/layout pro template (ex.: "foto da turma sorrindo, logo no canto"). Não descreve pixels finais.',
          },
        },
        required: ['ordem', 'papel', 'titulo', 'corpo', 'topicos', 'destaque', 'direcao_visual'],
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
      },
      required: ['angulo', 'gancho', 'formato', 'cta', 'oferta'],
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

function instrucaoSistema(): string {
  return [
    'Você é o estrategista de conteúdo do MeuEstagiario. Gera peças de marketing para negócios locais que aprendem com o que vende.',
    'Escreva na linguagem do público (resultado prático, presencial, cidade específica). Nada de métrica inventada.',
    'Respeite as regras de design da marca. A "direcao_visual" orienta o template com FOTOS REAIS — não descreva geração de imagem.',
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

  return [
    `Gere uma peça do tipo "${tipo.nome}" (${nslides}) no formato ${formato.nome} (${formato.proporcao}, ${formato.largura}x${formato.altura}px).`,
    input.cidade ? `Cidade/turma alvo: ${input.cidade}.` : '',
    input.produto ? `Produto alvo: ${input.produto.nome} (veja "PRODUTO EM FOCO" no contexto).` : '',
    input.ctaObjetivo
      ? `OBJETIVO DO CTA: a chamada final (slide de CTA + fim da legenda) deve levar a pessoa a ${CTA_INSTRUCAO[input.ctaObjetivo] ?? input.ctaObjetivo}.`
      : '',
    '',
    'BRIEFING:',
    input.briefing,
    '',
    'Estruture os slides com papéis claros (gancho -> desenvolvimento/prova -> cta). O primeiro slide é o gancho.',
    'Em cada slide, escolha um "destaque" curto (a frase ou número mais forte) pra ser realçado no layout — ou deixe vazio se o slide não tiver um ponto forte único.',
    'Quando o slide for uma lista (dias, passos, itens), use "topicos" (um item por entrada) em vez de jogar tudo no corpo — o layout formata como lista.',
    `Preencha atributos.formato exatamente com "${formato.id}".`,
  ]
    .filter(Boolean)
    .join('\n')
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

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: mensagemUsuario(brand, input) }],
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
