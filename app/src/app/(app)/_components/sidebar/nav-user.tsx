"use client";

import { useRouter } from "next/navigation";

import { UserRoundCog } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { Usuario } from "@/domain/types";
import { toque } from "@/lib/touch";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

/** Usuário atual e troca rápida: o tablet é compartilhado pelo posto, o contexto continua. */
export function NavUser({ usuario }: { readonly usuario: Usuario }) {
  const router = useRouter();
  const sair = useSessionStore((s) => s.sair);

  return (
    <div className="flex flex-col gap-2">
      <Item size="sm" className="px-2">
        <ItemMedia>
          <Avatar>
            <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-base">{usuario.nome}</ItemTitle>
          <ItemDescription>
            {usuario.cargo} · {usuario.matricula}
          </ItemDescription>
        </ItemContent>
      </Item>
      <Button
        variant="outline"
        className={toque.botao}
        onClick={() => {
          sair();
          router.replace("/login");
        }}
      >
        <UserRoundCog data-icon="inline-start" />
        Trocar usuário
      </Button>
    </div>
  );
}
