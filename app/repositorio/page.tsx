'use client'

// Repositório por PRAÇA (produto × cidade, ex.: "ANL · Caxias"). Cada praça guarda:
//  - material bruto (fotos/vídeos que a equipe sobe acompanhando a turma)
//  - as peças aprovadas daquela praça
// O material abastece a geração da praça (Studio/Turmas puxam essas fotos).
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'
import { RoteiroCard, type RoteiroResult, type RoteiroBlocoAsset } from '@/app/_components/RoteiroCard'
import { subirMidia } from '@/lib/upload-midia'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

const CIDADES = ['Porto Alegre', 'Novo Hamburgo', 'Canoas', 'Lajeado', 'Caxias do Sul', 'Santa Cruz do Sul']
const GERAL = '__geral__' // praça "conteúdo geral da escola" (sem produto/cidade)

interface ProdutoOpcao { id: string; codigo: string | null; nome: string }
interface Midia { id: string; produto: string | null; cidade: string | null; tipo: 'foto' | 'video'; url: string; nota: string | null }
interface Peca extends PecaResult {
  produto_id: string | null
  cidade: string | null
  assets: PecaResult['assets'] & { roteiro?: RoteiroBlocoAsset[]; duracao?: string }
}

function chavePraca(produto: string | null | undefined, cidade: string | null | undefined) {
  return `${(produto ?? '').trim()}||${(cidade ?? '').trim()}`
}

interface Praca {
  produto: string
  cidade: string
  midias: Midia[]
  pecas: Peca[]
}

function ehRoteiro(p: Peca): boolean {
  return Array.isArray(p.assets.roteiro) && p.assets.roteiro.length > 0
}

