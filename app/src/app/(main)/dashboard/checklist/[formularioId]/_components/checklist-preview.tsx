"use client";

import * as React from "react";

import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { Formulario, Registro, TarefaInstancia } from "@/domain/types";

import { ChecklistPaper } from "./checklist-paper";
import { type ChecklistFormValues, PAPER_HEIGHT, PAPER_SCALE, PAPER_WIDTH } from "./data";
import { PrintChecklist } from "./print-checklist";
import { useVisibleCenterPosition } from "./use-visible-center-position";

function handlePrint() {
  window.print();
}

export interface ChecklistPaperProps {
  formulario: Formulario;
  valores: ChecklistFormValues;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
}

export function ChecklistPreview(props: ChecklistPaperProps) {
  const previewBodyRef = React.useRef<HTMLDivElement>(null);
  const paperLayout = useVisibleCenterPosition(previewBodyRef, {
    height: PAPER_HEIGHT,
    maxScale: PAPER_SCALE,
    width: PAPER_WIDTH,
  });

  return (
    <>
      <PrintChecklist {...props} />
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="font-medium text-lg">Prévia do registro</h2>
          <ButtonGroup>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer data-icon="inline-start" />
              Imprimir
            </Button>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Download data-icon="inline-start" />
              Baixar PDF
            </Button>
          </ButtonGroup>
        </div>

        <div
          ref={previewBodyRef}
          className="@container/preview relative min-h-[calc(100svh-15rem)] flex-1 rounded-b-xl bg-stone-200 p-4 dark:bg-stone-800"
        >
          {paperLayout === null ? (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
              Carregando prévia
            </div>
          ) : null}
          <div
            style={{
              height: paperLayout ? PAPER_HEIGHT * paperLayout.scale : PAPER_HEIGHT * PAPER_SCALE,
              top: paperLayout?.top ?? "50%",
              transform: paperLayout === null ? "translate(-50%, -50%)" : "translateX(-50%)",
              width: paperLayout ? PAPER_WIDTH * paperLayout.scale : PAPER_WIDTH * PAPER_SCALE,
            }}
            className="absolute left-1/2 opacity-0 data-[ready=true]:opacity-100"
            data-ready={paperLayout !== null}
          >
            <div style={{ transform: `scale(${paperLayout?.scale ?? PAPER_SCALE})` }} className="origin-top-left">
              <ChecklistPaper {...props} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
