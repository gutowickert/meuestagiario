// =============================================================
// Template "bloco" — visual claro: cartões creme/branco sobre a cor sólida da
// marca, texto na cor primária. Alto contraste, mais "clean/produto". Só Flexbox.
// Mesmos tokens do editorial — muda só o arranjo (CLAUDE.md §12).
// =============================================================
import type { ReactElement } from 'react'
import { ehCapa, type SlideInput, type Template } from './types'

const ROTULO: Record<string, string> = {
  gancho: 'Gancho',
  desenvolvimento: 'Passo',
  prova: 'Prova',
  cta: 'Bora',
}

function moldura(largura: number, altura: number, cor: string, children: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: largura,
        height: altura,
        padding: 56 * (largura / 1080),
        backgroundColor: cor,
      }}
    >
      {children}
    </div>
  )
}

function capa(input: SlideInput): ReactElement {
  const { largura, altura, tokens, titulo, corpo, cidade, fotoUrl, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const logo = logoPos === 'oculto' ? undefined : logoUrl
  const logoW = 260 * u
  const logoH = logoW / 2.745

  return moldura(
    largura,
    altura,
    cores.primaria,
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {logo ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 * u }}>
          <img src={logo} width={logoW} height={logoH} style={{ width: logoW, height: logoH, objectFit: 'contain' }} />
        </div>
      ) : null}

      {/* Cartão creme com título + foto */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 44 * u,
          borderRadius: 40 * u,
          backgroundColor: cores.creme,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: fontes.titulo,
            fontSize: 78 * u,
            lineHeight: 1.0,
            color: cores.primaria,
            textTransform: 'uppercase',
          }}
        >
          {titulo}
        </div>
        <div style={{ width: 96 * u, height: 10 * u, borderRadius: 999, marginTop: 20 * u, backgroundColor: cores.destaque }} />

        <div
          style={{
            display: 'flex',
            flex: 1,
            marginTop: 32 * u,
            borderRadius: 28 * u,
            overflow: 'hidden',
            backgroundColor: cores.primaria_escura,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fotoUrl ? (
            <img src={fotoUrl} width={largura} height={altura} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 40 * u, color: cores.creme, opacity: 0.6 }}>
              FOTO REAL
            </div>
          )}
        </div>

        {corpo ? (
          <div
            style={{
              display: 'flex',
              marginTop: 28 * u,
              fontFamily: fontes.corpo,
              fontWeight: 600,
              fontSize: 32 * u,
              lineHeight: 1.3,
              color: cores.texto_escuro,
            }}
          >
            {corpo}
          </div>
        ) : null}
      </div>

      {cidade ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 * u }}>
          <div
            style={{
              display: 'flex',
              paddingTop: 16 * u,
              paddingBottom: 16 * u,
              paddingLeft: 48 * u,
              paddingRight: 48 * u,
              borderRadius: 999,
              backgroundColor: cores.destaque,
              fontFamily: fontes.titulo,
              fontSize: 44 * u,
              color: cores.texto_escuro,
              textTransform: 'uppercase',
            }}
          >
            {cidade}
          </div>
        </div>
      ) : null}
    </div>,
  )
}

function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehCta = papel === 'cta'
  const logo = logoPos === 'oculto' ? undefined : logoUrl
  const rotulo = `${ROTULO[papel] ?? 'Slide'} ${ordem}`
  const logoW = 240 * u
  const logoH = logoW / 2.745

  return moldura(
    largura,
    altura,
    cores.primaria,
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 * u }}>
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
        {logo ? (
          <img src={logo} width={logoW} height={logoH} style={{ width: logoW, height: logoH, objectFit: 'contain' }} />
        ) : null}
      </div>

      {/* Cartão creme com o conteúdo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          padding: 56 * u,
          borderRadius: 40 * u,
          backgroundColor: ehCta ? cores.destaque : cores.creme,
        }}
      >
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 150 * u, lineHeight: 0.9, color: cores.primaria, opacity: 0.18 }}>
          {String(ordem).padStart(2, '0')}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: fontes.titulo,
            fontSize: 62 * u,
            lineHeight: 1.03,
            color: cores.primaria,
            textTransform: 'uppercase',
            marginTop: 8 * u,
          }}
        >
          {titulo}
        </div>
        <div style={{ width: 96 * u, height: 10 * u, borderRadius: 999, marginTop: 22 * u, backgroundColor: cores.destaque }} />
        <div
          style={{
            display: 'flex',
            marginTop: 28 * u,
            fontFamily: fontes.corpo,
            fontWeight: 600,
            fontSize: 40 * u,
            lineHeight: 1.34,
            color: cores.texto_escuro,
          }}
        >
          {corpo}
        </div>
      </div>
    </div>,
  )
}

export const bloco: Template = {
  id: 'bloco',
  nome: 'Bloco',
  descricao: 'Cartões creme sobre a cor sólida da marca. Claro, alto contraste, cara de produto.',
  render: (input: SlideInput): ReactElement => (ehCapa(input) ? capa(input) : interno(input)),
}
