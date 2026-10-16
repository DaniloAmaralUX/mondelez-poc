"use client";

import { BookOpenText } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localRepository } from "@/data/repository";
import { equipamentos } from "@/data/seed";
import { useSessionStore } from "@/stores/session/session-store";

import type { ChecklistFormValues } from "./data";

export function EquipmentSelector() {
  const { control } = useFormContext<ChecklistFormValues>();
  const contexto = useSessionStore((s) => s.contexto);
  const doPosto = equipamentos.filter((e) => e.postoId === contexto?.postoId);
  const posto = contexto ? localRepository.posto(contexto.postoId) : undefined;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">Equipamento</h2>
        <Button type="button" variant="ghost" size="sm" disabled>
          <BookOpenText data-icon="inline-start" />
          Ver IT e LPP
        </Button>
      </div>

      <Controller
        control={control}
        name="equipamentoId"
        render={({ field }) => {
          const selecionado = doPosto.find((e) => e.id === field.value);

          return (
            <Field className="gap-1">
              <FieldLabel className="text-xs">Equipamento do posto</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={doPosto.length === 0}>
                <SelectTrigger className="w-full data-[size=default]:h-auto">
                  <SelectValue
                    placeholder={doPosto.length ? "Escolha o equipamento" : "Posto sem equipamentos cadastrados"}
                  >
                    {selecionado && (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="after:rounded-md">
                          <AvatarFallback className="rounded-md bg-card text-foreground">
                            {selecionado.nome.replace(/\D/g, "").slice(0, 2) || "EQ"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="text-left text-xs">
                          <div>{selecionado.nome}</div>
                          <div className="text-muted-foreground">{posto?.nome}</div>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {doPosto.map((equipamento) => (
                      <SelectItem key={equipamento.id} value={equipamento.id}>
                        {equipamento.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          );
        }}
      />
    </section>
  );
}
