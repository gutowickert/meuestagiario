// =============================================================
// Registro de formatos e tipos de peça — fonte única.
// "tipo" = o que é a peça (vai na coluna content_pieces.tipo).
// "formato" = a proporção/canvas (vai em content_pieces.atributos.formato).
// O template lê a dimensão daqui; nunca cravar largura/altura no template.
// =============================================================

// ---- Formatos (proporção / dimensão do canvas) ----

export type FormatoId = 'feed_quadrado' | 'feed_retrato' | 'story'

export interface Formato {
  id: FormatoId
  nome: string
  proporcao: string // ex.: "1:1"
  largura: number // px
  altura: number // px
  usos: string // onde esse formato costuma ser usado
}

export const FORMATOS: Record<FormatoId, Formato> = {
  feed_quadrado: {
    id: 'feed_quadrado',
    nome: 'Feed quadrado',
    proporcao: '1:1',
    largura: 1080,
    altura: 1080,
    usos: 'feed, carrossel',
  },
  feed_retrato: {
    id: 'feed_retrato',
    nome: 'Feed retrato',
    proporcao: '4:5',
    largura: 1080,
    altura: 1350,
    usos: 'feed e anúncio de imagem (ocupa mais tela)',
  },
  story: {
    id: 'story',
    nome: 'Story / Reel',
    proporcao: '9:16',
    largura: 1080,
    altura: 1920,
    usos: 'stories e capa de reels (tela cheia vertical)',
  },
}

export const FORMATO_PADRAO: FormatoId = 'feed_quadrado'

export function isFormatoValido(id: string): id is FormatoId {
  return id in FORMATOS
}

/** Retorna o formato ou lança erro legível se o id for inválido. */
export function getFormato(id: string): Formato {
  if (!isFormatoValido(id)) {
    const validos = Object.keys(FORMATOS).join(', ')
    throw new Error(`Formato inválido: "${id}". Válidos: ${validos}.`)
  }
  return FORMATOS[id]
}

// ---- Tipos de peça ----
// Valores alinhados ao CHECK do banco (db/001_fatia1_schema.sql):
// 'carrossel' | 'anuncio_imagem' | 'reel' | 'organico'.
// Na Fatia 1 estão ativos apenas carrossel e imagem única (anuncio_imagem).

export type TipoPeca = 'carrossel' | 'anuncio_imagem' | 'reel' | 'organico'

export interface TipoConfig {
  id: TipoPeca
  nome: string
  minSlides: number
  maxSlides: number
  ativoFatia1: boolean
}

export const TIPOS: Record<TipoPeca, TipoConfig> = {
  carrossel: {
    id: 'carrossel',
    nome: 'Carrossel',
    minSlides: 3,
    maxSlides: 8,
    ativoFatia1: true,
  },
  anuncio_imagem: {
    id: 'anuncio_imagem',
    nome: 'Imagem única',
    minSlides: 1,
    maxSlides: 1,
    ativoFatia1: true,
  },
  reel: {
    id: 'reel',
    nome: 'Reel',
    minSlides: 1,
    maxSlides: 1,
    ativoFatia1: false, // Fatia 4
  },
  organico: {
    id: 'organico',
    nome: 'Orgânico',
    minSlides: 1,
    maxSlides: 8,
    ativoFatia1: false,
  },
}

export function isTipoValido(id: string): id is TipoPeca {
  return id in TIPOS
}

/** Retorna o tipo (apenas os ativos na Fatia 1) ou lança erro legível. */
export function getTipoAtivo(id: string): TipoConfig {
  if (!isTipoValido(id) || !TIPOS[id].ativoFatia1) {
    const ativos = Object.values(TIPOS)
      .filter((t) => t.ativoFatia1)
      .map((t) => t.id)
      .join(', ')
    throw new Error(`Tipo inválido ou não disponível na Fatia 1: "${id}". Ativos: ${ativos}.`)
  }
  return TIPOS[id]
}
