// POST /api/midias/sign — devolve uma URL assinada pra o navegador subir o arquivo
// DIRETO no Storage (fotos e principalmente vídeos, que estouram o limite de body
// das funções). Depois o cliente registra a mídia via POST /api/midias.
import { getSupabaseAdmin } from '@/lib/data'

const BUCKET = 'estagiario-media'

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const mime = typeof body?.mime === 'string' ? body.mime : ''
    const ext = EXT[mime]
    if (!ext) {
      return Response.json({ error: 'Formato não suportado. Fotos: JPG/PNG/WEBP. Vídeos: MP4/MOV/WEBM.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const path = `repositorio/${crypto.randomUUID()}.${ext}`
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) {
      return Response.json({ error: `Falha ao assinar upload: ${error?.message ?? 'desconhecido'}` }, { status: 500 })
    }

    const base = process.env.SUPABASE_URL as string
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return Response.json({
      // URL absoluta pra o PUT direto do navegador (token embutido).
      uploadUrl: `${base}/storage/v1${data.signedUrl}`,
      publicUrl: pub.publicUrl,
      path,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
