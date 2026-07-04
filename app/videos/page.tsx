'use client'

// Copy de VÍDEO pra anúncio: roteiro falado + legenda. Dois fluxos:
//  - "3 ângulos" (prova social / quebra de objeção / oferta), como os anúncios de imagem
//  - "1 com cena" (você descreve a situação que tem pra gravar)
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RoteiroCard, type RoteiroResult } from '@/app/_components/RoteiroCard'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface ProdutoOpcao {
  id: string
  codigo: string | null
  nome: string
}

const ETAPAS = [
  { id: 'descoberta' as const, nome: 'Descoberta', hint: 'Público frio: gancho fala com o público-alvo e mostra o tema. Sem urgência.' },
  { id: 'aquecimento' as const, nome: 'Aquecimento', hint: 'Já teve contato: educa, prova, quebra objeção, mostra o método.' },
  { id: 'remarketing' as const, nome: 'Remarketing', hint: 'Já visitou/engajou: urgência da turma, oferta e fechamento.' },
]

const CTAS = [
  { id: 'whatsapp', nome: 'WhatsApp' },
  { id: 'site', nome: 'Site / link' },
  { id: 'inscricao', nome: 'Inscrição / vaga' },
  { id: 'direct', nome: 'Direct' },
  { id: 'perfil', nome: 'Seguir o perfil' },
]

const ANGULOS = [
  { angulo: 'Prova social', hint: 'Ângulo: PROVA SOCIAL — resultado/caso real de aluno que gera desejo e confiança.' },
  { angulo: 'Quebra de objeção', hint: 'Ângulo: QUEBRA DE OBJEÇÃO — pegue a objeção mais forte do público e desmonte.' },
  { angulo: 'Oferta e urgência', hint: 'Ângulo: OFERTA/URGÊNCIA — motivo real pra agir agora.' },
]

interface Roteiro {
  chave: string
  titulo: string
  briefing: string
  situacao?: string
  result: RoteiroResult | null
  estado: 'gerando' | 'pronto' | 'erro'
  erro?: string
}

