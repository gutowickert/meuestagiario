// =============================================================
// Registry de templates (server): mapeia id -> molde. É o ponto pluggável —
// pra crescer a biblioteca, adicione um arquivo de estilo e registre aqui.
// A seleção que aprende (por performance) vai escolher entre estes (CLAUDE.md §12).
// =============================================================
import { editorial } from './editorial'
import { bloco } from './bloco'
import { destaque } from './destaque'
import type { Template } from './types'

export const TEMPLATES: Record<string, Template> = {
  [editorial.id]: editorial,
  [bloco.id]: bloco,
  [destaque.id]: destaque,
}

export const TEMPLATE_PADRAO = editorial.id

/** Retorna o template pedido, ou o padrão se o id não existir. */
export function getTemplate(id: string | null | undefined): Template {
  return (id && TEMPLATES[id]) || TEMPLATES[TEMPLATE_PADRAO]
}
