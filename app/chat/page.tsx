'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

// Marca de teste (Carreira No Digital). Depois vira seletor de marcas.
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
interface Decisao {
  acao: 'perguntar' | 'gerar'
  mensagem: string
  parametros: {
    produto_id: string
    cidade: string
    template: string
    formato: string
    tipo: string
    cta_objetivo: string
    briefing: string
  }
}

type FeedItem =
  | { kind: 'msg'; role: 'user' | 'assistant'; text: string }
  | { kind: 'peca'; result: GenerateResult }
  | { kind: 'erro'; text: string }

export default function Chat() {
  const [feed, setFeed] = useState<FeedItem[]>([
    {
      kind: 'msg',
      role: 'assistant',
      text: 'Oi! Me diz o que você quer publicar — ex.: "carrossel da imersão de Caxias, foco em prova social, chamando pro WhatsApp". Eu decido o resto e já gero.',
    },
  ])
  const [historico, setHistorico] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [pensando, setPensando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  function rolarFim() {
    setTimeout(() => fimRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function anexarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setSubindoFoto(true)
    try {
      for (const file of files) {
        const resp = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || 'Falha ao subir a foto.')
        setFotos((a) => [...a, data.url as string])
      }
    } catch (err) {
      setFeed((f) => [...f, { kind: 'erro', text: err instanceof Error ? err.message : 'Falha ao subir foto.' }])
    } finally {
      setSubindoFoto(false)
    }
  }

  async function gerarPeca(p: Decisao['parametros']) {
    setGerando(true)
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: BRAND_ID,
          produto_id: p.produto_id || undefined,
          cidade: p.cidade || undefined,
          briefing: p.briefing,
          tipo: p.tipo || 'carrossel',
          formato: p.formato || 'feed_quadrado',
          template: p.template || undefined,
          cta_objetivo: p.cta_objetivo || undefined,
          logo: true,
          logo_pos: 'sup_dir',
          fotos,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      setFeed((f) => [...f, { kind: 'peca', result: data as GenerateResult }])
    } catch (err) {
      setFeed((f) => [...f, { kind: 'erro', text: err instanceof Error ? err.message : 'Falha ao gerar.' }])
    } finally {
      setGerando(false)
      rolarFim()
    }
  }

  async function enviar() {
    const texto = input.trim()
    if (!texto || pensando || gerando) return
    setInput('')
    const novoHist = [...historico, { role: 'user' as const, content: texto }]
    setHistorico(novoHist)
    setFeed((f) => [...f, { kind: 'msg', role: 'user', text: texto }])
    setPensando(true)
    rolarFim()
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, mensagens: novoHist, num_fotos: fotos.length }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      const decisao = data as Decisao
      setHistorico((h) => [...h, { role: 'assistant', content: decisao.mensagem }])
      setFeed((f) => [...f, { kind: 'msg', role: 'assistant', text: decisao.mensagem }])
      rolarFim()
      if (decisao.acao === 'gerar') await gerarPeca(decisao.parametros)
    } catch (err) {
      setFeed((f) => [...f, { kind: 'erro', text: err instanceof Error ? err.message : 'Falha na conversa.' }])
    } finally {
      setPensando(false)
      rolarFim()
    }
  }

  return (
    <main className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            MeuEstagiário <span className="text-violet-400">Conversa</span>
          </h1>
          <p className="text-xs text-neutral-500">Peça em português. O agente decide e gera — ou pergunta se faltar.</p>
        </div>
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
          Studio (manual) →
        </Link>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {feed.map((item, i) => {
            if (item.kind === 'msg') {
              const eu = item.role === 'user'
              return (
                <div key={i} className={`flex ${eu ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                      eu ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-100'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              )
            }
            if (item.kind === 'erro') {
              return (
                <div key={i} className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
                  {item.text}
                </div>
              )
            }
            // peça gerada
            const r = item.result
            return (
              <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-neutral-400">
                  <span className="rounded-full bg-neutral-800 px-2.5 py-1">
                    content_id: <code className="text-violet-300">{r.content_id}</code>
                  </span>
                  {Object.entries(r.atributos).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-neutral-800 px-2.5 py-1">
                      {k}: <span className="text-neutral-200">{v}</span>
                    </span>
                  ))}
                </div>
                <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                  {r.assets.slides.map((s) => (
                    <figure key={s.ordem} className="shrink-0 snap-start">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={`slide ${s.ordem}`} className="h-72 w-auto rounded-xl border border-neutral-800" />
                      <figcaption className="mt-1 text-center text-xs text-neutral-500">
                        {s.ordem}. {s.papel}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <details className="mt-3 text-sm text-neutral-300">
                  <summary className="cursor-pointer text-neutral-400">Legenda</summary>
                  <p className="mt-2 whitespace-pre-wrap">{r.assets.legenda}</p>
                  <p className="mt-2 text-violet-300">{r.assets.hashtags.join('  ')}</p>
                </details>
              </div>
            )
          })}
          {pensando ? <div className="text-sm text-neutral-500">O agente está pensando…</div> : null}
          {gerando ? <div className="text-sm text-neutral-500">Gerando a peça… (pode levar até ~40s)</div> : null}
          <div ref={fimRef} />
        </div>
      </div>

      {/* Barra de input */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {fotos.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {fotos.map((url, i) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`anexo ${i + 1}`} className="h-12 w-12 rounded-lg border border-neutral-700 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotos((a) => a.filter((u) => u !== url))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-red-900 hover:text-white"
                    aria-label="remover"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <label className="cursor-pointer rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800">
              {subindoFoto ? '…' : '📎'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={anexarFotos} disabled={subindoFoto} />
            </label>
            <textarea
              className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              placeholder="Ex.: carrossel da imersão de Caxias, foco em prova social, chamar no WhatsApp"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void enviar()
                }
              }}
            />
            <button
              onClick={() => void enviar()}
              disabled={pensando || gerando || !input.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
