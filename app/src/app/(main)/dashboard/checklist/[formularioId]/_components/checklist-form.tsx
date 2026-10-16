"use client";

import * as React from "react";

import { useWatch } from "react-hook-form";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { situacaoItem } from "@/domain/formulario-engine";
import type { Formulario, TarefaInstancia } from "@/domain/types";

import { ChecklistDetails } from "./checklist-details";
import { ChecklistItems } from "./checklist-items";
import { ChecklistNotes } from "./checklist-notes";
import type { ChecklistFormValues } from "./data";
import { EquipmentSelector } from "./equipment-selector";

const TODOS = "todos";

export function ChecklistForm({
  formulario,
  tarefa,
  erros,
  somenteLeitura,
}: {
  formulario: Formulario;
  tarefa: TarefaInstancia | undefined;
  erros: Record<string, string>;
  somenteLeitura: boolean;
}) {
  const [grupo, setGrupo] = React.useState(TODOS);
  const respostas = useWatch<ChecklistFormValues, "respostas">({ name: "respostas" }) ?? {};
  const grupos = [...new Set(formulario.itens.map((item) => item.grupo))];
  const itens = grupo === TODOS ? formulario.itens : formulario.itens.filter((item) => item.grupo === grupo);
  const numeros = Object.fromEntries(formulario.itens.map((item, index) => [item.id, index + 1]));

  const contagem = (doGrupo: string) => {
    const lista = doGrupo === TODOS ? formulario.itens : formulario.itens.filter((item) => item.grupo === doGrupo);
    const respondidos = lista.filter((item) => situacaoItem(item, respostas[item.id]) !== "pendente").length;
    return `${respondidos}/${lista.length}`;
  };

  return (
    <fieldset disabled={somenteLeitura} className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <Tabs value={grupo} onValueChange={setGrupo}>
        <TabsList className="w-full">
          {[TODOS, ...grupos].map((g) => (
            <TabsTrigger key={g} value={g}>
              {g === TODOS ? "Todos" : g}
              <span className="text-muted-foreground tabular-nums">{contagem(g)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ChecklistDetails tarefa={tarefa} formulario={formulario} />

      <Separator />

      <EquipmentSelector />

      <Separator />

      <ChecklistItems itens={itens} numeros={numeros} erros={erros} />

      <Separator />

      <ChecklistNotes />
    </fieldset>
  );
}
