// =============================================================
// Cérebro de decisão do agente conversacional (VISAO §12).
// Recebe o pedido em linguagem natural + o contexto e DECIDE os parâmetros da
// peça — ou PERGUNTA se faltar algo crítico. Não gera (o /api/generate faz isso).
// =============================================================
import { getAnthropic, MODEL_CONVERSA } from './anthropic'
import type { Brand, Produto } from './data'
import { CATALOGO, TEMPLATE_PADRAO_ID } from './templates/catalogo'

export interface MensagemChat {
  role: 'user' | 'assistant'
  content: string
}

export interface DecisaoParametros {
  produto_id: string
  cidade: string
  template: string
  formato: string
  tipo: string
  cta_objetivo: string
  briefing: string
}

export interface Decisao {
  acao: 'perguntar' | 'gerar'
  mensagem: string
  parametros: DecisaoParametros
}

const FORMATOS = ['feed_quadrado', 'feed_retrato', 'story']
const TIPOS = ['carrossel', 'anuncio_imagem']
const CTAS = ['whatsapp', 'direct', 'site', 'inscricao', 'perfil']

const DECISAO_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    acao: { type: 'string', enum: ['perguntar', 'gerar'] },
    mensagem: {
      type: 'string',
      description:
        'O que você diz ao usuário. Se acao=perguntar, a pergunta. Se acao=gerar, um aviso curto e amigável do que vai gerar.',
    },
    parametros: {
      type: 'object',
      additionalProperties: false,
      properties: {
        produto_id: { type: 'string', description: 'UUID do produto escolhido (da lista). "" se nenhum se aplica.' },
        cidade: { type: 'string', description: 'Cidade/turma alvo, se houver. "" se não.' },
        template: { type: 'string', description: `Id do estilo: ${CATALOGO.map((t) => t.id).join(', ')}.` },
        formato: { type: 'string', description: `Um de: ${FORMATOS.join(', ')}.` },
        tipo: { type: 'string', description: `Um de: ${TIPOS.join(', ')}.` },
        cta_objetivo: { type: 'string', description: `Um de: ${CTAS.join(', ')}.` },
        briefing: { type: 'string', description: 'O brief consolidado pro gerador: ângulo, foco e ideia, em pt-BR.' },
      },
      required: ['produto_id', 'cidade', 'template', 'formato', 'tipo', 'cta_objetivo', 'briefing'],
    },
  },
  required: ['acao', 'mensagem', 'parametros'],
}

function sistema(brand: Brand, produtos: Produto[], numFotos: number): string {
  const listaProdutos = produtos
    .map((p) => `- ${p.nome}${p.codigo ? ` (${p.codigo})` : ''} — id: ${p.id}${p.oferta ? ` — ${p.oferta}` : ''}`)
    .join('\n')
  const estilos = CATALOGO.map((t) => `- ${t.id}: ${t.descricao}`).join('\n')

  return [
    `Você é o MeuEstagiário, o coordenador de marketing conversacional da marca "${brand.nome}".`,
    `Marca: nicho=${brand.nicho ?? '—'}; público=${brand.publico ?? '—'}; tom=${brand.tom ?? '—'}.`,
    '',
    'PRODUTOS disponíveis (use o id no parametros.produto_id):',
    listaProdutos || '(nenhum produto cadastrado)',
    '',
    'ESTILOS de template disponíveis:',
    estilos,
    `Padrão quando em dúvida: "${TEMPLATE_PADRAO_ID}".`,
    '',
    `FOTOS já anexadas nesta conversa: ${numFotos}.`,
    '',
    'SEU TRABALHO: a partir do pedido do usuário + este contexto, DECIDIR os parâmetros da peça e gerar.',
    'REGRAS:',
    '- Seja decisivo. Escolha produto, estilo, formato, tipo e objetivo do CTA sozinho quando der pra inferir.',
    '- Formato padrão: feed_quadrado. Tipo padrão: carrossel. CTA padrão: whatsapp (a menos que o pedido indique outro).',
    '- Só use acao="perguntar" quando faltar algo CRÍTICO que você não tem como decidir: ex.: qual produto (se houver vários e o pedido não deixar claro), a cidade/turma (se for peça de turma específica), ou se a ideia estiver vaga demais. Faça UMA pergunta objetiva por vez.',
    '- NÃO peça foto obrigatoriamente: dá pra gerar sem (entra um placeholder). Só sugira foto se fizer muita diferença — e mesmo assim, prefira gerar.',
    '- Em acao="gerar", escreva no "briefing" um brief claro (ângulo/foco/ideia) e um "mensagem" curto do tipo "Fechou, gerando um carrossel de prova social pra imersão de Caxias, chamando pro WhatsApp.".',
    '- Fale como gente, pt-BR, próximo e direto (o tom da marca).',
    'Responda SEMPRE no schema estruturado.',
  ].join('\n')
}

/** Decide os parâmetros da peça a partir da conversa, ou formula uma pergunta. */
export async function decidir(
  brand: Brand,
  produtos: Produto[],
  mensagens: MensagemChat[],
  numFotos: number,
): Promise<Decisao> {
  const anthropic = getAnthropic()

  const message = await anthropic.messages.create({
    model: MODEL_CONVERSA,
    max_tokens: 2000,
    system: [{ type: 'text', text: sistema(brand, produtos, numFotos) }],
    messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
    output_config: { format: { type: 'json_schema', schema: DECISAO_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O agente não retornou conteúdo (possível refusal).')
  }
  return JSON.parse(textBlock.text) as Decisao
}
