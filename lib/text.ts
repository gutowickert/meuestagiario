// Utilitários de texto pro render. O Satori (@vercel/og) quebra linha em espaços
// comuns — então valores como "R$ 797,00" partem entre o "R$" e o número. Trocamos
// por espaço inquebrável (nbsp, U+00A0) pra manter o valor inteiro na mesma linha.
const NBSP = String.fromCharCode(160)

export function protegerValores(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/R\$\s+/g, `R$${NBSP}`) // "R$ 797,00" não parte entre "R$" e o número
    .replace(/(\d)\s*x\s+de\b/gi, `$1x${NBSP}de`) // "12 x de" / "12x de" -> junto
}
