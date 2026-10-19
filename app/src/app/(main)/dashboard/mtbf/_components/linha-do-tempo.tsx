"use client";

import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { corteDoTurno, duracaoMin } from "@/domain/falhas";
import { turnoAtual } from "@/domain/turno";
import type { EventoFalha } from "@/domain/types";
import { formatarDuracao, formatarHora } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { JANELA_APAGAR_FALHA_MS, useAgora, useSessionStore } from "@/stores/session/session-store";

const HORA_MS = 3_600_000;

/**
 * Posição do rótulo da hora: o primeiro alinhado à esquerda, o último à direita, os outros centrados na marca. As horas
 * ímpares somem no retrato estreito: 9 rótulos de 5 caracteres não cabem abaixo de ~28 rem.
 */
function rotuloDaHora(i: number, total: number): string {
  if (i === 0) return "absolute";
  if (i === total - 1) return "absolute -translate-x-full";
  if (i % 2 === 1) return "absolute hidden -translate-x-1/2 @min-[28rem]/tempo:block";
  return "absolute -translate-x-1/2";
}

/**
 * Linha do tempo do turno (8 h): uma faixa com as paradas no lugar e na largura em que aconteceram, a marca de agora e,
 * embaixo, a lista das falhas (hora, tipo, equipamento, duração). A faixa é o resumo visual; a lista tem todo o texto,
 * sem depender de hover. Quem apontou ainda apaga um toque errado pela lista, até `JANELA_APAGAR_FALHA_MS` (o mesmo
 * "Desfazer" do aviso, num lugar que não some).
 */
export function LinhaDoTempo({ falhas }: { falhas: readonly EventoFalha[] }) {
  const agora = useAgora();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const apagarFalha = useSessionStore((s) => s.apagarFalha);
  const turno = turnoAtual(agora);
  const corte = corteDoTurno(turno, agora);
  const inicio = turno.inicio.getTime();
  const total = turno.fim.getTime() - inicio;
  const pos = (ms: number) => Math.min(100, Math.max(0, ((ms - inicio) / total) * 100));
  const horas = Array.from({ length: Math.round(total / HORA_MS) + 1 }, (_, i) => new Date(inicio + i * HORA_MS));
  const recentes = [...falhas].reverse();

  function apagar(falha: EventoFalha) {
    const nome = localRepository.tiposFalha().find((t) => t.id === falha.tipoId)?.nome ?? falha.tipoId;
    if (apagarFalha(falha.id)) toast.info("Apontamento apagado", { description: `${nome} não conta no MTBF.` });
    else toast.info("Não dá para desfazer", { description: "Só quem apontou apaga, até 5 minutos depois." });
  }

  return (
    <Card className="@container/tempo h-full">
      <CardHeader>
        <CardTitle>Linha do tempo do turno</CardTitle>
        <CardDescription>
          {formatarHora(turno.inicio)}–{formatarHora(turno.fim)}, cada faixa é uma parada
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div aria-hidden className="flex flex-col gap-1.5">
          <div className="relative h-10 overflow-hidden rounded-lg bg-muted">
            {/* Parte do turno que já passou, para a faixa ler como tempo andando. */}
            <div className="absolute inset-y-0 left-0 bg-foreground/5" style={{ width: `${pos(corte.getTime())}%` }} />
            {falhas.map((f) => {
              const de = pos(new Date(f.inicio).getTime());
              const ate = pos(f.fim ? new Date(f.fim).getTime() : corte.getTime());
              return (
                <div
                  key={f.id}
                  className={
                    f.fim
                      ? "absolute inset-y-1.5 min-w-1 rounded-sm bg-amber-500 dark:bg-amber-400"
                      : "absolute inset-y-1.5 min-w-1 rounded-sm bg-amber-500/50 ring-2 ring-amber-500 ring-inset dark:bg-amber-400/40 dark:ring-amber-400"
                  }
                  style={{ left: `${de}%`, width: `${Math.max(0, ate - de)}%` }}
                />
              );
            })}
            {agora < turno.fim && (
              <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${pos(agora.getTime())}%` }} />
            )}
          </div>
          <div className="relative h-5 text-muted-foreground text-xs toque:text-sm tabular-nums">
            {horas.map((h, i) => (
              <span
                key={h.toISOString()}
                className={rotuloDaHora(i, horas.length)}
                style={{ left: `${(i / (horas.length - 1)) * 100}%` }}
              >
                {formatarHora(h)}
              </span>
            ))}
          </div>
        </div>

        {recentes.length === 0 ? (
          <Empty className="border-none p-0 md:p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>Sem falhas no turno</EmptyTitle>
              <EmptyDescription>
                Cada falha apontada aparece aqui, com a hora e quanto tempo a máquina parou.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y">
            {recentes.map((f) => {
              const tipo = localRepository.tiposFalha().find((t) => t.id === f.tipoId);
              const equipamento = localRepository.equipamento(f.equipamentoId);
              const podeApagar =
                f.usuarioId === usuarioId && agora.getTime() - new Date(f.inicio).getTime() <= JANELA_APAGAR_FALHA_MS;
              return (
                <li key={f.id} className="flex min-h-12 toque:min-h-14 items-center gap-3 py-2">
                  <span className="w-12 shrink-0 font-medium text-sm tabular-nums">
                    {formatarHora(new Date(f.inicio))}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-sm toque:text-base">{tipo?.nome ?? f.tipoId}</span>
                    <span className="truncate text-muted-foreground text-sm">{equipamento?.nome}</span>
                  </span>
                  {f.fim ? (
                    <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
                      {formatarDuracao(duracaoMin(f, corte) * 60_000)}
                    </span>
                  ) : (
                    <Status variant="warning" className={STATUS_LEGIVEL}>
                      <StatusIndicator />
                      <StatusLabel className="tabular-nums">
                        Em curso · {formatarDuracao(duracaoMin(f, corte) * 60_000)}
                      </StatusLabel>
                    </Status>
                  )}
                  {podeApagar && (
                    <Button variant="ghost" className="h-10 shrink-0 text-foreground" onClick={() => apagar(f)}>
                      Desfazer
                    </Button>
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
