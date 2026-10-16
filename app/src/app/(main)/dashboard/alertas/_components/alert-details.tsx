"use client";

import * as React from "react";

import Link from "next/link";

import { cn } from "cn";
import { AlertTriangleIcon, CheckCircle2, Copy, Hand, MessageSquareText, Send, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { localRepository } from "@/data/repository";
import type { Alerta } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { progressRingClasses, STATUS_LABEL, statusBadgeClasses, statusVisual } from "./alerta-estilos";
import { AlertTimelineMap } from "./alert-timeline-map";
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

function AlertOverview({ alerta, onTratar }: { alerta: Alerta; onTratar: () => void }) {
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

          {alerta.estado !== "resolvido" && (
            <Button variant="outline" size="sm" onClick={onTratar}>
              <Hand data-icon="inline-start" />
              {alerta.estado === "aberto" ? "Assumir" : "Tratar"}
            </Button>
          )}
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

function AlertTreatment({ alerta }: { alerta: Alerta }) {
  const usuario = useUsuarioAtual();
  const tratarAlerta = useSessionStore((s) => s.tratarAlerta);
  const [texto, setTexto] = React.useState("");
  const podeTratar = usuario && usuario.perfil !== "operacao";

  if (alerta.estado === "resolvido") {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed text-muted-foreground text-sm">
        Alerta resolvido. O histórico fica guardado para auditoria.
      </div>
    );
  }

  if (!podeTratar) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
        O tratamento é feito pela supervisão, gerência ou especialista (RM-09).
      </div>
    );
  }

  function registrar(tipo: "assumir" | "acao" | "resolver") {
    const descricao =
      texto.trim() ||
      { assumir: "Assumiu o tratamento.", acao: "Ação registrada.", resolver: "Desvio tratado e encerrado." }[tipo];
    if (tipo === "resolver" && !texto.trim()) {
      toast.error("Descreva a ação que resolveu o desvio");
      return;
    }
    tratarAlerta(alerta.id, tipo, descricao);
    setTexto("");
    toast.success({ assumir: "Alerta assumido", acao: "Ação registrada", resolver: "Alerta resolvido" }[tipo], {
      description: alerta.titulo,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field className="gap-1">
        <FieldLabel className="text-xs" htmlFor="acao-alerta">
          Ação tomada
        </FieldLabel>
        <Textarea
          id="acao-alerta"
          rows={3}
          placeholder="O que foi feito no posto?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <FieldDescription className="text-xs">
          Fica no histórico do alerta com seu nome e horário. Para resolver, descreva a ação.
        </FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        {alerta.estado === "aberto" && (
          <Button variant="outline" onClick={() => registrar("assumir")}>
            <Hand data-icon="inline-start" />
            Assumir
          </Button>
        )}
        <Button variant="outline" onClick={() => registrar("acao")} disabled={!texto.trim()}>
          <MessageSquareText data-icon="inline-start" />
          Registrar ação
        </Button>
        <Button onClick={() => registrar("resolver")}>
          <CheckCircle2 data-icon="inline-start" />
          Resolver
        </Button>
      </div>
    </div>
  );
}

function AlertHistory({ alerta }: { alerta: Alerta }) {
  return (
    <div className="flex flex-col gap-4">
      {alerta.acoes.map((acao) => {
        const autor = acao.usuarioId ? localRepository.usuario(acao.usuarioId) : undefined;
        return (
          <div key={`${acao.tipo}-${acao.em}`} className="flex items-start gap-3">
            <Avatar className="size-8 after:rounded-sm">
              <AvatarFallback className="rounded-sm text-xs">{autor ? getInitials(autor.nome) : "RO"}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="text-sm leading-none">
                <span className="font-medium">{ACAO_LABEL[acao.tipo]}</span>
                <span className="text-muted-foreground"> · {formatarHora(new Date(acao.em))}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {acao.texto}
                {autor && ` · ${autor.nome}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertOrigin({ alerta }: { alerta: Alerta }) {
  const { registro } = useOrigem(alerta);
  const formulario = registro ? localRepository.formulario(registro.formularioId) : undefined;

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p className="text-muted-foreground">
        {registro
          ? `Registro ${registro.id} de ${formulario?.titulo}, versão ${registro.versaoFormulario}, às ${formatarHora(new Date(registro.criadoEm))}.`
          : "Tarefa obrigatória do posto que não teve registro até o fim da janela."}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link prefetch={false} href={registro ? `/dashboard/checklist/${registro.formularioId}` : "/dashboard/tarefas"}>
          {registro ? "Abrir o registro" : "Ver tarefas do posto"}
        </Link>
      </Button>
    </div>
  );
}

export function AlertDetails({ alerta }: AlertDetailsProps) {
  const [aba, setAba] = React.useState("overview");

  if (!alerta) {
    return (
      <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
        <div className="min-h-0 overflow-hidden">
          <AlertTimelineMap alerta={null} />
        </div>
        <div className="min-h-0 overflow-hidden p-4">
          <EmptyAlertOverview />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
      <div className="min-h-0 overflow-hidden">
        <AlertTimelineMap alerta={alerta} />
      </div>
      <div className="min-h-0 overflow-hidden">
        <div className="h-full min-h-0 py-2">
          <Tabs value={aba} onValueChange={setAba} className="h-full gap-0">
            <TabsList
              className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
              variant="line"
            >
              <TabsTrigger className="flex-none" value="overview">
                Visão geral
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="tratamento">
                Tratamento
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="historico">
                Histórico ({alerta.acoes.length})
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="origem">
                Origem
              </TabsTrigger>
            </TabsList>
            <TabsContent className="min-h-0 overflow-auto p-4" value="overview">
              <AlertOverview alerta={alerta} onTratar={() => setAba("tratamento")} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="tratamento">
              <AlertTreatment alerta={alerta} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="historico">
              <AlertHistory alerta={alerta} />
            </TabsContent>
            <TabsContent className="min-h-0 overflow-auto p-4" value="origem">
              <AlertOrigin alerta={alerta} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
