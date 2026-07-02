'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CATALOGO, TEMPLATE_PADRAO_ID } from '@/lib/templates/catalogo'

// Brand de teste (Carreira No Digital). Depois vira um seletor de marcas.
const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface ProdutoOpcao {
  id: string
  codigo: string | null
  nome: string
}

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
  const [produtos, setProdutos] = useState<ProdutoOpcao[]>([])
  const [produto, setProduto] = useState('') // id do produto selecionado
  const [tipo, setTipo] = useState('carrossel')
  const [formato, setFormato] = useState('feed_quadrado')
  const [template, setTemplate] = useState(TEMPLATE_PADRAO_ID)
  const [usarLogo, setUsarLogo] = useState(true)
  const [logoPos, setLogoPos] = useState('sup_dir')
  const [ctaObjetivo, setCtaObjetivo] = useState('whatsapp')
  const [briefing, setBriefing] = useState(
    'Anunciar a próxima turma de Anúncios para Negócios Locais, foco em dono de comércio que quer mais clientes.',
  )
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [fotoCapa, setFotoCapa] = useState<string | null>(null)
  const [subindoFoto, setSubindoFoto] = useState(false)

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

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubindoFoto(true)
    setErro(null)
    try {
      const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao subir a foto.')
      setFotoCapa(data.url)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao subir a foto.')
    } finally {
      setSubindoFoto(false)
    }
  }

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
          template,
          logo: usarLogo,
          logo_pos: usarLogo ? logoPos : 'oculto',
          cta_objetivo: ctaObjetivo,
          foto_capa: fotoCapa ?? undefined,
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
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              MeuEstagiário <span className="text-violet-400">Studio</span>
            </h1>
            <p className="mt-1 text-neutral-400">
              Gere um carrossel da Carreira No Digital a partir de um briefing.
            </p>
          </div>
          <Link href="/contexto" className="text-sm text-violet-300 hover:text-violet-200">
            Contexto da marca →
          </Link>
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

          {/* Foto da capa (real) — sem ela, a capa mostra o placeholder "FOTO REAL" */}
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Foto da capa (opcional)</span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition hover:bg-neutral-800">
                {subindoFoto ? 'Enviando…' : fotoCapa ? 'Trocar foto' : 'Enviar foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={subirFoto}
                  disabled={subindoFoto}
                />
              </label>
              {fotoCapa ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoCapa}
                    alt="prévia da foto da capa"
                    className="h-12 w-12 rounded-lg border border-neutral-700 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFotoCapa(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    remover
                  </button>
                </>
              ) : (
                <span className="text-xs text-neutral-500">JPG, PNG ou WEBP · até 10MB</span>
              )}
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
