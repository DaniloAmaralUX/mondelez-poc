"use client";

import Link from "next/link";

import { ChevronRight, LayoutGrid } from "lucide-react";

import { ICONE_MODULO } from "@/components/rotina/icone-modulo";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { localRepository } from "@/data/repository";
import { useUsuarioAtual } from "@/stores/session/session-store";

export function GradeModulos() {
  const usuario = useUsuarioAtual();
  const modulos = localRepository.modulos().filter((m) => !m.perfis || (usuario && m.perfis.includes(usuario.perfil)));

  return (
    <div className="grid gap-3 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {modulos.map((m) => {
        const Icone = ICONE_MODULO[m.slug] ?? LayoutGrid;
        return (
          <Item key={m.slug} asChild variant="outline" className="min-h-touch items-start">
            <Link href={`/modulos/${m.slug}`}>
              <ItemMedia variant="icon" className="size-10 rounded-lg bg-primary/10 text-primary [&_svg]:size-5!">
                <Icone />
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle className="text-base">{m.nome}</ItemTitle>
                <ItemDescription className="text-sm">{m.descricao}</ItemDescription>
              </ItemContent>
              <ItemActions className="self-center">
                <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
              </ItemActions>
            </Link>
          </Item>
        );
      })}
    </div>
  );
}
