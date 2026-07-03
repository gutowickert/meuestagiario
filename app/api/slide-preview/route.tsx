// GET /api/slide-preview?template=editorial&papel=capa&formato=feed_quadrado
// Renderiza um slide de EXEMPLO com o template pedido e os tokens da marca,
// pra galeria de estilos (/estilos). Conteúdo fake só pra visualizar o layout.
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getFormato, FORMATO_PADRAO, isFormatoValido } from '@/lib/formats'
import { logoDataUri } from '@/lib/render'
import { getTemplate } from '@/lib/templates/registry'
import type { CapaTokens } from '@/lib/templates/slide-capa'
import type { LogoPos } from '@/lib/templates/types'

// Tokens da Carreira No Digital (espelham o seed 002; futuramente vêm de getBrand()).
const TOKENS: CapaTokens = {
  cores: {
    primaria: '#7A2BD4',
    primaria_escura: '#3D1178',
    destaque: '#A855F7', // acento roxo (a marca é roxa, não verde)
    creme: '#F3EEFB',
    texto_claro: '#FFFFFF',
    texto_escuro: '#262626',
    barra: '#141414',
  },
  fontes: { titulo: 'Anton', corpo: 'Poppins' },
}

// Amostras de conteúdo por papel, só pra ver o layout.
const AMOSTRA = {
  capa: { ordem: 1, papel: 'gancho', titulo: 'Impulsionar post não é anúncio', corpo: 'Existe um jeito certo — e é mais simples do que parece.', destaque: '', topicos: [] as string[] },
  conteudo: { ordem: 2, papel: 'desenvolvimento', titulo: '3 dias, sua campanha no ar', corpo: '', destaque: '3 dias presenciais', topicos: ['Dia 1: o que funciona nos anúncios', 'Dia 2: você sobe a campanha do seu negócio', 'Dia 3: revisão das métricas e mentoria'] },
  prova: { ordem: 3, papel: 'prova', titulo: 'R$40 viraram R$65 mil', corpo: 'Aluna investiu R$40 no 2º dia e vendeu um carro de R$65.000. Aconteceu na prática.', destaque: 'vendeu na prática', topicos: [] as string[] },
  roxo: { ordem: 4, papel: 'desenvolvimento', titulo: 'Sai daqui com campanha rodando', corpo: 'Nada de teoria pra guardar na gaveta. Você termina a imersão com anúncio no ar.', destaque: 'anúncio no ar', topicos: [] as string[] },
  cta: { ordem: 5, papel: 'cta', titulo: 'Turma de Caxias abrindo', corpo: 'Vagas limitadas por turma. Chama no direct e garante seu lugar.', destaque: 'vagas limitadas', topicos: [] as string[] },
} as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fmtParam = searchParams.get('formato') ?? FORMATO_PADRAO
    const formato = getFormato(isFormatoValido(fmtParam) ? fmtParam : FORMATO_PADRAO)
    const molde = getTemplate(searchParams.get('template'))
    const papelParam = (searchParams.get('papel') ?? 'capa') as keyof typeof AMOSTRA
    const amostra = AMOSTRA[papelParam] ?? AMOSTRA.capa
    const logoParam = searchParams.get('logo_pos')
    const logoPos = (logoParam as LogoPos) || undefined
    // comfoto=1 usa o logo como "foto" só pra exercitar o layout de slide com foto.
    const comFoto = searchParams.get('comfoto') === '1'

    const [anton, poppinsBold, poppinsSemi, logo] = await Promise.all([
      readFile(join(process.cwd(), 'assets/fonts/Anton-Regular.ttf')),
      readFile(join(process.cwd(), 'assets/fonts/Poppins-Bold.ttf')),
      readFile(join(process.cwd(), 'assets/fonts/Poppins-SemiBold.ttf')),
      logoDataUri(),
    ])

    return new ImageResponse(
      molde.render({
        largura: formato.largura,
        altura: formato.altura,
        tokens: TOKENS,
        ordem: amostra.ordem,
        papel: amostra.papel,
        titulo: amostra.titulo,
        corpo: amostra.corpo,
        topicos: [...amostra.topicos],
        destaque: amostra.destaque,
        cidade: 'Caxias do Sul',
        fotoUrl: comFoto ? logo : undefined,
        logoUrl: logo,
        logoPos,
      }),
      {
        width: formato.largura,
        height: formato.altura,
        fonts: [
          { name: 'Anton', data: anton, weight: 400, style: 'normal' },
          { name: 'Poppins', data: poppinsBold, weight: 700, style: 'normal' },
          { name: 'Poppins', data: poppinsSemi, weight: 600, style: 'normal' },
        ],
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
    console.error('[/api/slide-preview] falha:', msg)
    return new Response(`Falha ao gerar a imagem: ${msg}`, { status: 500 })
  }
}
