// POST /api/planejar — a grade semanal de orgânico (não desenvolve as peças).
// Abastecida por marca + método + voz do cliente (Camada 3) do produto em foco.
import { getBrand, resolverProduto, getDossieCliente } from '@/lib/data'
import { gerarPlano, type PlanoInput } from '@/lib/planejador'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, produto_id, foco, qtd_posts } = body as Record<string, unknown>
    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }

    const brand = await getBrand(brand_id)
    const produtoRef = typeof produto_id === 'string' && produto_id ? produto_id : null
    const produto = produtoRef ? await resolverProduto(brand_id, produtoRef) : null
    // Dossiê geral do produto (sem cidade) — orgânico é nível marca/produto.
    const inteligencia = produto ? await getDossieCliente(produto.nome, null) : null

    const qtd = typeof qtd_posts === 'number' && qtd_posts > 0 ? Math.min(Math.round(qtd_posts), 14) : 5

    const input: PlanoInput = {
      produto,
      inteligencia,
      qtdPosts: qtd,
      foco: typeof foco === 'string' ? foco : null,
    }
    const plano = await gerarPlano(brand, input)
    return Response.json({ plano, produto_id: produto?.id ?? null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/planejar] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
