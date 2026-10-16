import { Clock, Hash } from "lucide-react";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { Formulario, TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";

/** Dados da tarefa que o checklist conclui: referência, abertura e prazo da janela. */
export function ChecklistDetails({ tarefa, formulario }: { tarefa: TarefaInstancia | undefined; formulario: Formulario }) {
  const janela = tarefa
    ? [
        { id: "abertura", label: "Abre às", value: formatarHora(tarefa.abre) },
        { id: "prazo", label: "Prazo", value: formatarHora(tarefa.prazo) },
      ]
    : [];

  return (
    <section className="flex flex-col gap-3">
      <FieldGroup>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="referencia">
            Formulário
          </FieldLabel>
          <InputGroup>
            <InputGroupInput id="referencia" readOnly value={`${formulario.id} · versão ${formulario.versao}`} />
            <InputGroupAddon align="inline-end">
              <Hash />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        {janela.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {janela.map((campo) => (
              <Field key={campo.id} className="gap-1">
                <FieldLabel className="text-xs" htmlFor={campo.id}>
                  {campo.label}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput id={campo.id} readOnly value={campo.value} className="tabular-nums" />
                  <InputGroupAddon align="inline-end">
                    <Clock />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            ))}
          </div>
        )}
      </FieldGroup>
    </section>
  );
}
