// POST /api/planejar — a grade de orgânico (semanal/mensal) seguindo os pilares.
// Não desenvolve as peças. Abastecida por marca + método + voz do cliente (Camada 3).
import { getBrand, resolverProduto, getDossieCliente } from '@/lib/data'
import { gerarPlano, type PlanoInput, type Pilar, type Cadencia } from '@/lib/planejador'

export const maxDuration = 120

const FORMATOS = ['reel', 'carrossel', 'imagem', 'auto']

function sanitizarPilares(raw: unknown): Pilar[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      nome: typeof p.nome === 'string' ? p.nome : '',
      descricao: typeof p.descricao === 'string' ? p.descricao : '',
      formato: (FORMATOS.includes(p.formato as string) ? p.formato : 'auto') as Pilar['formato'],
      trend: p.trend === true,
    }))
    .filter((p) => p.nome.trim())
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, produto_id, foco, cadencia, posts_por_semana, pilares } = body as Record<string, unknown>
    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }

    const pilaresLimpos = sanitizarPilares(pilares)
    if (pilaresLimpos.length === 0) {
      return Response.json({ error: 'Defina ao menos um pilar de conteúdo.' }, { status: 400 })
    }

    const brand = await getBrand(brand_id)
    const produtoRef = typeof produto_id === 'string' && produto_id ? produto_id : null
    const produto = produtoRef ? await resolverProduto(brand_id, produtoRef) : null
    const inteligencia = produto ? await getDossieCliente(produto.nome, null) : null

    const cad: Cadencia = cadencia === 'mensal' ? 'mensal' : 'semanal'
    const ppw = typeof posts_por_semana === 'number' && posts_por_semana > 0 ? Math.min(Math.round(posts_por_semana), 7) : 3

    const input: PlanoInput = {
      produto,
      inteligencia,
      cadencia: cad,
      postsPorSemana: ppw,
      pilares: pilaresLimpos,
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
