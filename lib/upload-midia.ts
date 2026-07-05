// Upload de mídia pro repositório (client).
//  - FOTO: converte HEIC->JPEG, redimensiona e sobe pela rota same-origin /api/upload
//    (confiável; a foto resa fica bem abaixo do limite de body).
//  - VÍDEO: sobe DIRETO no Storage via URL assinada (é grande demais pro body da função).
// Depois registra a mídia na praça (produto+cidade).
import { prepararImagem } from './prepara-imagem'

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

async function subirFotoServidor(blob: Blob, mime: string): Promise<string> {
  const resp = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': mime }, body: blob })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || 'Falha ao subir a foto.')
  return data.url as string
}

async function subirVideoAssinado(file: File): Promise<string> {
  const mime = file.type || 'video/mp4'
  const s = await fetch('/api/midias/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mime }),
  })
  const sd = await s.json()
  if (!s.ok) throw new Error(sd.error || 'Falha ao assinar o upload do vídeo.')
  const put = await fetch(sd.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: file })
  if (!put.ok) throw new Error(`Falha ao subir o vídeo no Storage (${put.status}).`)
  return sd.publicUrl as string
}

async function registrar(params: {
  brandId: string
  produto: string | null
  cidade: string | null
  tipo: 'foto' | 'video'
  url: string
  mime: string
}): Promise<MidiaSalva> {
  const r = await fetch('/api/midias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: params.brandId,
      produto: params.produto,
      cidade: params.cidade,
      tipo: params.tipo,
      url: params.url,
      mime: params.mime,
    }),
  })
  const rd = await r.json()
  if (!r.ok) throw new Error(rd.error || 'Falha ao registrar a mídia.')
  return rd.midia as MidiaSalva
}

export async function subirMidia(params: {
  brandId: string
  produto: string | null
  cidade: string | null
  tipo: 'foto' | 'video'
  file: File
}): Promise<MidiaSalva> {
  if (params.tipo === 'video') {
    const url = await subirVideoAssinado(params.file)
    return registrar({ ...params, url, mime: params.file.type || 'video/mp4' })
  }
  const { blob, mime } = await prepararImagem(params.file, 1920)
  const url = await subirFotoServidor(blob, mime)
  return registrar({ ...params, url, mime })
}
