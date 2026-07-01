// =============================================================
// Client Anthropic — SÓ backend (usa ANTHROPIC_API_KEY do ambiente).
// Criação lazy pra dar erro legível se faltar a chave.
// =============================================================
import Anthropic from '@anthropic-ai/sdk'

let cached: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (cached) return cached
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta a variável de ambiente ANTHROPIC_API_KEY.')
  }
  cached = new Anthropic() // lê ANTHROPIC_API_KEY automaticamente
  return cached
}

// Opus para estratégia/brief (raciocínio pesado, 1x por peça — CLAUDE.md seção 8).
export const MODEL_ESTRATEGIA = 'claude-opus-4-8'
