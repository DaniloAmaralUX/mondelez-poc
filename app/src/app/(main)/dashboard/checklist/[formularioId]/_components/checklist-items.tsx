"use client";

import { cn } from "cn";
import { CheckCheck } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MIN_JUSTIFICATIVA, situacaoItem } from "@/domain/formulario-engine";
import type { ItemFormulario, Resposta, ValorCnc } from "@/domain/types";

import type { ChecklistFormValues } from "./data";

const SITUACAO_LABEL = { pendente: "—", C: "Conforme", NC: "Não conforme", NA: "N/A" } as const;

export function ChecklistItems({
  itens,
  numeros,
  erros,
}: {
  itens: ItemFormulario[];
  numeros: Record<string, number>;
  erros: Record<string, string>;
}) {
  const { getValues, setValue } = useFormContext<ChecklistFormValues>();
  const respostas = useWatch<ChecklistFormValues, "respostas">({ name: "respostas" }) ?? {};
  const restantes = itens.filter((item) => item.tipo === "cnc" && situacaoItem(item, respostas[item.id]) === "pendente");

  function marcarRestantesConformes() {
    const atuais = getValues("respostas") ?? {};
    const proximas = { ...atuais };
    for (const item of restantes) proximas[item.id] = { ...proximas[item.id], valor: "C" };
    setValue("respostas", proximas, { shouldDirty: true });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">Itens do checklist</h2>
        <Button type="button" variant="ghost" size="sm" onClick={marcarRestantesConformes} disabled={restantes.length === 0}>
          <CheckCheck data-icon="inline-start" />
          Restantes conformes
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="hidden items-center gap-2 px-1 font-medium text-muted-foreground text-xs md:grid md:grid-cols-[24px_minmax(0,1fr)_176px_96px]">
          <span />
          <span>Item</span>
          <span className="px-2">Resposta</span>
          <span className="text-right">Situação</span>
        </div>

        <div className="flex flex-col gap-3">
          {itens.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              numero={numeros[item.id] ?? 0}
              resposta={respostas[item.id]}
              erro={erros[item.id]}
              onChange={(resposta) => setValue(`respostas.${item.id}`, resposta, { shouldDirty: true })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ItemRow({
  item,
  numero,
  resposta,
  erro,
  onChange,
}: {
  item: ItemFormulario;
  numero: number;
  resposta: Resposta | undefined;
  erro: string | undefined;
  onChange: (resposta: Resposta) => void;
}) {
  const situacao = situacaoItem(item, resposta);
  const pedeJustificativa = situacao === "NC";
  const detalhes = [
    item.faixa && `Padrão ${item.faixa.min.toLocaleString("pt-BR")}–${item.faixa.max.toLocaleString("pt-BR")} ${item.faixa.unidade}`,
    item.critico && "item crítico",
  ].filter(Boolean);

  return (
    <div
      id={`item-${item.id}`}
      data-invalid={erro ? true : undefined}
      className="grid min-w-0 scroll-mt-24 grid-cols-[24px_minmax(0,1fr)_96px] items-center gap-2 rounded-lg md:grid-cols-[24px_minmax(0,1fr)_176px_96px]"
    >
      <span className="text-center text-muted-foreground text-xs tabular-nums">{numero}</span>
      <div className="min-w-0 max-md:col-span-2">
        <p className="text-sm">{item.texto}</p>
        {detalhes.length > 0 && <p className="text-muted-foreground text-xs">{detalhes.join(" · ")}</p>}
      </div>

      <div className="max-md:col-start-2 max-md:row-start-2">
        {item.tipo === "cnc" && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={resposta?.valor ?? ""}
            onValueChange={(valor) => onChange({ ...resposta, valor: (valor || undefined) as ValorCnc | undefined })}
            aria-label={item.texto}
            aria-invalid={erro ? true : undefined}
          >
            <ToggleGroupItem value="C" aria-label="Conforme">
              C
            </ToggleGroupItem>
            <ToggleGroupItem value="NC" aria-label="Não conforme">
              NC
            </ToggleGroupItem>
            <ToggleGroupItem value="NA" aria-label="Não se aplica">
              N/A
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        {item.tipo === "numero" && (
          <InputGroup>
            <InputGroupInput
              type="number"
              inputMode="decimal"
              step="0.1"
              aria-label={item.texto}
              aria-invalid={erro ? true : undefined}
              value={resposta?.numero ?? ""}
              onChange={(e) =>
                onChange({ ...resposta, numero: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
            <InputGroupAddon align="inline-end">{item.faixa?.unidade}</InputGroupAddon>
          </InputGroup>
        )}
        {item.tipo === "texto" && (
          <Input
            aria-label={item.texto}
            aria-invalid={erro ? true : undefined}
            value={resposta?.texto ?? ""}
            onChange={(e) => onChange({ ...resposta, texto: e.target.value })}
          />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 text-right font-medium text-sm max-md:col-start-3 max-md:row-start-2",
          situacao === "NC" && "text-destructive",
          situacao === "pendente" && "text-muted-foreground",
        )}
      >
        {SITUACAO_LABEL[situacao]}
      </div>

      {pedeJustificativa && (
        <div className="col-span-full md:col-start-2">
          <Input
            aria-label={`Justificativa: ${item.texto}`}
            aria-invalid={erro ? true : undefined}
            placeholder={`O que está fora do padrão? (mínimo ${MIN_JUSTIFICATIVA} caracteres)`}
            value={resposta?.justificativa ?? ""}
            onChange={(e) => onChange({ ...resposta, justificativa: e.target.value })}
          />
        </div>
      )}
      {erro && <FieldError className="col-span-full md:col-start-2">{erro}</FieldError>}
    </div>
  );
}
