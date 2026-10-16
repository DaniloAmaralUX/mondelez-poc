"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import { useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

export function SupportCard() {
  const contexto = useSessionStore((s) => s.contexto);
  const hydrated = useSessionHydrated();
  const agora = useAgora();
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    <Card size="sm" className="overflow-hidden shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm">Precisa de ajuda?</CardTitle>
        <CardDescription className="line-clamp-3">
          Chame a supervisão {hydrated ? `do ${turnoAtual(agora).numero}º turno` : "do turno"}
          {linha && posto ? ` na ${linha.nome} · ${posto.nome}` : ""} ou use o pedido de ajuda no Teams.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
