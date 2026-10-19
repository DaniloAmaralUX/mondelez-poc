"use client";

import Link from "next/link";

import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, FileText, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localRepository } from "@/data/repository";
import type { Recado } from "@/domain/types";
import { useRecados } from "@/hooks/use-producao";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

/** Pelo relógio da demo: isToday/isYesterday do date-fns comparam com o dia real e erravam depois da meia-noite simulada. */
function formatarData(hoje: Date, iso: string) {
  const dias = differenceInCalendarDays(hoje, new Date(iso));
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return format(new Date(iso), "d 'de' MMM", { locale: ptBR });
}

function quando(recado: Recado) {
  if (!recado.data) return null;
  const [a, m, d] = recado.data.split("-").map(Number);
  const dia = format(new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1), "EEE, d 'de' MMM", { locale: ptBR });
  return recado.horario ? `${dia} · ${recado.horario}` : dia;
}

const ICONE: Record<Recado["tipo"], typeof FileText> = {
  recado: FileText,
  agenda: CalendarDays,
  visita: CalendarDays,
  evento: CalendarDays,
  parada: Wrench,
};

/** Agenda da fábrica e recados (RM-16): os quatro mais recentes da linha do tablet; a lista inteira fica na Agenda. */
export function RecentNotesCard() {
  const hoje = useAgora();
  const linhaId = useSessionStore((s) => s.contexto?.linhaId);
  const recados = useRecados(linhaId).slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recados</CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm" className="toque:text-sm">
            <Link prefetch href="/dashboard/agenda">
              Ver todos
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recados.length === 0 && <p className="text-muted-foreground text-sm">Sem recados para esta linha.</p>}
        {recados.map((recado) => {
          const Icone = ICONE[recado.tipo];
          const data = quando(recado);
          return (
            <div key={recado.id} className="flex items-start gap-4">
              <Icone className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                {/* wrap-anywhere quebra um e-mail ou endereço longo dentro da coluna. */}
                <div className="wrap-anywhere font-medium text-sm leading-tight">{recado.titulo}</div>
                {data && <div className="text-foreground text-xs toque:text-sm">{data}</div>}
                <div className="text-muted-foreground text-xs toque:text-sm">
                  {formatarData(hoje, recado.em)} · {localRepository.usuario(recado.autorId)?.nome ?? "Fábrica"}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
