// /api/midias — repositório de material bruto por praça (produto × cidade).
//   GET    ?brand_id[&produto&cidade&tipo]  -> lista
//   POST   { brand_id, produto, cidade, tipo, url, mime?, nota? } -> registra (já subido no Storage)
//   DELETE ?id=...                          -> remove o registro
import { inserirMidia, listarMidias, deletarMidia } from '@/lib/data'

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams
    const brandId = p.get('brand_id')
    if (!brandId) return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    const tipo = p.get('tipo')
    const midias = await listarMidias(brandId, {
      produto: p.get('produto'),
      cidade: p.get('cidade'),
      tipo: tipo === 'foto' || tipo === 'video' ? tipo : undefined,
    })
    return Response.json({ midias })
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
    const { brand_id, produto, cidade, tipo, url, mime, nota } = body as Record<string, unknown>
    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (typeof url !== 'string' || !url) {
      return Response.json({ error: 'url é obrigatório (suba o arquivo antes).' }, { status: 400 })
    }
    const t = tipo === 'video' ? 'video' : 'foto'
    const midia = await inserirMidia({
      brand_id,
      produto: typeof produto === 'string' ? produto : null,
      cidade: typeof cidade === 'string' ? cidade : null,
      tipo: t,
      url,
      mime: typeof mime === 'string' ? mime : null,
      nota: typeof nota === 'string' ? nota : null,
    })
    return Response.json({ midia })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'id é obrigatório.' }, { status: 400 })
    await deletarMidia(id)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
