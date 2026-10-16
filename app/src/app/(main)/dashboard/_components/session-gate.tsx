"use client";

import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/** O estado do tablet vem do IndexedDB; sem pessoa logada, volta ao login. */
export function SessionGate({ children }: { readonly children: ReactNode }) {
  const hydrated = useSessionHydrated();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const router = useRouter();
  const semSessao = hydrated && !usuarioId;

  useEffect(() => {
    if (semSessao) router.replace("/auth/login");
  }, [semSessao, router]);

  if (!hydrated || semSessao) {
    return <div className="flex size-full items-center justify-center text-muted-foreground text-sm">Carregando…</div>;
  }

  return children;
}
