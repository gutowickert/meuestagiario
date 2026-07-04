'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resizeImage } from '@/lib/resize-image'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

// 3 ângulos por turma (mesmos do lote do Studio). Você valida e marca as boas.
const ANGULOS = [
  { angulo: 'Prova social', hint: 'Ângulo: PROVA SOCIAL — resultados/casos reais de alunos que geram desejo e confiança.' },
  { angulo: 'Quebra de objeção', hint: 'Ângulo: QUEBRA DE OBJEÇÃO — pegue a objeção mais forte do público e desmonte.' },
  { angulo: 'Oferta e urgência', hint: 'Ângulo: OFERTA/URGÊNCIA — turma, poucas vagas, motivo real pra agir agora.' },
]

// Quantos /api/generate rodam ao mesmo tempo (cada um é pesado ~40s).
const CONCORRENCIA = 3

interface Turma {
  codigo: string
  produto_codigo: string
  produto_nome: string
  produto_id: string | null
  produto_reconhecido: boolean
  cidade: string
  periodo: string
  datas: string
  horario: string
  preco: string
  professor: string
  local: string
  briefing: string
  // estado local
  incluir: boolean
  fotos: string[]
  subindoFoto: boolean
}

interface Anuncio {
  turmaCodigo: string
  angulo: string
  briefing: string
  produtoId: string
  ctaObjetivo: string
  fotos: string[]
  result: PecaResult | null
  estado: 'gerando' | 'pronto' | 'erro'
  erro?: string
}

// Roda `tarefas` com no máx `limite` simultâneas.
async function pool<T>(tarefas: (() => Promise<T>)[], limite: number): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(limite, tarefas.length) }, async () => {
    while (i < tarefas.length) {
      const idx = i++
      await tarefas[idx]()
    }
  })
  await Promise.all(workers)
}

