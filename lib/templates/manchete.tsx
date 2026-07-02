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

// Ritmo de cores: alterna CLARO (creme) e ESCURO (roxo escuro da marca) entre os
// slides pra criar quebra visual. CTA estoura em menta. (Sem o roxo claro que
// "fugia do tom".)
interface Esquema {
  bg: string
  titulo: string
  corpo: string
  accent: string
  rotulo: string
  divisor: string
  claro: boolean // fundo claro -> logo branco fica invisível, então some
}

function esquemaDoSlide(ordem: number, papel: string, c: SlideInput['tokens']['cores']): Esquema {
  if (papel === 'cta') {
    return { bg: c.destaque, titulo: c.texto_escuro, corpo: c.texto_escuro, accent: c.primaria, rotulo: c.texto_escuro, divisor: c.texto_escuro, claro: true }
  }
  // Alterna claro/escuro pela paridade (capa = 1; internos 2,3,4,5...).
  if (ordem % 2 === 1) {
    return { bg: c.creme, titulo: c.primaria, corpo: c.texto_escuro, accent: c.primaria, rotulo: c.primaria, divisor: c.destaque, claro: true }
  }
  return { bg: c.primaria_escura, titulo: c.texto_claro, corpo: c.texto_claro, accent: c.destaque, rotulo: c.destaque, divisor: c.destaque, claro: false }
}

// Âncora vertical do conteúdo — oscila entre topo/centro/base pra o carrossel
// não ter todo texto na mesma posição.
const ANCORAS = ['flex-start', 'center', 'flex-end'] as const

// ---- Internos: tipografia gigante + destaque + lista + posição que oscila ----
function interno(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, topicos, destaque, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const ehProva = papel === 'prova'
  const e = esquemaDoSlide(ordem, papel, cores)
  const rotulo = `${ROTULO[papel] ?? 'Slide'} ${ordem}`
  const corTitulo = ehProva ? e.accent : e.titulo
  const temDestaque = !!destaque && destaque.trim().length > 0
  const lista = (topicos ?? []).filter((t) => t && t.trim().length > 0)
  const ancora = ANCORAS[(ordem - 2 + 3) % 3] ?? 'center'

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: ancora, width: largura, height: altura, backgroundColor: e.bg, padding: 80 * u }}>
      {/* Bloco de conteúdo agrupado (não fica "jogado") */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Rótulo */}
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', fontFamily: fontes.corpo, fontWeight: 700, fontSize: 26 * u, letterSpacing: 2 * u, textTransform: 'uppercase', color: e.rotulo }}>
            {rotulo}
          </div>
        </div>

        {/* Headline gigante */}
        <div style={{ display: 'flex', marginTop: 24 * u, fontFamily: fontes.titulo, fontSize: 92 * u, lineHeight: 0.95, color: corTitulo, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        <div style={{ width: 140 * u, height: 12 * u, borderRadius: 999, marginTop: 26 * u, backgroundColor: e.divisor }} />

        {/* Destaque em acento */}
        {temDestaque ? (
          <div style={{ display: 'flex', marginTop: 32 * u, fontFamily: fontes.titulo, fontSize: 70 * u, lineHeight: 0.98, color: e.accent, textTransform: 'uppercase' }}>
            {destaque}
          </div>
        ) : null}

        {/* Lista formatada (tópicos) OU corpo em prosa */}
        {lista.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 * u }}>
            {lista.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 * u }}>
                <div style={{ display: 'flex', width: 20 * u, height: 20 * u, marginTop: 16 * u, marginRight: 22 * u, borderRadius: 6 * u, backgroundColor: e.accent }} />
                <div style={{ display: 'flex', flex: 1, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 40 * u, lineHeight: 1.25, color: e.corpo }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        ) : corpo ? (
          <div style={{ display: 'flex', marginTop: 34 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 42 * u, lineHeight: 1.32, color: e.corpo }}>
            {corpo}
          </div>
        ) : null}
      </div>

      {logoCanto(e.claro ? undefined : logoUrl, logoPos, largura, 0.9)}
    </div>
  )
}

export const manchete: Template = {
  id: 'manchete',
  nome: 'Manchete',
  descricao: 'Estilo agência: tipografia gigante, alto contraste, foto full na capa, prova em destaque e CTA que estoura.',
  render: (input: SlideInput): ReactElement => (ehCapa(input) ? capa(input) : interno(input)),
}
