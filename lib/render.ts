// =============================================================
// Render de slide -> PNG (buffer) via @vercel/og (next/og).
// Carrega as fontes uma vez e reaproveita.
// =============================================================
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ReactElement } from 'react'

type FontDef = { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }

let fontsCache: FontDef[] | null = null

async function carregarFontes(): Promise<FontDef[]> {
  if (fontsCache) return fontsCache
  const dir = join(process.cwd(), 'assets/fonts')
  const [anton, poppinsBold, poppinsSemi] = await Promise.all([
    readFile(join(dir, 'Anton-Regular.ttf')),
    readFile(join(dir, 'Poppins-Bold.ttf')),
    readFile(join(dir, 'Poppins-SemiBold.ttf')),
  ])
  fontsCache = [
    { name: 'Anton', data: anton, weight: 400, style: 'normal' },
    { name: 'Poppins', data: poppinsBold, weight: 700, style: 'normal' },
    { name: 'Poppins', data: poppinsSemi, weight: 600, style: 'normal' },
  ]
  return fontsCache
}

/** Renderiza um elemento JSX de slide num PNG (buffer). */
export async function renderSlidePng(
  element: ReactElement,
  largura: number,
  altura: number,
): Promise<Buffer> {
  const fonts = await carregarFontes()
  const resp = new ImageResponse(element, { width: largura, height: altura, fonts })
  return Buffer.from(await resp.arrayBuffer())
}
