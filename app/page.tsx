'use client'

import { useState } from 'react'

// Brand de teste (Carreira No Digital). Depois vira um seletor de marcas.
const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface SlideAsset {
  ordem: number
  papel: string
  url: string
}
interface GenerateResult {
  content_id: string
  atributos: Record<string, string>
  assets: { slides: SlideAsset[]; legenda: string; hashtags: string[] }
}

export default function Studio() {
  const [cidade, setCidade] = useState('Caxias do Sul')
  const [produto, setProduto] = useState('ANL')
  const [tipo, setTipo] = useState('carrossel')
  const [formato, setFormato] = useState('feed_quadrado')
  const [briefing, setBriefing] = useState(
    'Anunciar a próxima turma de Anúncios para Negócios Locais, foco em dono de comércio que quer mais clientes.',
  )
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)

  async function gerar() {
    setLoading(true)
    setErro(null)
    setResult(null)
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: BRAND_ID,
          produto_id: produto,
          cidade,
          briefing,
          tipo,
          formato,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      setResult(data)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            MeuEstagiário <span className="text-violet-400">Studio</span>
          </h1>
          <p className="mt-1 text-neutral-400">
            Gere um carrossel da Carreira No Digital a partir de um briefing.
          </p>
        </header>

        {/* Formulário */}
        <section className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Cidade / turma</span>
              <input
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Produto</span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
              >
                <option value="FC">Formação Completa (FC)</option>
                <option value="ANL">Anúncios p/ Negócios Locais (ANL)</option>
                <option value="MAPA">Imersão Mapa Digital</option>
                <option value="IA">Imersão IA para Conteúdo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Tipo</span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="carrossel">Carrossel</option>
                <option value="anuncio_imagem">Imagem única</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Formato</span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
              >
                <option value="feed_quadrado">Feed quadrado (1:1)</option>
                <option value="feed_retrato">Feed retrato (4:5)</option>
                <option value="story">Story / Reel (9:16)</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Briefing</span>
            <textarea
              className="min-h-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
            />
          </label>
          <button
            onClick={gerar}
            disabled={loading || !briefing.trim()}
            className="mt-1 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Gerando… (pode levar até ~40s)' : 'Gerar peça'}
          </button>
          {erro ? (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p>
          ) : null}
        </section>

        {/* Resultado */}
        {result ? (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
              <span className="rounded-full bg-neutral-800 px-3 py-1">
                content_id: <code className="text-violet-300">{result.content_id}</code>
              </span>
              {Object.entries(result.atributos).map(([k, v]) => (
                <span key={k} className="rounded-full bg-neutral-800 px-3 py-1">
                  {k}: <span className="text-neutral-200">{v}</span>
                </span>
              ))}
            </div>

            {/* Galeria de slides */}
            <div className="flex snap-x gap-4 overflow-x-auto pb-3">
              {result.assets.slides.map((s) => (
                <figure key={s.ordem} className="shrink-0 snap-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={`slide ${s.ordem} (${s.papel})`}
                    className="h-80 w-auto rounded-xl border border-neutral-800"
                  />
                  <figcaption className="mt-1 text-center text-xs text-neutral-500">
                    {s.ordem}. {s.papel}
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Legenda + hashtags */}
            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h2 className="mb-2 text-sm font-semibold text-neutral-400">Legenda</h2>
              <p className="whitespace-pre-wrap text-neutral-200">{result.assets.legenda}</p>
              <p className="mt-3 text-sm text-violet-300">{result.assets.hashtags.join('  ')}</p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
