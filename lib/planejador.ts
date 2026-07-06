// =============================================================
// Planejador de ORGÂNICO. Decide O QUE postar e QUANDO — a grade (semanal ou
// mensal), seguindo os PILARES de conteúdo que o usuário definiu (ex.: "escola/
// novidades", "trend", "dica prática"), com formato por pilar. Abastecido por
// marca + método (Camada 2) + voz do cliente (Camada 3). Não desenvolve as peças:
// devolve o plano; o front manda cada item pro motor (roteiro/carrossel/imagem).
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import { blocoMarca, blocoProduto, blocoInteligencia, type EtapaFunil } from './generate'

export type FormatoOrganico = 'reel' | 'carrossel' | 'imagem'
export type Cadencia = 'semanal' | 'mensal'

/** Um pilar de conteúdo (linha editorial) definido pelo usuário. */
export interface Pilar {
  nome: string // ex.: "Escola / novidades"
  descricao: string // o que entra nesse pilar (diferenciais, inauguração, agenda...)
  formato: FormatoOrganico | 'auto' // formato preferido; 'auto' = a IA escolhe
  trend: boolean // usa tendência (newsjacking) ao desenvolver
}

export interface ItemPlano {
  dia: string // "Segunda", "Terça"... ou "Semana 1 · Segunda"
  pilar: string // nome do pilar de origem
  formato: FormatoOrganico
  trend: boolean
  etapa: EtapaFunil
  tema: string
  angulo: string
  ideia: string // 2-3 frases do que fazer — vira o briefing ao desenvolver
  objetivo: string
}

export interface PlanoSemanal {
  resumo: string
  itens: ItemPlano[]
}

export interface PlanoInput {
  produto?: Produto | null
  inteligencia?: unknown | null
  cadencia: Cadencia
  postsPorSemana: number
  pilares: Pilar[]
  foco?: string | null // tema/campanha do período (opcional)
}

const PLANO_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    resumo: { type: 'string', description: 'A lógica do período em 1-2 frases.' },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dia: { type: 'string', description: 'Dia (Segunda..Domingo). No mensal, prefixe a semana: "Semana 2 · Quarta".' },
          pilar: { type: 'string', description: 'Nome EXATO do pilar de origem.' },
          formato: { type: 'string', enum: ['reel', 'carrossel', 'imagem'] },
          trend: { type: 'boolean', description: 'true se for post de tendência (o tema real vem depois via busca).' },
          etapa: { type: 'string', enum: ['descoberta', 'aquecimento', 'remarketing'] },
          tema: { type: 'string' },
          angulo: { type: 'string' },
          ideia: { type: 'string', description: '2-3 frases do que fazer (vira o briefing do post).' },
          objetivo: { type: 'string', description: 'alcance | autoridade | prova | engajamento | nutrição' },
        },
        required: ['dia', 'pilar', 'formato', 'trend', 'etapa', 'tema', 'angulo', 'ideia', 'objetivo'],
      },
    },
  },
  required: ['resumo', 'itens'],
}

function instrucaoSistema(): string {
  return [
    'Você é um estrategista sênior de conteúdo ORGÂNICO (social media) da escola. Monta a grade do período seguindo os PILARES definidos.',
    'ORGÂNICO ≠ ANÚNCIO: conteúdo de VALOR que constrói audiência, autoridade e confiança e alimenta o funil — não oferta dura.',
    'Princípios:',
    '- Siga os PILARES à risca: cada post pertence a um pilar e usa o formato dele (se "auto", escolha o melhor). Distribua os pilares ao longo do período em rodízio equilibrado.',
    '- Puxe os temas da VOZ REAL do cliente (dores, desejos, objeções, frases literais) e do MÉTODO da escola. Cada post ataca algo REAL e ESPECÍFICO — nada genérico.',
    '- Todo item tem um ÂNGULO afiado e provocativo/contraintuitivo (não óbvio) e um objetivo claro. Varie a etapa do funil (a maioria descoberta/aquecimento).',
    '- Para posts de pilar de TENDÊNCIA (trend=true): NÃO invente uma trend específica (você não sabe o que está em alta agora). Descreva o ÂNGULO de como conectar uma tendência atual ao tema do negócio — a trend real é buscada na hora de desenvolver.',
    '- Ritmo realista de quem posta sozinho: prático de produzir.',
    'Devolva SEMPRE no schema estruturado.',
  ].join('\n')
}

function blocoPilares(pilares: Pilar[]): string {
  const linhas = pilares.map((p, i) => {
    const fmt = p.formato === 'auto' ? 'formato à sua escolha' : `formato ${p.formato}`
    const trend = p.trend ? ' [TENDÊNCIA — trend=true]' : ''
    return `${i + 1}. ${p.nome} (${fmt})${trend}: ${p.descricao}`
  })
  return ['PILARES DE CONTEÚDO (linhas editoriais a seguir):', ...linhas].join('\n')
}

function mensagemUsuario(input: PlanoInput): string {
  const total = input.cadencia === 'mensal' ? input.postsPorSemana * 4 : input.postsPorSemana
  const janela = input.cadencia === 'mensal' ? 'as próximas 4 semanas (mês)' : 'a próxima semana'
  return [
    `Monte um plano de conteúdo ORGÂNICO com ${total} post(s) no total, distribuídos em ${janela}.`,
    input.cadencia === 'mensal' ? `São ~${input.postsPorSemana} post(s) por semana. Prefixe o "dia" com a semana (ex.: "Semana 1 · Segunda").` : `São ${input.postsPorSemana} post(s) na semana.`,
    '',
    blocoPilares(input.pilares),
    '',
    input.produto ? `Foco no produto: ${input.produto.nome} (veja "PRODUTO EM FOCO").` : 'Sem produto específico — conteúdo geral da escola/marca.',
    input.foco && input.foco.trim() ? `Tema/campanha do período: ${input.foco.trim()}.` : '',
    '',
    'Distribua os pilares em rodízio ao longo do período, respeitando o formato de cada um. Comece forte.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Gera a grade de orgânico seguindo os pilares. Não desenvolve as peças. */
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
    max_tokens: 8000,
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
