'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

// Marca de teste (Carreira No Digital). Depois vira um seletor de marcas.
const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface BrandForm {
  nome: string
  nicho: string
  oferta: string
  publico: string
  tom: string
  metodo: string
}

interface Produto {
  id: string
  brand_id: string
  codigo: string | null
  nome: string
  metodo: string | null
  oferta: string | null
  publico: string | null
  meta: string | null
  ativo: boolean
}

const BRAND_VAZIA: BrandForm = { nome: '', nicho: '', oferta: '', publico: '', tom: '', metodo: '' }

function campo(v: string | null | undefined): string {
  return v ?? ''
}

export default function Contexto() {
  const [brand, setBrand] = useState<BrandForm>(BRAND_VAZIA)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoMarca, setSalvandoMarca] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [edit, setEdit] = useState<Partial<Produto> | null>(null) // produto em edição/criação
  const [salvandoProduto, setSalvandoProduto] = useState(false)

  // Cadeia de promise (setState só em callbacks): no mount `carregando` já é true;
  // em refreshs (após salvar/apagar) o recarregamento é silencioso.
  const carregar = useCallback(() => {
    return Promise.all([
      fetch(`/api/brands/${BRAND_ID}`),
      fetch(`/api/produtos?brand_id=${BRAND_ID}`),
    ])
      .then(async ([rb, rp]) => {
        const db = await rb.json()
        const dp = await rp.json()
        if (!rb.ok) throw new Error(db.error || 'Falha ao carregar a marca.')
        if (!rp.ok) throw new Error(dp.error || 'Falha ao carregar os produtos.')
        setBrand({
          nome: campo(db.nome),
          nicho: campo(db.nicho),
          oferta: campo(db.oferta),
          publico: campo(db.publico),
          tom: campo(db.tom),
          metodo: campo(db.metodo),
        })
        setProdutos(dp.produtos ?? [])
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Falha desconhecida.'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvarMarca() {
    setSalvandoMarca(true)
    setErro(null)
    setAviso(null)
    try {
      const resp = await fetch(`/api/brands/${BRAND_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao salvar a marca.')
      setAviso('Marca salva.')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setSalvandoMarca(false)
    }
  }

  async function salvarProduto() {
    if (!edit || !edit.nome?.trim()) {
      setErro('O produto precisa de um nome.')
      return
    }
    setSalvandoProduto(true)
    setErro(null)
    setAviso(null)
    try {
      const resp = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...edit, brand_id: BRAND_ID }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao salvar o produto.')
      setEdit(null)
      setAviso('Produto salvo.')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    } finally {
      setSalvandoProduto(false)
    }
  }

  async function apagarProduto(id: string) {
    setErro(null)
    setAviso(null)
    try {
      const resp = await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Falha ao apagar o produto.')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha desconhecida.')
    }
  }

  const inputCls =
    'rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-violet-500'

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contexto <span className="text-violet-400">da marca</span>
            </h1>
            <p className="mt-1 text-neutral-400">
              A base da assertividade: quanto mais rico aqui, menos genérica a saída.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/onboarding" className="text-violet-300 hover:text-violet-200">
              Onboarding por áudio
            </Link>
            <Link href="/" className="text-violet-300 hover:text-violet-200">
              Studio →
            </Link>
          </div>
        </header>

        {erro ? (
          <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p>
        ) : null}
        {aviso ? (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">{aviso}</p>
        ) : null}

        {carregando ? (
          <p className="text-neutral-400">Carregando…</p>
        ) : (
          <>
            {/* ---- Marca (base do orgânico) ---- */}
            <section className="mb-10 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold">Marca / negócio</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-400">Nome</span>
                  <input
                    className={inputCls}
                    value={brand.nome}
                    onChange={(e) => setBrand({ ...brand, nome: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-400">Nicho</span>
                  <input
                    className={inputCls}
                    value={brand.nicho}
                    onChange={(e) => setBrand({ ...brand, nicho: e.target.value })}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-400">Oferta geral</span>
                <textarea
                  className={`${inputCls} min-h-16`}
                  value={brand.oferta}
                  onChange={(e) => setBrand({ ...brand, oferta: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-400">Público</span>
                <textarea
                  className={`${inputCls} min-h-16`}
                  value={brand.publico}
                  onChange={(e) => setBrand({ ...brand, publico: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-400">Tom de voz</span>
                <textarea
                  className={`${inputCls} min-h-16`}
                  value={brand.tom}
                  onChange={(e) => setBrand({ ...brand, tom: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-neutral-400">
                  Método da escola <span className="text-neutral-600">(Camada 2 — framework de marketing)</span>
                </span>
                <textarea
                  className={`${inputCls} min-h-32`}
                  value={brand.metodo}
                  onChange={(e) => setBrand({ ...brand, metodo: e.target.value })}
                />
              </label>
              <button
                onClick={salvarMarca}
                disabled={salvandoMarca}
                className="mt-1 w-fit rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {salvandoMarca ? 'Salvando…' : 'Salvar marca'}
              </button>
            </section>

            {/* ---- Produtos (base do anúncio) ---- */}
            <section className="grid gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Produtos <span className="text-neutral-500">({produtos.length})</span>
                </h2>
                {!edit ? (
                  <button
                    onClick={() => setEdit({ nome: '', codigo: '' })}
                    className="rounded-lg border border-violet-600 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-600 hover:text-white"
                  >
                    + Novo produto
                  </button>
                ) : null}
              </div>

              {/* Editor inline (novo ou edição) */}
              {edit ? (
                <div className="grid gap-4 rounded-2xl border border-violet-800 bg-neutral-900 p-6">
                  <h3 className="text-sm font-semibold text-violet-300">
                    {edit.id ? `Editando: ${edit.nome}` : 'Novo produto'}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-neutral-400">Código (utm)</span>
                      <input
                        className={inputCls}
                        placeholder="ANL"
                        value={campo(edit.codigo)}
                        onChange={(e) => setEdit({ ...edit, codigo: e.target.value })}
                      />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1 text-sm">
                      <span className="text-neutral-400">Nome</span>
                      <input
                        className={inputCls}
                        value={campo(edit.nome)}
                        onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">Oferta</span>
                    <textarea
                      className={`${inputCls} min-h-16`}
                      value={campo(edit.oferta)}
                      onChange={(e) => setEdit({ ...edit, oferta: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">Público específico</span>
                    <textarea
                      className={`${inputCls} min-h-16`}
                      value={campo(edit.publico)}
                      onChange={(e) => setEdit({ ...edit, publico: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">
                      Método do produto <span className="text-neutral-600">(o que diferencia a saída)</span>
                    </span>
                    <textarea
                      className={`${inputCls} min-h-32`}
                      value={campo(edit.metodo)}
                      onChange={(e) => setEdit({ ...edit, metodo: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-400">Meta / objetivo</span>
                    <input
                      className={inputCls}
                      value={campo(edit.meta)}
                      onChange={(e) => setEdit({ ...edit, meta: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={salvarProduto}
                      disabled={salvandoProduto}
                      className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                      {salvandoProduto ? 'Salvando…' : 'Salvar produto'}
                    </button>
                    <button
                      onClick={() => setEdit(null)}
                      className="rounded-lg border border-neutral-700 px-5 py-2.5 text-neutral-300 transition hover:bg-neutral-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Lista de produtos */}
              {produtos.map((p) => {
                const semMetodo = !p.metodo || p.metodo.startsWith('PLACEHOLDER')
                return (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {p.codigo ? (
                          <span className="rounded bg-violet-950 px-2 py-0.5 text-xs font-semibold text-violet-300">
                            {p.codigo}
                          </span>
                        ) : null}
                        <span className="font-semibold">{p.nome}</span>
                        {semMetodo ? (
                          <span className="rounded bg-amber-950 px-2 py-0.5 text-xs text-amber-300">
                            método pendente
                          </span>
                        ) : null}
                      </div>
                      {p.oferta ? (
                        <p className="mt-1 truncate text-sm text-neutral-400">{p.oferta}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setEdit(p)}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => apagarProduto(p.id)}
                        className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-950"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                )
              })}
              {produtos.length === 0 && !edit ? (
                <p className="text-neutral-500">Nenhum produto ainda. Crie o primeiro.</p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
