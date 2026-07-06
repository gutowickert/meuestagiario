// POST /api/roteiro — copy de vídeo (roteiro falado + legenda). Sem render de
// imagem: o entregável é texto. Gera com o Claude, salva a peça (tipo 'reel')
// pra passar pelo mesmo portão de aprovação, e devolve o roteiro.
import { getBrand, resolverProduto, inserirContentPiece, listarAprovados, getDossieCliente } from '@/lib/data'
import { gerarRoteiro, type RoteiroInput } from '@/lib/roteiro'
import { isEtapaValida } from '@/lib/generate'
import { gerarContentId } from '@/lib/content-id'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }
    const { brand_id, produto_id, turma_id, cidade, briefing, situacao, cta_objetivo, etapa, mostrar_preco, objetivo } =
      body as Record<string, unknown>

    if (typeof brand_id !== 'string' || !brand_id) {
      return Response.json({ error: 'brand_id é obrigatório.' }, { status: 400 })
    }
    if (typeof briefing !== 'string' || !briefing.trim()) {
      return Response.json({ error: 'briefing é obrigatório.' }, { status: 400 })
    }

    const brand = await getBrand(brand_id)
    const produtoRef = typeof produto_id === 'string' ? produto_id : null
    const produto = produtoRef ? await resolverProduto(brand_id, produtoRef) : null
    const produtoAtributo = produto?.codigo ?? produtoRef

    const aprovados = await listarAprovados(brand_id).catch(() => [])
    const exemplosAprovados = aprovados.map((e) => ({ gancho: e.gancho, legenda: e.legenda }))

    const cidadeStr = typeof cidade === 'string' ? cidade : null
    const inteligencia = produto ? await getDossieCliente(produto.nome, cidadeStr) : null

    const input: RoteiroInput = {
      produto,
      produto_id: produtoAtributo,
      cidade: typeof cidade === 'string' ? cidade : null,
      briefing,
      situacao: typeof situacao === 'string' ? situacao : null,
      ctaObjetivo: typeof cta_objetivo === 'string' ? cta_objetivo : null,
      etapa: isEtapaValida(etapa) ? etapa : null,
      mostrarPreco: mostrar_preco === true,
      exemplosAprovados,
      inteligencia,
      objetivo: objetivo === 'organico' ? 'organico' : 'anuncio',
    }

    const roteiro = await gerarRoteiro(brand, input)
    const content_id = gerarContentId({ produto_id: produtoAtributo, cidade: input.cidade, tipo: 'reel' })

    // assets carrega o roteiro (pra a tela de aprovados exibir sem re-consultar a spec).
    const assets = {
      slides: [] as { ordem: number; papel: string; url: string }[],
      legenda: roteiro.legenda,
      hashtags: roteiro.hashtags,
      roteiro: roteiro.blocos,
      duracao: roteiro.duracao,
      inteligencia: !!inteligencia, // Camada 3 (voz do cliente) entrou neste roteiro?
    }

    const pieceId = await inserirContentPiece({
      content_id,
      brand_id,
      produto_id: produtoAtributo,
      turma_id: typeof turma_id === 'string' ? turma_id : null,
      cidade: input.cidade,
      tipo: 'reel',
      spec: roteiro,
      atributos: roteiro.atributos,
      assets,
    })

    return Response.json({
      id: pieceId,
      content_id,
      brand_id,
      tipo: 'reel',
      atributos: roteiro.atributos,
      assets,
      roteiro,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/roteiro] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
