"use client";

import { UserRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatarHora } from "@/lib/format";

/**
 * Rascunho começado por outra pessoa no mesmo tablet (dispositivo compartilhado, docs/12 §3.4 e fase E): quem chega
 * vê de quem são as respostas e decide. "Continuar" passa a autoria para quem está no posto; "Descartar" apaga as
 * respostas, com "Desfazer" no toast. Enquanto não decide, o formulário continua editável e o autor original fica.
 */
export function AvisoDeRascunho({
  autor,
  iniciadoEm,
  onContinuar,
  onDescartar,
}: {
  autor: string;
  /** ISO, horário simulado. */
  iniciadoEm: string;
  onContinuar: () => void;
  onDescartar: () => void;
}) {
  return (
    <Alert>
      <UserRound />
      <AlertTitle className="text-base">
        Rascunho iniciado por {autor} às {formatarHora(new Date(iniciadoEm))}
      </AlertTitle>
      <AlertDescription>Continue de onde a pessoa parou ou descarte as respostas e comece do zero.</AlertDescription>
      {/* Continuar × Descartar são ações opostas: 16 px entre elas (docs/12 §2 item 2). */}
      <div className="col-start-2 mt-3 flex flex-wrap gap-4">
        <Button type="button" className="h-11" onClick={onContinuar}>
          Continuar
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onDescartar}>
          Descartar
        </Button>
      </div>
    </Alert>
  );
}
