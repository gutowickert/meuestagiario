// =============================================================
// Template "slide-capa" — reproduz o anúncio da marca com @vercel/og.
// SÓ Flexbox (restrição do Satori). Lê tudo dos tokens da marca:
// nada de cor/fonte cravada aqui.
// =============================================================
import type { ReactElement } from 'react'

export interface CapaTokens {
  cores: {
    primaria: string
    primaria_escura: string
    destaque: string
    creme: string
    texto_claro: string
    texto_escuro: string
    barra: string
  }
  fontes: { titulo: string; corpo: string }
}

export interface Chip {
  texto: string
  destaque?: boolean // true = pill verde-menta; false = contorno branco
}

export interface SlideCapaProps {
  largura: number
  altura: number
  tokens: CapaTokens
  titulo: string
  cidade?: string
  subtitulo?: string
  chips?: Chip[]
  fotoUrl?: string
  logoUrl?: string
}

export function SlideCapa({
  largura,
  altura,
  tokens,
  titulo,
  cidade,
  subtitulo,
  chips = [],
  fotoUrl,
  logoUrl,
}: SlideCapaProps): ReactElement {
  const { cores, fontes } = tokens
  // Escala tipográfica proporcional à largura do canvas (base 1080).
  const u = largura / 1080
  const logoW = 300 * u
  const logoH = logoW / 2.745 // proporção do logo (2133x777)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: largura,
        height: altura,
        padding: 56 * u,
        backgroundImage: `linear-gradient(160deg, ${cores.primaria}, ${cores.primaria_escura})`,
        fontFamily: fontes.corpo,
      }}
    >
      {/* Logo no topo (canto direito) */}
      {logoUrl ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 * u }}>
          <img
            src={logoUrl}
            width={logoW}
            height={logoH}
            style={{ width: logoW, height: logoH, objectFit: 'contain' }}
          />
        </div>
      ) : null}

      {/* Título (Anton, uppercase, branco) + divisor menta */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: fontes.titulo,
            fontSize: 82 * u,
            lineHeight: 1.02,
            color: cores.texto_claro,
            textTransform: 'uppercase',
            letterSpacing: -1 * u,
          }}
        >
          {titulo}
        </div>
        <div
          style={{
            width: 96 * u,
            height: 10 * u,
            borderRadius: 999,
            marginTop: 22 * u,
            backgroundColor: cores.destaque,
          }}
        />
      </div>

      {/* Card da foto (borda branca arredondada). flex:1 absorve a altura. */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          marginTop: 40 * u,
          marginBottom: 32 * u,
          borderRadius: 32 * u,
          border: `${8 * u}px solid ${cores.texto_claro}`,
          overflow: 'hidden',
          backgroundColor: cores.creme,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {fotoUrl ? (
          <img
            src={fotoUrl}
            width={largura}
            height={altura}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              fontFamily: fontes.titulo,
              fontSize: 40 * u,
              color: cores.primaria,
              opacity: 0.5,
            }}
          >
            FOTO REAL
          </div>
        )}
      </div>

      {/* Pill da cidade (branco, texto Anton roxo) */}
      {cidade ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 * u }}>
          <div
            style={{
              display: 'flex',
              paddingTop: 16 * u,
              paddingBottom: 16 * u,
              paddingLeft: 56 * u,
              paddingRight: 56 * u,
              borderRadius: 999,
              backgroundColor: cores.texto_claro,
              fontFamily: fontes.titulo,
              fontSize: 46 * u,
              color: cores.primaria,
              textTransform: 'uppercase',
              letterSpacing: 1 * u,
            }}
          >
            {cidade}
          </div>
        </div>
      ) : null}

      {/* Barra escura: subtítulo + chips */}
      {subtitulo || chips.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 32 * u,
            borderRadius: 28 * u,
            backgroundColor: cores.barra,
          }}
        >
          {subtitulo ? (
            <div
              style={{
                display: 'flex',
                fontFamily: fontes.corpo,
                fontWeight: 700,
                fontSize: 30 * u,
                color: cores.texto_claro,
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: chips.length > 0 ? 20 * u : 0,
              }}
            >
              {subtitulo}
            </div>
          ) : null}
          {chips.length > 0 ? (
            <div style={{ display: 'flex', gap: 16 * u }}>
              {chips.map((chip, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    paddingTop: 12 * u,
                    paddingBottom: 12 * u,
                    paddingLeft: 28 * u,
                    paddingRight: 28 * u,
                    borderRadius: 999,
                    fontFamily: fontes.corpo,
                    fontWeight: 700,
                    fontSize: 26 * u,
                    textTransform: 'uppercase',
                    backgroundColor: chip.destaque ? cores.destaque : 'transparent',
                    border: chip.destaque ? 'none' : `${3 * u}px solid ${cores.texto_claro}`,
                    color: chip.destaque ? cores.texto_escuro : cores.texto_claro,
                  }}
                >
                  {chip.texto}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
