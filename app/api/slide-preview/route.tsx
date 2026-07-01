// GET /api/slide-preview?formato=feed_quadrado
// Renderiza o template slide-capa com os tokens da Carreira No Digital,
// pra visualizar o visual da marca. (Passo intermediário: depois o /api/generate
// usa este template com a copy e as fotos reais.)
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getFormato, FORMATO_PADRAO, isFormatoValido } from '@/lib/formats'
import { SlideCapa, type CapaTokens } from '@/lib/templates/slide-capa'

// Tokens da Carreira No Digital (espelham o seed 002; futuramente vêm de getBrand()).
const TOKENS: CapaTokens = {
  cores: {
    primaria: '#7A2BD4',
    primaria_escura: '#3D1178',
    destaque: '#6FE3A6',
    creme: '#EAF7EC',
    texto_claro: '#FFFFFF',
    texto_escuro: '#262626',
    barra: '#141414',
  },
  fontes: { titulo: 'Anton', corpo: 'Poppins' },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fmtParam = searchParams.get('formato') ?? FORMATO_PADRAO
    const formato = getFormato(isFormatoValido(fmtParam) ? fmtParam : FORMATO_PADRAO)

    const [anton, poppinsBold] = await Promise.all([
      readFile(join(process.cwd(), 'assets/fonts/Anton-Regular.ttf')),
      readFile(join(process.cwd(), 'assets/fonts/Poppins-Bold.ttf')),
    ])

    return new ImageResponse(
      SlideCapa({
        largura: formato.largura,
        altura: formato.altura,
        tokens: TOKENS,
        titulo: 'Formação Completa em Marketing Digital',
        cidade: 'Porto Alegre – RS',
        subtitulo: 'Seu negócio no digital, pronto e rodando',
        chips: [
          { texto: '4 módulos', destaque: true },
          { texto: '4 semanas' },
          { texto: 'presencial' },
        ],
      }),
      {
        width: formato.largura,
        height: formato.altura,
        fonts: [
          { name: 'Anton', data: anton, weight: 400, style: 'normal' },
          { name: 'Poppins', data: poppinsBold, weight: 700, style: 'normal' },
        ],
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/slide-preview] falha:', msg)
    return new Response(`Falha ao gerar a imagem: ${msg}`, { status: 500 })
  }
}
