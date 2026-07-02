// =============================================================
// Adapter de feedback — a memória viva (CLAUDE.md §12, VISAO §11 b).
// Aprovar: grava em approved_examples + marca a peça. Rejeitar: sinal negativo.
// Listar aprovados: alimenta o few-shot das próximas gerações.
// =============================================================
import { getSupabaseAdmin } from './client'

export interface AprovarInput {
  content_piece_id: string
  brand_id: string
  tipo?: string | null
  atributos?: unknown
  nota_curadoria?: string | null
}

/** Aprova uma peça: entra em approved_examples e a peça vira status 'aprovado'. */
export async function aprovarPeca(input: AprovarInput): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error: e1 } = await supabase
    .schema('estagiario')
    .from('approved_examples')
    .insert({
      brand_id: input.brand_id,
      content_piece_id: input.content_piece_id,
      tipo: input.tipo ?? null,
      atributos: input.atributos ?? {},
      nota_curadoria: input.nota_curadoria ?? null,
    })
  if (e1) throw new Error(`aprovarPeca falhou: ${e1.message}`)

  const { error: e2 } = await supabase
    .schema('estagiario')
    .from('content_pieces')
    .update({ status: 'aprovado' })
    .eq('id', input.content_piece_id)
  if (e2) throw new Error(`aprovarPeca (status) falhou: ${e2.message}`)
}

/** Rejeita uma peça: status 'rejeitado' + motivo (sinal de "não faça"). */
export async function rejeitarPeca(content_piece_id: string, motivo?: string | null): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .schema('estagiario')
    .from('content_pieces')
    .update({ status: 'rejeitado', motivo: motivo ?? null })
    .eq('id', content_piece_id)
  if (error) throw new Error(`rejeitarPeca falhou: ${error.message}`)
}

export interface ExemploAprovado {
  tipo: string | null
  gancho: string
  legenda: string
}

/** Lista os últimos aprovados da marca (gancho + legenda) pro few-shot. */
export async function listarAprovados(brandId: string, limite = 4): Promise<ExemploAprovado[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('approved_examples')
    .select('tipo, content_pieces(spec)')
    .eq('brand_id', brandId)
    .order('aprovado_em', { ascending: false })
    .limit(limite)

  if (error) throw new Error(`listarAprovados falhou: ${error.message}`)

  type Linha = { tipo: string | null; content_pieces: { spec: unknown } | null }
  return ((data ?? []) as unknown as Linha[])
    .map((row) => {
      const spec = (row.content_pieces?.spec ?? {}) as {
        legenda?: string
        slides?: { titulo?: string }[]
      }
      return {
        tipo: row.tipo,
        gancho: spec.slides?.[0]?.titulo ?? '',
        legenda: spec.legenda ?? '',
      }
    })
    .filter((e) => e.gancho || e.legenda)
}
