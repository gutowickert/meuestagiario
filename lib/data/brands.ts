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

/** Campos editáveis da marca (portão de evolução deliberada — CLAUDE.md §12). */
export interface BrandPatch {
  nome?: string
  nicho?: string | null
  oferta?: string | null
  publico?: string | null
  tom?: string | null
  metodo?: string | null
  provas?: unknown[]
  objecoes?: unknown[]
  tokens_visuais?: VisualTokens
  regras_design?: Record<string, unknown>
}

/** Colunas que o PATCH aceita — evita gravar campo não previsto (ex.: id, timestamps). */
const CAMPOS_EDITAVEIS: (keyof BrandPatch)[] = [
  'nome', 'nicho', 'oferta', 'publico', 'tom', 'metodo',
  'provas', 'objecoes', 'tokens_visuais', 'regras_design',
]

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

/** Atualiza campos editáveis da marca (só o whitelisted). Devolve a marca atualizada. */
export async function atualizarBrand(id: string, patch: BrandPatch): Promise<Brand> {
  const supabase = getSupabaseAdmin()
  const update: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITAVEIS) {
    if (patch[campo] !== undefined) update[campo] = patch[campo]
  }
  if (Object.keys(update).length === 0) return getBrand(id)

  const { data, error } = await supabase
    .schema('estagiario')
    .from('brands')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`atualizarBrand(${id}) falhou: ${error.message}`)
  return data as Brand
}
