'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PecaCard, type PecaResult } from '@/app/_components/PecaCard'
import { RoteiroCard, type RoteiroResult, type RoteiroBlocoAsset } from '@/app/_components/RoteiroCard'

const BRAND_ID = 'a1111111-1111-4111-8111-111111111111'

interface Aprovada extends PecaResult {
  produto_id: string | null
  criado_em: string
  // peças de vídeo (tipo reel) trazem o roteiro nos assets, sem slides
  assets: PecaResult['assets'] & { roteiro?: RoteiroBlocoAsset[]; duracao?: string }
}

function ehRoteiro(p: Aprovada): boolean {
  return Array.isArray(p.assets.roteiro) && p.assets.roteiro.length > 0
}

export default function Aprovados() {
  const [pecas, setPecas] = useState<Aprovada[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(() => {
    return fetch(`/api/aprovados?brand_id=${BRAND_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setPecas(d.pecas ?? [])
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Falha ao carregar.'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Aprovados <span className="text-violet-400">({pecas.length})</span>
            </h1>
            <p className="mt-1 text-neutral-400">Sua gaveta de peças prontas — baixe as imagens e copie as legendas.</p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/chat" className="text-violet-300 hover:text-violet-200">
              Conversa
            </Link>
            <Link href="/turmas" className="text-violet-300 hover:text-violet-200">
              Turmas em lote
            </Link>
            <Link href="/planejador" className="text-violet-300 hover:text-violet-200">Planejador</Link>
            <Link href="/videos" className="text-violet-300 hover:text-violet-200">
              Vídeos
            </Link>
            <Link href="/" className="text-violet-300 hover:text-violet-200">
              Studio →
            </Link>
          </div>
        </header>

        {erro ? <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{erro}</p> : null}

        {carregando ? (
          <p className="text-neutral-500">Carregando…</p>
        ) : pecas.length === 0 ? (
          <p className="text-neutral-500">
            Nenhuma peça aprovada ainda. Gere no Studio ou na Conversa e clique <span className="text-emerald-400">👍 Marcar boa</span>.
          </p>
        ) : (
          <div className="grid gap-6">
            {pecas.map((p) =>
              ehRoteiro(p) ? (
                <RoteiroCard key={p.id} result={p as unknown as RoteiroResult} brandId={BRAND_ID} estadoInicial="aprovado" />
              ) : (
                <PecaCard
                  key={p.id}
                  result={p}
                  brandId={BRAND_ID}
                  produtoId={p.produto_id ?? undefined}
                  estadoInicial="aprovado"
                />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  )
}
