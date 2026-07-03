// =============================================================
// Newsjacking (VISAO §12 / norte): busca o que está acontecendo na internet
// (web search do Claude) e devolve um BRIEF de como surfar a tendência conectando
// ao nicho da marca. Chamada SEPARADA da geração — web search não combina com
// structured output; o brief é injetado no prompt de geração depois.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'

function sistema(brand: Brand, produto: Produto | null): string {
  return [
    `Você é um estrategista de conteúdo de "${brand.nome}" (nicho: ${brand.nicho ?? '—'}; público: ${brand.publico ?? '—'}).`,
    produto ? `Produto em foco: ${produto.nome} — ${produto.oferta ?? ''}.` : '',
    '',
    'TAREFA: usar a busca na web pra achar 1 ASSUNTO QUENTE AGORA (notícia, tendência, evento, meme, data, algo muito comentado na internet — de preferência no Brasil/pt-BR) e conectar de forma inteligente ao negócio, como um gancho de conteúdo.',
    'Busque com termos atuais; priorize o que está em alta AGORA. Não invente fatos — use o que a busca trouxe.',
    '',
    'DEVOLVA UM BRIEF CURTO (sem enrolação), em pt-BR, com:',
    '1) TENDÊNCIA: o que está acontecendo (1-2 frases, concreto).',
    '2) GANCHO: como amarrar isso ao negócio/nicho de forma inteligente (a ponte).',
    '3) ÂNGULO: a ideia central do post que aproveita a onda pra chegar no objetivo da marca.',
    'Seja específico e usável. Nada de lista de opções — escolha a melhor e entregue.',
  ]
    .filter(Boolean)
    .join('\n')
}

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
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
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
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
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
