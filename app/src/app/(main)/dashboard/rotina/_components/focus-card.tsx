"use client";

import { useId } from "react";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

import { Duracao } from "./duracao";

/**
 * Tempo até o fim do turno, no lugar do timer de foco do template. v0.4 (docs/14): widget do iOS, com o número grande
 * em tabular-nums e a barra do turno andando (contexto que simplifica, HIG "Simplicity"), na mesma altura do
 * "Fazer agora" ao lado.
 */
export function FocusCard() {
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const ajudaId = useId();
  const total = turno.fim.getTime() - turno.inicio.getTime();
  const passado = Math.min(Math.max(agora.getTime() - turno.inicio.getTime(), 0), total);
  const percentual = total > 0 ? Math.round((passado / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Fim do turno</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {formatarHora(turno.inicio)}–{formatarHora(turno.fim)}
        </CardDescription>
        <CardAction>
          <Button variant="secondary" size="sm" disabled aria-describedby={ajudaId}>
            Passar turno
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-3">
        <div className="font-semibold text-4xl tabular-nums leading-none tracking-tight">
          <Duracao ms={turno.fim.getTime() - agora.getTime()} />
        </div>
        <Progress value={percentual} aria-label={`${percentual}% do turno passado`} className="h-1.5 bg-secondary" />
        {/* Botão desabilitado sem explicação não serve no toque (não há tooltip). */}
        <p id={ajudaId} className="text-muted-foreground text-xs toque:text-sm">
          {percentual}% do turno passado. Passar turno pelo app: em breve.
        </p>
      </CardContent>
    </Card>
  );
}
