// =============================================================
// Adapter do repositório de mídias (fotos/vídeos brutos por praça = produto×cidade).
// Material que a equipe sobe acompanhando a turma; abastece a geração daquela praça.
// =============================================================
import { getSupabaseAdmin } from './client'

export interface Midia {
  id: string
  brand_id: string
  produto: string | null // código do produto (ex.: 'ANL')
  cidade: string | null
  tipo: 'foto' | 'video'
  url: string
  mime: string | null
  nota: string | null
  criado_em: string
}

export interface MidiaInsert {
  brand_id: string
  produto?: string | null
  cidade?: string | null
  tipo: 'foto' | 'video'
  url: string
  mime?: string | null
  nota?: string | null
}

/** Registra uma mídia já subida no Storage. Devolve a linha criada. */
export async function inserirMidia(input: MidiaInsert): Promise<Midia> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('midias')
    .insert(input)
    .select('*')
    .single()
  if (error) throw new Error(`inserirMidia falhou: ${error.message}`)
  return data as Midia
}

/** Lista mídias da marca, opcionalmente filtrando por praça (produto+cidade) e tipo. */
export async function listarMidias(
  brandId: string,
  filtro?: { produto?: string | null; cidade?: string | null; tipo?: 'foto' | 'video' },
): Promise<Midia[]> {
  const supabase = getSupabaseAdmin()
  let q = supabase.schema('estagiario').from('midias').select('*').eq('brand_id', brandId)
  if (filtro?.produto) q = q.eq('produto', filtro.produto)
  if (filtro?.cidade) q = q.eq('cidade', filtro.cidade)
  if (filtro?.tipo) q = q.eq('tipo', filtro.tipo)
  const { data, error } = await q.order('criado_em', { ascending: false })
  if (error) throw new Error(`listarMidias falhou: ${error.message}`)
  return (data ?? []) as Midia[]
}

/** Remove uma mídia (só o registro; o arquivo no Storage é mantido). */
export async function deletarMidia(id: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.schema('estagiario').from('midias').delete().eq('id', id)
  if (error) throw new Error(`deletarMidia(${id}) falhou: ${error.message}`)
}
