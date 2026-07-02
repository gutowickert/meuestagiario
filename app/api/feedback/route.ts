// POST /api/feedback — o portão de aprovação (VISAO §11 b, CLAUDE.md §12).
//   { piece_id, acao: 'aprovar', brand_id, tipo?, atributos?, nota? }  -> memória viva
//   { piece_id, acao: 'rejeitar', motivo? }                            -> sinal negativo
import { aprovarPeca, rejeitarPeca } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { piece_id, acao, brand_id, tipo, atributos, nota, motivo } = body as {
      piece_id?: string
      acao?: string
      brand_id?: string
      tipo?: string
      atributos?: unknown
      nota?: string
      motivo?: string
    }
    if (!piece_id) {
      return Response.json({ error: 'piece_id é obrigatório.' }, { status: 400 })
    }

    if (acao === 'aprovar') {
      if (!brand_id) {
        return Response.json({ error: 'brand_id é obrigatório para aprovar.' }, { status: 400 })
      }
      await aprovarPeca({ content_piece_id: piece_id, brand_id, tipo, atributos, nota_curadoria: nota })
      return Response.json({ ok: true, status: 'aprovado' })
    }
    if (acao === 'rejeitar') {
      await rejeitarPeca(piece_id, motivo)
      return Response.json({ ok: true, status: 'rejeitado' })
    }
    return Response.json({ error: 'acao inválida. Use "aprovar" ou "rejeitar".' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/feedback] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
