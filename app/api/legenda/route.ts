// POST /api/legenda — opções de legenda sem re-render (VISAO §11 a).
// Recebe o contexto da peça e devolve 3 legendas alternativas pra escolher.
import { getBrand, resolverProduto } from '@/lib/data'
import { gerarLegendas } from '@/lib/copy'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, produto_id, atributos, legenda_atual, cta_objetivo } = body as {
      brand_id?: string
      produto_id?: string
      atributos?: Record<string, string>
      legenda_atual?: string
      cta_objetivo?: string
    }
    if (!brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }

    const brand = await getBrand(brand_id)
    const produto = produto_id ? await resolverProduto(brand_id, produto_id) : null
    const legendas = await gerarLegendas(brand, produto, {
      atributos,
      legendaAtual: legenda_atual,
      ctaObjetivo: cta_objetivo ?? null,
    })
    return Response.json({ legendas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/legenda] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
