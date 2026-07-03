// =============================================================
// Redimensiona uma imagem NO NAVEGADOR antes do upload (client-only).
// Necessário porque a API de visão limita cada imagem a 2000px por lado em
// requisições com várias imagens — prints de celular passam disso. Também
// deixa o upload mais leve. Devolve um JPEG.
// =============================================================
export async function resizeImage(file: File, maxDim = 1568): Promise<Blob> {
  // Só imagens; se algo der errado, devolve o arquivo original.
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const maior = Math.max(bitmap.width, bitmap.height)
    const escala = Math.min(1, maxDim / maior)
    if (escala === 1) {
      bitmap.close?.()
      return file // já está dentro do limite
    }
    const w = Math.round(bitmap.width * escala)
    const h = Math.round(bitmap.height * escala)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao redimensionar.'))), 'image/jpeg', 0.9),
    )
  } catch {
    return file
  }
}
