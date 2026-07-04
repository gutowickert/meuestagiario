// POST /api/turmas/parse — lê a lista crua de turmas e devolve linhas estruturadas
// (código, produto, cidade, datas, briefing pronto). Não gera nada: só entende a
// lista pra o front disparar os anúncios depois (3 ângulos por turma).
import { getBrand, listarProdutos, resolverProduto } from '@/lib/data'
import { lerTurmas } from '@/lib/turmas'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, texto } = body as Record<string, unknown>

    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (typeof texto !== 'string' || !texto.trim()) {
      return Response.json({ error: 'texto (a lista de turmas) é obrigatório.' }, { status: 400 })
    }

    const [brand, produtos] = await Promise.all([getBrand(brand_id), listarProdutos(brand_id)])
    const turmas = await lerTurmas(brand, produtos, texto)

    // Resolve o produto_id (UUID) de cada turma pelo código, pra o front já
    // linkar o contexto certo e sinalizar quando o produto não bate com nenhum cadastrado.
    const enriquecidas = await Promise.all(
      turmas.map(async (t) => {
        const p = t.produto_codigo ? await resolverProduto(brand_id, t.produto_codigo) : null
        return { ...t, produto_id: p?.id ?? null, produto_reconhecido: !!p }
      }),
    )

    return Response.json({ turmas: enriquecidas })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
