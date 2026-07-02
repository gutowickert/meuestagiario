// POST /api/onboarding/estruturar — transcrição da entrevista -> proposta de contexto.
// NÃO grava nada: devolve a proposta pra revisão humana (portão de aprovação).
import { getBrand, listarProdutos } from '@/lib/data'
import { estruturarOnboarding } from '@/lib/onboarding'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, transcricao } = body as Record<string, unknown>
    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (typeof transcricao !== 'string' || !transcricao.trim()) {
      return Response.json({ error: 'transcricao é obrigatória.' }, { status: 400 })
    }

    const [brand, produtos] = await Promise.all([getBrand(brand_id), listarProdutos(brand_id)])
    const proposta = await estruturarOnboarding(brand, produtos, transcricao)
    return Response.json(proposta)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/onboarding/estruturar] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
