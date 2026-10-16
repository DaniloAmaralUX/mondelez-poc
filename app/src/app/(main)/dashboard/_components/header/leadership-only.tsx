"use client";

import type { ReactNode } from "react";

import { APP_CONFIG } from "@/config/app-config";
import { useUsuarioAtual } from "@/stores/session/session-store";

/**
 * Controles que não são do operador (preferências de layout). Com a demonstração ligada (padrão) aparecem para todos;
 * com `NEXT_PUBLIC_DEMO=false`, só para a liderança. Enquanto a sessão do tablet não carrega, o perfil é desconhecido e
 * nada aparece, para o operador não ver o controle piscar. O painel de demonstração não passa por aqui: ele só existe
 * com a demonstração ligada, para todos os perfis (demo-menu.tsx).
 */
export function LeadershipOnly({ children }: { readonly children: ReactNode }) {
  const usuario = useUsuarioAtual();

  if (APP_CONFIG.demo.enabled) return children;
  if (!usuario || usuario.perfil === "operacao") return null;
  return children;
}