export default function Turmas() {
  const [texto, setTexto] = useState('')
  const [lendo, setLendo] = useState(false)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const [mostrarPreco, setMostrarPreco] = useState(false)
  const [ctaObjetivo, setCtaObjetivo] = useState('Chamar no WhatsApp pra garantir a vaga')

  const [gerando, setGerando] = useState(false)
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])

  async function ler() {
    const t = texto.trim()
    if (!t || lendo) return
    setLendo(true)
    setErro(null)
    setTurmas([])
    setAnuncios([])
    try {
      const resp = await fetch('/api/turmas/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, texto: t }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      const lidas: Turma[] = (data.turmas as Omit<Turma, 'incluir' | 'fotos' | 'subindoFoto'>[]).map((t) => ({
        ...t,
        incluir: true,
        fotos: [],
        subindoFoto: false,
      }))
      setTurmas(lidas)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao ler a lista.')
    } finally {
      setLendo(false)
    }
  }

  function patchTurma(codigo: string, patch: Partial<Turma>) {
    setTurmas((ts) => ts.map((t) => (t.codigo === codigo ? { ...t, ...patch } : t)))
  }

  async function anexarFotos(codigo: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    patchTurma(codigo, { subindoFoto: true })
    try {
      const urls: string[] = []
      for (const file of files) {
        const blob = await resizeImage(file, 1920)
        const resp = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || 'Falha ao subir a foto.')
        urls.push(data.url as string)
      }
      setTurmas((ts) => ts.map((t) => (t.codigo === codigo ? { ...t, fotos: [...t.fotos, ...urls], subindoFoto: false } : t)))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao subir foto.')
      patchTurma(codigo, { subindoFoto: false })
    }
  }

  const selecionadas = turmas.filter((t) => t.incluir)
  const totalAnuncios = selecionadas.length * ANGULOS.length

  async function gerarUm(a: Anuncio): Promise<void> {
    setAnuncios((l) => l.map((x) => (x.turmaCodigo === a.turmaCodigo && x.angulo === a.angulo ? { ...x, estado: 'gerando', erro: undefined } : x)))
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: BRAND_ID,
          produto_id: a.produtoId || undefined,
          turma_id: a.turmaCodigo,
          briefing: a.briefing,
          tipo: 'anuncio_imagem',
          formato: 'feed_quadrado',
          logo: true,
          logo_pos: 'sup_dir',
          cta_objetivo: a.ctaObjetivo || undefined,
          mostrar_preco: mostrarPreco,
          newsjacking: false,
          fotos: a.fotos,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      setAnuncios((l) => l.map((x) => (x.turmaCodigo === a.turmaCodigo && x.angulo === a.angulo ? { ...x, result: data as PecaResult, estado: 'pronto' } : x)))
    } catch (e) {
      setAnuncios((l) => l.map((x) => (x.turmaCodigo === a.turmaCodigo && x.angulo === a.angulo ? { ...x, estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' } : x)))
    }
  }

  async function gerarTudo() {
    if (selecionadas.length === 0 || gerando) return
    setGerando(true)
    setErro(null)
    const inicial: Anuncio[] = selecionadas.flatMap((t) =>
      ANGULOS.map((ang) => ({
        turmaCodigo: t.codigo,
        angulo: ang.angulo,
        briefing: `${t.briefing}\n\n${ang.hint}`,
        produtoId: t.produto_id ?? t.produto_codigo,
        ctaObjetivo,
        fotos: t.fotos,
        result: null,
        estado: 'gerando' as const,
      })),
    )
    setAnuncios(inicial)
    await pool(
      inicial.map((a) => () => gerarUm(a)),
      CONCORRENCIA,
    )
    setGerando(false)
  }

  async function ajustar(a: Anuncio, nota: string) {
    await gerarUm({ ...a, briefing: `${a.briefing}\n\nAJUSTE PEDIDO: ${nota}` })
  }

  const prontos = anuncios.filter((a) => a.estado === 'pronto').length
  // Turmas agrupadas na exibição dos resultados.
  const codigos = selecionadas.map((t) => t.codigo)

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Turmas <span className="text-violet-400">em lote</span>
            </h1>
            <p className="mt-1 text-neutral-400">Cole sua lista de turmas → gera 3 anúncios por turma → você só aprova.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/chat" className="text-violet-300 hover:text-violet-200">Conversa</Link>
            <Link href="/aprovados" className="text-violet-300 hover:text-violet-200">Aprovados</Link>
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio →</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {/* 1. Colar a lista */}
        <section className="mb-6">
          <label className="mb-2 block text-sm font-medium text-neutral-300">Sua lista de turmas</label>
          <textarea
            className="min-h-40 w-full resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 font-mono text-xs leading-relaxed outline-none focus:border-violet-500"
            placeholder={`Ex.:\nLAJEADO\nanllajeado072601 — 23, 24 e 25 de julho (19h às 22h15)\nPreço: 797,00\nProfessor: Douglas Conceição\nsala 01 lajeado`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button
            onClick={() => void ler()}
            disabled={lendo || !texto.trim()}
            className="mt-3 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {lendo ? 'Lendo…' : 'Ler turmas'}
          </button>
        </section>

        {/* 2. Turmas lidas */}
        {turmas.length > 0 ? (
          <section className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {turmas.length} turma{turmas.length > 1 ? 's' : ''} lida{turmas.length > 1 ? 's' : ''}
                <span className="ml-2 text-sm font-normal text-neutral-500">· {selecionadas.length} selecionada(s)</span>
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-neutral-300">
                  <input type="checkbox" checked={mostrarPreco} onChange={(e) => setMostrarPreco(e.target.checked)} className="accent-violet-600" />
                  Mostrar preço
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-neutral-400">Objetivo do anúncio (CTA)</label>
              <input
                value={ctaObjetivo}
                onChange={(e) => setCtaObjetivo(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
                placeholder="Ex.: Chamar no WhatsApp pra garantir a vaga"
              />
            </div>

            <div className="grid gap-3">
              {turmas.map((t) => (
                <div key={t.codigo} className={`rounded-xl border p-4 ${t.incluir ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-800 bg-neutral-950 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.incluir}
                      onChange={(e) => patchTurma(t.codigo, { incluir: e.target.checked })}
                      className="mt-1 accent-violet-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-neutral-300">{t.codigo}</span>
                        <span className={`rounded px-2 py-0.5 ${t.produto_reconhecido ? 'bg-violet-950 text-violet-300' : 'bg-red-950 text-red-300'}`}>
                          {t.produto_codigo || '?'}{t.produto_reconhecido ? '' : ' (não cadastrado)'}
                        </span>
                        {t.cidade ? <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">{t.cidade}</span> : null}
                        {t.periodo ? <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-400">{t.periodo}</span> : null}
                      </div>
                      <p className="mt-2 text-sm text-neutral-200">{t.datas}{t.horario ? ` · ${t.horario}` : ''}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-neutral-500">
                        {t.professor ? <span>Prof.: {t.professor}</span> : null}
                        {t.local ? <span>{t.local}</span> : null}
                        {t.preco ? <span className="text-neutral-400">{t.preco}</span> : null}
                      </div>
                      <p className="mt-2 text-xs italic text-neutral-500">{t.briefing}</p>

                      {/* Fotos da turma */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {t.fotos.map((url, i) => (
                          <div key={url} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`foto ${i + 1}`} className="h-12 w-12 rounded-lg border border-neutral-700 object-cover" />
                            <button
                              type="button"
                              onClick={() => patchTurma(t.codigo, { fotos: t.fotos.filter((u) => u !== url) })}
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-red-900 hover:text-white"
                              aria-label="remover"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="cursor-pointer rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800">
                          {t.subindoFoto ? '…' : '📎 foto da turma'}
                          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => void anexarFotos(t.codigo, e)} disabled={t.subindoFoto} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => void gerarTudo()}
              disabled={gerando || selecionadas.length === 0}
              className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              {gerando ? `Gerando… (${prontos}/${anuncios.length})` : `Gerar ${totalAnuncios} anúncios (${selecionadas.length} × ${ANGULOS.length})`}
            </button>
            {gerando ? <p className="mt-2 text-xs text-neutral-500">Rodando {CONCORRENCIA} por vez — cada anúncio leva ~40s. Pode ir aprovando os que ficarem prontos.</p> : null}
          </section>
        ) : null}

        {/* 3. Resultados agrupados por turma */}
        {anuncios.length > 0 ? (
          <section className="space-y-8">
            {codigos.map((codigo) => {
              const doGrupo = anuncios.filter((a) => a.turmaCodigo === codigo)
              if (doGrupo.length === 0) return null
              return (
                <div key={codigo}>
                  <h3 className="mb-3 font-mono text-sm text-violet-300">{codigo}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {doGrupo.map((a) => (
                      <div key={a.angulo} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                        <div className="mb-2 text-xs font-medium text-neutral-400">{a.angulo}</div>
                        {a.estado === 'gerando' ? (
                          <div className="py-8 text-center text-sm text-neutral-500">Gerando…</div>
                        ) : a.estado === 'erro' ? (
                          <div className="text-sm text-red-300">{a.erro}</div>
                        ) : a.result ? (
                          <PecaCard
                            result={a.result}
                            brandId={BRAND_ID}
                            produtoId={a.produtoId}
                            ctaObjetivo={a.ctaObjetivo}
                            onAjustar={(nota) => ajustar(a, nota)}
                            ajustando={false}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        ) : null}
      </div>
    </main>
  )
}
