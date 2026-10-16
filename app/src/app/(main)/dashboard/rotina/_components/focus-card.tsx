"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

function restante(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

/** Tempo até o fim do turno, no lugar do timer de foco do template. */
export function FocusCard() {
  const agora = useAgora(5_000);
  const turno = turnoAtual(agora);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Fim do turno</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="text-3xl tabular-nums tracking-tight">
              {restante(turno.fim.getTime() - agora.getTime())}
            </div>
            <Button className="min-w-24" disabled>
              Passar turno
            </Button>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="size-3" />
            <span>
              {turno.numero}º turno · termina às {formatarHora(turno.fim)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
