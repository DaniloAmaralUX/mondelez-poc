"use client";

import type { ReactNode } from "react";

import { localRepository } from "@/data/repository";
import { useSessionStore } from "@/stores/session/session-store";

/**
 * Cabeçalho das telas de produção (Hora x Hora e Sobrepeso) no padrão Large Title da Minha Rotina (greeting.tsx, docs/14):
 * linha e posto como sobretítulo, título em 32–34 px e o contexto do dia como subtítulo.
 */
export function CabecalhoDaProducao({ titulo, children }: { readonly titulo: string; readonly children?: ReactNode }) {
  const contexto = useSessionStore((s) => s.contexto);
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    <header className="flex flex-col gap-1.5 pouca-altura:gap-1">
      <p className="font-semibold text-muted-foreground text-sm toque:text-base">
        {linha && posto ? `${linha.nome} · ${posto.nome}` : "Produção"}
      </p>
      <h1 className="@min-[60rem]/content:text-[2.125rem] pouca-altura:text-2xl text-[2rem] text-foreground leading-[1.1]">
        {titulo}
      </h1>
      {children && (
        <p className="text-pretty pouca-altura:text-base text-lg text-muted-foreground leading-snug">{children}</p>
      )}
    </header>
  );
}
