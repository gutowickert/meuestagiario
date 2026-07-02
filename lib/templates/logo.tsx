// =============================================================
// Logo em canto — overlay absoluto, posicionável e opcional. Usado por todos os
// templates pra o usuário escolher SE usa e ONDE (mantém consistência visual).
// =============================================================
import type { CSSProperties, ReactElement } from 'react'
import { LOGO_POS_PADRAO, type LogoPos } from './types'

/**
 * Devolve o logo posicionado no canto pedido, ou null se oculto/sem URL.
 * `escala` ajusta o tamanho (1 = ~230px de largura em 1080).
 */
export function logoCanto(
  logoUrl: string | undefined,
  pos: LogoPos | undefined,
  largura: number,
  escala = 1,
): ReactElement | null {
  const p = pos ?? LOGO_POS_PADRAO
  if (!logoUrl || p === 'oculto') return null

  const u = largura / 1080
  const w = 230 * u * escala
  const h = w / 2.745 // proporção do logo (2133x777)
  const pad = 56 * u

  const cantos: Record<Exclude<LogoPos, 'oculto'>, CSSProperties> = {
    sup_esq: { top: pad, left: pad },
    sup_dir: { top: pad, right: pad },
    inf_esq: { bottom: pad, left: pad },
    inf_dir: { bottom: pad, right: pad },
  }

  return (
    <img
      src={logoUrl}
      width={w}
      height={h}
      style={{ position: 'absolute', width: w, height: h, objectFit: 'contain', ...cantos[p] }}
    />
  )
}
