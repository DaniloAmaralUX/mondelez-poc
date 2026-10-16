"use client";

import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/**
 * O estado do tablet vem do IndexedDB; sem pessoa logada, volta ao login.
 *
 * Tablet bloqueado ("Quem está no posto?", lock-screen.tsx): o conteúdo continua montado por baixo, com o checklist
 * pela metade, a rolagem e a rota, e fica inerte (sem foco, toque nem leitor de tela) até alguém entrar com o PIN.
 * O invólucro existe sempre (`display: contents`, sem caixa própria): bloquear e desbloquear só mudam o atributo
 * `inert`, então a árvore não é recriada e nada se perde.
 */
export function SessionGate({ children }: { readonly children: ReactNode }) {
  const hydrated = useSessionHydrated();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const bloqueado = useSessionStore((s) => s.bloqueado);
  const router = useRouter();
  const semSessao = hydrated && !usuarioId;

  useEffect(() => {
    if (semSessao) router.replace("/auth/login");
  }, [semSessao, router]);

  if (!hydrated || semSessao) {
    return <div className="flex size-full items-center justify-center text-muted-foreground text-sm">Carregando…</div>;
  }

  return (
    <div className="contents" inert={bloqueado}>
      {children}
    </div>
  );
}
