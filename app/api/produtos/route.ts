// /api/produtos — CRUD de produtos de uma marca (editor de contexto).
//   GET    ?brand_id=...            → lista os produtos da marca
//   POST   { brand_id, nome, ... }  → cria (sem id) ou atualiza (com id)
//   DELETE ?id=...                  → remove o produto
import { listarProdutos, upsertProduto, deletarProduto, type ProdutoUpsert } from '@/lib/data'

export async function GET(request: Request) {
  try {
    const brandId = new URL(request.url).searchParams.get('brand_id')
    if (!brandId) {
      return Response.json({ error: 'brand_id é obrigatório (query).' }, { status: 400 })
    }
    const produtos = await listarProdutos(brandId)
    return Response.json({ produtos })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const input = body as Partial<ProdutoUpsert>
    if (!input.brand_id || typeof input.brand_id !== 'string') {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (!input.nome || typeof input.nome !== 'string' || !input.nome.trim()) {
      return Response.json({ error: 'nome é obrigatório.' }, { status: 400 })
    }
    const produto = await upsertProduto(input as ProdutoUpsert)
    return Response.json(produto)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[POST /api/produtos] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return Response.json({ error: 'id é obrigatório (query).' }, { status: 400 })
    }
    await deletarProduto(id)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[DELETE /api/produtos] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
