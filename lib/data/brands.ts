// =============================================================
// Adapter de marca. Todo acesso a brands passa por aqui (seção 4 do CLAUDE.md).
// Para revenda futura, troca-se só este adapter (fonte do aluno), sem tocar no motor.
// =============================================================
import { getSupabaseAdmin } from './client'

/** Tokens visuais da marca — fonte única da verdade visual (lida pelos templates). */
export interface VisualTokens {
  cores?: Record<string, string> // ex.: { primaria: "#0F62FE", texto: "#111" }
  fontes?: Record<string, string> // ex.: { titulo: "Inter", corpo: "Inter" }
  logo?: string // URL no Storage
  espacamento?: Record<string, number | string>
  [key: string]: unknown
}

export interface Brand {
  id: string
  nome: string
  nicho: string | null
  oferta: string | null
  publico: string | null
  tom: string | null
  provas: unknown[]
  objecoes: unknown[]
  exemplos_vencedores: unknown[]
  tokens_visuais: VisualTokens
  regras_design: Record<string, unknown>
  metodo: string | null
  criado_em: string
  atualizado_em: string
}

/** Carrega o perfil completo da marca. Lança erro legível se não achar. */
export async function getBrand(id: string): Promise<Brand> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .schema('estagiario')
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`getBrand(${id}) falhou: ${error.message}`)
  }
  if (!data) {
    throw new Error(`Marca não encontrada: ${id}`)
  }
  return data as Brand
}
