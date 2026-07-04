// Upload de mídia pro repositório (client). Foto é redimensionada; o arquivo sobe
// DIRETO no Storage via URL assinada (não passa pelo body da função — vídeo é grande),
// e depois registra a mídia na praça (produto+cidade).
import { resizeImage } from './resize-image'

export interface MidiaSalva {
  id: string
  produto: string | null
  cidade: string | null
  tipo: 'foto' | 'video'
  url: string
  mime: string | null
  nota: string | null
  criado_em: string
}

export async function subirMidia(params: {
  brandId: string
  produto: string | null
  cidade: string | null
  tipo: 'foto' | 'video'
  file: File
}): Promise<MidiaSalva> {
  let corpo: Blob = params.file
  let mime = params.file.type || (params.tipo === 'video' ? 'video/mp4' : 'image/jpeg')
  if (params.tipo === 'foto') {
    corpo = await resizeImage(params.file, 1920)
    mime = corpo.type || 'image/jpeg'
  }

  // 1. Assina o upload
  const s = await fetch('/api/midias/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mime }),
  })
  const sd = await s.json()
  if (!s.ok) throw new Error(sd.error || 'Falha ao assinar o upload.')

  // 2. Sobe direto no Storage
  const put = await fetch(sd.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: corpo })
  if (!put.ok) throw new Error(`Falha ao subir o arquivo (${put.status}).`)

  // 3. Registra a mídia na praça
  const r = await fetch('/api/midias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: params.brandId,
      produto: params.produto,
      cidade: params.cidade,
      tipo: params.tipo,
      url: sd.publicUrl,
      mime,
    }),
  })
  const rd = await r.json()
  if (!r.ok) throw new Error(rd.error || 'Falha ao registrar a mídia.')
  return rd.midia as MidiaSalva
}
