"use client";

import * as React from "react";

import { startOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useAgora } from "@/stores/session/session-store";

export function CalendarPanel() {
  const hoje = startOfDay(useAgora(60_000));
  const [date, setDate] = React.useState<Date | undefined>(hoje);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(hoje));

  return (
    <Card className="w-full" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          today={hoje}
          fixedWeeks
          locale={ptBR}
          className="w-full p-0"
        />
      </CardContent>
    </Card>
  );
}
