import { useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LIMITES } from "@/domain/limites";

import type { ChecklistFormValues } from "./data";

export function ChecklistNotes() {
  const { register } = useFormContext<ChecklistFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">Observações</h2>

      {/* Rótulo e descrição no text-sm do template: tela do operador, nada em text-xs (docs/12 §3.3). */}
      <Field className="gap-1">
        <FieldLabel htmlFor="observacao">Observação geral</FieldLabel>
        <Textarea
          id="observacao"
          rows={3}
          maxLength={LIMITES.observacao}
          placeholder="Algo que a supervisão precisa saber?"
          {...register("observacao")}
        />
        <FieldDescription>Opcional. Vai junto com o registro e com o alerta, se houver.</FieldDescription>
      </Field>
    </section>
  );
}
