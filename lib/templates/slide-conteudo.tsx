// =============================================================
// Template "slide-conteudo" — slides internos do carrossel (não-capa).
// Fundo da marca + título Anton + corpo Poppins. Só Flexbox.
// =============================================================
import type { ReactElement } from 'react'
import type { CapaTokens } from './slide-capa'

export interface SlideConteudoProps {
  largura: number
  altura: number
  tokens: CapaTokens
  ordem: number
  papel: string
  titulo: string
  corpo: string
}

const ROTULO: Record<string, string> = {
  gancho: 'Gancho',
  desenvolvimento: 'Passo',
  prova: 'Prova',
  cta: 'Bora',
}

export function SlideConteudo({
  largura,
  altura,
  tokens,
  ordem,
  papel,
  titulo,
  corpo,
}: SlideConteudoProps): ReactElement {
  const { cores, fontes } = tokens
  const u = largura / 1080
  const rotulo = `${ROTULO[papel] ?? 'Slide'} ${ordem}`

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
      {/* Rótulo do papel (pill menta) */}
      <div style={{ display: 'flex' }}>
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
      </div>

      {/* Título Anton */}
      <div
        style={{
          display: 'flex',
          fontFamily: fontes.titulo,
          fontSize: 76 * u,
          lineHeight: 1.03,
          color: cores.texto_claro,
          textTransform: 'uppercase',
          marginTop: 40 * u,
        }}
      >
        {titulo}
      </div>

      {/* Divisor menta */}
      <div
        style={{
          width: 96 * u,
          height: 10 * u,
          borderRadius: 999,
          marginTop: 28 * u,
          backgroundColor: cores.destaque,
        }}
      />

      {/* Corpo Poppins */}
      <div
        style={{
          display: 'flex',
          fontFamily: fontes.corpo,
          fontWeight: 600,
          fontSize: 40 * u,
          lineHeight: 1.35,
          color: cores.texto_claro,
          marginTop: 40 * u,
        }}
      >
        {corpo}
      </div>

      <div style={{ display: 'flex', flex: 1 }} />

      {/* Marca no rodapé */}
      <div
        style={{
          display: 'flex',
          fontFamily: fontes.titulo,
          fontSize: 30 * u,
          color: cores.texto_claro,
          opacity: 0.8,
          textTransform: 'uppercase',
        }}
      >
        Carreira no Digital
      </div>
    </div>
  )
}
