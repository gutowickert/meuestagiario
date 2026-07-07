// =============================================================
// Performance / atribuição (CLAUDE.md §5). LEITURA das tabelas do CRM (public.*)
// — NUNCA escreve nelas. O elo é o content_id da peça = utm_content do anúncio:
//   estagiario.content_pieces.content_id
//     → public.wa_clicks.utm_content  (cliques no /wa)
//     → public.leads.utm_content      (etapa, valor_venda, matricula_id)
//     → public.matriculas.valor_pago  (receita real)
// Atribuição last-touch: a peça que trouxe o lead leva o crédito.
// =============================================================
import { getSupabaseAdmin } from './client'

export interface PerfPeca {
  content_id: string
  tipo: string
  cidade: string | null
  produto_id: string | null
  atributos: Record<string, string>
  criado_em: string
  cliques: number
  leads: number
  matriculas: number
  receita: number
}

// Divide um array em lotes (pra .in() não estourar com muitos ids).
function lotes<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

/** Performance por peça (funil: cliques → leads → matrículas → receita). */
export async function getPerformancePorPeca(brandId: string): Promise<PerfPeca[]> {
  const sb = getSupabaseAdmin()

  // 1. Peças da marca (schema estagiario).
  const { data: pecas, error: e1 } = await sb
    .schema('estagiario')
    .from('content_pieces')
    .select('content_id, tipo, cidade, produto_id, atributos, criado_em')
    .eq('brand_id', brandId)
    .order('criado_em', { ascending: false })
  if (e1) throw new Error(`getPerformancePorPeca (peças) falhou: ${e1.message}`)

  const linhas = (pecas ?? []) as {
    content_id: string
    tipo: string
    cidade: string | null
    produto_id: string | null
    atributos: Record<string, string>
    criado_em: string
  }[]
  const ids = [...new Set(linhas.map((p) => p.content_id).filter(Boolean))]
  if (ids.length === 0) return []

  // 2. Cliques por utm_content (public.wa_clicks — leitura).
  const cliquesPor = new Map<string, number>()
  for (const lote of lotes(ids, 300)) {
    const { data } = await sb.from('wa_clicks').select('utm_content').in('utm_content', lote)
    for (const r of (data ?? []) as { utm_content: string | null }[]) {
      if (r.utm_content) cliquesPor.set(r.utm_content, (cliquesPor.get(r.utm_content) ?? 0) + 1)
    }
  }

  // 3. Leads por utm_content (public.leads — leitura). Guarda matrícula p/ receita.
  const leadsPor = new Map<string, number>()
  const matriculasPor = new Map<string, number>()
  const matIdsPorContent = new Map<string, string[]>() // content_id -> matricula_ids
  for (const lote of lotes(ids, 300)) {
    const { data } = await sb.from('leads').select('utm_content, matricula_id').in('utm_content', lote)
    for (const r of (data ?? []) as { utm_content: string | null; matricula_id: string | null }[]) {
      if (!r.utm_content) continue
      leadsPor.set(r.utm_content, (leadsPor.get(r.utm_content) ?? 0) + 1)
      if (r.matricula_id) {
        matriculasPor.set(r.utm_content, (matriculasPor.get(r.utm_content) ?? 0) + 1)
        const l = matIdsPorContent.get(r.utm_content) ?? []
        l.push(r.matricula_id)
        matIdsPorContent.set(r.utm_content, l)
      }
    }
  }

  // 4. Receita real: valor_pago das matrículas atribuídas (public.matriculas — leitura).
  const todosMatIds = [...new Set([...matIdsPorContent.values()].flat())]
  const valorPorMat = new Map<string, number>()
  for (const lote of lotes(todosMatIds, 300)) {
    if (lote.length === 0) continue
    const { data } = await sb.from('matriculas').select('id, valor_pago').in('id', lote)
    for (const r of (data ?? []) as { id: string; valor_pago: number | string | null }[]) {
      valorPorMat.set(r.id, Number(r.valor_pago) || 0)
    }
  }

  return linhas.map((p) => {
    const receita = (matIdsPorContent.get(p.content_id) ?? []).reduce((s, mid) => s + (valorPorMat.get(mid) ?? 0), 0)
    return {
      content_id: p.content_id,
      tipo: p.tipo,
      cidade: p.cidade,
      produto_id: p.produto_id,
      atributos: p.atributos ?? {},
      criado_em: p.criado_em,
      cliques: cliquesPor.get(p.content_id) ?? 0,
      leads: leadsPor.get(p.content_id) ?? 0,
      matriculas: matriculasPor.get(p.content_id) ?? 0,
      receita,
    }
  })
}
