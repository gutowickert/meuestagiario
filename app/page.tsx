'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CATALOGO, TEMPLATE_PADRAO_ID } from '@/lib/templates/catalogo'
import { resizeImage } from '@/lib/resize-image'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'

// Brand de teste (Carreira No Digital). Depois vira um seletor de marcas.
const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface ProdutoOpcao {
  id: string
  codigo: string | null
  nome: string
}

// Um anúncio no lote de "3 opções": ângulo pedido + resultado (ou gerando/erro).
interface OpcaoLote {
  angulo: string
  briefing: string
  result: PecaResult | null
  estado: 'gerando' | 'pronto' | 'erro'
  erro?: string
}

export default function Studio() {
  const [cidade, setCidade] = useState('Caxias do Sul')
  const [produtos, setProdutos] = useState<ProdutoOpcao[]>([])
  const [produto, setProduto] = useState('') // id do produto selecionado
  const [tipo, setTipo] = useState('carrossel')
  const [formato, setFormato] = useState('feed_quadrado')
  const [template, setTemplate] = useState(TEMPLATE_PADRAO_ID)
  const [usarLogo, setUsarLogo] = useState(true)
  const [logoPos, setLogoPos] = useState('sup_dir')
  const [ctaObjetivo, setCtaObjetivo] = useState('whatsapp')
  const [newsjacking, setNewsjacking] = useState(false)
  const [tendenciaTema, setTendenciaTema] = useState('')
  const [briefing, setBriefing] = useState(
    'Anunciar a próxima turma de Anúncios para Negócios Locais, foco em dono de comércio que quer mais clientes.',
  )
  const [mostrarPreco, setMostrarPreco] = useState(false)
  const [etapa, setEtapa] = useState<'descoberta' | 'aquecimento' | 'remarketing'>('descoberta')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [result, setResult] = useState<PecaResult | null>(null)
  const [fotos, setFotos] = useState<string[]>([])
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [puxando, setPuxando] = useState(false)
  const [lote, setLote] = useState<OpcaoLote[]>([])
  const [gerandoLote, setGerandoLote] = useState(false)

  // Carrega os produtos reais da marca (contexto), pra não anunciar "no vácuo".
  useEffect(() => {
    fetch(`/api/produtos?brand_id=${BRAND_ID}`)
      .then((r) => r.json())
      .then((d) => {
        const lista: ProdutoOpcao[] = d.produtos ?? []
        setProdutos(lista)
        if (lista[0]) setProduto((atual) => atual || lista[0].id)
      })
      .catch(() => {})
  }, [])

  async function puxarRepositorio() {
    const codigo = produtos.find((p) => p.id === produto)?.codigo
    if (!codigo || !cidade.trim()) {
      setErro('Escolha o produto e a cidade pra puxar do repositório.')
      return
    }
    setPuxando(true)
    setErro(null)
    try {
      const r = await fetch(`/api/midias?brand_id=${BRAND_ID}&tipo=foto&produto=${encodeURIComponent(codigo)}&cidade=${encodeURIComponent(cidade)}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao puxar do repositório.')
      const urls: string[] = (d.midias ?? []).map((m: { url: string }) => m.url)
      if (urls.length === 0) {
        setErro(`Nenhuma foto no repositório pra ${codigo} · ${cidade}.`)
        return
      }
      setFotos((atual) => [...atual, ...urls.filter((u) => !atual.includes(u))])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao puxar do repositório.')
    } finally {
      setPuxando(false)
    }
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setSubindoFoto(true)
    setErro(null)
    try {
      for (const file of files) {
        const blob = await resizeImage(file, 1920)
        const resp = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': blob.type || 'image/jpeg' },
          body: blob,
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error || 'Falha ao subir a foto.')
        setFotos((atual) => [...atual, data.url as string])
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao subir a foto.')
    } finally {
      setSubindoFoto(false)
    }
  }

  // Chamada única de geração — reusada pelo botão principal, pelo lote e pelo ajuste.
  async function chamarGenerate(opts: {
    briefing: string
    tipo?: string
    comNewsjacking?: boolean
    fotoPrincipal?: number
  }): Promise<PecaResult> {
    const usarNews = opts.comNewsjacking ?? newsjacking
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: BRAND_ID,
        produto_id: produto,
        cidade,
        briefing: opts.briefing,
        tipo: opts.tipo ?? tipo,
        formato,
        template,
        logo: usarLogo,
        logo_pos: usarLogo ? logoPos : 'oculto',
        cta_objetivo: ctaObjetivo,
        mostrar_preco: mostrarPreco,
        etapa,
        newsjacking: usarNews,
        tendencia_tema: usarNews && tendenciaTema.trim() ? tendenciaTema.trim() : undefined,
        fotos,
        foto_principal: opts.fotoPrincipal,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)
    return data as PecaResult
  }

  async function gerar() {
    setLoading(true)
    setErro(null)
    setResult(null)
    try {
      setResult(await chamarGenerate({ briefing }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setLoading(false)
    }
  }

  // 3 opções de anúncio (imagem única) com ângulos distintos — sem newsjacking
  // (pra ser rápido). Você valida, marca boas e ajusta as que não.
  const ANGULOS_LOTE = [
    { angulo: 'Prova social', hint: 'Ângulo: PROVA SOCIAL — resultados/casos reais de alunos que geram desejo e confiança.' },
    { angulo: 'Quebra de objeção', hint: 'Ângulo: QUEBRA DE OBJEÇÃO — pegue a objeção mais forte do público e desmonte.' },
    { angulo: 'Oferta e urgência', hint: 'Ângulo: OFERTA/URGÊNCIA — turma, poucas vagas, motivo real pra agir agora.' },
  ]

  async function gerarLote() {
    setErro(null)
    setResult(null)
    setGerandoLote(true)
    const inicial: OpcaoLote[] = ANGULOS_LOTE.map((a) => ({
      angulo: a.angulo,
      briefing: `${briefing}\n\n${a.hint}`,
      result: null,
      estado: 'gerando',
    }))
    setLote(inicial)
    await Promise.all(
      inicial.map(async (op, i) => {
        try {
          // Foto protagonista roda por opção (i) pra as 3 não caírem na mesma foto.
          const fp = fotos.length > 0 ? i % fotos.length : undefined
          const r = await chamarGenerate({ briefing: op.briefing, tipo: 'anuncio_imagem', comNewsjacking: false, fotoPrincipal: fp })
          setLote((l) => l.map((x, j) => (j === i ? { ...x, result: r, estado: 'pronto' } : x)))
        } catch (e) {
          setLote((l) => l.map((x, j) => (j === i ? { ...x, estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' } : x)))
        }
      }),
    )
    setGerandoLote(false)
  }

  async function ajustarOpcao(i: number, nota: string) {
    const op = lote[i]
    if (!op) return
    setLote((l) => l.map((x, j) => (j === i ? { ...x, estado: 'gerando' } : x)))
    try {
      const r = await chamarGenerate({
        briefing: `${op.briefing}\n\nAJUSTE PEDIDO: ${nota}`,
        tipo: 'anuncio_imagem',
        comNewsjacking: false,
      })
      setLote((l) => l.map((x, j) => (j === i ? { ...x, result: r, estado: 'pronto' } : x)))
    } catch (e) {
      setLote((l) => l.map((x, j) => (j === i ? { ...x, estado: 'erro', erro: e instanceof Error ? e.message : 'Falha.' } : x)))
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              MeuEstagiário <span className="text-violet-400">Studio</span>
            </h1>
            <p className="mt-1 text-neutral-400">
              Gere um carrossel da Carreira No Digital a partir de um briefing.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/chat" className="text-violet-300 hover:text-violet-200">
              Conversa (agente)
            </Link>
            <Link href="/turmas" className="text-violet-300 hover:text-violet-200">
              Turmas em lote
            </Link>
            <Link href="/planejador" className="text-violet-300 hover:text-violet-200">Planejador</Link>
            <Link href="/videos" className="text-violet-300 hover:text-violet-200">
              Vídeos
            </Link>
            <Link href="/repositorio" className="text-violet-300 hover:text-violet-200">Repositório</Link>
            <Link href="/resultados" className="text-violet-300 hover:text-violet-200">Resultados</Link>
            <Link href="/contexto" className="text-violet-300 hover:text-violet-200">
              Contexto da marca →
            </Link>
          </div>
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
                {produtos.length === 0 ? (
                  <option value="">Nenhum produto cadastrado</option>
                ) : (
                  produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo ? `${p.nome} (${p.codigo})` : p.nome}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-400">Objetivo do CTA</span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={ctaObjetivo}
                onChange={(e) => setCtaObjetivo(e.target.value)}
              >
                <option value="whatsapp">Chamar no WhatsApp</option>
                <option value="direct">Chamar no direct</option>
                <option value="site">Acessar o site / link na bio</option>
                <option value="inscricao">Se inscrever / garantir vaga</option>
                <option value="perfil">Seguir o perfil</option>
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
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center justify-between text-neutral-400">
                Estilo (template)
                <Link href="/estilos" className="text-xs text-violet-300 hover:text-violet-200">
                  ver estilos
                </Link>
              </span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {CATALOGO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
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

          {/* Fotos reais — a 1ª é a capa; as demais são distribuídas nos slides */}
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-neutral-400">
              Fotos (opcional) <span className="text-neutral-600">— a 1ª é a capa; as outras entram em slides</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition hover:bg-neutral-800">
                {subindoFoto ? 'Enviando…' : 'Adicionar fotos'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={subirFoto}
                  disabled={subindoFoto}
                />
              </label>
              <button
                type="button"
                onClick={() => void puxarRepositorio()}
                disabled={puxando}
                title="Puxa as fotos do repositório da praça (produto + cidade)"
                className="rounded-lg border border-violet-800 px-4 py-2 text-violet-300 transition hover:bg-violet-950 disabled:opacity-50"
              >
                {puxando ? 'Puxando…' : '↧ Repositório'}
              </button>
              {fotos.length === 0 ? (
                <span className="text-xs text-neutral-500">JPG, PNG ou WEBP · até 10MB cada</span>
              ) : null}
              {fotos.map((url, i) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`foto ${i + 1}`}
                    className="h-14 w-14 rounded-lg border border-neutral-700 object-cover"
                  />
                  {i === 0 ? (
                    <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-lg bg-violet-600 px-1 text-[10px] font-semibold text-white">
                      capa
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setFotos((atual) => atual.filter((u) => u !== url))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-red-900 hover:text-white"
                    aria-label="remover foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Logo: usar ou não + onde */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={usarLogo}
                onChange={(e) => setUsarLogo(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="text-neutral-300">Mostrar logo</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-neutral-400">Posição</span>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500 disabled:opacity-40"
                value={logoPos}
                onChange={(e) => setLogoPos(e.target.value)}
                disabled={!usarLogo}
              >
                <option value="sup_dir">Superior direita</option>
                <option value="sup_esq">Superior esquerda</option>
                <option value="inf_dir">Inferior direita</option>
                <option value="inf_esq">Inferior esquerda</option>
              </select>
            </label>
          </div>

          {/* Newsjacking: surfar o que está em alta na internet */}
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newsjacking}
                onChange={(e) => setNewsjacking(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="text-neutral-300">Surfar uma tendência (newsjacking)</span>
              <span className="text-xs text-neutral-600">— busca o que está em alta e conecta ao negócio</span>
            </label>
            {newsjacking ? (
              <input
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-violet-500"
                placeholder="Tema/assunto (opcional) — ex.: Copa 2026, Black Friday. Vazio = o agente acha."
                value={tendenciaTema}
                onChange={(e) => setTendenciaTema(e.target.value)}
              />
            ) : null}
          </div>

          {/* Etapa do funil — muda a estratégia da copy */}
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Etapa do funil</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'descoberta', nome: 'Descoberta', hint: 'Público frio, primeiro impacto. Fala com o público-alvo e mostra o tema. Sem "vaga/urgência".' },
                { id: 'aquecimento', nome: 'Aquecimento', hint: 'Já teve contato: educa, prova, quebra objeção, mostra o método.' },
                { id: 'remarketing', nome: 'Remarketing', hint: 'Já visitou/engajou: urgência da turma, oferta e fechamento.' },
              ] as const).map((e) => (
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

          {/* Preço: decidir ANTES de gerar (padrão: sem preço) */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mostrarPreco}
              onChange={(e) => setMostrarPreco(e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            <span className="text-neutral-300">Mostrar preço</span>
            <span className="text-xs text-neutral-600">— desligado = nada de valores na peça/legenda</span>
          </label>

          <div className="mt-1 flex flex-wrap gap-3">
            <button
              onClick={gerar}
              disabled={loading || gerandoLote || !briefing.trim()}
              className="rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Gerando… (pode levar até ~40s)' : 'Gerar peça'}
            </button>
            <button
              onClick={() => void gerarLote()}
              disabled={loading || gerandoLote || !briefing.trim()}
              className="rounded-lg border border-violet-600 px-5 py-3 font-semibold text-violet-300 transition hover:bg-violet-600 hover:text-white disabled:opacity-50"
              title="3 anúncios (imagem) com ângulos diferentes, pra você escolher"
            >
              {gerandoLote ? 'Gerando 3…' : 'Gerar 3 opções de anúncio'}
            </button>
          </div>
          {erro ? (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p>
          ) : null}
        </section>

        {/* Resultado único */}
        {result ? (
          <section className="mt-8">
            <PecaCard result={result} brandId={BRAND_ID} produtoId={produto} ctaObjetivo={ctaObjetivo} />
          </section>
        ) : null}

        {/* Lote: 3 opções de anúncio */}
        {lote.length > 0 ? (
          <section className="mt-8 grid gap-6">
            <h2 className="text-lg font-semibold">3 opções de anúncio — valide, marque 👍 e ajuste as que quiser</h2>
            {lote.map((op, i) => (
              <div key={i} className="grid gap-2">
                <div className="text-sm font-semibold text-violet-300">
                  Opção {i + 1}: {op.angulo}
                </div>
                {op.estado === 'gerando' ? (
                  <p className="text-sm text-neutral-500">Gerando…</p>
                ) : op.estado === 'erro' ? (
                  <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{op.erro}</p>
                ) : op.result ? (
                  <PecaCard
                    result={op.result}
                    brandId={BRAND_ID}
                    produtoId={produto}
                    ctaObjetivo={ctaObjetivo}
                    onAjustar={(nota) => void ajustarOpcao(i, nota)}
                  />
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
