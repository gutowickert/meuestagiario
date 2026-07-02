'use client'

import Link from 'next/link'
import { CATALOGO } from '@/lib/templates/catalogo'

// Galeria de estilos: o MESMO conteúdo de exemplo em cada molde, lendo os tokens
// da marca. Mostra que 1 template != 1 visual — a variedade vem de N moldes ×
// tokens × seleção que aprende (CLAUDE.md §12). Escolha o estilo no Studio.
export default function Estilos() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Estilos de <span className="text-violet-400">template</span>
            </h1>
            <p className="mt-1 max-w-2xl text-neutral-400">
              O mesmo conteúdo, moldes diferentes — todos lendo as cores, fontes e logo da sua marca.
              Escolha o estilo na hora de gerar, no Studio.
            </p>
          </div>
          <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
            Studio →
          </Link>
        </header>

        <div className="grid gap-8">
          {CATALOGO.map((t) => (
            <section key={t.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{t.nome}</h2>
                <p className="text-sm text-neutral-400">{t.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {(['capa', 'conteudo', 'prova'] as const).map((papel) => (
                  <figure key={papel} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/slide-preview?template=${t.id}&papel=${papel}&formato=feed_quadrado`}
                      alt={`${t.nome} — ${papel}`}
                      className="h-72 w-72 rounded-xl border border-neutral-800 object-cover"
                    />
                    <figcaption className="mt-1 text-center text-xs text-neutral-500">{papel}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
