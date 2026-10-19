"use client";

import Link from "next/link";

import { cn } from "cn";
import { Bell, BellOff, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { pode } from "@/domain/permissoes";
import { useAlertas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { useUsuarioAtual } from "@/stores/session/session-store";

import {
  STATUS_LABEL,
  STATUS_VARIANTE,
  type StatusVisual,
  statusVisual,
} from "../../alertas/_components/alerta-estilos";

const TINTA: Record<StatusVisual, string> = {
  critico: "bg-destructive/10 text-red-700 dark:text-red-400",
  atencao: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  tratamento: "bg-muted text-foreground",
  resolvido: "bg-green-600/10 text-green-700 dark:text-green-400",
};

/**
 * Detalhe da Bis 2 no relatório: os alertas do turno da linha, do mais recente para o mais antigo, com o estado de cada
 * um. Quem trata alertas abre o alerta na tela de Alertas; a Assistência só lê.
 */
export function AlertasDaLinha({ nomeDaLinha }: { nomeDaLinha: string }) {
  const usuario = useUsuarioAtual();
  const alertas = [...useAlertas()].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  const abreAlerta = pode(usuario?.perfil, "alertas");
  const abertos = alertas.filter((a) => a.estado !== "resolvido").length;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{nomeDaLinha} · alertas do turno</CardTitle>
        <CardDescription>
          {alertas.length === 0
            ? "Nenhum alerta até agora."
            : `${alertas.length} no turno, ${abertos} ainda ${abertos === 1 ? "aberto" : "abertos"}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <Empty className="min-h-40 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellOff />
              </EmptyMedia>
              <EmptyTitle>Turno sem alertas</EmptyTitle>
              <EmptyDescription>Atrasos, não conformidades e desvios de indicador aparecem aqui.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y">
            {alertas.map((alerta) => {
              const status = statusVisual(alerta);
              const Icone = ICONE_MODULO[alerta.moduloSlug] ?? Bell;
              const posto = localRepository.posto(alerta.postoId);
              const conteudo = (
                <>
                  <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-lg", TINTA[status])}>
                    <Icone className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{alerta.titulo}</span>
                    <span className="truncate text-muted-foreground text-sm">
                      {posto?.nome} · {formatarHora(alerta.criadoEm)} · {alerta.regra}
                    </span>
                  </span>
                  <Status variant={STATUS_VARIANTE[status]} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
                    <StatusIndicator className="before:hidden" />
                    <StatusLabel>{STATUS_LABEL[status]}</StatusLabel>
                  </Status>
                </>
              );
              return (
                <li key={alerta.id}>
                  {abreAlerta ? (
                    <Link
                      href={`/dashboard/alertas?alerta=${encodeURIComponent(alerta.id)}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/70"
                    >
                      {conteudo}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3">{conteudo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
