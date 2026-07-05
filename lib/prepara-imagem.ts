// Prepara uma imagem no navegador pro upload: converte HEIC/HEIF do iPhone em JPEG
// (o navegador não decodifica HEIC) e depois redimensiona. Devolve sempre um JPEG.
import { resizeImage } from './resize-image'

function ehHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase()
  const n = (file.name || '').toLowerCase()
  return t.includes('heic') || t.includes('heif') || n.endsWith('.heic') || n.endsWith('.heif')
}

/** Converte HEIC->JPEG se preciso e redimensiona. Retorna { blob, mime }. */
export async function prepararImagem(file: File, maxDim = 1920): Promise<{ blob: Blob; mime: string }> {
  let entrada: File = file
  if (ehHeic(file)) {
    // Import dinâmico: só carrega o conversor (pesado) quando aparece um HEIC.
    const heic2any = (await import('heic2any')).default as (opts: {
      blob: Blob
      toType?: string
      quality?: number
    }) => Promise<Blob | Blob[]>
    const convertido = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const jpeg = Array.isArray(convertido) ? convertido[0] : convertido
    entrada = new File([jpeg], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
  }
  const blob = await resizeImage(entrada, maxDim)
  return { blob, mime: blob.type || 'image/jpeg' }
}
