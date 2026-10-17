import { type NextRequest, NextResponse } from "next/server";

import { ehAquecimentoDoServiceWorker } from "@/lib/pwa/regras-do-cache";

/** Mesmo valor de `SESSION_COOKIE` em `stores/session/session-store.ts`. */
const SESSION_COOKIE = "rotinas_sessao";

/**
 * Login simulado do protótipo: sem a pessoa do tablet identificada, o dashboard volta ao login.
 * A raiz abre direto a Minha Rotina.
 *
 * O service worker, ao guardar o HTML das telas para um build novo, passa mesmo sem pessoa (`ehAquecimentoDoServiceWorker`):
 * o HTML é o mesmo para todos, e o SessionGate leva ao login no cliente.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const logado = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(logado ? "/dashboard/rotina" : "/auth/login", req.url));
  }

  if (pathname.startsWith("/dashboard") && !logado && !ehAquecimentoDoServiceWorker(req)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
