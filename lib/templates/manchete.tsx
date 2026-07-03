// =============================================================
// Template "manchete" — padrão de agência: tipografia GIGANTE, alto contraste.
// NÃO é um layout fixo: um DISPATCHER escolhe a composição de cada slide pelo
// conteúdo (foto / manchetão / lista / stat), pra o carrossel não ser todo igual.
// Cores alternam claro/escuro; posição oscila. Só Flexbox + absolute (Satori).
// =============================================================
import type { ReactElement } from 'react'
import { logoCanto } from './logo'
import { ehCapa, type SlideInput, type Template } from './types'

// ---- Ritmo de cores: alterna CLARO (creme) e ESCURO (roxo escuro). CTA em menta. ----
interface Esquema {
  bg: string
  titulo: string
  corpo: string
  accent: string
  divisor: string
  claro: boolean // fundo claro -> logo branco some
}

function esquemaDoSlide(ordem: number, papel: string, c: SlideInput['tokens']['cores']): Esquema {
  if (papel === 'cta') {
    // CTA em roxo (destaque) com texto branco — o roxo é a cor da marca.
    return { bg: c.destaque, titulo: c.texto_claro, corpo: c.texto_claro, accent: c.texto_claro, divisor: c.texto_claro, claro: false }
  }
  if (ordem % 2 === 1) {
    return { bg: c.creme, titulo: c.primaria, corpo: c.texto_escuro, accent: c.primaria, divisor: c.destaque, claro: true }
  }
  return { bg: c.primaria_escura, titulo: c.texto_claro, corpo: c.texto_claro, accent: c.destaque, divisor: c.destaque, claro: false }
}

const ANCORAS = ['flex-start', 'center', 'flex-end'] as const

// ---- Peças reutilizáveis ----
function divisor(cor: string, u: number): ReactElement {
  return <div style={{ width: 140 * u, height: 12 * u, borderRadius: 999, marginTop: 26 * u, backgroundColor: cor }} />
}

function listaTopicos(itens: string[], corMarcador: string, corTexto: string, fonteCorpo: string, u: number): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 * u }}>
      {itens.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 * u }}>
          <div style={{ display: 'flex', width: 20 * u, height: 20 * u, marginTop: 16 * u, marginRight: 22 * u, borderRadius: 6 * u, backgroundColor: corMarcador }} />
          <div style={{ display: 'flex', flex: 1, fontFamily: fonteCorpo, fontWeight: 600, fontSize: 40 * u, lineHeight: 1.25, color: corTexto }}>
            {item}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Composição sobre FOTO (capa e slides internos com foto) ----
