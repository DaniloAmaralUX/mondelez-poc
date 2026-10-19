"use client";

import * as React from "react";

import { type DayCellInfo, type EventInput, useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import ptBr from "@fullcalendar/react/locales/pt-br";
import { cn } from "cn";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { dataLocal } from "@/domain/producao";
import type { Recado, TipoRecado } from "@/domain/types";

import { ICONE_DO_TIPO, TINTA_DO_TIPO } from "./recados";

const plugins = [dayGridPlugin, interactionPlugin];

/** O FullCalendar entrega o dia da célula como "marcador" com a data local nos campos UTC. */
function chaveDoMarcador(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Mês da agenda no calendário do template (dashboard/calendar: FullCalendar com `EventCalendarViews`), só na visão de
 * mês. O relógio da demonstração é o "hoje" do calendário (`now`). Ajustes no ponto de uso, sem editar
 * `components/calendar` (as opções passadas aqui vencem as do componente):
 *
 * - O dia inteiro é o alvo: tocar numa célula escolhe o dia (`dateClick`), com ~100 × 100 px no iPad. Os eventos dentro
 *   da célula não são interativos (seriam alvos de 20 px); o que tocar está na lista ao lado.
 * - Texto do evento e do "mais" em 14 px no toque (o componente usa 11–12 px), e células "estreitas" só abaixo de 70 px.
 * - Cada evento leva o ícone do tipo e a tinta do tipo, para a cor não ser a única pista.
 */
export function CalendarioDoMes({
  recados,
  agora,
  selecionado,
  onSelecionar,
}: {
  readonly recados: readonly Recado[];
  readonly agora: Date;
  readonly selecionado: string;
  readonly onSelecionar: (data: string) => void;
}) {
  const controller = useCalendarController();
  const [mes, setMes] = React.useState({ titulo: "", inicio: "", fim: "" });
  const hoje = dataLocal(agora);

  const eventos = React.useMemo<EventInput[]>(
    () =>
      recados
        .filter((r) => r.data)
        .map((r) => ({
          id: r.id,
          title: r.titulo,
          start: r.data,
          allDay: true,
          color: "transparent",
          contrastColor: "currentColor",
          extendedProps: { tipo: r.tipo },
        })),
    [recados],
  );
  const noMes = recados.filter((r) => r.data && r.data >= mes.inicio && r.data < mes.fim).length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-semibold text-lg leading-none first-letter:uppercase">{mes.titulo}</h2>
          <p className="text-muted-foreground text-sm tabular-nums toque:text-base">
            {noMes} {noMes === 1 ? "compromisso" : "compromissos"} no mês
          </p>
        </div>
        <ButtonGroup>
          <Button size="icon" variant="outline" aria-label="Mês anterior" onClick={() => controller.prev()}>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              controller.gotoDate(agora);
              onSelecionar(hoje);
            }}
          >
            Hoje
          </Button>
          <Button size="icon" variant="outline" aria-label="Próximo mês" onClick={() => controller.next()}>
            <ChevronRight />
          </Button>
        </ButtonGroup>
      </div>

      <div className="[&_.fc-daygrid-day]:cursor-pointer">
        <EventCalendarViews
          controller={controller}
          initialView="dayGridMonth"
          initialDate={agora}
          now={agora}
          locale={ptBr}
          plugins={plugins}
          height="auto"
          firstDay={1}
          fixedWeekCount={false}
          dayMaxEvents={2}
          dayNarrowWidth={70}
          popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
          events={eventos}
          dateClick={(info) => onSelecionar(info.dateStr.slice(0, 10))}
          dayCellClass={(info: DayCellInfo) =>
            cn(
              "border",
              info.isMajor && "border-foreground/20",
              chaveDoMarcador(info.date) === selecionado && "bg-muted/70",
            )
          }
          eventContent={(info) => {
            const tipo = info.event.extendedProps.tipo as TipoRecado;
            const Icone = ICONE_DO_TIPO[tipo];
            return (
              <span
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium text-xs toque:text-sm",
                  TINTA_DO_TIPO[tipo],
                )}
              >
                <Icone className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{info.event.title}</span>
              </span>
            );
          }}
          views={{
            dayGrid: {
              rowEventInnerClass: "flex flex-row items-center min-w-0",
              rowMoreLinkInnerClass: "p-0.5 text-xs toque:text-sm",
            },
          }}
          datesSet={(info) =>
            setMes({
              titulo: info.view.title,
              inicio: dataLocal(info.view.currentStart),
              fim: dataLocal(info.view.currentEnd),
            })
          }
        />
      </div>
    </div>
  );
}
