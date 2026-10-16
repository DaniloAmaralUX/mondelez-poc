"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAlertas } from "@/hooks/use-turno";

import { AlertDetails } from "./alert-details";
import { AlertList } from "./alert-list";

export function Alertas() {
  const alertas = useAlertas();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  // O aviso de alerta novo abre esta tela com ?alerta=<id> já selecionado.
  const [selectedAlertId, setSelectedAlertId] = React.useState<string | null>(useSearchParams().get("alerta"));
  const selectedAlert = alertas.find((alerta) => alerta.id === selectedAlertId) ?? alertas[0] ?? null;

  function handleSelectAlert(alertaId: string) {
    setSelectedAlertId(alertaId);

    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }

  return (
    <>
      <div
        data-content-padding="false"
        className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x"
      >
        <div className="h-full overflow-hidden">
          <AlertList alertas={alertas} selectedAlertId={selectedAlert?.id ?? null} onSelectAlert={handleSelectAlert} />
        </div>
        <div className="hidden h-full overflow-hidden lg:block">
          <AlertDetails alerta={selectedAlert} />
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-3/4"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedAlert ? selectedAlert.titulo : "Detalhe do alerta"}</SheetTitle>
            <SheetDescription>Origem, linha do tempo e tratamento do alerta selecionado.</SheetDescription>
          </SheetHeader>
          <AlertDetails alerta={selectedAlert} />
        </SheetContent>
      </Sheet>
    </>
  );
}
