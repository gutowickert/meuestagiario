// =============================================================
// Opções de copy sem re-render (VISAO §11 a): gera variações de LEGENDA (caption)
// pra o usuário escolher/trocar — texto é barato, pixel não. Não toca na imagem.
// =============================================================
import { getAnthropic, MODEL_CONVERSA } from './anthropic'
import type { Brand, Produto } from './data'
import { CTA_INSTRUCAO } from './generate'

const SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    legendas: {
      type: 'array',
      description: '3 opções de legenda, distintas entre si.',
      items: { type: 'string' },
    },
  },
  required: ['legendas'],
}

export interface ContextoCopy {
  atributos?: Record<string, string> // angulo, gancho, cta, oferta...
  legendaAtual?: string
  ctaObjetivo?: string | null
}

/** Gera 3 legendas alternativas no tom da marca, mesma oferta/CTA. */
export async function gerarLegendas(
  brand: Brand,
  produto: Produto | null,
  ctx: ContextoCopy,
): Promise<string[]> {
  const anthropic = getAnthropic()

  const sistema = [
    `Você é o copywriter da marca "${brand.nome}". Tom: ${brand.tom ?? '—'}. Público: ${brand.publico ?? '—'}.`,
    produto ? `Produto: ${produto.nome}. Oferta: ${produto.oferta ?? '—'}.` : '',
    'Gere 3 opções de LEGENDA (caption de Instagram) para a MESMA peça, DISTINTAS entre si:',
    '1) curta e punchy; 2) média com storytelling; 3) direta com prova + oferta.',
    'Todas no tom da marca, em pt-BR, mesma oferta e mesmo CTA. NÃO invente métricas nem provas — use só o contexto.',
    ctx.ctaObjetivo ? `O CTA deve levar a pessoa a ${CTA_INSTRUCAO[ctx.ctaObjetivo] ?? ctx.ctaObjetivo}.` : '',
    'Cada legenda pode ter quebras de linha e no fim o CTA. Devolva no schema.',
  ]
    .filter(Boolean)
    .join('\n')

  const usuario = [
    'CONTEXTO DA PEÇA:',
    ctx.atributos ? JSON.stringify(ctx.atributos, null, 2) : '(sem atributos)',
    '',
    'LEGENDA ATUAL (referência — faça diferente e melhor):',
    ctx.legendaAtual || '(vazia)',
  ].join('\n')

  const message = await anthropic.messages.create({
    model: MODEL_CONVERSA,
    max_tokens: 2000,
    system: [{ type: 'text', text: sistema }],
    messages: [{ role: 'user', content: usuario }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O agente não retornou conteúdo (possível refusal).')
  }
  const data = JSON.parse(textBlock.text) as { legendas: string[] }
  return (data.legendas ?? []).filter((l) => l && l.trim()).slice(0, 3)
}
