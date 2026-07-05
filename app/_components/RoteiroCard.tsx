'use client'

// Cartão de um ROTEIRO de vídeo (copy falada + legenda). Sem imagem: mostra os
// blocos falados (tempo · papel · fala), a legenda, e passa pelo mesmo portão de
// aprovação (👍/👎) e ajuste (regerar) que as peças de imagem.
import { useState } from 'react'

export interface RoteiroBlocoAsset {
  tempo: string
  papel: string
  fala: string
}
export interface RoteiroResult {
  id: string
  content_id: string
  tipo: string
  atributos: Record<string, string>
  assets: { legenda: string; hashtags: string[]; roteiro: RoteiroBlocoAsset[]; duracao?: string; inteligencia?: boolean }
}

function copiar(texto: string) {
  void navigator.clipboard?.writeText(texto)
}

function roteiroEmTexto(r: RoteiroResult): string {
  const linhas = r.assets.roteiro.map((b) => `[${b.tempo}] ${b.fala}`)
  return `${linhas.join('\n\n')}\n\n---\nLEGENDA:\n${r.assets.legenda}\n\n${r.assets.hashtags.join(' ')}`
}

const COR_PAPEL: Record<string, string> = {
  gancho: 'text-violet-300',
  desenvolvimento: 'text-neutral-400',
  cta: 'text-emerald-300',
}

export function RoteiroCard({
  result,
  brandId,
  onAjustar,
  ajustando,
  estadoInicial,
}: {
  result: RoteiroResult
  brandId: string
  onAjustar?: (nota: string) => void
  ajustando?: boolean
  estadoInicial?: 'aprovado' | 'rejeitado' | null
}) {
  const [feito, setFeito] = useState<'aprovado' | 'rejeitado' | null>(estadoInicial ?? null)
  const [enviandoFb, setEnviandoFb] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function feedback(acao: 'aprovar' | 'rejeitar') {
    const motivo = acao === 'rejeitar' ? window.prompt('Por que não ficou bom? (opcional)') ?? undefined : undefined
    setEnviandoFb(true)
    setErro(null)
    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piece_id: result.id, acao, brand_id: brandId, tipo: result.tipo, atributos: result.atributos, motivo }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao enviar feedback.')
      setFeito(acao === 'aprovar' ? 'aprovado' : 'rejeitado')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao enviar feedback.')
    } finally {
      setEnviandoFb(false)
    }
  }

  function pedirAjuste() {
    const nota = window.prompt('O que você quer mudar no roteiro?')
    if (nota && nota.trim() && onAjustar) onAjustar(nota.trim())
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span className="rounded-full bg-neutral-800 px-2.5 py-1">🎬 roteiro</span>
        {result.assets.duracao ? <span className="rounded-full bg-neutral-800 px-2.5 py-1">{result.assets.duracao}</span> : null}
        {result.assets.inteligencia ? (
          <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-emerald-300" title="Usou o dossiê de voz do cliente do CRM (Camada 3)">
            🧠 voz do cliente
          </span>
        ) : null}
        {Object.entries(result.atributos)
          .filter(([k]) => k !== 'formato' && k !== 'gancho')
          .map(([k, v]) => (
            <span key={k} className="rounded-full bg-neutral-800 px-2.5 py-1">
              {k}: <span className="text-neutral-200">{v}</span>
            </span>
          ))}
      </div>

      {/* Roteiro falado */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400">Roteiro (falado)</span>
          <button
            onClick={() => {
              copiar(roteiroEmTexto(result))
              setCopiado(true)
              setTimeout(() => setCopiado(false), 1500)
            }}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            {copiado ? 'copiado!' : '⧉ copiar tudo'}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {result.assets.roteiro.map((b, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-16 shrink-0 pt-0.5 text-right font-mono text-xs text-neutral-600">{b.tempo}</span>
              <div className="flex-1">
                <span className={`text-[10px] uppercase tracking-wide ${COR_PAPEL[b.papel] ?? 'text-neutral-500'}`}>{b.papel}</span>
                <p className="whitespace-pre-wrap text-sm text-neutral-200">{b.fala}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400">Legenda</span>
          <button onClick={() => copiar(`${result.assets.legenda}\n\n${result.assets.hashtags.join(' ')}`)} className="text-xs text-violet-300 hover:text-violet-200">
            ⧉ copiar legenda
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-neutral-200">{result.assets.legenda}</p>
        <p className="mt-2 text-sm text-violet-300">{result.assets.hashtags.join('  ')}</p>
      </div>

      {erro ? <p className="mt-2 text-xs text-red-300">{erro}</p> : null}

      {/* Ações */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {feito ? (
          <span className={feito === 'aprovado' ? 'text-emerald-400' : 'text-neutral-500'}>
            {feito === 'aprovado' ? '✓ marcado como bom (vira exemplo pras próximas)' : '✕ rejeitado'}
          </span>
        ) : (
          <>
            <button
              onClick={() => void feedback('aprovar')}
              disabled={enviandoFb}
              className="rounded-lg border border-emerald-800 px-3 py-1.5 text-emerald-300 transition hover:bg-emerald-950 disabled:opacity-50"
            >
              👍 Marcar bom
            </button>
            <button
              onClick={() => void feedback('rejeitar')}
              disabled={enviandoFb}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-400 transition hover:bg-neutral-800 disabled:opacity-50"
            >
              👎 Rejeitar
            </button>
          </>
        )}
        {onAjustar ? (
          <button
            onClick={pedirAjuste}
            disabled={ajustando}
            className="rounded-lg border border-violet-800 px-3 py-1.5 text-violet-300 transition hover:bg-violet-950 disabled:opacity-50"
          >
            {ajustando ? 'ajustando…' : '✎ Ajustar'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
