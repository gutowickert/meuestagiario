// =============================================================
// Template "editorial" — o estilo base da marca: degradê, Anton em caixa alta,
// divisor menta, foto em card na capa. Slides internos refinados (número-fantasma,
// painel de leitura, prova como citação, CTA como bloco). Só Flexbox (Satori).
// =============================================================
import type { ReactElement } from 'react'
import { SlideCapa } from './slide-capa'
import { ehCapa, type SlideInput, type Template } from './types'

const ROTULO: Record<string, string> = {
  gancho: 'Gancho',
  desenvolvimento: 'Passo',
  prova: 'Prova',
  cta: 'Bora',
}

function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, logoUrl } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehProva = papel === 'prova'
  const ehCta = papel === 'cta'
  const rotulo = `${ROTULO[papel] ?? 'Slide'} ${ordem}`
  const logoW = 240 * u
  const logoH = logoW / 2.745

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: largura,
        height: altura,
        padding: 72 * u,
        backgroundImage: `linear-gradient(160deg, ${cores.primaria}, ${cores.primaria_escura})`,
        fontFamily: fontes.corpo,
      }}
    >
      {/* Topo: rótulo (menta) + logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'flex',
            paddingTop: 12 * u,
            paddingBottom: 12 * u,
            paddingLeft: 28 * u,
            paddingRight: 28 * u,
            borderRadius: 999,
            backgroundColor: cores.destaque,
            fontFamily: fontes.corpo,
            fontWeight: 700,
            fontSize: 28 * u,
            color: cores.texto_escuro,
            textTransform: 'uppercase',
          }}
        >
          {rotulo}
        </div>
        {logoUrl ? (
          <img src={logoUrl} width={logoW} height={logoH} style={{ width: logoW, height: logoH, objectFit: 'contain' }} />
        ) : null}
      </div>

      {/* Número-fantasma grande + título */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 44 * u }}>
        <div
          style={{
            display: 'flex',
            fontFamily: fontes.titulo,
            fontSize: 150 * u,
            lineHeight: 0.9,
            color: cores.destaque,
            opacity: 0.28,
            marginRight: 28 * u,
          }}
        >
          {String(ordem).padStart(2, '0')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: fontes.titulo,
              fontSize: 66 * u,
              lineHeight: 1.03,
              color: cores.texto_claro,
              textTransform: 'uppercase',
            }}
          >
            {titulo}
          </div>
          <div style={{ width: 96 * u, height: 10 * u, borderRadius: 999, marginTop: 22 * u, backgroundColor: cores.destaque }} />
        </div>
      </div>

      {/* Corpo em painel de leitura — prova vira citação, CTA vira bloco menta */}
      <div style={{ display: 'flex', flex: 1, marginTop: 44 * u }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            padding: 44 * u,
            borderRadius: 28 * u,
            backgroundColor: ehCta ? cores.destaque : 'rgba(0,0,0,0.22)',
          }}
        >
          {ehProva ? (
            <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 90 * u, lineHeight: 0.7, color: cores.destaque, marginBottom: 10 * u }}>
              “
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontFamily: fontes.corpo,
              fontWeight: ehProva ? 700 : 600,
              fontSize: (ehProva ? 46 : 40) * u,
              lineHeight: 1.34,
              color: ehCta ? cores.texto_escuro : cores.texto_claro,
            }}
          >
            {corpo}
          </div>
        </div>
      </div>
    </div>
  )
}

export const editorial: Template = {
  id: 'editorial',
  nome: 'Editorial',
  descricao: 'Degradê da marca, títulos Anton em caixa alta, foto em card e número-fantasma nos passos.',
  render: (input: SlideInput): ReactElement => {
    if (ehCapa(input)) {
      return SlideCapa({
        largura: input.largura,
        altura: input.altura,
        tokens: input.tokens,
        titulo: input.titulo,
        cidade: input.cidade,
        subtitulo: input.corpo,
        fotoUrl: input.fotoUrl,
        logoUrl: input.logoUrl,
      })
    }
    return interno(input)
  },
}
