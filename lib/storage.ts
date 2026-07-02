// =============================================================
// Upload de assets no Storage do Supabase (bucket estagiario-media).
// Usa o client service_role (bypassa RLS). Retorna a URL pública.
// >>> O bucket precisa ser público pra URL resolver (o Meta busca a imagem). <<<
// =============================================================
import { getSupabaseAdmin } from './data/client'

const BUCKET = 'estagiario-media'

/** Sobe um arquivo com o content-type informado e devolve a URL pública. */
export async function subirArquivo(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (error) {
    throw new Error(`Falha ao subir "${path}" no Storage: ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Sobe um PNG e devolve a URL pública. */
export async function subirImagem(path: string, buffer: Buffer): Promise<string> {
  return subirArquivo(path, buffer, 'image/png')
}
