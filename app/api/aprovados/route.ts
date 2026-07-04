// GET /api/aprovados?brand_id=... — a gaveta de peças aprovadas (biblioteca).
import { listarPecasAprovadas } from '@/lib/data'

export async function GET(request: Request) {
  try {
    const brandId = new URL(request.url).searchParams.get('brand_id')
    if (!brandId) {
      return Response.json({ error: 'brand_id é obrigatório (query).' }, { status: 400 })
    }
    const pecas = await listarPecasAprovadas(brandId)
    return Response.json({ pecas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
