'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ROTEIRO } from '@/lib/onboarding-roteiro'
import type { PropostaOnboarding, MarcaProposta, ProdutoProposto } from '@/lib/onboarding'

// Marca de teste (Carreira No Digital). Depois vira um seletor de marcas.
const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

const inputCls =
  'rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-violet-500'

export default function Onboarding() {
  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [gravando, setGravando] = useState(false)
  const [transcrevendo, setTranscrevendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [gerando, setGerando] = useState(false)
  const [proposta, setProposta] = useState<PropostaOnboarding | null>(null)
  const [aplicando, setAplicando] = useState(false)
  const [aplicado, setAplicado] = useState<string | null>(null)

  const [prints, setPrints] = useState<string[]>([])
  const [subindoPrint, setSubindoPrint] = useState(false)
  const [extraindo, setExtraindo] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function subirPrints(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setSubindoPrint(true)
    setErro(null)
    try {
      for (const file of files) {
        const resp = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || 'Falha ao subir o print.')
        setPrints((a) => [...a, data.url as string])
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao subir o print.')
    } finally {
      setSubindoPrint(false)
    }
  }

  async function extrairPrints() {
    setExtraindo(true)
    setErro(null)
    setProposta(null)
    setAplicado(null)
    try {
      const resp = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, imagens: prints }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao extrair.')
      setProposta(data as PropostaOnboarding)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao extrair.')
    } finally {
      setExtraindo(false)
    }
  }

  const atual = ROTEIRO[idx]
  const respondidas = ROTEIRO.filter((q) => respostas[q.id]?.trim()).length

  function setResposta(id: string, texto: string) {
    setRespostas((r) => ({ ...r, [id]: texto }))
  }

  async function enviarAudio(blob: Blob) {
    setTranscrevendo(true)
    setErro(null)
    try {
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao transcrever.')
      const novo = (data.transcript ?? '').trim()
      if (!novo) {
        setErro('Não consegui captar fala nesse áudio. Tente de novo, mais perto do microfone.')
        return
      }
      // Acumula na resposta atual (permite gravar em partes).
      setRespostas((r) => ({ ...r, [atual.id]: [r[atual.id], novo].filter(Boolean).join(' ') }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setTranscrevendo(false)
    }
  }

  async function iniciarGravacao() {
    setErro(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        void enviarAudio(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setGravando(true)
    } catch {
      setErro('Não consegui acessar o microfone. Verifique a permissão do navegador.')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void enviarAudio(file)
    e.target.value = '' // permite reenviar o mesmo arquivo
  }

  function montarTranscricao(): string {
    return ROTEIRO.map((q) => {
      const r = respostas[q.id]?.trim()
      if (!r) return null
      return `## ${q.titulo}\nPergunta: ${q.pergunta}\nResposta: ${r}`
    })
      .filter(Boolean)
      .join('\n\n')
  }

  async function gerarProposta() {
    setGerando(true)
    setErro(null)
    setProposta(null)
    setAplicado(null)
    try {
      const resp = await fetch('/api/onboarding/estruturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, transcricao: montarTranscricao() }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao gerar a proposta.')
      setProposta(data as PropostaOnboarding)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setGerando(false)
    }
  }

  function editarMarca(campo: keyof MarcaProposta, valor: string) {
    setProposta((p) => (p ? { ...p, marca: { ...p.marca, [campo]: valor } } : p))
  }
  function editarProduto(i: number, campo: keyof ProdutoProposto, valor: string) {
    setProposta((p) => {
      if (!p) return p
      const produtos = p.produtos.map((pr, j) => (j === i ? { ...pr, [campo]: valor } : pr))
      return { ...p, produtos }
    })
  }

  async function aplicar() {
    if (!proposta) return
    setAplicando(true)
    setErro(null)
    try {
      const resp = await fetch('/api/onboarding/aplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, marca: proposta.marca, produtos: proposta.produtos }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao aplicar.')
      setAplicado(
        `Contexto salvo. Produtos: ${data.produtos_criados} criados, ${data.produtos_atualizados} atualizados.`,
      )
      setProposta(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setAplicando(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Onboarding <span className="text-violet-400">por áudio</span>
            </h1>
            <p className="mt-1 text-neutral-400">
              Responda falando. O sistema transcreve e monta o contexto da marca e dos produtos.
            </p>
          </div>
          <Link href="/contexto" className="text-sm text-violet-300 hover:text-violet-200">
            Contexto →
          </Link>
        </header>

        {erro ? (
          <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p>
        ) : null}
        {aplicado ? (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            {aplicado}{' '}
            <Link href="/contexto" className="underline">
              Ver em Contexto
            </Link>
          </p>
        ) : null}

        {/* ---- Importar por print ---- */}
        {!proposta ? (
          <section className="mb-6 grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div>
              <h2 className="text-lg font-semibold text-violet-300">Importar por print do site</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Suba prints do seu site (home, páginas de curso, ofertas). O sistema lê as imagens e monta o contexto
                — marca e produtos — pra você revisar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800">
                {subindoPrint ? 'Enviando…' : 'Adicionar prints'}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={subirPrints} disabled={subindoPrint} />
              </label>
              {prints.map((url, i) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`print ${i + 1}`} className="h-14 w-14 rounded-lg border border-neutral-700 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPrints((a) => a.filter((u) => u !== url))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-red-900 hover:text-white"
                    aria-label="remover"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {prints.length > 0 ? (
              <button
                onClick={() => void extrairPrints()}
                disabled={extraindo || subindoPrint}
                className="w-fit rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {extraindo ? 'Lendo os prints…' : `Extrair contexto de ${prints.length} print(s)`}
              </button>
            ) : null}
            <p className="text-xs text-neutral-600">Ou responda a entrevista por áudio abaixo.</p>
          </section>
        ) : null}

        {/* ---- Entrevista ---- */}
        {!proposta ? (
          <section className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>
                Pergunta {idx + 1} de {ROTEIRO.length}
              </span>
              <span>{respondidas} respondida(s)</span>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-violet-300">{atual.titulo}</h2>
              <p className="mt-1 text-neutral-100">{atual.pergunta}</p>
              <p className="mt-1 text-sm text-neutral-500">{atual.dica}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!gravando ? (
                <button
                  onClick={iniciarGravacao}
                  disabled={transcrevendo}
                  className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  ● Gravar resposta
                </button>
              ) : (
                <button
                  onClick={pararGravacao}
                  className="animate-pulse rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
                >
                  ■ Parar e transcrever
                </button>
              )}
              <label className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800">
                Enviar áudio
                <input type="file" accept="audio/*" className="hidden" onChange={onUpload} />
              </label>
              {transcrevendo ? <span className="text-sm text-neutral-400">Transcrevendo…</span> : null}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Resposta (transcrita — pode editar)</span>
              <textarea
                className={`${inputCls} min-h-32`}
                value={respostas[atual.id] ?? ''}
                onChange={(e) => setResposta(atual.id, e.target.value)}
                placeholder="A transcrição aparece aqui. Você também pode digitar."
              />
            </label>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-40"
              >
                ← Anterior
              </button>
              {idx < ROTEIRO.length - 1 ? (
                <button
                  onClick={() => setIdx((i) => Math.min(ROTEIRO.length - 1, i + 1))}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition hover:bg-neutral-800"
                >
                  Próxima →
                </button>
              ) : (
                <button
                  onClick={gerarProposta}
                  disabled={gerando || respondidas === 0}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {gerando ? 'Gerando…' : 'Gerar proposta de contexto'}
                </button>
              )}
            </div>
            {idx === ROTEIRO.length - 1 && respondidas === 0 ? (
              <p className="text-sm text-neutral-500">Responda ao menos uma pergunta para gerar a proposta.</p>
            ) : null}
          </section>
        ) : null}

        {/* ---- Revisão da proposta ---- */}
        {proposta ? (
          <section className="grid gap-6">
            <div className="rounded-2xl border border-emerald-900 bg-neutral-900 p-5">
              <h2 className="text-sm font-semibold text-emerald-300">Proposta gerada — revise antes de aplicar</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">{proposta.resumo}</p>
            </div>

            {/* Marca */}
            <div className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="font-semibold">Marca</h3>
              {(['nome', 'nicho', 'oferta', 'publico', 'tom', 'metodo'] as const).map((campo) => (
                <label key={campo} className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-400 capitalize">{campo}</span>
                  <textarea
                    className={`${inputCls} ${campo === 'metodo' ? 'min-h-28' : 'min-h-14'}`}
                    value={proposta.marca[campo] ?? ''}
                    onChange={(e) => editarMarca(campo, e.target.value)}
                  />
                </label>
              ))}
              <p className="text-xs text-neutral-500">
                Provas ({proposta.marca.provas.length}) e objeções ({proposta.marca.objecoes.length}) serão salvas
                junto. Ajuste-as depois em Contexto.
              </p>
            </div>

            {/* Produtos */}
            <div className="grid gap-4">
              <h3 className="font-semibold">Produtos ({proposta.produtos.length})</h3>
              {proposta.produtos.map((p, i) => (
                <div key={i} className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-neutral-400">Código</span>
                      <input
                        className={inputCls}
                        value={p.codigo ?? ''}
                        onChange={(e) => editarProduto(i, 'codigo', e.target.value)}
                      />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1 text-sm">
                      <span className="text-neutral-400">Nome</span>
                      <input
                        className={inputCls}
                        value={p.nome ?? ''}
                        onChange={(e) => editarProduto(i, 'nome', e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">Oferta</span>
                    <textarea
                      className={`${inputCls} min-h-14`}
                      value={p.oferta ?? ''}
                      onChange={(e) => editarProduto(i, 'oferta', e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">Método do produto</span>
                    <textarea
                      className={`${inputCls} min-h-24`}
                      value={p.metodo ?? ''}
                      onChange={(e) => editarProduto(i, 'metodo', e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-neutral-500">
                    Público, meta, provas ({p.provas.length}) e objeções ({p.objecoes.length}) também serão salvos.
                  </p>
                </div>
              ))}
              {proposta.produtos.length === 0 ? (
                <p className="text-neutral-500">Nenhum produto identificado na conversa.</p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <button
                onClick={aplicar}
                disabled={aplicando}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {aplicando ? 'Aplicando…' : 'Aplicar ao contexto'}
              </button>
              <button
                onClick={() => setProposta(null)}
                className="rounded-lg border border-neutral-700 px-5 py-2.5 text-neutral-300 transition hover:bg-neutral-800"
              >
                Voltar à entrevista
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
