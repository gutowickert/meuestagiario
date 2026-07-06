'use client'

// Planejador semanal de ORGÂNICO: gera a grade (o quê/quando postar) abastecida
// por marca + método + voz do cliente, você revisa, e desenvolve cada item no
// motor (roteiro pra reel; carrossel/imagem pros outros). Aprova como sempre.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'
import { RoteiroCard, type RoteiroResult } from '@/app/_components/RoteiroCard'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'
const GERAL = '__geral__'

interface ProdutoOpcao { id: string; codigo: string | null; nome: string }

interface ItemPlano {
  dia: string
  formato: 'reel' | 'carrossel' | 'imagem'
  etapa: 'descoberta' | 'aquecimento' | 'remarketing'
  tema: string
  angulo: string
  ideia: string
  objetivo: string
}

interface ItemEstado extends ItemPlano {
  chave: string
  kind: 'reel' | 'peca' | null
  reel: RoteiroResult | null
  peca: PecaResult | null
  estado: 'idle' | 'gerando' | 'pronto' | 'erro'
  erro?: string
}

const COR_ETAPA: Record<string, string> = {
  descoberta: 'bg-sky-950 text-sky-300',
  aquecimento: 'bg-amber-950 text-amber-300',
  remarketing: 'bg-emerald-950 text-emerald-300',
}
const ICONE_FORMATO: Record<string, string> = { reel: '🎬 reel', carrossel: '🎠 carrossel', imagem: '🖼️ imagem' }

