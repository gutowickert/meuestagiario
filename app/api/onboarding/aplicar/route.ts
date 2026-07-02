// POST /api/onboarding/aplicar — grava a proposta revisada (marca + produtos).
// Chamado só depois do "Aplicar" na UI (revisão humana feita). Produtos casam por código.
import {
  atualizarBrand,
  listarProdutos,
  upsertProduto,
  type BrandPatch,
  type ProdutoUpsert,
} from '@/lib/data'
import type { MarcaProposta, ProdutoProposto } from '@/lib/onboarding'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, marca, produtos } = body as {
      brand_id?: string
      marca?: MarcaProposta
      produtos?: ProdutoProposto[]
    }
    if (!brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }

    // 1. Marca (só o whitelist do adapter é aplicado)
    if (marca) {
      const patch: BrandPatch = {
        nome: marca.nome || undefined,
        nicho: marca.nicho,
        oferta: marca.oferta,
        publico: marca.publico,
        tom: marca.tom,
        metodo: marca.metodo,
        provas: marca.provas,
        objecoes: marca.objecoes,
      }
      await atualizarBrand(brand_id, patch)
    }

    // 2. Produtos — casa por código com os existentes (refina em vez de duplicar).
    let criados = 0
    let atualizados = 0
    if (Array.isArray(produtos) && produtos.length > 0) {
      const existentes = await listarProdutos(brand_id)
      const porCodigo = new Map(
        existentes.filter((p) => p.codigo).map((p) => [p.codigo as string, p.id]),
      )
      for (const p of produtos) {
        if (!p.nome?.trim()) continue
        const codigo = p.codigo?.trim() || null
        const idExistente = codigo ? porCodigo.get(codigo) : undefined
        const input: ProdutoUpsert = {
          id: idExistente,
          brand_id,
          codigo,
          nome: p.nome,
          metodo: p.metodo,
          oferta: p.oferta,
          publico: p.publico,
          meta: p.meta,
          provas: p.provas,
          objecoes: p.objecoes,
        }
        await upsertProduto(input)
        if (idExistente) atualizados++
        else criados++
      }
    }

    return Response.json({ ok: true, produtos_criados: criados, produtos_atualizados: atualizados })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/onboarding/aplicar] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
