// GET /api/performance?brand_id=... — o loop de atribuição (CLAUDE.md §5).
// Lê o CRM (só leitura) e devolve o funil por peça: cliques → leads → matrículas
// → receita, ligado pelo content_id (= utm_content do anúncio).
import { getPerformancePorPeca } from '@/lib/data'

export async function GET(request: Request) {
  try {
    const brandId = new URL(request.url).searchParams.get('brand_id')
    if (!brandId) {
      return Response.json({ error: 'brand_id é obrigatório (query).' }, { status: 400 })
    }
    const pecas = await getPerformancePorPeca(brandId)
    return Response.json({ pecas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/performance] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
