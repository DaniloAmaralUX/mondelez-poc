"use client";

import Link from "next/link";

import { cn } from "cn";
import {
  AlertTriangleIcon,
  Clock,
  Copy,
  MessageSquareText,
  PanelRight,
  Send,
  ShieldAlert,
  Star,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import type { AcaoAlerta, Alerta, Registro } from "@/domain/types";
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
  /** `id` do título (recebe o foco quando o detalhe substitui a lista na pilha do retrato). */
  tituloId?: string;
};

/** v0.4 (docs/14): estado vazio do template (Empty) no lugar da caixa tracejada, centralizado no painel como no Mail. */
function EmptyAlertOverview() {
  return (
    <Empty className="h-full min-h-64">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PanelRight />
        </EmptyMedia>
        <EmptyTitle>Nenhum alerta aberto aqui</EmptyTitle>
        <EmptyDescription>Selecione um alerta na lista para ver o que aconteceu e tratar.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * O aviso no Teams sai do servidor, quando o registro chega lá (RF-07). Enquanto o registro com a NC está no tablet
 * (janela de desfazer, fila, sem rede ou erro), o selo e o histórico dizem "aguardando envio": dizer "enviado" faria a
 * liderança achar que a especialista já foi avisada. Sem registro (atraso), o alerta nasce no servidor pelo prazo.
 */
function envioPendente(registro: Registro | undefined) {
  return registro !== undefined && registro.syncStatus !== "sincronizado";
}

function useOrigem(alerta: Alerta) {
  const registros = useSessionStore((s) => s.registros);
  const registro = alerta.registroId ? registros[alerta.registroId] : undefined;
  const pessoa = registro
    ? localRepository.usuario(registro.usuarioId)
    : localRepository.usuarios().find((u) => u.perfil === "operacao");
  return { registro, pessoa };
}

function AlertOverview({ alerta, tituloId }: { alerta: Alerta; tituloId?: string }) {
  const agora = useAgora();
  const status = statusVisual(alerta);
  const { registro, pessoa } = useOrigem(alerta);
  const posto = localRepository.posto(alerta.postoId);
  const equipamento = alerta.equipamentoId ? localRepository.equipamento(alerta.equipamentoId) : undefined;
  const responsavel = alerta.responsavelId ? localRepository.usuario(alerta.responsavelId) : undefined;
  const itemCritico = alerta.itensNaoConformes.some((i) => i.critico);
  const aguardandoEnvio = envioPendente(registro);

  return (
    <div className="flex flex-col gap-4">
      {/* Container queries (@container/detalhe): o painel tem ~550 px em paisagem com a sidebar aberta e ~800 px no
          retrato, independentemente do viewport. */}
      <div className="flex @lg/detalhe:flex-row flex-col @lg/detalhe:items-center @lg/detalhe:justify-between @lg/detalhe:gap-4 gap-2">
        <div className="flex items-center gap-2">
          <h1
            id={tituloId}
            tabIndex={-1}
            className="font-medium @lg/detalhe:text-xl text-lg tabular-nums tracking-tight outline-none"
          >
            #{alerta.regra}
          </h1>
          {/* Tamanho do template no notebook; no toque a camada (src/styles/tablet.css) leva o ícone a 56 × 56 px.
              Copia uma referência legível (regra, posto e hora, como na tela), e não o id interno, para colar no Teams.
              Sem área de transferência (página fora de HTTPS no tablet), o aviso mostra a referência para anotar. */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar referência do alerta"
            onClick={() => {
              const referencia = `${alerta.regra} · ${posto?.nome ?? "posto"} · ${formatarHora(alerta.criadoEm)}`;
              const naoCopiou = () => {
                toast.warning("Não deu para copiar", { description: referencia });
              };
              // O tipo do DOM diz que `clipboard` sempre existe; fora de HTTPS ele é undefined.
              const copia: Promise<void> | undefined = navigator.clipboard?.writeText(referencia);
              if (!copia) {
                naoCopiou();
                return;
              }
              copia.then(() => {
                toast("Referência do alerta copiada", { description: referencia });
              }, naoCopiou);
            }}
          >
            <Copy />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-9 after:rounded-sm">
            <AvatarFallback className="rounded-sm">{pessoa ? getInitials(pessoa.nome) : "OP"}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm leading-none">{registro ? pessoa?.nome : "Operação do posto"}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm tabular-nums leading-none tracking-tight">
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
          <div className="text-muted-foreground text-sm leading-none">
            {itemCritico ? "Item de segurança ou qualidade" : "Escalona após 30 min"}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-medium">Detalhes do alerta</h2>

          <Button asChild variant="outline" size="sm" className="shrink-0">
            {/* prefetch: o registro abre mesmo com a rede caindo no meio da linha (lib/rotas.ts). */}
            <Link prefetch href={registro ? `/dashboard/checklist/${registro.formularioId}` : "/dashboard/tarefas"}>
              {registro ? "Abrir o registro" : "Ver tarefas do posto"}
            </Link>
          </Button>
        </div>

        {/* 2 colunas abaixo de 672 px de painel (paisagem com a sidebar aberta), 5 acima (retrato, notebook). */}
        <div className="grid @2xl/detalhe:grid-cols-[1.35fr_1fr_1.1fr_1.15fr_1fr] grid-cols-2 gap-x-4 gap-y-5">
          <div className="@2xl/detalhe:col-span-1 col-span-2 flex flex-col @2xl/detalhe:gap-2 gap-1">
            <div className="@2xl/detalhe:invisible @2xl/detalhe:text-sm text-muted-foreground text-xs toque:text-sm leading-none">
              Alerta
            </div>
            <div className="text-sm leading-tight">{alerta.titulo}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="@2xl/detalhe:text-sm text-muted-foreground text-xs toque:text-sm leading-none">Posto</div>
            <div className="text-sm leading-tight">{posto?.nome}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="@2xl/detalhe:text-sm text-muted-foreground text-xs toque:text-sm leading-none">
              Equipamento
            </div>
            <div className="text-sm leading-tight">{equipamento?.nome ?? "—"}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="@2xl/detalhe:text-sm text-muted-foreground text-xs toque:text-sm leading-none">Regra</div>
            <div className="text-sm leading-tight">{REGRA_LABEL[alerta.regra]}</div>
          </div>

          <div className="flex flex-col gap-2 @2xl/detalhe:text-right">
            <div className="@2xl/detalhe:text-sm text-muted-foreground text-xs toque:text-sm leading-none">
              Responsável
            </div>
            <div className="text-sm leading-tight">{responsavel?.nome ?? "—"}</div>
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
                <p key={item.texto} className="wrap-anywhere leading-snug">
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
              aguardandoEnvio
                ? { icon: Clock, label: "Teams aguardando envio" }
                : { icon: Send, label: "Teams enviado" },
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

/** Ações da liderança que o "Desfazer" do histórico pode tirar (o envio e o encerramento automático são do sistema). */
const DESFAZIVEIS: ReadonlySet<AcaoAlerta["tipo"]> = new Set(["assumir", "acao", "resolver"]);

/**
 * "Desfazer" além dos 10 s do aviso (WCAG 2.2.1, V03-A11Y-03): a última ação do histórico, se for da pessoa no posto,
 * mostra "Desfazer" enquanto ninguém agir depois dela. Outra pessoa assumir, registrar ou resolver (ou a tarefa ser
 * concluída no posto) fecha essa porta: desfazer apagaria uma ação que não é a última do histórico. É o mesmo desfazer
 * do aviso, sem prazo e sem regra nova; o store recusa se o tablet estiver bloqueado ou se a ação for de outra pessoa.
 */
function useDesfazerDoHistorico(alerta: Alerta) {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const desfazerTratamento = useSessionStore((s) => s.desfazerTratamento);
  const ultima = alerta.acoes.at(-1);
  const podeDesfazer =
    ultima !== undefined && usuarioId !== null && ultima.usuarioId === usuarioId && DESFAZIVEIS.has(ultima.tipo);

  function desfazer() {
    if (!ultima || !desfazerTratamento(alerta.id, ultima.em)) {
      toast.warning("Não deu para desfazer", { description: "Outra ação foi registrada depois desta." });
      return;
    }
    toast.info("Ação desfeita", { description: alerta.titulo });
  }

  return { ultimaId: podeDesfazer ? `${ultima.tipo}-${ultima.em}` : null, desfazer };
}

/** Ciclo do alerta como linha do tempo vertical: quem fez o quê e quando (substitui a faixa de 420 px da v0). */
function AlertHistory({ alerta }: { alerta: Alerta }) {
  const { registro } = useOrigem(alerta);
  const aguardandoEnvio = envioPendente(registro);
  const { ultimaId, desfazer } = useDesfazerDoHistorico(alerta);
  const eventos = [
    { id: "criado", titulo: "Alerta gerado", texto: alerta.descricao, em: alerta.criadoEm, autor: undefined },
    ...alerta.acoes.map((acao) => ({
      id: `${acao.tipo}-${acao.em}`,
      titulo: acao.tipo === "envio" && aguardandoEnvio ? "Envio pendente" : ACAO_LABEL[acao.tipo],
      texto:
        acao.tipo === "envio" && aguardandoEnvio
          ? "Aguardando o registro chegar ao servidor para avisar a Supervisão e a Especialista via Teams (simulado)."
          : acao.texto,
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
                <TimelineTime dateTime={evento.em.toISOString()} className="toque:text-sm tabular-nums">
                  {formatarHora(evento.em)}
                </TimelineTime>
                <TimelineTitle>{evento.titulo}</TimelineTitle>
              </TimelineHeader>
              {/* wrap-anywhere: texto colado sem espaços (código, lote) quebra dentro do painel em vez de vazar. */}
              <TimelineDescription className="wrap-anywhere">
                {evento.texto}
                {evento.autor && ` · ${evento.autor.nome}`}
              </TimelineDescription>
              {/* Tamanho do template no notebook; no toque a camada leva o botão a 56 px (src/styles/tablet.css). */}
              {evento.id === ultimaId && (
                <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={desfazer}>
                  <Undo2 data-icon="inline-start" />
                  Desfazer<span className="sr-only">: {evento.titulo}</span>
                </Button>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </section>
  );
}

/**
 * Lado a lado (`@4xl/content`), o painel tem a altura da tela: o conteúdo rola por dentro e as ações ficam no rodapé.
 * Na pilha do retrato, a página rola normalmente e o rodapé de ações gruda na borda de baixo da tela.
 */
export function AlertDetails({ alerta, tituloId }: AlertDetailsProps) {
  // Tablet compartilhado: se outra pessoa desbloqueia com o diálogo "Registrar ação" aberto, ele remonta vazio, e o
  // texto de quem saiu não vai para o histórico no nome de quem entrou (RNF-06). A mesma pessoa volta como estava.
  const usuarioId = useSessionStore((s) => s.usuarioId);

  if (!alerta) {
    return (
      <div className="h-full p-4">
        <EmptyAlertOverview />
      </div>
    );
  }

  return (
    <div className="@container/detalhe flex @4xl/content:h-full @4xl/content:min-h-0 flex-col @4xl/content:overflow-hidden">
      <div className="flex @4xl/content:min-h-0 @4xl/content:flex-1 flex-col gap-6 @4xl/content:overflow-auto p-4">
        <AlertOverview alerta={alerta} tituloId={tituloId} />
        <Separator />
        <AlertHistory alerta={alerta} />
      </div>
      {/* data-touch-bar: opaca e sem blur no toque (src/styles/tablet.css). Com viewport-fit=cover, fica acima do
          indicador de início do iPad no app instalado. */}
      <div
        data-touch-bar="true"
        className="sticky bottom-0 z-10 shrink-0 border-t bg-background/95 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] backdrop-blur-sm"
      >
        <AlertActions key={usuarioId ?? ""} alerta={alerta} />
      </div>
    </div>
  );
}
