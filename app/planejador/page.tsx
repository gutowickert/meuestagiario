'use client'

// Planejador de ORGÂNICO: define cadência (semanal/mensal), nº de posts e os
// PILARES de conteúdo → gera a grade abastecida por marca + método + voz do
// cliente → você revisa → desenvolve cada item no motor (roteiro/carrossel/imagem),
// sempre em modo orgânico. Pilar de tendência puxa newsjacking ao desenvolver.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'
import { RoteiroCard, type RoteiroResult } from '@/app/_components/RoteiroCard'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'
const GERAL = '__geral__'

interface ProdutoOpcao { id: string; codigo: string | null; nome: string }
type FormatoOrganico = 'reel' | 'carrossel' | 'imagem'

interface Pilar { nome: string; descricao: string; formato: FormatoOrganico | 'auto'; trend: boolean }

// Pilares padrão (o exemplo do Guto). Editáveis.
const PILARES_PADRAO: Pilar[] = [
  { nome: 'Escola / novidades', descricao: 'Diferenciais da escola, novidades (inauguração de Porto Alegre), agenda mensal de cursos, bastidores.', formato: 'reel', trend: false },
  { nome: 'Trend', descricao: 'Conectar o que está bombando na internet ao universo de marketing e negócio local.', formato: 'imagem', trend: true },
  { nome: 'Dica prática', descricao: 'Uma dica prática e aplicável de marketing/anúncios pra dono de negócio local.', formato: 'carrossel', trend: false },
]

interface ItemPlano {
  dia: string
  pilar: string
  formato: FormatoOrganico
  trend: boolean
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
  const [cadencia, setCadencia] = useState<'semanal' | 'mensal'>('semanal')
  const [postsSemana, setPostsSemana] = useState(3)
  const [pilares, setPilares] = useState<Pilar[]>(PILARES_PADRAO)

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

