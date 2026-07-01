// =============================================================
// Mapeia os tokens_visuais da marca (jsonb solto) para o shape do template,
// com fallback pra paleta da Carreira No Digital.
// Obs.: só Anton/Poppins estão empacotadas (assets/fonts) na Fatia 1.
// =============================================================
import type { VisualTokens } from '../data'
import type { CapaTokens } from './slide-capa'

const PADRAO: CapaTokens = {
  cores: {
    primaria: '#7A2BD4',
    primaria_escura: '#3D1178',
    destaque: '#6FE3A6',
    creme: '#EAF7EC',
    texto_claro: '#FFFFFF',
    texto_escuro: '#262626',
    barra: '#141414',
  },
  fontes: { titulo: 'Anton', corpo: 'Poppins' },
}

export function tokensParaTemplate(tv: VisualTokens | undefined): CapaTokens {
  const cores = (tv?.cores ?? {}) as Record<string, string>
  const fontes = (tv?.fontes ?? {}) as Record<string, string>
  return {
    cores: {
      primaria: cores.primaria ?? PADRAO.cores.primaria,
      primaria_escura: cores.primaria_escura ?? PADRAO.cores.primaria_escura,
      destaque: cores.destaque ?? PADRAO.cores.destaque,
      creme: cores.creme ?? PADRAO.cores.creme,
      texto_claro: cores.texto_claro ?? PADRAO.cores.texto_claro,
      texto_escuro: cores.texto_escuro ?? PADRAO.cores.texto_escuro,
      barra: cores.barra ?? PADRAO.cores.barra,
    },
    fontes: {
      titulo: fontes.titulo ?? PADRAO.fontes.titulo,
      corpo: fontes.corpo ?? PADRAO.fontes.corpo,
    },
  }
}
