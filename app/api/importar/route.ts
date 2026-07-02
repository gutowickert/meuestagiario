// POST /api/importar — lê prints (URLs de imagem) e devolve a proposta de contexto.
// Não grava: usa o mesmo /api/onboarding/aplicar depois da revisão.
import { getBrand, listarProdutos } from '@/lib/data'
import { extrairDoPrint } from '@/lib/importar'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, imagens } = body as { brand_id?: string; imagens?: string[] }
    if (!brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    const urls = Array.isArray(imagens) ? imagens.filter((u) => typeof u === 'string' && u) : []
    if (urls.length === 0) {
      return Response.json({ error: 'Envie ao menos um print (imagens).' }, { status: 400 })
    }

    const [brand, produtos] = await Promise.all([getBrand(brand_id), listarProdutos(brand_id)])
    const proposta = await extrairDoPrint(urls, brand, produtos)
    return Response.json(proposta)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/importar] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
