"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/** Só mostra o app com usuário logado e posto escolhido. O estado vem do IndexedDB do tablet. */
export function SessionGate({ children }: { readonly children: ReactNode }) {
  const hydrated = useSessionHydrated();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const contexto = useSessionStore((s) => s.contexto);
  const router = useRouter();
  const path = usePathname();

  const precisaLogin = hydrated && !usuarioId;
  const precisaContexto = hydrated && !!usuarioId && !contexto && path !== "/contexto";

  useEffect(() => {
    if (precisaLogin) router.replace("/login");
    else if (precisaContexto) router.replace("/contexto");
  }, [precisaLogin, precisaContexto, router]);

  if (!hydrated || precisaLogin || precisaContexto) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return children;
}
