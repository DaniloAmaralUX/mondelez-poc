"use client";

import type { ReactNode } from "react";

import { useAgora } from "@/stores/session/session-store";

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

/**
 * Título grande da tela (Large Title do iOS, docs/14), como a saudação da Minha Rotina: data do relógio da demonstração
 * como sobretítulo, título em 32–34 px e subtítulo. A ação da tela, quando houver, fica à direita no notebook e embaixo
 * no iPad em retrato. Usado pelas telas de turno e liderança da v0.5 (relatório, troca de turno, painel).
 */
export function TituloGrande({ titulo, subtitulo, acao }: { titulo: string; subtitulo?: ReactNode; acao?: ReactNode }) {
  const agora = useAgora();
  return (
    <header className="flex @2xl/content:flex-row flex-col @2xl/content:items-end @2xl/content:justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5 pouca-altura:gap-1">
        <p className="font-semibold text-muted-foreground text-sm toque:text-base first-letter:uppercase">
          {DATA_LONGA.format(agora)}
        </p>
        <h1 className="@min-[60rem]/content:text-[2.125rem] pouca-altura:text-2xl text-[2rem] text-foreground leading-[1.1]">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-pretty pouca-altura:text-base text-lg text-muted-foreground leading-snug">{subtitulo}</p>
        )}
      </div>
      {acao && <div className="flex shrink-0 flex-wrap items-center gap-3">{acao}</div>}
    </header>
  );
}
