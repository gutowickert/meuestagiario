// Ponto único de import do adapter de dados.
// Use sempre `@/lib/data` no resto do código — nunca query Supabase espalhada.
export { getSupabaseAdmin } from './client'
export { getBrand, atualizarBrand, type Brand, type BrandPatch, type VisualTokens } from './brands'
export { inserirContentPiece, type ContentPieceInsert } from './content-pieces'
export {
  listarProdutos,
  getProduto,
  getProdutoPorCodigo,
  resolverProduto,
  upsertProduto,
  deletarProduto,
  type Produto,
  type ProdutoUpsert,
} from './produtos'
export {
  aprovarPeca,
  rejeitarPeca,
  listarAprovados,
  listarPecasAprovadas,
  type AprovarInput,
  type ExemploAprovado,
  type PecaAprovada,
} from './feedback'
export {
  inserirMidia,
  listarMidias,
  deletarMidia,
  type Midia,
  type MidiaInsert,
} from './midias'
export { getDossieCliente, type DossieCliente } from './inteligencia'
