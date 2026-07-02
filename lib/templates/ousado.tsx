// =============================================================
// Template "ousado" — moderno e brutalista: fundo quase-preto, tipografia GIGANTE,
// menta de acento. O clima "agência de tráfego" (referência que o Guto curtiu).
// Distinto do manchete (roxo). Só Flexbox + absolute (Satori). Lê os tokens.
// =============================================================
import type { ReactElement } from 'react'
import { logoCanto } from './logo'
import { ehCapa, type SlideInput, type Template } from './types'

const PRETO = '#141414' // = tokens.cores.barra; near-black moderno

function listaItens(itens: string[], accent: string, cor: string, fonte: string, u: number): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32 * u }}>
      {itens.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 * u }}>
          <div style={{ display: 'flex', width: 22 * u, height: 22 * u, marginTop: 14 * u, marginRight: 22 * u, backgroundColor: accent }} />
          <div style={{ display: 'flex', flex: 1, fontFamily: fonte, fontWeight: 600, fontSize: 42 * u, lineHeight: 1.25, color: cor }}>
            {item}
          </div>
        </div>
      ))}
    </div>
  )
}

function capa(input: SlideInput): ReactElement {
  const { largura, altura, tokens, titulo, corpo, cidade, fotoUrl, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  return (
    <div style={{ position: 'relative', display: 'flex', width: largura, height: altura, backgroundColor: PRETO }}>
      {fotoUrl ? (
        <img src={fotoUrl} width={largura} height={altura} style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, objectFit: 'cover' }} />
      ) : null}
      <div style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, display: 'flex', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.6) 55%, ${PRETO} 100%)` }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', padding: 76 * u }}>
        {cidade ? (
          <div style={{ display: 'flex', marginBottom: 22 * u }}>
            <div style={{ display: 'flex', paddingTop: 12 * u, paddingBottom: 12 * u, paddingLeft: 30 * u, paddingRight: 30 * u, backgroundColor: cores.destaque, fontFamily: fontes.titulo, fontSize: 40 * u, color: PRETO, textTransform: 'uppercase' }}>
              {cidade}
            </div>
          </div>
        ) : null}
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 118 * u, lineHeight: 0.9, color: cores.texto_claro, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        <div style={{ width: 160 * u, height: 14 * u, marginTop: 26 * u, backgroundColor: cores.destaque }} />
        {corpo ? (
          <div style={{ display: 'flex', marginTop: 24 * u, fontFamily: fontes.corpo, fontWeight: 700, fontSize: 36 * u, lineHeight: 1.2, color: cores.texto_claro }}>
            {corpo}
          </div>
        ) : null}
      </div>
      {logoCanto(logoUrl, logoPos, largura)}
    </div>
  )
}

function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, topicos, destaque, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehCta = papel === 'cta'
  const bg = ehCta ? cores.destaque : PRETO
  const corTexto = ehCta ? PRETO : cores.texto_claro
  const accent = ehCta ? PRETO : cores.destaque
  const lista = (topicos ?? []).filter((t) => t && t.trim())
  const temDestaque = !!destaque && destaque.trim().length > 0
  const tall = altura / largura >= 1.4

  const base =
    lista.length > 0
      ? listaItens(lista, accent, corTexto, fontes.corpo, u)
      : corpo
        ? (
          <div style={{ display: 'flex', marginTop: 30 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 42 * u, lineHeight: 1.3, color: corTexto }}>
            {corpo}
          </div>
        )
        : null

  const topo = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: (tall ? 116 : 104) * u, lineHeight: 0.9, color: corTexto, textTransform: 'uppercase' }}>
        {titulo}
      </div>
      <div style={{ width: 160 * u, height: 14 * u, marginTop: 26 * u, backgroundColor: accent }} />
      {temDestaque ? (
        <div style={{ display: 'flex', marginTop: 30 * u, fontFamily: fontes.titulo, fontSize: (tall ? 88 : 72) * u, lineHeight: 0.96, color: accent, textTransform: 'uppercase' }}>
          {destaque}
        </div>
      ) : null}
    </div>
  )

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: tall ? (base ? 'space-between' : 'center') : 'center', width: largura, height: altura, backgroundColor: bg, padding: 84 * u }}>
      {tall ? (
        <>
          {topo}
          {base}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {topo}
          {base}
        </div>
      )}
      {logoCanto(ehCta ? undefined : logoUrl, logoPos, largura, 0.9)}
    </div>
  )
}

export const ousado: Template = {
  id: 'ousado',
  nome: 'Ousado',
  descricao: 'Fundo quase-preto, tipografia gigante e menta de acento. Moderno, brutalista, cara de agência de tráfego.',
  render: (input: SlideInput): ReactElement => (ehCapa(input) ? capa(input) : input.fotoUrl ? capa(input) : interno(input)),
}
