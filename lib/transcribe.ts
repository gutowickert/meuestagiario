// =============================================================
// Transcrição de áudio via Deepgram (SÓ backend — usa DEEPGRAM_API_KEY).
// O Claude não transcreve áudio; a Deepgram devolve texto pt-BR (VISAO §7).
// Nova-3 é o modelo recomendado p/ português desde 05/2026.
// =============================================================

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen'
// Parametrizável por env caso a gente troque de modelo/idioma sem redeploy de código.
const MODELO = process.env.DEEPGRAM_MODEL ?? 'nova-3'
const IDIOMA = process.env.DEEPGRAM_LANGUAGE ?? 'pt-BR'

export interface TranscricaoResultado {
  transcript: string
  duracao: number | null
}

/**
 * Transcreve bytes de áudio (gravação do navegador ou arquivo enviado).
 * `contentType` é o mime do áudio (ex.: audio/webm, audio/mp4, audio/wav).
 */
export async function transcreverAudio(
  audio: ArrayBuffer,
  contentType: string,
): Promise<TranscricaoResultado> {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) throw new Error('Falta a variável de ambiente DEEPGRAM_API_KEY.')
  if (audio.byteLength === 0) throw new Error('Áudio vazio.')

  const params = new URLSearchParams({
    model: MODELO,
    language: IDIOMA,
    smart_format: 'true', // pontuação + formatação de números/datas
  })

  const resp = await fetch(`${DEEPGRAM_URL}?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': contentType || 'audio/webm',
    },
    body: audio,
  })

  if (!resp.ok) {
    const detalhe = await resp.text().catch(() => '')
    throw new Error(`Deepgram falhou (${resp.status}): ${detalhe.slice(0, 300)}`)
  }

  const data = (await resp.json()) as {
    results?: { channels?: { alternatives?: { transcript?: string }[] }[] }
    metadata?: { duration?: number }
  }

  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
  return { transcript, duracao: data.metadata?.duration ?? null }
}
