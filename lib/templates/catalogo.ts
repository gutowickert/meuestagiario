// =============================================================
// Catálogo client-safe dos templates: só metadados (id/nome/descrição), sem JSX
// nem render de servidor. A UI (Studio, galeria) importa daqui; o registry.ts
// server importa os moldes de fato. Mantenha os ids em sincronia com o registry.
// =============================================================
export interface TemplateInfo {
  id: string
  nome: string
  descricao: string
}

export const CATALOGO: TemplateInfo[] = [
  {
    id: 'manchete',
    nome: 'Manchete',
    descricao: 'Estilo agência: tipografia gigante, alto contraste, foto full na capa, prova em destaque e CTA que estoura.',
  },
  {
    id: 'editorial',
    nome: 'Editorial',
    descricao: 'Degradê da marca, títulos Anton, foto em card e número-fantasma nos passos.',
  },
  {
    id: 'bloco',
    nome: 'Bloco',
    descricao: 'Cartões creme sobre a cor sólida da marca. Claro, alto contraste, cara de produto.',
  },
  {
    id: 'destaque',
    nome: 'Destaque',
    descricao: 'A foto em tela cheia na capa, com o texto sobreposto. Internos minimalistas.',
  },
]

export const TEMPLATE_PADRAO_ID = 'manchete'