export default function Videos() {
  const [produtos, setProdutos] = useState<ProdutoOpcao[]>([])
  const [produto, setProduto] = useState('')
  const [cidade, setCidade] = useState('Caxias do Sul')
  const [etapa, setEtapa] = useState<'descoberta' | 'aquecimento' | 'remarketing'>('descoberta')
  const [ctaObjetivo, setCtaObjetivo] = useState('whatsapp')
  const [mostrarPreco, setMostrarPreco] = useState(false)
  const [briefing, setBriefing] = useState('')
  const [situacao, setSituacao] = useState('')

  const [roteiros, setRoteiros] = useState<Roteiro[]>([])
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/produtos?brand_id=${BRAND_ID}`)
      .then((r) => r.json())
      .then((d) => setProdutos(d.produtos ?? []))
      .catch(() => {})
  }, [])

  async function chamarRoteiro(opts: { briefing: string; situacao?: string }): Promise<RoteiroResult> {
    const resp = await fetch('/api/roteiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: BRAND_ID,
        produto_id: produto || undefined,
        cidade: cidade || undefined,
        briefing: opts.briefing,
        situacao: opts.situacao || undefined,
        cta_objetivo: ctaObjetivo,
        etapa,
        mostrar_preco: mostrarPreco,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
    return data as RoteiroResult
  }

  function atualiza(chave: string, patch: Partial<Roteiro>) {
    setRoteiros((rs) => rs.map((r) => (r.chave === chave ? { ...r, ...patch } : r)))
  }

  async function gerarUm(r: Roteiro) {
    atualiza(r.chave, { estado: 'gerando', erro: undefined })
    try {
      const res = await chamarRoteiro({ briefing: r.briefing, situacao: r.situacao })
      atualiza(r.chave, { result: res, estado: 'pronto' })
    } catch (e) {
      atualiza(r.chave, { estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' })
    }
  }

  async function gerarLote() {
    if (!briefing.trim() || gerando) return
    setErro(null)
    setGerando(true)
    const inicial: Roteiro[] = ANGULOS.map((a) => ({
      chave: `lote-${a.angulo}`,
      titulo: a.angulo,
      briefing: `${briefing}\n\n${a.hint}`,
      result: null,
      estado: 'gerando',
    }))
    setRoteiros(inicial)
    await Promise.all(inicial.map((r) => gerarUm(r)))
    setGerando(false)
  }

  async function gerarComCena() {
    if (!briefing.trim() || gerando) return
    setErro(null)
    setGerando(true)
    const r: Roteiro = {
      chave: `cena-${roteiros.length}`,
      titulo: situacao.trim() ? 'Com cena descrita' : 'Roteiro',
      briefing,
      situacao: situacao.trim() || undefined,
      result: null,
      estado: 'gerando',
    }
    setRoteiros((rs) => [r, ...rs])
    await gerarUm(r)
    setGerando(false)
  }

  async function ajustar(r: Roteiro, nota: string) {
    atualiza(r.chave, { estado: 'gerando' })
    try {
      const res = await chamarRoteiro({ briefing: `${r.briefing}\n\nAJUSTE PEDIDO: ${nota}`, situacao: r.situacao })
      atualiza(r.chave, { result: res, estado: 'pronto' })
    } catch (e) {
      atualiza(r.chave, { estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' })
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Vídeos <span className="text-violet-400">— copy de anúncio</span>
            </h1>
            <p className="mt-1 text-neutral-400">Roteiro falado + legenda. Gere 3 ângulos ou descreva a cena e gere 1.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio</Link>
            <Link href="/turmas" className="text-violet-300 hover:text-violet-200">Turmas</Link>
            <Link href="/repositorio" className="text-violet-300 hover:text-violet-200">Repositório</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        <section className="mb-6 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Produto</label>
              <select
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                <option value="">— sem produto específico —</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}{p.codigo ? ` (${p.codigo})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Cidade / turma</label>
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
                placeholder="Ex.: Caxias do Sul"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300">Etapa do funil</label>
            <div className="flex flex-wrap gap-2">
              {ETAPAS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEtapa(e.id)}
                  title={e.hint}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    etapa === e.id ? 'border-violet-500 bg-violet-950 text-violet-200' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {e.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Objetivo (CTA)</label>
              <select
                value={ctaObjetivo}
                onChange={(e) => setCtaObjetivo(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                {CTAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-neutral-300">
              <input type="checkbox" checked={mostrarPreco} onChange={(e) => setMostrarPreco(e.target.checked)} className="accent-violet-600" />
              Mostrar preço
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300">Briefing</label>
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              className="min-h-20 w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
              placeholder="Ex.: vídeo pra apresentar a formação e chamar dono de negócio local em Caxias"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300">
              Cena / situação <span className="text-xs text-neutral-500">(opcional — só pra o botão “1 roteiro”)</span>
            </label>
            <textarea
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="min-h-16 w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
              placeholder="Ex.: eu falando na frente da câmera na escola / depoimento de um aluno que abriu negócio"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void gerarLote()}
              disabled={gerando || !briefing.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              {gerando ? 'Gerando…' : 'Gerar 3 ângulos'}
            </button>
            <button
              onClick={() => void gerarComCena()}
              disabled={gerando || !briefing.trim()}
              className="rounded-lg border border-violet-700 px-5 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-950 disabled:opacity-40"
            >
              {situacao.trim() ? 'Gerar 1 (com cena)' : 'Gerar 1 roteiro'}
            </button>
          </div>
        </section>

        {roteiros.length > 0 ? (
          <section className="grid gap-4">
            {roteiros.map((r) => (
              <div key={r.chave}>
                <div className="mb-2 text-xs font-medium text-neutral-400">{r.titulo}</div>
                {r.estado === 'gerando' ? (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 py-8 text-center text-sm text-neutral-500">Gerando roteiro…</div>
                ) : r.estado === 'erro' ? (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-red-300">{r.erro}</div>
                ) : r.result ? (
                  <RoteiroCard result={r.result} brandId={BRAND_ID} onAjustar={(nota) => ajustar(r, nota)} ajustando={false} />
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