export default function Repositorio() {
  const [produtos, setProdutos] = useState<ProdutoOpcao[]>([])
  const [midias, setMidias] = useState<Midia[]>([])
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aberta, setAberta] = useState<string | null>(null)

  // Painel "adicionar material"
  const [addProduto, setAddProduto] = useState('')
  const [addCidade, setAddCidade] = useState(CIDADES[4])
  const [subindo, setSubindo] = useState(false)

  const nomeProduto = useCallback(
    (codigo: string | null) => produtos.find((p) => p.codigo === codigo)?.nome ?? codigo ?? '(sem produto)',
    [produtos],
  )

  const carregar = useCallback(async () => {
    try {
      const [rp, rm, ra] = await Promise.all([
        fetch(`/api/produtos?brand_id=${BRAND_ID}`).then((r) => r.json()),
        fetch(`/api/midias?brand_id=${BRAND_ID}`).then((r) => r.json()),
        fetch(`/api/aprovados?brand_id=${BRAND_ID}`).then((r) => r.json()),
      ])
      setProdutos(rp.produtos ?? [])
      setMidias(rm.midias ?? [])
      setPecas(ra.pecas ?? [])
      if (!addProduto && rp.produtos?.[0]) setAddProduto(rp.produtos[0].codigo ?? '')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar.')
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // Agrupa mídias + peças por praça (produto × cidade).
  const pracas = useMemo(() => {
    const mapa = new Map<string, Praca>()
    const garante = (produto: string, cidade: string) => {
      const k = chavePraca(produto, cidade)
      if (!mapa.has(k)) mapa.set(k, { produto, cidade, midias: [], pecas: [] })
      return mapa.get(k)!
    }
    for (const m of midias) garante(m.produto ?? '', m.cidade ?? '').midias.push(m)
    for (const p of pecas) garante(p.produto_id ?? '', p.cidade ?? '').pecas.push(p)
    return Array.from(mapa.values()).sort((a, b) =>
      `${a.produto}${a.cidade}`.localeCompare(`${b.produto}${b.cidade}`),
    )
  }, [midias, pecas])

  async function adicionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setSubindo(true)
    setErro(null)
    try {
      const geral = addProduto === GERAL
      const prod = geral ? null : addProduto || null
      const cid = geral ? null : addCidade || null
      for (const file of files) {
        const tipo: 'foto' | 'video' = file.type.startsWith('video') ? 'video' : 'foto'
        const nova = await subirMidia({ brandId: BRAND_ID, produto: prod, cidade: cid, tipo, file })
        setMidias((ms) => [{ id: nova.id, produto: nova.produto, cidade: nova.cidade, tipo: nova.tipo, url: nova.url, nota: nova.nota }, ...ms])
      }
      setAberta(chavePraca(prod, cid))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao subir material.')
    } finally {
      setSubindo(false)
    }
  }

  async function remover(id: string) {
    if (!window.confirm('Remover esta mídia do repositório?')) return
    setMidias((ms) => ms.filter((m) => m.id !== id))
    await fetch(`/api/midias?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Repositório <span className="text-violet-400">por praça</span>
            </h1>
            <p className="mt-1 text-neutral-400">Produto × cidade. Material bruto + peças aprovadas, tudo organizado.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="text-violet-300 hover:text-violet-200">Studio</Link>
            <Link href="/turmas" className="text-violet-300 hover:text-violet-200">Turmas</Link>
            <Link href="/planejador" className="text-violet-300 hover:text-violet-200">Planejador</Link>
            <Link href="/videos" className="text-violet-300 hover:text-violet-200">Vídeos</Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {/* Adicionar material a uma praça */}
        <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-1 text-sm font-semibold text-neutral-300">Adicionar material (fotos/vídeos)</div>
          <p className="mb-3 text-xs text-neutral-500">O Nando sobe aqui o que gravou na turma — vai pra praça escolhida e abastece a geração.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Produto</label>
              <select value={addProduto} onChange={(e) => setAddProduto(e.target.value)} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500">
                <option value={GERAL}>Geral / escola (sem produto)</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.codigo ?? ''}>{p.nome}{p.codigo ? ` (${p.codigo})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Cidade</label>
              <select value={addCidade} onChange={(e) => setAddCidade(e.target.value)} disabled={addProduto === GERAL} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-violet-500 disabled:opacity-40">
                {CIDADES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <label className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500">
              {subindo ? 'Subindo…' : '＋ Enviar arquivos'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={adicionar} disabled={subindo} />
            </label>
          </div>
          {addProduto === GERAL ? (
            <p className="mt-2 text-xs text-neutral-500">Conteúdo geral da escola — pra orgânico e demandas que não são de uma turma específica.</p>
          ) : null}
        </section>

        {carregando ? (
          <p className="text-neutral-500">Carregando…</p>
        ) : pracas.length === 0 ? (
          <p className="text-neutral-500">Nenhuma praça ainda. Suba material acima ou aprove peças pra elas aparecerem aqui.</p>
        ) : (
          <div className="space-y-4">
            {pracas.map((pr) => {
              const k = chavePraca(pr.produto, pr.cidade)
              const nFotos = pr.midias.filter((m) => m.tipo === 'foto').length
              const nVideos = pr.midias.filter((m) => m.tipo === 'video').length
              const isAberta = aberta === k
              return (
                <div key={k} className="rounded-2xl border border-neutral-800 bg-neutral-900">
                  <button onClick={() => setAberta(isAberta ? null : k)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                    <div>
                      <div className="text-lg font-semibold">
                        {!pr.produto && !pr.cidade ? (
                          <>Conteúdo geral <span className="text-violet-400">· Escola</span></>
                        ) : (
                          <>{nomeProduto(pr.produto || null)} <span className="text-violet-400">· {pr.cidade || 'sem cidade'}</span></>
                        )}
                      </div>
                      <div className="mt-0.5 flex gap-3 text-xs text-neutral-500">
                        <span>📸 {nFotos} foto(s)</span>
                        <span>🎬 {nVideos} vídeo(s)</span>
                        <span>✅ {pr.pecas.length} aprovada(s)</span>
                      </div>
                    </div>
                    <span className="text-neutral-500">{isAberta ? '▲' : '▼'}</span>
                  </button>

                  {isAberta ? (
                    <div className="border-t border-neutral-800 px-5 py-4">
                      {/* Material bruto */}
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Material bruto</div>
                      {pr.midias.length === 0 ? (
                        <p className="mb-4 text-sm text-neutral-600">Nada ainda. Suba fotos/vídeos no painel acima (produto {pr.produto}, {pr.cidade}).</p>
                      ) : (
                        <div className="mb-5 flex flex-wrap gap-3">
                          {pr.midias.map((m) => (
                            <div key={m.id} className="group relative">
                              {m.tipo === 'video' ? (
                                <video src={m.url} className="h-28 w-28 rounded-lg border border-neutral-700 object-cover" muted />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt="material" className="h-28 w-28 rounded-lg border border-neutral-700 object-cover" />
                              )}
                              <a href={m.url} target="_blank" rel="noreferrer" className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 py-0.5 text-center text-[10px] text-neutral-300 opacity-0 group-hover:opacity-100">
                                {m.tipo === 'video' ? '▶ abrir' : 'abrir'}
                              </a>
                              <button onClick={() => void remover(m.id)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-red-900 hover:text-white" aria-label="remover">×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Peças aprovadas */}
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Peças aprovadas</div>
                      {pr.pecas.length === 0 ? (
                        <p className="text-sm text-neutral-600">Nenhuma peça aprovada nesta praça ainda.</p>
                      ) : (
                        <div className="grid gap-4">
                          {pr.pecas.map((p) =>
                            ehRoteiro(p) ? (
                              <RoteiroCard key={p.id} result={p as unknown as RoteiroResult} brandId={BRAND_ID} estadoInicial="aprovado" />
                            ) : (
                              <PecaCard key={p.id} result={p} brandId={BRAND_ID} produtoId={p.produto_id ?? undefined} estadoInicial="aprovado" />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
