// POST /api/chat — o agente conversacional decide (VISAO §12).
// Recebe a conversa + quantas fotos foram anexadas, carrega o contexto da marca
// e devolve uma Decisão: perguntar (falta info) OU gerar (com os parâmetros).
// Não gera a peça — a tela chama /api/generate quando a decisão é "gerar".
import { getBrand, listarProdutos } from '@/lib/data'
import { decidir, type MensagemChat } from '@/lib/agente'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, mensagens, num_fotos } = body as {
      brand_id?: string
      mensagens?: MensagemChat[]
      num_fotos?: number
    }
    if (!brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return Response.json({ error: 'mensagens é obrigatório.' }, { status: 400 })
    }

    const [brand, produtos] = await Promise.all([getBrand(brand_id), listarProdutos(brand_id)])
    const decisao = await decidir(brand, produtos, mensagens, typeof num_fotos === 'number' ? num_fotos : 0)
    return Response.json(decisao)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/chat] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
