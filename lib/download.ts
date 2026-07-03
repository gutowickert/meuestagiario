// =============================================================
// Baixa uma imagem (client-only). Busca o blob e força o download — o atributo
// `download` sozinho é ignorado em URLs cross-origin (Supabase), então abrimos
// via object URL. Fallback: abre em nova aba.
// =============================================================
export async function baixarImagem(url: string, nome: string): Promise<void> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(String(resp.status))
    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

/** Baixa todos os slides em sequência (nomeados por ordem). */
export async function baixarTodas(
  slides: { ordem: number; url: string }[],
  prefixo: string,
): Promise<void> {
  for (const s of slides) {
    await baixarImagem(s.url, `${prefixo}-${String(s.ordem).padStart(2, '0')}.png`)
    await new Promise((r) => setTimeout(r, 350)) // evita o navegador bloquear downloads em rajada
  }
}
