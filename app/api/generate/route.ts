// POST /api/generate — o fluxo completo da Fatia 1.
// briefing -> getBrand -> Claude (spec) -> render dos slides -> Storage -> content_pieces.
import { getBrand, resolverProduto, inserirContentPiece } from '@/lib/data'
import { gerarSpec, type GerarInput } from '@/lib/generate'
import { gerarContentId } from '@/lib/content-id'
import { getFormato, isFormatoValido, isTipoValido, TIPOS } from '@/lib/formats'
import { renderSlidePng, logoDataUri } from '@/lib/render'
import { subirImagem } from '@/lib/storage'
import { tokensParaTemplate } from '@/lib/templates/tokens'
import { getTemplate } from '@/lib/templates/registry'
import type { LogoPos } from '@/lib/templates/types'

// Rotas de geração podem demorar (raciocínio do modelo + render) — Fluid Compute.
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Corpo inválido: envie um JSON.' }, { status: 400 })
    }

    const { brand_id, produto_id, turma_id, cidade, briefing, tipo, formato, foto_capa, template, logo, logo_pos, cta_objetivo } =
      body as Record<string, unknown>

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

    const dim = getFormato(formato)

    // 1. Marca (adapter)
    const brand = await getBrand(brand_id)
    const tokens = tokensParaTemplate(brand.tokens_visuais)

    // 1b. Produto (contexto rico). produto_id pode ser o UUID novo ou o código legado ('ANL').
    const produtoRef = typeof produto_id === 'string' ? produto_id : null
    const produto = produtoRef ? await resolverProduto(brand_id, produtoRef) : null
    // Na atribuição/utm usamos o código do produto (legível no relatório do Meta).
    const produtoAtributo = produto?.codigo ?? produtoRef

    // 2. Spec com o Claude (structured output)
    const input: GerarInput = {
      produto_id: produtoAtributo,
      produto,
      turma_id: typeof turma_id === 'string' ? turma_id : null,
      cidade: typeof cidade === 'string' ? cidade : null,
      briefing,
      tipo,
      formato,
      ctaObjetivo: typeof cta_objetivo === 'string' ? cta_objetivo : null,
    }
    const spec = await gerarSpec(brand, input)

    // 3. content_id (vira utm_content)
    const content_id = gerarContentId({ produto_id: produtoAtributo, cidade: input.cidade, tipo })

    // 4-6. Renderiza cada slide com o template escolhido, sobe no Storage
    const fotoCapa = typeof foto_capa === 'string' ? foto_capa : undefined
    const molde = getTemplate(typeof template === 'string' ? template : null)
    const logoPos = typeof logo_pos === 'string' ? (logo_pos as LogoPos) : undefined
    const mostrarLogo = logo !== false && logoPos !== 'oculto' // default: mostra
    const logoImg = mostrarLogo ? await logoDataUri() : undefined
    const slidesAssets: { ordem: number; papel: string; url: string }[] = []

    for (const slide of spec.slides) {
      const element = molde.render({
        largura: dim.largura,
        altura: dim.altura,
        tokens,
        ordem: slide.ordem,
        papel: slide.papel,
        titulo: slide.titulo,
        corpo: slide.corpo,
        topicos: slide.topicos,
        destaque: slide.destaque,
        cidade: input.cidade ?? undefined,
        fotoUrl: fotoCapa,
        logoUrl: logoImg,
        logoPos,
      })

      const png = await renderSlidePng(element, dim.largura, dim.altura)
      const path = `${content_id}/slide-${String(slide.ordem).padStart(2, '0')}.png`
      const url = await subirImagem(path, png)
      slidesAssets.push({ ordem: slide.ordem, papel: slide.papel, url })
    }

    const assets = {
      slides: slidesAssets,
      legenda: spec.legenda,
      hashtags: spec.hashtags,
    }

    // 7. Grava a peça
    await inserirContentPiece({
      content_id,
      brand_id,
      produto_id: input.produto_id,
      turma_id: input.turma_id,
      cidade: input.cidade,
      tipo,
      spec,
      atributos: spec.atributos,
      assets,
    })

    // 8. Retorna as URLs + content_id (pra virar utm_content no Meta)
    return Response.json({ content_id, brand_id, tipo, formato, atributos: spec.atributos, assets, spec })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/generate] falha:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
