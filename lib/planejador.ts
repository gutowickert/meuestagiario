// =============================================================
// Planejador semanal de ORGÂNICO. Decide O QUE postar e QUANDO na semana —
// a grade (dia × formato × tema × etapa), abastecida por marca + método
// (Camada 2) + voz do cliente do CRM (Camada 3). Não desenvolve as peças:
// devolve o plano; o front manda cada item pro motor (roteiro/carrossel/imagem).
// Orgânico = conteúdo de VALOR (educa/prova/engaja), não oferta dura.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import { blocoMarca, blocoProduto, blocoInteligencia, type EtapaFunil } from './generate'

export type FormatoOrganico = 'reel' | 'carrossel' | 'imagem'

export interface ItemPlano {
  dia: string // "Segunda", "Terça"... (ou "Dia 1")
  formato: FormatoOrganico
  etapa: EtapaFunil
  tema: string // o assunto do post
  angulo: string // o gancho/ângulo
  ideia: string // 2-3 frases do que fazer — vira o briefing ao desenvolver
  objetivo: string // ex.: alcance, autoridade, prova, engajamento, nutrição
}

export interface PlanoSemanal {
  resumo: string // 1-2 frases da lógica da semana
  itens: ItemPlano[]
}

export interface PlanoInput {
  produto?: Produto | null
  inteligencia?: unknown | null
  qtdPosts: number
  foco?: string | null // tema/campanha da semana (opcional)
}

const PLANO_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    resumo: { type: 'string', description: 'A lógica da semana em 1-2 frases.' },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dia: { type: 'string', description: 'Dia da semana (Segunda..Domingo) ou "Dia 1".' },
          formato: { type: 'string', enum: ['reel', 'carrossel', 'imagem'] },
          etapa: { type: 'string', enum: ['descoberta', 'aquecimento', 'remarketing'] },
          tema: { type: 'string' },
          angulo: { type: 'string' },
          ideia: { type: 'string', description: '2-3 frases do que fazer (vira o briefing do post).' },
          objetivo: { type: 'string', description: 'alcance | autoridade | prova | engajamento | nutrição' },
        },
        required: ['dia', 'formato', 'etapa', 'tema', 'angulo', 'ideia', 'objetivo'],
      },
    },
  },
  required: ['resumo', 'itens'],
}

function instrucaoSistema(): string {
  return [
    'Você é um estrategista sênior de conteúdo ORGÂNICO (social media) da escola. Monta a grade da semana.',
    'ORGÂNICO ≠ ANÚNCIO: é conteúdo de VALOR que constrói audiência, autoridade e confiança e alimenta o funil — não oferta dura nem "compre agora".',
    'Princípios da grade:',
    '- Varie FORMATO (reel, carrossel, imagem) e ETAPA do funil ao longo da semana. A maioria é descoberta/aquecimento; remarketing/fechamento entra pouco e leve no orgânico.',
    '- Puxe os temas da VOZ REAL do cliente (dores, desejos, objeções, frases literais) e do MÉTODO da escola. Cada post ataca algo real — nada genérico.',
    '- Todo item tem um GANCHO forte (os 3 primeiros segundos / a capa). Um objetivo claro por post.',
    '- Ritmo realista de quem posta sozinho: prático de gravar/produzir.',
    'Devolva SEMPRE no schema estruturado.',
  ].join('\n')
}

function mensagemUsuario(input: PlanoInput): string {
  return [
    `Monte um plano de conteúdo ORGÂNICO com ${input.qtdPosts} post(s) para a próxima semana.`,
    input.produto ? `Foco no produto: ${input.produto.nome} (veja "PRODUTO EM FOCO").` : 'Sem produto específico — conteúdo geral da escola/marca.',
    input.foco && input.foco.trim() ? `Tema/campanha da semana: ${input.foco.trim()}.` : 'Sem tema fixo — você escolhe os melhores assuntos pela voz do cliente e pelo método.',
    '',
    'Para cada post: dia, formato (reel/carrossel/imagem), etapa do funil, tema, ângulo/gancho, uma ideia de 2-3 frases (o que fazer) e o objetivo.',
    'Distribua os formatos e as etapas com equilíbrio. Comece a semana com algo de descoberta forte.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Gera a grade semanal de orgânico. Não desenvolve as peças. */
export async function gerarPlano(brand: Brand, input: PlanoInput): Promise<PlanoSemanal> {
  const anthropic = getAnthropic()

  const system: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [
    { type: 'text', text: instrucaoSistema() },
    { type: 'text', text: blocoMarca(brand), cache_control: { type: 'ephemeral' } },
  ]
  const prod = blocoProduto(input.produto)
  if (prod) system.push({ type: 'text', text: prod, cache_control: { type: 'ephemeral' } })
  const intel = blocoInteligencia(input.inteligencia)
  if (intel) system.push({ type: 'text', text: intel, cache_control: { type: 'ephemeral' } })

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 5000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: mensagemUsuario(input) }],
    output_config: { format: { type: 'json_schema', schema: PLANO_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O planejador não retornou conteúdo (possível refusal).')
  }
  return JSON.parse(textBlock.text) as PlanoSemanal
}
