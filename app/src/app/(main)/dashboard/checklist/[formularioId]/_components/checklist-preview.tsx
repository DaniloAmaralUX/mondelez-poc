"use client";

import { Download, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Formulario, Registro, TarefaInstancia } from "@/domain/types";

import { ChecklistPaper } from "./checklist-paper";
import type { ChecklistFormValues } from "./data";
import { PrintChecklist } from "./print-checklist";

function imprimir() {
  window.print();
}

export interface ChecklistPaperProps {
  formulario: Formulario;
  valores: ChecklistFormValues;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
}

/**
 * Documento do registro atrás de "Ver documento" (docs/12 §3.4, auditoria §1.10): em vez da prévia reduzida na revisão
 * (escala ≤ 0,6, texto de ~7 px no tablet em paisagem), um Sheet em tela cheia com o papel em escala 1 e rolagem nos
 * dois eixos. Imprimir e Baixar PDF ficam junto do documento.
 *
 * O `PrintChecklist` (cópia do papel que só aparece na impressão) fica montado aqui fora do Sheet, uma vez só: assim
 * imprimir funciona com o Sheet aberto e a impressão não sai em duas páginas.
 */
export function ChecklistPreview({
  aoAbrir,
  ...props
}: ChecklistPaperProps & {
  /** Ao abrir o documento (ex.: tirar os avisos da tela, que cobririam Imprimir). */
  aoAbrir?: () => void;
}) {
  const titulo = props.registro ? "Documento do registro" : "Prévia do documento";

  return (
    <>
      <PrintChecklist {...props} />
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-medium tracking-tight">{titulo}</h2>
          <p className="text-muted-foreground text-sm">
            {props.registro
              ? "O que ficou guardado, com responsável, posto e horário."
              : "Como o registro vai ficar, com responsável, posto e horário."}
          </p>
        </div>
        <Sheet
          onOpenChange={(aberto) => {
            if (aberto) aoAbrir?.();
          }}
        >
          <SheetTrigger asChild>
            <Button type="button" variant="outline">
              <FileText data-icon="inline-start" />
              Ver documento
            </Button>
          </SheetTrigger>
          {/* Tela cheia: largura toda em qualquer tamanho (o template limita o lado direito a max-w-sm). Fechar próprio
              com texto, 56 px no toque, no lugar do X de 28 px do canto. */}
          <SheetContent
            side="right"
            showCloseButton={false}
            className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
          >
            <SheetHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b px-4 pt-[max(--spacing(3),env(safe-area-inset-top))] pb-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <SheetTitle>{titulo}</SheetTitle>
                <SheetDescription className="truncate">{props.formulario.titulo}</SheetDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={imprimir}>
                  <Printer data-icon="inline-start" />
                  Imprimir
                </Button>
                <Button type="button" variant="outline" onClick={imprimir}>
                  <Download data-icon="inline-start" />
                  Baixar PDF
                </Button>
                <SheetClose asChild>
                  <Button type="button">Fechar</Button>
                </SheetClose>
              </div>
            </SheetHeader>
            {/* Papel em escala 1 (816 px de largura): no retrato e no Split View rola também na horizontal, só aqui
                dentro. Focável e nomeado: sem nenhum controle dentro, o teclado precisa do foco aqui para rolar (o
                WebKit não torna focável um contêiner com rolagem). */}
            <section
              // biome-ignore lint/a11y/noNoninteractiveTabindex: região com rolagem precisa de foco para o teclado rolar (WCAG 2.1.1).
              tabIndex={0}
              aria-label="Documento do registro"
              className="min-h-0 flex-1 overflow-auto overscroll-contain bg-stone-200 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset dark:bg-stone-800"
            >
              <div className="mx-auto w-fit shadow-sm">
                <ChecklistPaper {...props} />
              </div>
            </section>
          </SheetContent>
        </Sheet>
      </section>
    </>
  );
}
