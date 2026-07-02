// =============================================================
// Cérebro do onboarding (VISAO §3): o sistema pergunta, o usuário responde por
// áudio, a transcrição vira contexto estruturado (marca + produtos).
// Este módulo NÃO grava — devolve uma PROPOSTA pra revisão humana (portão §12).
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'

// Roteiro vive em módulo separado (sem imports de servidor) pra a UI reusar.
export { ROTEIRO, type PerguntaOnboarding } from './onboarding-roteiro'

// ---- Proposta estruturada (saída) ----
export interface ProvaProposta {
  tipo: string
  texto: string
}
export interface ObjecaoProposta {
  objecao: string
  resposta: string
}
export interface MarcaProposta {
  nome: string
  nicho: string
  oferta: string
  publico: string
  tom: string
  metodo: string
  provas: ProvaProposta[]
  objecoes: ObjecaoProposta[]
}
export interface ProdutoProposto {
  codigo: string
  nome: string
  metodo: string
  oferta: string
  publico: string
  meta: string
  provas: ProvaProposta[]
  objecoes: ObjecaoProposta[]
}
export interface PropostaOnboarding {
  marca: MarcaProposta
  produtos: ProdutoProposto[]
  resumo: string
}

// ---- Schema do structured output ----
// Restrições: todo objeto com additionalProperties:false + required; sem minItems.
const PROVAS_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: { tipo: { type: 'string' }, texto: { type: 'string' } },
    required: ['tipo', 'texto'],
  },
}
const OBJECOES_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: { objecao: { type: 'string' }, resposta: { type: 'string' } },
    required: ['objecao', 'resposta'],
  },
}

export const PROPOSTA_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    marca: {
      type: 'object',
      additionalProperties: false,
      properties: {
        nome: { type: 'string' },
        nicho: { type: 'string' },
        oferta: { type: 'string' },
        publico: { type: 'string' },
        tom: { type: 'string' },
        metodo: { type: 'string', description: 'Método/framework de marketing da marca (Camada 2).' },
        provas: PROVAS_SCHEMA,
        objecoes: OBJECOES_SCHEMA,
      },
      required: ['nome', 'nicho', 'oferta', 'publico', 'tom', 'metodo', 'provas', 'objecoes'],
    },
    produtos: {
      type: 'array',
      description: 'Um item por produto identificado na conversa.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          codigo: { type: 'string', description: 'Código curto p/ utm (ex.: ANL). Vazio se o usuário não deu.' },
          nome: { type: 'string' },
          metodo: { type: 'string', description: 'Método específico DESTE produto.' },
          oferta: { type: 'string' },
          publico: { type: 'string' },
          meta: { type: 'string' },
          provas: PROVAS_SCHEMA,
          objecoes: OBJECOES_SCHEMA,
        },
        required: ['codigo', 'nome', 'metodo', 'oferta', 'publico', 'meta', 'provas', 'objecoes'],
      },
    },
    resumo: {
      type: 'string',
      description: 'Resumo do que foi extraído e do que ficou faltando (perguntas a repetir).',
    },
  },
  required: ['marca', 'produtos', 'resumo'],
}

// ---- Composição do prompt ----
function contextoAtual(brand: Brand, produtos: Produto[]): string {
  return [
    'CONTEXTO ATUAL (merge, não apague o que já existe sem motivo):',
    JSON.stringify(
      {
        marca: {
          nome: brand.nome,
          nicho: brand.nicho,
          oferta: brand.oferta,
          publico: brand.publico,
          tom: brand.tom,
          metodo: brand.metodo,
          provas: brand.provas,
          objecoes: brand.objecoes,
        },
        produtos: produtos.map((p) => ({
          codigo: p.codigo,
          nome: p.nome,
          metodo: p.metodo,
          oferta: p.oferta,
          publico: p.publico,
          meta: p.meta,
        })),
      },
      null,
      2,
    ),
  ].join('\n')
}

function instrucao(): string {
  return [
    'Você organiza a entrevista de onboarding do MeuEstagiario em contexto estruturado de marca e produtos.',
    'REGRAS:',
    '- Baseie-se SÓ no que a pessoa falou na transcrição + no contexto atual. NÃO invente provas, números ou métodos.',
    '- Se algo não foi dito, mantenha o valor atual (ou deixe string vazia se não existir). Nunca fabrique.',
    '- Para produtos: case pelo CÓDIGO com os existentes; refine em vez de duplicar. Se o usuário citou um produto novo, crie.',
    '- Escreva na linguagem do próprio negócio (pt-BR, tom do dono).',
    '- No "resumo", diga o que ficou faltando ou vago, pra pessoa saber o que regravar.',
    'Devolva SEMPRE no schema estruturado.',
  ].join('\n')
}

/** Estrutura a transcrição da entrevista em uma proposta de contexto (não grava). */
export async function estruturarOnboarding(
  brand: Brand,
  produtos: Produto[],
  transcricao: string,
): Promise<PropostaOnboarding> {
  const anthropic = getAnthropic()

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: instrucao() },
      { type: 'text', text: contextoAtual(brand, produtos), cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: `TRANSCRIÇÃO DA ENTREVISTA (respostas por áudio, transcritas):\n\n${transcricao}`,
      },
    ],
    output_config: { format: { type: 'json_schema', schema: PROPOSTA_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O Claude não retornou conteúdo de texto (possível refusal).')
  }
  return JSON.parse(textBlock.text) as PropostaOnboarding
}
