// =============================================================
// Contrato comum dos templates (moldes). Um template é agnóstico de marca:
// recebe os tokens da marca + o conteúdo do slide (slots) e devolve JSX.
// Isso é o que faz a MESMA copy render em vários layouts, e o MESMO layout
// virar marcas diferentes só trocando os tokens (CLAUDE.md §12).
// =============================================================
import type { ReactElement } from 'react'
import type { CapaTokens } from './slide-capa'

export type { CapaTokens }

/** Papel do slide dentro do carrossel. */
export type PapelSlide = 'gancho' | 'desenvolvimento' | 'prova' | 'cta'

/** Onde posicionar o logo (ou ocultar). Escolha do usuário por peça. */
export type LogoPos = 'sup_esq' | 'sup_dir' | 'inf_esq' | 'inf_dir' | 'oculto'

export const LOGO_POS_PADRAO: LogoPos = 'sup_dir'

/** Slots que qualquer template recebe pra um slide. Nem todo molde usa todos. */
export interface SlideInput {
  largura: number
  altura: number
  tokens: CapaTokens
  ordem: number
  papel: PapelSlide | string
  titulo: string
  corpo: string
  topicos?: string[] // itens de lista (quando o slide é enumeração); senão vazio
  destaque?: string // frase/estatística-chave a realçar em cor de acento (opcional)
  cidade?: string
  fotoUrl?: string
  logoUrl?: string
  logoPos?: LogoPos
}

/** Um molde de layout. `id` casa com o catálogo client-safe. */
export interface Template {
  id: string
  nome: string
  descricao: string
  /** true = este slide é a capa (gancho/primeiro). Regra comum a todos os moldes. */
  render: (input: SlideInput) => ReactElement
}

/** Regra única de "o que é capa": primeiro slide ou papel gancho. */
export function ehCapa(input: Pick<SlideInput, 'ordem' | 'papel'>): boolean {
  return input.ordem === 1 || input.papel === 'gancho'
}
