/**
 * `/api/saude`: o servidor responde? Usado pelo HEAD de `src/lib/pwa/servidor.ts`, que o service worker não atende
 * (ele só trata GET). Sem dados, sem cache e fora do `proxy`: responde com ou sem pessoa no posto.
 */
export const dynamic = "force-dynamic";

function semConteudo() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export function HEAD() {
  return semConteudo();
}

export function GET() {
  return semConteudo();
}
