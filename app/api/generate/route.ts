// POST /api/generate — o cérebro da Fatia 1.
// Recebe o briefing, carrega a marca pelo adapter, e devolve a spec + content_id.
// (Render dos slides + upload no Storage + gravação em content_pieces: próximos passos.)
import { getBrand } from '@/lib/data'
import { gerarSpec, type GerarInput } from '@/lib/generate'
import { gerarContentId } from '@/lib/content-id'
import { isFormatoValido, isTipoValido, TIPOS } from '@/lib/formats'

// Rotas de geração podem demorar (raciocínio do modelo) — Fluid Compute.
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }

    const { brand_id, produto_id, turma_id, cidade, briefing, tipo, formato } = body as Record<
      string,
      unknown
    >

    // Validação de entrada
    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (typeof briefing !== 'string' || !briefing.trim()) {
      return Response.json({ error: 'briefing é obrigatório.' }, { status: 400 })
    }
    if (typeof tipo !== 'string' || !isTipoValido(tipo) || !TIPOS[tipo].ativoFatia1) {
      return Response.json(
        { error: 'tipo inválido. Use "carrossel" ou "anuncio_imagem".' },
        { status: 400 },
      )
    }
    if (typeof formato !== 'string' || !isFormatoValido(formato)) {
      return Response.json(
        { error: 'formato inválido. Use "feed_quadrado", "feed_retrato" ou "story".' },
        { status: 400 },
      )
    }

    // 1. Carrega a marca pelo adapter
    const brand = await getBrand(brand_id)

    // 2. Gera a spec com o Claude (structured output)
    const input: GerarInput = {
      produto_id: typeof produto_id === 'string' ? produto_id : null,
      turma_id: typeof turma_id === 'string' ? turma_id : null,
      cidade: typeof cidade === 'string' ? cidade : null,
      briefing,
      tipo,
      formato,
    }
    const spec = await gerarSpec(brand, input)

    // 3. Gera o content_id (vira utm_content)
    const content_id = gerarContentId({ produto_id: input.produto_id, cidade: input.cidade, tipo })

    return Response.json({
      content_id,
      brand_id,
      tipo,
      formato,
      atributos: spec.atributos,
      spec,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/generate] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
