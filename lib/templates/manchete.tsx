// =============================================================
// Template "manchete" — padrão de agência: tipografia GIGANTE, alto contraste,
// foto full-bleed na capa, prova com número em destaque, CTA que estoura.
// A tipografia é o design (poucos elementos). Só Flexbox + absolute (Satori).
// Lê os tokens da marca; logo posicionável via logoCanto.
// =============================================================
import type { ReactElement } from 'react'
import { logoCanto } from './logo'
import { ehCapa, type SlideInput, type Template } from './types'

const ROTULO: Record<string, string> = {
  gancho: 'Gancho',
  desenvolvimento: 'Passo',
  prova: 'Prova',
  cta: 'Bora',
}

// ---- Capa: foto em tela cheia + headline embaixo ----
function capa(input: SlideInput): ReactElement {
  const { largura, altura, tokens, titulo, corpo, cidade, fotoUrl, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080

  return (
    <div style={{ position: 'relative', display: 'flex', width: largura, height: altura, backgroundColor: cores.primaria_escura }}>
      {fotoUrl ? (
        <img src={fotoUrl} width={largura} height={altura} style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, objectFit: 'cover' }} />
      ) : null}
      <div style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, display: 'flex', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.10) 20%, rgba(0,0,0,0.55) 60%, ${cores.primaria_escura} 100%)` }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', padding: 72 * u }}>
        {cidade ? (
          <div style={{ display: 'flex', marginBottom: 22 * u }}>
            <div style={{ display: 'flex', paddingTop: 12 * u, paddingBottom: 12 * u, paddingLeft: 32 * u, paddingRight: 32 * u, borderRadius: 999, backgroundColor: cores.destaque, fontFamily: fontes.titulo, fontSize: 40 * u, color: cores.texto_escuro, textTransform: 'uppercase' }}>
              {cidade}
            </div>
          </div>
        ) : null}
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 104 * u, lineHeight: 0.94, color: cores.texto_claro, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        {corpo ? (
          <div style={{ display: 'flex', marginTop: 22 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 36 * u, lineHeight: 1.25, color: cores.texto_claro }}>
            {corpo}
          </div>
        ) : null}
      </div>
      {logoCanto(logoUrl, logoPos, largura)}
    </div>
  )
}

// ---- Internos: tipografia gigante sobre fundo sólido ----
function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehProva = papel === 'prova'
  const ehCta = papel === 'cta'

  // CTA estoura em menta; demais slides no roxo escuro da marca.
  const bg = ehCta ? cores.destaque : cores.primaria_escura
  const corTitulo = ehCta ? cores.texto_escuro : ehProva ? cores.destaque : cores.texto_claro
  const corCorpo = ehCta ? cores.texto_escuro : cores.texto_claro
  const rotulo = `${ROTULO[papel] ?? 'Slide'} ${ordem}`

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: largura, height: altura, backgroundColor: bg, padding: 80 * u }}>
      {/* Rótulo pequeno no topo */}
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', fontFamily: fontes.corpo, fontWeight: 700, fontSize: 26 * u, letterSpacing: 2 * u, textTransform: 'uppercase', color: ehCta ? cores.texto_escuro : cores.destaque }}>
          {rotulo}
        </div>
      </div>

      {/* Headline gigante — o herói do slide */}
      <div style={{ display: 'flex', marginTop: 28 * u, fontFamily: fontes.titulo, fontSize: 100 * u, lineHeight: 0.95, color: corTitulo, textTransform: 'uppercase' }}>
        {titulo}
      </div>
      <div style={{ width: 140 * u, height: 12 * u, borderRadius: 999, marginTop: 30 * u, backgroundColor: ehCta ? cores.texto_escuro : cores.destaque }} />

      {/* Corpo de apoio, empurrado pra baixo */}
      <div style={{ display: 'flex', flex: 1 }} />
      <div style={{ display: 'flex', fontFamily: fontes.corpo, fontWeight: 600, fontSize: 42 * u, lineHeight: 1.32, color: corCorpo }}>
        {corpo}
      </div>

      {logoCanto(logoUrl, logoPos, largura, 0.9)}
    </div>
  )
}

export const manchete: Template = {
  id: 'manchete',
  nome: 'Manchete',
  descricao: 'Estilo agência: tipografia gigante, alto contraste, foto full na capa, prova em destaque e CTA que estoura.',
  render: (input: SlideInput): ReactElement => (ehCapa(input) ? capa(input) : interno(input)),
}
