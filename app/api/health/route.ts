// Smoke test da Fatia 1: confirma que o serviço está de pé.
// GET /api/health -> { ok: true }
export async function GET() {
  return Response.json({ ok: true })
}
