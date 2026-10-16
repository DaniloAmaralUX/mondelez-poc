import { useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import type { ChecklistFormValues } from "./data";

export function ChecklistNotes() {
  const { register } = useFormContext<ChecklistFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">Observações</h2>

      <Field className="gap-1">
        <FieldLabel className="text-xs" htmlFor="observacao">
          Observação geral
        </FieldLabel>
        <Textarea id="observacao" rows={3} placeholder="Algo que a supervisão precisa saber?" {...register("observacao")} />
        <FieldDescription className="text-xs">Opcional. Vai junto com o registro e com o alerta, se houver.</FieldDescription>
      </Field>
    </section>
  );
}
