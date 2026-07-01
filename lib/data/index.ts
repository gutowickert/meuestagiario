// Ponto único de import do adapter de dados.
// Use sempre `@/lib/data` no resto do código — nunca query Supabase espalhada.
export { getSupabaseAdmin } from './client'
export { getBrand, type Brand, type VisualTokens } from './brands'
export { inserirContentPiece, type ContentPieceInsert } from './content-pieces'
