// POST /api/transcribe — recebe bytes de áudio (gravação do navegador OU upload)
// e devolve o texto transcrito (Deepgram, pt-BR). Body = áudio cru; Content-Type = mime.
import { transcreverAudio } from '@/lib/transcribe'

// Transcrição pode demorar em áudios longos — Fluid Compute.
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? 'audio/webm'
    const audio = await request.arrayBuffer()
    if (audio.byteLength === 0) {
      return Response.json({ error: 'Nenhum áudio recebido.' }, { status: 400 })
    }
    const { transcript, duracao } = await transcreverAudio(audio, contentType)
    return Response.json({ transcript, duracao })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/transcribe] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
