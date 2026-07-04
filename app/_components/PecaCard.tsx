'use client'

// Cartão de uma peça gerada — usado no Chat E no Studio (paridade total).
// Mostra: atributos, tendência (newsjacking), slides + baixar, legenda + opções
// sem re-render, portão de aprovação (👍/👎) e, opcional, "Ajustar" (regerar).
import { useState } from 'react'
import { baixarImagem, baixarTodas } from '@/lib/download'

export interface SlideAsset {
  ordem: number
  papel: string
  url: string
}
export interface PecaResult {
  id: string
  content_id: string
  tipo: string
  atributos: Record<string, string>
  assets: { slides: SlideAsset[]; legenda: string; hashtags: string[] }
  tendencia?: string | null
}

export function PecaCard({
  result,
  brandId,
  produtoId,
  ctaObjetivo,
  onAjustar,
  ajustando,
  estadoInicial,
}: {
  result: PecaResult
  brandId: string
  produtoId?: string
  ctaObjetivo?: string
  onAjustar?: (nota: string) => void
  ajustando?: boolean
  estadoInicial?: 'aprovado' | 'rejeitado' | null
}) {
  const [legenda, setLegenda] = useState(result.assets.legenda)
  const [opcoes, setOpcoes] = useState<string[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState<'aprovado' | 'rejeitado' | null>(estadoInicial ?? null)
  const [enviandoFb, setEnviandoFb] = useState(false)

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

  async function buscarOpcoes() {
    setCarregando(true)
    setErro(null)
    try {
      const resp = await fetch('/api/legenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          produto_id: produtoId || undefined,
          atributos: result.atributos,
          legenda_atual: legenda,
          cta_objetivo: ctaObjetivo || undefined,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao gerar opções.')
      setOpcoes(data.legendas ?? [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar opções.')
    } finally {
      setCarregando(false)
    }
  }

  function pedirAjuste() {
    const nota = window.prompt('O que você quer mudar nesta peça?')
    if (nota && nota.trim() && onAjustar) onAjustar(nota.trim())
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-neutral-400">
        <span className="rounded-full bg-neutral-800 px-2.5 py-1">
          content_id: <code className="text-violet-300">{result.content_id}</code>
        </span>
        {Object.entries(result.atributos).map(([k, v]) => (
          <span key={k} className="rounded-full bg-neutral-800 px-2.5 py-1">
            {k}: <span className="text-neutral-200">{v}</span>
          </span>
        ))}
      </div>

      {result.tendencia ? (
        <details className="mb-3 rounded-xl border border-violet-900 bg-neutral-950 p-3">
          <summary className="cursor-pointer text-xs font-semibold text-violet-300">Tendência surfada (newsjacking)</summary>
          <p className="mt-2 whitespace-pre-wrap text-xs text-neutral-300">{result.tendencia}</p>
        </details>
      ) : null}

      <div className="mb-2 flex justify-end">
        <button
          onClick={() => void baixarTodas(result.assets.slides, result.content_id)}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-800"
        >
          ⤓ Baixar todas
        </button>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {result.assets.slides.map((s) => (
          <figure key={s.ordem} className="shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={`slide ${s.ordem}`} className="h-72 w-auto rounded-xl border border-neutral-800" />
            <figcaption className="mt-1 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <span>{s.ordem}. {s.papel}</span>
              <button
                onClick={() => void baixarImagem(s.url, `${result.content_id}-${String(s.ordem).padStart(2, '0')}.png`)}
                className="text-violet-300 hover:text-violet-200"
              >
                baixar
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Legenda + opções (troca sem re-render) */}
      <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400">Legenda</span>
          <button
            onClick={() => void buscarOpcoes()}
            disabled={carregando}
            className="text-xs text-violet-300 hover:text-violet-200 disabled:opacity-50"
          >
            {carregando ? 'gerando…' : 'outras opções de legenda'}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-neutral-200">{legenda}</p>
        <p className="mt-2 text-sm text-violet-300">{result.assets.hashtags.join('  ')}</p>
        {erro ? <p className="mt-2 text-xs text-red-300">{erro}</p> : null}

        {opcoes ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-neutral-800 pt-3">
            <span className="text-xs text-neutral-500">Escolha uma (troca só o texto, sem regerar imagem):</span>
            {opcoes.map((op, i) => (
              <button
                key={i}
                onClick={() => {
                  setLegenda(op)
                  setOpcoes(null)
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-left text-sm text-neutral-200 transition hover:border-violet-600"
              >
                {op}
              </button>
            ))}
            <button onClick={() => setOpcoes(null)} className="self-start text-xs text-neutral-500 hover:text-neutral-300">
              cancelar
            </button>
          </div>
        ) : null}
      </div>

      {/* Ações: aprovar/rejeitar (memória viva) + ajustar (regerar, opcional) */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {feito ? (
          <span className={feito === 'aprovado' ? 'text-emerald-400' : 'text-neutral-500'}>
            {feito === 'aprovado' ? '✓ marcada como boa (vira exemplo pras próximas)' : '✕ rejeitada'}
          </span>
        ) : (
          <>
            <button
              onClick={() => void feedback('aprovar')}
              disabled={enviandoFb}
              className="rounded-lg border border-emerald-800 px-3 py-1.5 text-emerald-300 transition hover:bg-emerald-950 disabled:opacity-50"
            >
              👍 Marcar boa
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
