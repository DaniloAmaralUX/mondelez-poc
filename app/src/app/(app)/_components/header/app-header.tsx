"use client";

import Link from "next/link";

import { cn } from "cn";
import { ChevronRight, Clock, CloudCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { toque } from "@/lib/touch";
import { useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

export function AppHeader() {
  const contexto = useSessionStore((s) => s.contexto);
  const hydrated = useSessionHydrated();
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const { planta, linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    <header className="sticky top-0 z-40 flex h-18 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger className={toque.botaoIcone} />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-8 data-[orientation=vertical]:self-center"
      />

      <Button asChild variant="ghost" className={cn(toque.botao, "min-w-0 px-3")}>
        <Link href="/contexto" aria-label="Trocar posto de trabalho">
          {planta && linha && posto ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="hidden text-muted-foreground lg:inline">{planta.nome}</span>
              <ChevronRight aria-hidden className="hidden text-muted-foreground lg:inline" />
              <span className="text-muted-foreground">{linha.nome}</span>
              <ChevronRight aria-hidden className="text-muted-foreground" />
              <span className="truncate font-strong">{posto.nome}</span>
            </span>
          ) : (
            <span>Escolher posto</span>
          )}
        </Link>
      </Button>

      <div className="ml-auto flex items-center gap-4">
        {/* Relógio simulado só depois de carregar o estado do tablet, para o HTML do servidor bater com o cliente. */}
        {hydrated && (
          <div className="flex items-center gap-2 whitespace-nowrap text-base">
            <Clock aria-hidden className="size-5 text-muted-foreground" />
            <span>
              <span className="font-strong">{turno.numero}º turno</span>
              <span className="text-muted-foreground"> · </span>
              <time dateTime={agora.toISOString()} className="tabular-nums">
                {formatarHora(agora)}
              </time>
            </span>
          </div>
        )}
        {/* No I1 não há fila de envio; a fila e o modo offline simulado entram no I2. */}
        <div className="flex items-center gap-2 whitespace-nowrap text-base text-success" role="status">
          <CloudCheck aria-hidden className="size-5" />
          <span className="sr-only lg:not-sr-only">Tudo salvo</span>
        </div>
      </div>
    </header>
  );
}