function sobreFoto(input: SlideInput, conteudo: ReactElement): ReactElement {
  const { largura, altura, tokens, fotoUrl, logoUrl, logoPos } = input
  const { cores } = tokens
  return (
    <div style={{ position: 'relative', display: 'flex', width: largura, height: altura, backgroundColor: cores.primaria_escura }}>
      {fotoUrl ? (
        <img src={fotoUrl} width={largura} height={altura} style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, objectFit: 'cover' }} />
      ) : null}
      <div style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura, display: 'flex', backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.10) 20%, rgba(0,0,0,0.55) 58%, ${cores.primaria_escura} 100%)` }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', padding: 72 * (largura / 1080) }}>
        {conteudo}
      </div>
      {logoCanto(fotoUrl ? logoUrl : undefined, logoPos, largura)}
    </div>
  )
}

// ---- Capa ----
function capa(input: SlideInput): ReactElement {
  const { largura, tokens, titulo, corpo, cidade } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  return sobreFoto(
    input,
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {cidade ? (
        <div style={{ display: 'flex', marginBottom: 22 * u }}>
          <div style={{ display: 'flex', paddingTop: 12 * u, paddingBottom: 12 * u, paddingLeft: 32 * u, paddingRight: 32 * u, borderRadius: 999, backgroundColor: cores.destaque, fontFamily: fontes.titulo, fontSize: 40 * u, color: cores.texto_claro, textTransform: 'uppercase' }}>
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
    </div>,
  )
}

// ---- Slide interno COM foto (headline + destaque/lista sobre a foto) ----
function internoFoto(input: SlideInput): ReactElement {
  const { largura, tokens, titulo, corpo, topicos, destaque } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const lista = (topicos ?? []).filter((t) => t && t.trim())
  return sobreFoto(
    input,
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 82 * u, lineHeight: 0.96, color: cores.texto_claro, textTransform: 'uppercase' }}>
        {titulo}
      </div>
      {destaque && destaque.trim() ? (
        <div style={{ display: 'flex', marginTop: 20 * u, fontFamily: fontes.titulo, fontSize: 58 * u, lineHeight: 0.98, color: cores.destaque, textTransform: 'uppercase' }}>
          {destaque}
        </div>
      ) : lista.length > 0 ? (
        listaTopicos(lista, cores.destaque, cores.texto_claro, fontes.corpo, u)
      ) : corpo ? (
        <div style={{ display: 'flex', marginTop: 20 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 36 * u, lineHeight: 1.28, color: cores.texto_claro }}>
          {corpo}
        </div>
      ) : null}
    </div>,
  )
}

// ---- Slides internos SEM foto: 3 composições escolhidas pelo conteúdo ----
function internoTexto(input: SlideInput): ReactElement {
  const { largura, altura, tokens, ordem, papel, titulo, corpo, topicos, destaque, logoUrl, logoPos } = input
  const { cores, fontes } = tokens
  const u = largura / 1080
  const e = esquemaDoSlide(ordem, papel, cores)
  const ancora = ANCORAS[(ordem - 2 + 3) % 3] ?? 'center'
  const lista = (topicos ?? []).filter((t) => t && t.trim())
  const temDestaque = !!destaque && destaque.trim().length > 0
  const ehProva = papel === 'prova'

  // Formato ALTO (story 9:16): divide topo/base pra preencher a tela (evita sobra).
  const tall = altura / largura >= 1.4
  if (tall) {
    const base =
      lista.length > 0
        ? listaTopicos(lista, e.accent, e.corpo, fontes.corpo, u)
        : corpo
          ? (
            <div style={{ display: 'flex', fontFamily: fontes.corpo, fontWeight: 600, fontSize: 46 * u, lineHeight: 1.32, color: e.corpo }}>
              {corpo}
            </div>
          )
          : null
    return (
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: base ? 'space-between' : 'center', width: largura, height: altura, backgroundColor: e.bg, padding: 90 * u }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 112 * u, lineHeight: 0.94, color: ehProva ? e.accent : e.titulo, textTransform: 'uppercase' }}>
            {titulo}
          </div>
          <div style={{ width: 150 * u, height: 14 * u, borderRadius: 999, marginTop: 30 * u, backgroundColor: e.divisor }} />
          {temDestaque ? (
            <div style={{ display: 'flex', marginTop: 34 * u, fontFamily: fontes.titulo, fontSize: 84 * u, lineHeight: 0.98, color: e.accent, textTransform: 'uppercase' }}>
              {destaque}
            </div>
          ) : null}
        </div>
        {base}
        {logoCanto(e.claro ? undefined : logoUrl, logoPos, largura, 0.9)}
      </div>
    )
  }

  // Escolhe a composição pelo conteúdo -> quebra o layout fixo.
  // STAT: prova/CTA com destaque forte -> o destaque VIRA o herói (gigante).
  // LISTA: tem tópicos -> headline média + lista.
  // MANCHETÃO: resto -> headline gigante + corpo.
  const modo = temDestaque && (papel === 'prova' || papel === 'cta') ? 'stat' : lista.length > 0 ? 'lista' : 'manchete'

  let conteudo: ReactElement
  if (modo === 'stat') {
    conteudo = (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: fontes.corpo, fontWeight: 700, fontSize: 40 * u, lineHeight: 1.1, color: e.titulo, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        {divisor(e.divisor, u)}
        <div style={{ display: 'flex', marginTop: 30 * u, fontFamily: fontes.titulo, fontSize: 132 * u, lineHeight: 0.9, color: e.accent, textTransform: 'uppercase' }}>
          {destaque}
        </div>
        {corpo ? (
          <div style={{ display: 'flex', marginTop: 28 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 38 * u, lineHeight: 1.3, color: e.corpo }}>
            {corpo}
          </div>
        ) : null}
      </div>
    )
  } else if (modo === 'lista') {
    conteudo = (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 78 * u, lineHeight: 0.98, color: e.titulo, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        {divisor(e.divisor, u)}
        {temDestaque ? (
          <div style={{ display: 'flex', marginTop: 26 * u, fontFamily: fontes.titulo, fontSize: 56 * u, lineHeight: 0.98, color: e.accent, textTransform: 'uppercase' }}>
            {destaque}
          </div>
        ) : null}
        {listaTopicos(lista, e.accent, e.corpo, fontes.corpo, u)}
      </div>
    )
  } else {
    conteudo = (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontFamily: fontes.titulo, fontSize: 108 * u, lineHeight: 0.92, color: e.titulo, textTransform: 'uppercase' }}>
          {titulo}
        </div>
        {divisor(e.divisor, u)}
        {temDestaque ? (
          <div style={{ display: 'flex', marginTop: 28 * u, fontFamily: fontes.titulo, fontSize: 64 * u, lineHeight: 0.98, color: e.accent, textTransform: 'uppercase' }}>
            {destaque}
          </div>
        ) : null}
        {corpo ? (
          <div style={{ display: 'flex', marginTop: 30 * u, fontFamily: fontes.corpo, fontWeight: 600, fontSize: 42 * u, lineHeight: 1.32, color: e.corpo }}>
            {corpo}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: ancora, width: largura, height: altura, backgroundColor: e.bg, padding: 80 * u }}>
      {conteudo}
      {logoCanto(e.claro ? undefined : logoUrl, logoPos, largura, 0.9)}
    </div>
  )
}

export const manchete: Template = {
  id: 'manchete',
  nome: 'Manchete',
  descricao: 'Estilo agência: composição varia por slide (foto, manchetão, lista, stat), cores alternam e o destaque salta.',
  render: (input: SlideInput): ReactElement => {
    if (ehCapa(input)) return capa(input)
    if (input.fotoUrl) return internoFoto(input)
    return internoTexto(input)
  },
}
