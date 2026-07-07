'use client'

// Resultados / atribuição: o que cada peça trouxe (cliques → leads → matrículas
// → receita), lido do CRM pelo content_id (= utm_content do anúncio). É o loop
// que faz o conteúdo aprender com o que vende.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface PerfPeca {
  content_id: string
  tipo: string
  cidade: string | null
  produto_id: string | null
  atributos: Record<string, string>
  criado_em: string
  cliques: number
  leads: number
  matriculas: number
  receita: number
}

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Rollup({ titulo, chave, pecas }: { titulo: string; chave: (p: PerfPeca) => string; pecas: PerfPeca[] }) {
  const grupos = useMemo(() => {
    const m = new Map<string, { cliques: number; leads: number; matriculas: number; receita: number }>()
    for (const p of pecas) {
      const k = chave(p) || '—'
      const g = m.get(k) ?? { cliques: 0, leads: 0, matriculas: 0, receita: 0 }
      g.cliques += p.cliques; g.leads += p.leads; g.matriculas += p.matriculas; g.receita += p.receita
      m.set(k, g)
    }
    return [...m.entries()].sort((a, b) => b[1].matriculas - a[1].matriculas || b[1].leads - a[1].leads)
  }, [pecas, chave])

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="mb-2 text-sm font-semibold text-neutral-300">{titulo}</h3>
      <div className="space-y-1 text-sm">
        {grupos.map(([k, g]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-neutral-850 py-1 last:border-0">
            <span className="truncate text-neutral-300">{k}</span>
            <span className="shrink-0 text-xs text-neutral-500">{g.leads} leads · <span className="text-emerald-400">{g.matriculas} matríc.</span> · {brl(g.receita)}</span>
          </div>
        ))}
        {grupos.length === 0 ? <p className="text-neutral-600">Sem dados ainda.</p> : null}
      </div>
    </div>
  )
}

export default function Resultados() {
  const [pecas, setPecas] = useState<PerfPeca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/performance?brand_id=${BRAND_ID}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setPecas(d.pecas ?? []) })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Falha ao carregar.'))
      .finally(() => setCarregando(false))
  }, [])

  const ordenadas = useMemo(
    () => [...pecas].sort((a, b) => b.matriculas - a.matriculas || b.leads - a.leads || b.cliques - a.cliques),
    [pecas],
  )
  const tot = useMemo(
    () => pecas.reduce((s, p) => ({ cliques: s.cliques + p.cliques, leads: s.leads + p.leads, matriculas: s.matriculas + p.matriculas, receita: s.receita + p.receita }), { cliques: 0, leads: 0, matriculas: 0, receita: 0 }),
    [pecas],
  )
  const comDados = ordenadas.filter((p) => p.cliques || p.leads || p.matriculas)

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Resultados <span className="text-violet-400">por peça</span>
            </h1>
            <p className="mt-1 text-neutral-400">O que cada anúncio trouxe — lido do CRM pelo content_id (utm_content).</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio</Link>
            <Link href="/repositorio" className="text-violet-300 hover:text-violet-200">Repositório</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {/* Totais */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: 'Cliques', v: tot.cliques },
            { l: 'Leads', v: tot.leads },
            { l: 'Matrículas', v: tot.matriculas },
            { l: 'Receita', v: brl(tot.receita) },
          ].map((c) => (
            <div key={c.l} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500">{c.l}</div>
              <div className="mt-1 text-2xl font-bold text-neutral-100">{c.v}</div>
            </div>
          ))}
        </div>

        {carregando ? (
          <p className="text-neutral-500">Carregando…</p>
        ) : comDados.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
            <p className="mb-2 font-semibold text-neutral-200">Ainda sem resultados atribuídos.</p>
            <p>Os números aparecem aqui quando os anúncios rodarem com <code className="text-violet-300">utm_content = content_id</code> da peça. Copie o <b>utm_content</b> no cartão de cada peça (no Repositório) e cole nos parâmetros de URL do anúncio no Meta.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-3 md:grid-cols-2">
              <Rollup titulo="Por categoria de copy (o que converte)" chave={(p) => p.atributos?.categoria} pecas={comDados} />
              <Rollup titulo="Por cidade" chave={(p) => p.cidade ?? '—'} pecas={comDados} />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-neutral-900 text-left text-xs text-neutral-500">
                  <tr>
                    <th className="p-3">Peça</th>
                    <th className="p-3">Ângulo</th>
                    <th className="p-3 text-right">Cliques</th>
                    <th className="p-3 text-right">Leads</th>
                    <th className="p-3 text-right">Matríc.</th>
                    <th className="p-3 text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenadas.map((p) => (
                    <tr key={p.content_id} className="border-t border-neutral-850 hover:bg-neutral-900">
                      <td className="p-3">
                        <div className="font-mono text-[11px] text-violet-300">{p.content_id}</div>
                        <div className="text-xs text-neutral-500">{p.cidade ?? ''} · {p.tipo}</div>
                      </td>
                      <td className="max-w-xs p-3 text-xs text-neutral-400">{p.atributos?.angulo ?? '—'}</td>
                      <td className="p-3 text-right tabular-nums">{p.cliques}</td>
                      <td className="p-3 text-right tabular-nums">{p.leads}</td>
                      <td className="p-3 text-right tabular-nums text-emerald-400">{p.matriculas}</td>
                      <td className="p-3 text-right tabular-nums">{brl(p.receita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-neutral-600">Atribuição last-touch: a peça que trouxe o lead leva o crédito. Receita = valor pago nas matrículas atribuídas.</p>
          </>
        )}
      </div>
    </main>
  )
}