  function patchPilar(i: number, p: Partial<Pilar>) {
    setPilares((ps) => ps.map((x, j) => (j === i ? { ...x, ...p } : x)))
  }
  function addPilar() {
    setPilares((ps) => [...ps, { nome: '', descricao: '', formato: 'auto', trend: false }])
  }
  function removePilar(i: number) {
    setPilares((ps) => ps.filter((_, j) => j !== i))
  }

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
        body: JSON.stringify({
          brand_id: BRAND_ID,
          produto_id: produtoId || undefined,
          foco: foco || undefined,
          cadencia,
          posts_por_semana: postsSemana,
          pilares: pilares.filter((p) => p.nome.trim()),
        }),
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
    const briefing = `${it.tema}. ${it.ideia}\n\n(Conteúdo ORGÂNICO — pilar "${it.pilar}". Objetivo: ${it.objetivo}. Ângulo: ${it.angulo}.)`
    try {
      if (it.formato === 'reel') {
        const resp = await fetch('/api/roteiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: BRAND_ID, produto_id: produtoId || undefined, cidade: cidade || undefined, briefing, etapa: it.etapa, objetivo: 'organico', cta_objetivo: 'perfil', mostrar_preco: false, newsjacking: it.trend, tendencia_tema: it.trend ? it.tema : undefined }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
        patch(it.chave, { kind: 'reel', reel: data as RoteiroResult, estado: 'pronto' })
      } else {
        const tipo = it.formato === 'carrossel' ? 'carrossel' : 'anuncio_imagem'
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: BRAND_ID, produto_id: produtoId || undefined, cidade: cidade || undefined, briefing, tipo, formato: 'feed_quadrado', etapa: it.etapa, objetivo: 'organico', cta_objetivo: 'perfil', mostrar_preco: false, logo: true, logo_pos: 'sup_dir', newsjacking: it.trend, tendencia_tema: it.trend ? it.tema : undefined }),
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

  const totalPrevisto = cadencia === 'mensal' ? postsSemana * 4 : postsSemana

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Planejador <span className="text-violet-400">de orgânico</span>
            </h1>
            <p className="mt-1 text-neutral-400">Cadência + pilares → a grade → você revisa → desenvolve cada post.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio</Link>
            <Link href="/videos" className="text-violet-300 hover:text-violet-200">Vídeos</Link>
            <Link href="/repositorio" className="text-violet-300 hover:text-violet-200">Repositório</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {/* Configuração */}
        <section className="mb-6 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Foco (produto)</label>
              <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500">
                <option value={GERAL}>Geral / escola</option>
                {produtos.map((p) => (<option key={p.id} value={p.id}>{p.nome}{p.codigo ? ` (${p.codigo})` : ''}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Cidade <span className="text-xs text-neutral-500">(opcional)</span></label>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" placeholder="Ex.: Porto Alegre" />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Cadência</label>
              <div className="flex gap-2">
                {(['semanal', 'mensal'] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setCadencia(c)} className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition ${cadencia === c ? 'border-violet-500 bg-violet-950 text-violet-200' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Posts / semana</label>
              <input type="number" min={1} max={7} value={postsSemana} onChange={(e) => setPostsSemana(Number(e.target.value) || 3)} className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" />
            </div>
            <p className="pb-2 text-xs text-neutral-500">Total: <span className="text-neutral-300">{totalPrevisto} post(s)</span> {cadencia === 'mensal' ? '(4 semanas)' : ''}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300">Tema / campanha do período <span className="text-xs text-neutral-500">(opcional)</span></label>
            <input value={foco} onChange={(e) => setFoco(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500" placeholder="Ex.: semana da inauguração de Porto Alegre" />
          </div>

          {/* Pilares */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-neutral-300">Pilares de conteúdo</label>
              <button type="button" onClick={addPilar} className="text-xs text-violet-300 hover:text-violet-200">＋ pilar</button>
            </div>
            <div className="grid gap-2">
              {pilares.map((p, i) => (
                <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={p.nome} onChange={(e) => patchPilar(i, { nome: e.target.value })} placeholder="Nome do pilar" className="min-w-40 flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-violet-500" />
                    <select value={p.formato} onChange={(e) => patchPilar(i, { formato: e.target.value as Pilar['formato'] })} className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-violet-500">
                      <option value="auto">auto</option>
                      <option value="reel">reel</option>
                      <option value="carrossel">carrossel</option>
                      <option value="imagem">imagem</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-neutral-400" title="Puxa uma tendência atual (newsjacking) ao desenvolver">
                      <input type="checkbox" checked={p.trend} onChange={(e) => patchPilar(i, { trend: e.target.checked })} className="accent-violet-600" /> trend
                    </label>
                    <button type="button" onClick={() => removePilar(i)} className="text-xs text-neutral-600 hover:text-red-400">remover</button>
                  </div>
                  <input value={p.descricao} onChange={(e) => patchPilar(i, { descricao: e.target.value })} placeholder="O que entra nesse pilar" className="mt-2 w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-300 outline-none focus:border-violet-500" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <button onClick={() => void gerarPlano()} disabled={gerandoPlano} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40">
              {gerandoPlano ? 'Montando…' : `Gerar plano ${cadencia}`}
            </button>
          </div>
        </section>

        {resumo ? (
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm italic text-neutral-400">{resumo}</p>
            <button onClick={() => void desenvolverTodos()} className="shrink-0 rounded-lg border border-violet-700 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-violet-950">Desenvolver todos</button>
          </div>
        ) : null}

        {/* Grade */}
        <section className="space-y-4">
          {itens.map((it) => (
            <div key={it.chave} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-neutral-800 px-2 py-0.5 font-semibold text-neutral-200">{it.dia}</span>
                <span className="rounded bg-violet-950 px-2 py-0.5 text-violet-300">{it.pilar}</span>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">{ICONE_FORMATO[it.formato]}</span>
                {it.trend ? <span className="rounded bg-orange-950 px-2 py-0.5 text-orange-300">🔥 trend</span> : null}
                <span className={`rounded px-2 py-0.5 ${COR_ETAPA[it.etapa] ?? 'bg-neutral-800'}`}>{it.etapa}</span>
                <button onClick={() => remover(it.chave)} className="ml-auto text-neutral-600 hover:text-red-400" title="remover do plano">remover</button>
              </div>
              <h3 className="mt-2 font-semibold text-neutral-100">{it.tema}</h3>
              <p className="text-sm text-violet-300">{it.angulo}</p>
              <p className="mt-1 text-sm text-neutral-400">{it.ideia}</p>

              <div className="mt-3">
                {it.estado === 'idle' ? (
                  <button onClick={() => void desenvolver(it)} className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500">Desenvolver</button>
                ) : it.estado === 'gerando' ? (
                  <p className="text-sm text-neutral-500">Desenvolvendo…{it.trend ? ' (buscando tendência)' : ''}</p>
                ) : it.estado === 'erro' ? (
                  <div className="flex items-center gap-3"><p className="text-sm text-red-300">{it.erro}</p><button onClick={() => void desenvolver(it)} className="text-xs text-violet-300 hover:text-violet-200">tentar de novo</button></div>
                ) : null}
              </div>

              {it.estado === 'pronto' && it.kind === 'reel' && it.reel ? (
                <div className="mt-3"><RoteiroCard result={it.reel} brandId={BRAND_ID} /></div>
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
