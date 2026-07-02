// =============================================================
// Template "destaque" — a foto real manda: capa com foto em tela cheia + texto
// sobreposto; slides internos minimalistas com número grande e barra menta.
// Só Flexbox + position absolute (suportado pelo Satori). Lê os tokens da marca.
// =============================================================
import type { ReactElement } from 'react'
import { ehCapa, type SlideInput, type Template } from './types'

function capa(input: SlideInput): ReactElement {
  const { largura, altura, tokens, titulo, corpo, cidade, fotoUrl, logoUrl } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const logoW = 280 * u
  const logoH = logoW / 2.745

  return (
    <div style={{ position: 'relative', display: 'flex', width: largura, height: altura, backgroundColor: cores.primaria_escura }}>
      {fotoUrl ? (
        <img src={fotoUrl} width={largura} height={altura} style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, objectFit: 'cover' }} />
      ) : null}
      {/* Sobreposição escura pra legibilidade do texto */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: largura,
          height: altura,
          display: 'flex',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 25%, ${cores.primaria_escura} 100%)`,
        }}
      />
      {/* Conteúdo */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', padding: 64 * u }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {logoUrl ? <img src={logoUrl} width={logoW} height={logoH} style={{ width: logoW, height: logoH, objectFit: 'contain' }} /> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {cidade ? (
            <div style={{ display: 'flex', marginBottom: 20 * u }}>
              <div
                style={{
                  display: 'flex',
                  paddingTop: 12 * u,
                  paddingBottom: 12 * u,
                  paddingLeft: 32 * u,
                  paddingRight: 32 * u,
                  borderRadius: 999,
                  backgroundColor: cores.destaque,
                  fontFamily: fontes.titulo,
                  fontSize: 38 * u,
                  color: cores.texto_escuro,
                  textTransform: 'uppercase',
                }}
              >
                {cidade}
              </div>
            </div>
          ) : null}
          <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 92 * u, lineHeight: 0.98, color: cores.texto_claro, textTransform: 'uppercase' }}>
            {titulo}
          </div>
          <div style={{ width: 120 * u, height: 12 * u, borderRadius: 999, marginTop: 24 * u, backgroundColor: cores.destaque }} />
          {corpo ? (
            <div style={{ display: 'flex', marginTop: 24 * u, fontFamily: fontes.corpo, fontWeight: 700, fontSize: 34 * u, lineHeight: 1.25, color: cores.texto_claro, textTransform: 'uppercase' }}>
              {corpo}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, logoUrl } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehProva = papel === 'prova'
  const logoW = 240 * u
  const logoH = logoW / 2.745

  return (
    <div style={{ display: 'flex', width: largura, height: altura, backgroundColor: cores.primaria_escura, padding: 72 * u }}>
      {/* Barra menta vertical à esquerda */}
      <div style={{ display: 'flex', width: 14 * u, borderRadius: 999, backgroundColor: cores.destaque, marginRight: 44 * u }} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 120 * u, lineHeight: 0.9, color: cores.destaque }}>
            {String(ordem).padStart(2, '0')}
          </div>
          {logoUrl ? <img src={logoUrl} width={logoW} height={logoH} style={{ width: logoW, height: logoH, objectFit: 'contain' }} /> : null}
        </div>
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 68 * u, lineHeight: 1.02, color: cores.texto_claro, textTransform: 'uppercase', marginTop: 24 * u }}>
          {titulo}
        </div>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: fontes.corpo,
              fontWeight: ehProva ? 700 : 600,
              fontSize: (ehProva ? 48 : 42) * u,
              lineHeight: 1.32,
              color: cores.texto_claro,
            }}
          >
            {corpo}
          </div>
        </div>
      </div>
    </div>
  )
}

export const destaque: Template = {
  id: 'destaque',
  nome: 'Destaque',
  descricao: 'A foto em tela cheia na capa, com o texto sobreposto. Internos minimalistas com número grande.',
  render: (input: SlideInput): ReactElement => (ehCapa(input) ? capa(input) : interno(input)),
}
