"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { type Acao, NOME_DO_PERFIL, pode, type Recurso } from "@/domain/permissoes";
import type { Perfil } from "@/domain/types";
import { useUsuarioAtual } from "@/stores/session/session-store";

const QUEM_VE: Partial<Record<Recurso, Perfil[]>> = {
  alertas: ["supervisao", "gerencia", "especialista"],
  relatorio: ["supervisao", "gerencia", "especialista", "assistencia"],
  painel: ["supervisao", "gerencia", "especialista"],
  tendencias: ["supervisao", "gerencia", "especialista"],
  notificacoes: ["supervisao", "gerencia", "especialista"],
  usuarios: ["gerencia", "assistencia"],
  padroes: ["gerencia", "especialista"],
};

/**
 * Tela restrita por perfil (RF-08, doc 05 §4). Sem permissão, o estado vazio do template diz quem usa a tela e oferece
 * a volta para a Minha Rotina. O menu já esconde o item; isto cobre o link direto e o aparelho trocado de pessoa.
 */
export function SoComPermissao({
  recurso,
  acao = "ler",
  children,
}: {
  readonly recurso: Recurso;
  readonly acao?: Acao;
  readonly children: ReactNode;
}) {
  const usuario = useUsuarioAtual();
  if (pode(usuario?.perfil, recurso, acao)) return children;
  const quem = QUEM_VE[recurso]?.map((p) => NOME_DO_PERFIL[p]).join(", ");
  return (
    <Empty className="min-h-[60dvh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>Esta tela não é do seu perfil</EmptyTitle>
        <EmptyDescription>
          {quem ? `Ela é usada por ${quem}.` : "Ela não está disponível para o seu perfil."} Peça a quem usa ou volte
          para a sua rotina.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild className="toque:h-14">
          <Link prefetch href="/dashboard/rotina">
            Voltar para Minha Rotina
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
