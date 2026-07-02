// =============================================================
// Importar por print (VISAO §12 / onboarding): lê SCREENSHOTS do site do negócio
// com visão (Claude) e extrai o contexto (marca + produtos) — mesma proposta do
// onboarding, revisável antes de salvar. Ideal p/ sites que bloqueiam scraping/SPA.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import { PROPOSTA_SCHEMA, type PropostaOnboarding } from './onboarding'

function contextoAtual(brand: Brand, produtos: Produto[]): string {
  return [
    'CONTEXTO ATUAL (faça merge; não apague o que já existe sem motivo; case produtos por CÓDIGO):',
    JSON.stringify(
      {
        marca: { nome: brand.nome, nicho: brand.nicho, oferta: brand.oferta, publico: brand.publico, tom: brand.tom, metodo: brand.metodo },
        produtos: produtos.map((p) => ({ codigo: p.codigo, nome: p.nome, oferta: p.oferta })),
      },
      null,
      2,
    ),
  ].join('\n')
}

function instrucao(): string {
  return [
    'Você extrai o contexto de um negócio a partir de SCREENSHOTS do site/páginas dele.',
    'REGRAS:',
    '- Baseie-se SÓ no que está VISÍVEL nas imagens + no contexto atual. NÃO invente nada.',
    '- Capte a OFERTA de cada produto/curso com o máximo de detalhe que aparecer (o que entrega, duração, formato, benefícios, provas, condições).',
    '- Para produtos: case pelo CÓDIGO/nome com os existentes e ENRIQUEÇA; se aparecer um produto novo, crie (código curto se der).',
    '- Marca: refine tom, público, provas e objeções com o que os prints mostram. Escreva na voz do próprio negócio (pt-BR).',
    '- No "resumo", diga o que capturou e o que ficou ilegível/faltando (pra pedir outro print).',
    'Devolva SEMPRE no schema estruturado.',
  ].join('\n')
}

/** Extrai marca + produtos a partir de URLs de imagens (prints). Não grava. */
export async function extrairDoPrint(
  imagens: string[],
  brand: Brand,
  produtos: Produto[],
): Promise<PropostaOnboarding> {
  if (imagens.length === 0) throw new Error('Envie ao menos um print.')
  const anthropic = getAnthropic()

  const content = [
    ...imagens.map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } })),
    { type: 'text' as const, text: 'Estes são prints do site do negócio. Extraia marca + produtos no schema pedido.' },
  ]

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: instrucao() },
      { type: 'text', text: contextoAtual(brand, produtos) },
    ],
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema: PROPOSTA_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O modelo não retornou conteúdo (possível refusal).')
  }
  return JSON.parse(textBlock.text) as PropostaOnboarding
}
