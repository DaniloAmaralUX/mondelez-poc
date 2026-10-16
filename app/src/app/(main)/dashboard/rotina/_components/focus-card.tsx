"use client";

import { useId } from "react";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

import { Duracao } from "./duracao";

/** Tempo até o fim do turno, no lugar do timer de foco do template. */
export function FocusCard() {
  const agora = useAgora(5_000);
  const turno = turnoAtual(agora);
  const ajudaId = useId();

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Fim do turno</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Em coluna estreita o botão desce para a linha de baixo em vez de espremer a duração. */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="text-2xl tabular-nums tracking-tight">
              <Duracao ms={turno.fim.getTime() - agora.getTime()} />
            </div>
            <Button className="min-w-28" disabled aria-describedby={ajudaId}>
              Passar turno
            </Button>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs toque:text-sm">
            <Clock className="size-3 toque:size-4" />
            <span>
              {turno.numero}º turno · termina às {formatarHora(turno.fim)}
            </span>
          </div>
          {/* Botão desabilitado sem explicação não serve no toque (não há tooltip). */}
          <p id={ajudaId} className="text-muted-foreground text-xs toque:text-sm">
            Passar turno pelo app: em breve.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
