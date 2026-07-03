// =============================================================
// Newsjacking (VISAO §12 / norte): busca o que está acontecendo na internet
// (web search do Claude) e devolve um BRIEF de como surfar a tendência conectando
// ao nicho da marca. Chamada SEPARADA da geração — web search não combina com
// structured output; o brief é injetado no prompt de geração depois.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'

function hojeBR(): string {
  // Data de hoje no fuso do Brasil (o modelo não sabe a data sozinho).
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function sistema(brand: Brand, produto: Produto | null): string {
  return [
    `Você é um estrategista de conteúdo de "${brand.nome}" (nicho: ${brand.nicho ?? '—'}; público: ${brand.publico ?? '—'}).`,
    produto ? `Produto em foco: ${produto.nome} — ${produto.oferta ?? ''}.` : '',
    '',
    `HOJE É: ${hojeBR()}. Estamos no BRASIL (Rio Grande do Sul, fuso America/Sao_Paulo).`,
    'Use a busca na web pra achar 1 ASSUNTO QUENTE DE VERDADE NESTA DATA (notícia, tendência, evento, meme, personalidade, jogo, lançamento — algo muito comentado no Brasil AGORA, nos últimos dias/semana).',
    '',
    'REGRAS DURAS:',
    '- Baseie-se SÓ no que a busca retornou e que seja recente/atual pra HOJE. Confira as datas dos resultados.',
    '- NÃO invente. E NÃO chute um evento sazonal que NÃO está acontecendo nesta data (ex.: não fale de Black Friday em julho). Se está longe da data, não serve.',
    '- Se a busca não trouxer nada quente confiável pra hoje, DIGA ISSO honestamente e sugira 1 gancho perene seguro — deixando claro que não é "trend do dia".',
    '- Busque com termos em pt-BR e priorize fontes/resultados do Brasil.',
    '',
    'DEVOLVA UM BRIEF CURTO (pt-BR), com:',
    '1) TENDÊNCIA: o que está acontecendo AGORA (1-2 frases, concreto, com a data/período).',
    '2) GANCHO: como amarrar ao negócio/nicho de forma inteligente (a ponte).',
    '3) ÂNGULO: a ideia central do post que aproveita a onda pra chegar no objetivo da marca.',
    'Escolha a melhor e entregue — nada de lista de opções.',
  ]
    .filter(Boolean)
    .join('\n')
}

// Localização da busca no Brasil/RS pra resultados pt-BR e locais.
const LOCAL = { type: 'approximate' as const, country: 'BR', region: 'Rio Grande do Sul', timezone: 'America/Sao_Paulo' }

/** Busca uma tendência atual e devolve o brief de newsjacking (texto). */
export async function buscarTendencia(
  brand: Brand,
  produto: Produto | null,
  tema?: string | null,
): Promise<string> {
  const anthropic = getAnthropic()
  const pedido = tema?.trim()
    ? `Foque neste tema/assunto que está em alta: "${tema.trim()}". Confirme na busca e monte o gancho.`
    : 'Ache um assunto quente agora e monte o gancho.'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: pedido }]

  let resp = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 3000,
    thinking: { type: 'adaptive' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5, user_location: LOCAL }],
    system: [{ type: 'text', text: sistema(brand, produto) }],
    messages,
  })

  // Server tool loop pode pausar (pause_turn) — reenvia pra continuar.
  let guard = 0
  while (resp.stop_reason === 'pause_turn' && guard < 3) {
    messages.push({ role: 'assistant', content: resp.content })
    resp = await anthropic.messages.create({
      model: MODEL_ESTRATEGIA,
      max_tokens: 3000,
      thinking: { type: 'adaptive' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5, user_location: LOCAL }],
      system: [{ type: 'text', text: sistema(brand, produto) }],
      messages,
    })
    guard++
  }

  return resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('\n')
    .trim()
}
