import { type NextRequest, NextResponse } from "next/server";

/** Mesmo valor de `SESSION_COOKIE` em `stores/session/session-store.ts`. */
const SESSION_COOKIE = "rotinas_sessao";

/**
 * Login simulado do protótipo: sem a pessoa do tablet identificada, o dashboard volta ao login.
 * A raiz abre direto a Minha Rotina.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const logado = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(logado ? "/dashboard/rotina" : "/auth/login", req.url));
  }

  if (pathname.startsWith("/dashboard") && !logado) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
