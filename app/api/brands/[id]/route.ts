// GET/PATCH /api/brands/[id] — leitura e edição do perfil da marca (editor de contexto).
// Escrita passa pelo adapter (atualizarBrand faz o whitelist dos campos).
import { getBrand, atualizarBrand, type BrandPatch } from '@/lib/data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const brand = await getBrand(id)
    return Response.json(brand)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const brand = await atualizarBrand(id, body as BrandPatch)
    return Response.json(brand)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[PATCH /api/brands] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
