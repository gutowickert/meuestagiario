// =============================================================
// Adapter da INTELIGÊNCIA DO CLIENTE (Camada 3 — "o que vende", CLAUDE.md §8).
// Consome a API do CRM (serviço separado, banco compartilhado) que destila as
// conversas reais em dossiê por produto × cidade: perfil, dores (falas literais),
// desejos, gatilhos, objeções + como preemptar, motivos de perda, ângulos de
// conteúdo, banco de frases reais e provas sociais.
//
// Desacoplado de propósito: pra revenda, troca-se a fonte aqui sem tocar no motor.
// Falha graciosa (retorna null) — se o CRM estiver fora, a geração roda sem a
// Camada 3 (guardrail: nunca fabricar "vencedores").
// =============================================================

export type DossieCliente = Record<string, unknown>

/**
 * Busca o dossiê de um produto (e opcionalmente cidade) na API do CRM.
 * `produtoNome` = nome completo do produto (ex.: "Anúncios para Negócios Locais"),
 * que é como o CRM indexa. Devolve null se faltar config, der erro ou vier vazio.
 */
export async function getDossieCliente(
  produtoNome: string | null | undefined,
  cidade?: string | null,
): Promise<DossieCliente | null> {
  const base = process.env.CRM_BASE_URL
  if (!base || !produtoNome) return null

  try {
    const url = new URL('/api/inteligencia-cliente', base)
    url.searchParams.set('produto', produtoNome)
    if (cidade) url.searchParams.set('cidade', cidade)

    const headers: Record<string, string> = { Accept: 'application/json' }
    if (process.env.CRM_API_KEY) headers.Authorization = `Bearer ${process.env.CRM_API_KEY}`

    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
    if (!resp.ok) return null

    const data = (await resp.json()) as unknown
    // Aceita tanto o dossiê direto quanto um envelope { dossie: {...} }.
    const dossie =
      data && typeof data === 'object' && 'dossie' in data
        ? (data as { dossie: unknown }).dossie
        : data

    if (!dossie || typeof dossie !== 'object' || Object.keys(dossie as object).length === 0) {
      return null
    }
    return dossie as DossieCliente
  } catch {
    return null
  }
}
