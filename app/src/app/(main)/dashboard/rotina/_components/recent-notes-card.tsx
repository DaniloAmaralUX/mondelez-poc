"use client";

import { format, isToday, isYesterday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recados } from "@/data/seed";
import { useAgora } from "@/stores/session/session-store";

function formatarData(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMM", { locale: ptBR });
}

/** Agenda da fábrica e recados (RM-16). */
export function RecentNotesCard() {
  const hoje = useAgora(60_000);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Recados</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
            Ver todos
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recados.map((recado) => {
          const Icone = recado.tipo === "agenda" ? CalendarDays : FileText;
          return (
            <div key={recado.id} className="flex items-start gap-4">
              <Icone className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="line-clamp-2 font-medium text-sm leading-tight">{recado.titulo}</div>
                <div className="text-muted-foreground text-xs">
                  {formatarData(subDays(hoje, recado.diasAtras))} · {recado.autor}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
