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
  mostrar_preco: boolean
  etapa: string
}

export interface Decisao {
  acao: 'perguntar' | 'gerar'
  mensagem: string
  parametros: DecisaoParametros
}

const FORMATOS = ['feed_quadrado', 'feed_retrato', 'story']
const TIPOS = ['carrossel', 'anuncio_imagem']
const CTAS = ['whatsapp', 'direct', 'site', 'inscricao', 'perfil']
const ETAPAS = ['descoberta', 'aquecimento', 'remarketing']

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
        mostrar_preco: { type: 'boolean', description: 'Mostrar preço/valores na peça? Padrão false; true SÓ se o usuário pedir explicitamente.' },
        etapa: { type: 'string', description: `Etapa do funil: ${ETAPAS.join(', ')}. descoberta=frio/primeiro impacto, aquecimento=esquentar, remarketing=fechar.` },
      },
      required: ['produto_id', 'cidade', 'template', 'formato', 'tipo', 'cta_objetivo', 'briefing', 'mostrar_preco', 'etapa'],
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
    '- Decida SOZINHO a parte de CRIAÇÃO (você acerta): estilo/template, formato (padrão feed_quadrado), tipo (padrão carrossel), ângulo e composição.',
    '- Mas o que depende da INTENÇÃO/FUNIL do usuário você NÃO adivinha — PERGUNTE se não foi dito, porque errar isso gera retrabalho:',
    '  • OBJETIVO DO CTA (pra onde a chamada leva: whatsapp, direct, site, inscricao ou perfil). Se o pedido não deixar claro, PERGUNTE. NUNCA assuma WhatsApp por padrão.',
    '  • ETAPA DO FUNIL (descoberta = público frio/primeiro impacto; aquecimento = esquentar quem já viu; remarketing = fechar quem já engajou). Muda toda a copy. Se o pedido não deixar claro, PERGUNTE. Na dúvida entre gerar cedo, "descoberta" é o padrão mais seguro — mas confirme se der.',
    '  • Qual PRODUTO, se houver vários e o pedido não deixar claro.',
    '  • A CIDADE/turma, se for peça de turma específica e não foi dita.',
    '- Junte o que faltar numa pergunta só, objetiva (ex.: "É pra qual produto e o CTA leva pra onde — WhatsApp, site ou inscrição?"). Não pergunte o que já dá pra decidir sozinho (estilo, formato…).',
    '- Quando acao="gerar", só preencha cta_objetivo com um valor que o usuário deixou claro (direta ou indiretamente). Se não deixou, use acao="perguntar".',
    '- PREÇO: por padrão NÃO mostre preço (mostrar_preco=false). Só marque true se o usuário pedir explicitamente pra mostrar valores/preço.',
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
