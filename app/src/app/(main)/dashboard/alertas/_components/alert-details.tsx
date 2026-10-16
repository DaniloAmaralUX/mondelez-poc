"use client";

import Link from "next/link";

import { cn } from "cn";
import { AlertTriangleIcon, Copy, MessageSquareText, Send, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { localRepository } from "@/data/repository";
import type { Alerta } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { AlertActions } from "./alert-actions";
import { progressRingClasses, STATUS_LABEL, statusBadgeClasses, statusVisual } from "./alerta-estilos";
import { idadeDoAlerta } from "./idade";

const REGRA_LABEL = { "A-ATRASO": "A-ATRASO · RN-01", "A-NC": "A-NC · RN-02" } as const;
const ACAO_LABEL = {
  envio: "Envio",
  assumir: "Assumido",
  acao: "Ação registrada",
  resolver: "Resolvido",
  automatica: "Encerramento automático",
} as const;

type AlertDetailsProps = {
  alerta: Alerta | null;
};

function EmptyAlertOverview() {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-muted-foreground text-sm">
      Selecione um alerta para ver os detalhes.
    </div>
  );
}

function useOrigem(alerta: Alerta) {
  const registros = useSessionStore((s) => s.registros);
  const registro = alerta.registroId ? registros[alerta.registroId] : undefined;
  const pessoa = registro
    ? localRepository.usuario(registro.usuarioId)
    : localRepository.usuarios().find((u) => u.perfil === "operacao");
  return { registro, pessoa };
}

function AlertOverview({ alerta }: { alerta: Alerta }) {
  const agora = useAgora();
  const status = statusVisual(alerta);
  const { registro, pessoa } = useOrigem(alerta);
  const posto = localRepository.posto(alerta.postoId);
  const equipamento = alerta.equipamentoId ? localRepository.equipamento(alerta.equipamentoId) : undefined;
  const responsavel = alerta.responsavelId ? localRepository.usuario(alerta.responsavelId) : undefined;
  const itemCritico = alerta.itensNaoConformes.some((i) => i.critico);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-medium text-lg tabular-nums tracking-tight sm:text-xl">#{alerta.regra}</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar código do alerta"
            onClick={() => {
              void navigator.clipboard?.writeText(alerta.id);
              toast("Código do alerta copiado", { description: alerta.id });
            }}
          >
            <Copy />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Badge variant="outline" className={cn("gap-1.5", statusBadgeClasses[status])}>
            <span className={cn("size-1.5 rounded-full bg-current", progressRingClasses[status])} />
            {STATUS_LABEL[status]}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">{idadeDoAlerta(alerta, agora)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">desde {formatarHora(alerta.criadoEm)}</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-9 after:rounded-sm">
            <AvatarFallback className="rounded-sm">{pessoa ? getInitials(pessoa.nome) : "OP"}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm leading-none">{registro ? pessoa?.nome : "Operação do posto"}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs tabular-nums leading-none tracking-tight">
                {registro ? `Matrícula ${pessoa?.matricula}` : `${posto?.nome} · sem registro`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary">
            <Star />
            {alerta.criticidade === "critico" ? "Crítico" : "Atenção"}
          </Badge>
          <div className="text-muted-foreground text-xs leading-none">
            {itemCritico ? "Item de segurança ou qualidade" : "Escalona após 30 min"}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-medium">Detalhes do alerta</h2>

          <Button asChild variant="outline" size="sm">
            <Link
              prefetch={false}
              href={registro ? `/dashboard/checklist/${registro.formularioId}` : "/dashboard/tarefas"}
            >
              {registro ? "Abrir o registro" : "Ver tarefas do posto"}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-[1.35fr_1fr_1.1fr_1.15fr_1fr]">
          <div className="col-span-2 flex flex-col gap-1 md:col-span-1 md:gap-2">
            <div className="text-muted-foreground text-xs leading-none md:invisible md:text-sm">Alerta</div>
            <div className="text-sm leading-tight">{alerta.titulo}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Posto</div>
            <div className="text-sm leading-none">{posto?.nome}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Equipamento</div>
            <div className="text-sm leading-none">{equipamento?.nome ?? "—"}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Regra</div>
            <div className="text-sm leading-none">{REGRA_LABEL[alerta.regra]}</div>
          </div>

          <div className="flex flex-col gap-2 md:text-right">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Responsável</div>
            <div className="text-sm leading-none">{responsavel?.nome ?? "—"}</div>
          </div>
        </div>
      </div>

      <Separator />

      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>{alerta.regra === "A-NC" ? "Itens fora do padrão" : "Tarefa sem registro no prazo"}</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="space-y-1 border-amber-900 text-amber-900 dark:border-amber-50 dark:text-amber-50">
            {alerta.regra === "A-NC" ? (
              alerta.itensNaoConformes.map((item) => (
                <p key={item.texto} className="leading-snug">
                  <span className="font-medium">{item.texto}:</span> {item.detalhe}
                </p>
              ))
            ) : (
              <p className="leading-snug">{alerta.descricao}</p>
            )}
          </div>

          <Separator className="bg-amber-800 dark:bg-amber-50" />

          <div className="flex flex-wrap gap-2">
            {[
              ...(itemCritico ? [{ icon: ShieldAlert, label: "Item crítico" }] : []),
              { icon: Send, label: "Teams enviado" },
              { icon: MessageSquareText, label: "Supervisão e especialista" },
            ].map(({ icon: TagIcon, label }) => (
              <Badge
                className="rounded-sm border-amber-200 bg-background/50 text-amber-900 dark:border-amber-900 dark:text-amber-50"
                key={label}
                variant="outline"
              >
                <TagIcon data-icon="inline-start" />
                {label}
              </Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/** Ciclo do alerta como linha do tempo vertical: quem fez o quê e quando (substitui a faixa de 420 px da v0). */
function AlertHistory({ alerta }: { alerta: Alerta }) {
  const eventos = [
    { id: "criado", titulo: "Alerta gerado", texto: alerta.descricao, em: alerta.criadoEm, autor: undefined },
    ...alerta.acoes.map((acao) => ({
      id: `${acao.tipo}-${acao.em}`,
      titulo: ACAO_LABEL[acao.tipo],
      texto: acao.texto,
      em: new Date(acao.em),
      autor: acao.usuarioId ? localRepository.usuario(acao.usuarioId) : undefined,
    })),
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Histórico</h2>
      <Timeline activeIndex={alerta.estado === "resolvido" ? eventos.length : eventos.length - 1} className="gap-5">
        {eventos.map((evento) => (
          <TimelineItem key={evento.id}>
            <TimelineDot />
            <TimelineConnector />
            <TimelineContent>
              <TimelineHeader>
                <TimelineTime dateTime={evento.em.toISOString()} className="tabular-nums">
                  {formatarHora(evento.em)}
                </TimelineTime>
                <TimelineTitle>{evento.titulo}</TimelineTitle>
              </TimelineHeader>
              <TimelineDescription>
                {evento.texto}
                {evento.autor && ` · ${evento.autor.nome}`}
              </TimelineDescription>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </section>
  );
}

export function AlertDetails({ alerta }: AlertDetailsProps) {
  if (!alerta) {
    return (
      <div className="h-full p-4">
        <EmptyAlertOverview />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      <div className="flex min-h-0 flex-col gap-6 overflow-auto p-4">
        <AlertOverview alerta={alerta} />
        <Separator />
        <AlertHistory alerta={alerta} />
      </div>
      <div className="border-t bg-background/95 px-4 py-3 backdrop-blur-sm">
        <AlertActions alerta={alerta} />
      </div>
    </div>
  );
}
