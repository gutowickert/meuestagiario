// =============================================================
// Adapter de produtos. Cada produto tem seu próprio contexto (método, oferta,
// provas, objeções) — base do anúncio (VISAO-PRODUTO.md §3). Todo acesso passa aqui.
// =============================================================
import { getSupabaseAdmin } from './client'

export interface Produto {
  id: string
  brand_id: string
  codigo: string | null
  nome: string
  metodo: string | null
  oferta: string | null
  publico: string | null
  provas: unknown[]
  objecoes: unknown[]
  meta: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Campos aceitos ao criar/editar um produto. `id` presente = update; ausente = insert. */
export interface ProdutoUpsert {
  id?: string
  brand_id: string
  codigo?: string | null
  nome: string
  metodo?: string | null
  oferta?: string | null
  publico?: string | null
  provas?: unknown[]
  objecoes?: unknown[]
  meta?: string | null
  ativo?: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Lista os produtos de uma marca (ativos primeiro, depois por código). */
export async function listarProdutos(brandId: string): Promise<Produto[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('produtos')
    .select('*')
    .eq('brand_id', brandId)
    .order('ativo', { ascending: false })
    .order('codigo', { ascending: true, nullsFirst: false })

  if (error) throw new Error(`listarProdutos(${brandId}) falhou: ${error.message}`)
  return (data ?? []) as Produto[]
}

/** Carrega um produto por id. Lança erro legível se não achar. */
export async function getProduto(id: string): Promise<Produto> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`getProduto(${id}) falhou: ${error.message}`)
  if (!data) throw new Error(`Produto não encontrado: ${id}`)
  return data as Produto
}

/** Busca um produto pelo código (ex.: 'ANL') dentro da marca. Null se não existir. */
export async function getProdutoPorCodigo(
  brandId: string,
  codigo: string,
): Promise<Produto | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('produtos')
    .select('*')
    .eq('brand_id', brandId)
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw new Error(`getProdutoPorCodigo(${brandId}, ${codigo}) falhou: ${error.message}`)
  return (data as Produto) ?? null
}

/**
 * Resolve uma referência de produto que pode ser o UUID (novo) ou o código legado
 * ('ANL'). Devolve null se nada casar — o motor segue sem o contexto de produto.
 */
export async function resolverProduto(
  brandId: string,
  ref: string,
): Promise<Produto | null> {
  if (!ref) return null
  try {
    if (UUID_RE.test(ref)) return await getProduto(ref)
    return await getProdutoPorCodigo(brandId, ref)
  } catch {
    return null
  }
}

/** Cria (sem id) ou atualiza (com id) um produto. Devolve a linha resultante. */
export async function upsertProduto(input: ProdutoUpsert): Promise<Produto> {
  const supabase = getSupabaseAdmin()
  const { id, ...campos } = input

  if (id) {
    const { data, error } = await supabase
      .schema('estagiario')
      .from('produtos')
      .update(campos)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(`upsertProduto(update ${id}) falhou: ${error.message}`)
    return data as Produto
  }

  const { data, error } = await supabase
    .schema('estagiario')
    .from('produtos')
    .insert(campos)
    .select('*')
    .single()
  if (error) throw new Error(`upsertProduto(insert) falhou: ${error.message}`)
  return data as Produto
}

/** Remove um produto. */
export async function deletarProduto(id: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .schema('estagiario')
    .from('produtos')
    .delete()
    .eq('id', id)
  if (error) throw new Error(`deletarProduto(${id}) falhou: ${error.message}`)
}
