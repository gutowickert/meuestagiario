// =============================================================
// Gera o content_id — o elo de atribuição (vira utm_content no anúncio).
// Formato URL-safe [a-z0-9-], legível no relatório do Meta e único.
// Ex.: me-anl-caxias-carrossel-k3f9x2
// =============================================================

/** Reduz um texto a um slug curto e seguro pra UTM. */
function slug(v: string | undefined | null, max = 12): string {
  if (!v) return ''
  return v
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
}

export interface ContentIdParts {
  produto_id?: string | null
  cidade?: string | null
  tipo: string
}

/** Monta um content_id único e rastreável a partir dos atributos da peça. */
export function gerarContentId(parts: ContentIdParts): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 6)
  const pedacos = ['me', slug(parts.produto_id), slug(parts.cidade), slug(parts.tipo), rand]
  return pedacos.filter(Boolean).join('-')
}
