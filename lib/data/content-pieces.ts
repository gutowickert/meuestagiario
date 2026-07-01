// =============================================================
// Adapter de content_pieces — grava cada peça gerada (CLAUDE.md seção 5).
// =============================================================
import { getSupabaseAdmin } from './client'

export interface ContentPieceInsert {
  content_id: string
  brand_id: string
  produto_id?: string | null
  turma_id?: string | null
  cidade?: string | null
  tipo: string
  spec: unknown
  atributos: unknown
  assets: unknown
  status?: string
}

/** Insere uma peça e devolve o id gerado. */
export async function inserirContentPiece(row: ContentPieceInsert): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('content_pieces')
    .insert({ ...row, status: row.status ?? 'rascunho' })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Falha ao gravar content_piece (${row.content_id}): ${error.message}`)
  }
  return data.id as string
}
