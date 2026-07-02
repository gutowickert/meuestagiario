// POST /api/upload — recebe uma imagem (foto real do usuário) e devolve a URL pública.
// Body = bytes da imagem; Content-Type = mime (image/jpeg, image/png, image/webp).
// Usado pela capa do carrossel e, adiante, pelas fotos dos slides.
import { subirArquivo } from '@/lib/storage'

export const maxDuration = 60

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: Request) {
  try {
    const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim()
    const ext = EXT[contentType]
    if (!ext) {
      return Response.json(
        { error: 'Formato não suportado. Envie JPG, PNG ou WEBP.' },
        { status: 400 },
      )
    }
    const bytes = await request.arrayBuffer()
    if (bytes.byteLength === 0) {
      return Response.json({ error: 'Nenhuma imagem recebida.' }, { status: 400 })
    }
    // Limite defensivo (~10MB) — evita estourar memória do render depois.
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return Response.json({ error: 'Imagem muito grande (máx 10MB).' }, { status: 413 })
    }

    const path = `uploads/${crypto.randomUUID()}.${ext}`
    const url = await subirArquivo(path, Buffer.from(bytes), contentType)
    return Response.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/upload] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