export default function Planejador() {
  const [produtos, setProdutos] = useState<ProdutoOpcao[]>([])
  const [produto, setProduto] = useState(GERAL)
  const [cidade, setCidade] = useState('')
  const [foco, setFoco] = useState('')
  const [qtd, setQtd] = useState(5)

  const [resumo, setResumo] = useState('')
  const [itens, setItens] = useState<ItemEstado[]>([])
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/produtos?brand_id=${BRAND_ID}`)
      .then((r) => r.json())
      .then((d) => setProdutos(d.produtos ?? []))
      .catch(() => {})
  }, [])

  const produtoId = produto === GERAL ? '' : produto

  async function gerarPlano() {
    if (gerandoPlano) return
    setGerandoPlano(true)
    setErro(null)
    setItens([])
    setResumo('')
    try {
      const resp = await fetch('/api/planejar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: BRAND_ID, produto_id: produtoId || undefined, foco: foco || undefined, qtd_posts: qtd }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
      setResumo(data.plano.resumo ?? '')
      setItens(
        (data.plano.itens as ItemPlano[]).map((it, i) => ({
          ...it,
          chave: `item-${i}`,
          kind: null,
          reel: null,
          peca: null,
          estado: 'idle',
        })),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar o plano.')
    } finally {
      setGerandoPlano(false)
    }
  }

  function patch(chave: string, p: Partial<ItemEstado>) {
    setItens((is) => is.map((x) => (x.chave === chave ? { ...x, ...p } : x)))
  }

  async function desenvolver(it: ItemEstado) {
    patch(it.chave, { estado: 'gerando', erro: undefined })
    const briefing = `${it.tema}. ${it.ideia}\n\n(Conteúdo ORGÂNICO de valor — NÃO é anúncio. Objetivo: ${it.objetivo}. Ângulo: ${it.angulo}. CTA leve de engajamento: seguir, salvar ou comentar.)`
    try {
      if (it.formato === 'reel') {
        const resp = await fetch('/api/roteiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: BRAND_ID, produto_id: produtoId || undefined, cidade: cidade || undefined, briefing, etapa: it.etapa, cta_objetivo: 'perfil', mostrar_preco: false }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
        patch(it.chave, { kind: 'reel', reel: data as RoteiroResult, estado: 'pronto' })
      } else {
        const tipo = it.formato === 'carrossel' ? 'carrossel' : 'anuncio_imagem'
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: BRAND_ID, produto_id: produtoId || undefined, cidade: cidade || undefined, briefing, tipo, formato: 'feed_quadrado', etapa: it.etapa, cta_objetivo: 'perfil', mostrar_preco: false, logo: true, logo_pos: 'sup_dir' }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
        patch(it.chave, { kind: 'peca', peca: data as PecaResult, estado: 'pronto' })
      }
    } catch (e) {
      patch(it.chave, { estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' })
    }
  }

  async function desenvolverTodos() {
    for (const it of itens) {
      if (it.estado !== 'pronto') await desenvolver(it)
    }
  }

  function remover(chave: string) {
    setItens((is) => is.filter((x) => x.chave !== chave))
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Planejador <span className="text-violet-400">semanal</span>
            </h1>
            <p className="mt-1 text-neutral-400">Orgânico: a grade da semana → você revisa → desenvolve cada post.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio</Link>
            <Link href="/videos" className="text-violet-300 hover:text-violet-200">Vídeos</Link>
            <Link href="/repositorio" className="text-violet-300 hover:text-violet-200">Repositório</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {/* Configuração do plano */}
        <section className="mb-6 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Foco (produto)</label>
              <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500">
                <option value={GERAL}>Geral / escola</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}{p.codigo ? ` (${p.codigo})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Cidade <span className="text-xs text-neutral-500">(opcional)</span></label>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" placeholder="Ex.: Caxias do Sul" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Tema / campanha da semana <span className="text-xs text-neutral-500">(opcional)</span></label>
              <input value={foco} onChange={(e) => setFoco(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" placeholder="Ex.: quebrar a objeção de 'não tenho tempo'" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Posts</label>
              <input type="number" min={1} max={14} value={qtd} onChange={(e) => setQtd(Number(e.target.value) || 5)} className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <button onClick={() => void gerarPlano()} disabled={gerandoPlano} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40">
              {gerandoPlano ? 'Montando a semana…' : 'Gerar plano da semana'}
            </button>
          </div>
        </section>

        {resumo ? (
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm italic text-neutral-400">{resumo}</p>
            <button onClick={() => void desenvolverTodos()} className="shrink-0 rounded-lg border border-violet-700 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-violet-950">
              Desenvolver todos
            </button>
          </div>
        ) : null}

        {/* Grade */}
        <section className="space-y-4">
          {itens.map((it) => (
            <div key={it.chave} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-neutral-800 px-2 py-0.5 font-semibold text-neutral-200">{it.dia}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">{ICONE_FORMATO[it.formato]}</span>
                <span className={`rounded px-2 py-0.5 ${COR_ETAPA[it.etapa] ?? 'bg-neutral-800'}`}>{it.etapa}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-500">{it.objetivo}</span>
                <button onClick={() => remover(it.chave)} className="ml-auto text-neutral-600 hover:text-red-400" title="remover do plano">remover</button>
              </div>
              <h3 className="mt-2 font-semibold text-neutral-100">{it.tema}</h3>
              <p className="text-sm text-violet-300">{it.angulo}</p>
              <p className="mt-1 text-sm text-neutral-400">{it.ideia}</p>

              <div className="mt-3">
                {it.estado === 'idle' ? (
                  <button onClick={() => void desenvolver(it)} className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500">
                    Desenvolver
                  </button>
                ) : it.estado === 'gerando' ? (
                  <p className="text-sm text-neutral-500">Desenvolvendo… (pode levar ~40s)</p>
                ) : it.estado === 'erro' ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-red-300">{it.erro}</p>
                    <button onClick={() => void desenvolver(it)} className="text-xs text-violet-300 hover:text-violet-200">tentar de novo</button>
                  </div>
                ) : null}
              </div>

              {it.estado === 'pronto' && it.kind === 'reel' && it.reel ? (
                <div className="mt-3"><RoteiroCard result={it.reel} brandId={BRAND_ID} onAjustar={undefined} /></div>
              ) : null}
              {it.estado === 'pronto' && it.kind === 'peca' && it.peca ? (
                <div className="mt-3"><PecaCard result={it.peca} brandId={BRAND_ID} produtoId={produtoId || undefined} ctaObjetivo="perfil" /></div>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
