"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MIN_JUSTIFICATIVA, situacaoItem } from "@/domain/formulario-engine";
import type { ItemFormulario, Resposta, ValorCnc } from "@/domain/types";

import type { ChecklistFormValues } from "./data";
import { FaixaIndicador } from "./faixa-indicador";

const SITUACAO_LABEL = { pendente: "Pendente", C: "Conforme", NC: "Não conforme", NA: "Não se aplica" } as const;

// Cor do resultado escolhido: a resposta se lê de longe, não só pela posição do botão.
const OPCOES: { valor: ValorCnc; rotulo: string; aria: string; ativo: string }[] = [
  {
    valor: "C",
    rotulo: "C",
    aria: "Conforme",
    ativo:
      "data-[state=on]:border-green-600/40 data-[state=on]:bg-green-600/10 data-[state=on]:text-green-700 dark:data-[state=on]:text-green-400",
  },
  {
    valor: "NC",
    rotulo: "NC",
    aria: "Não conforme",
    ativo: "data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive",
  },
  { valor: "NA", rotulo: "N/A", aria: "Não se aplica", ativo: "data-[state=on]:bg-muted" },
];

const REVELAR = { duration: 0.2, ease: [0.23, 1, 0.32, 1] } as const;

export function ChecklistItems({
  itens,
  numeros,
  erros,
}: {
  itens: ItemFormulario[];
  numeros: Record<string, number>;
  erros: Record<string, string>;
}) {
  const { setValue } = useFormContext<ChecklistFormValues>();
  const respostas = useWatch<ChecklistFormValues, "respostas">({ name: "respostas" }) ?? {};

  return (
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
  const detalhes = [
    item.faixa &&
      `Padrão ${item.faixa.min.toLocaleString("pt-BR")}–${item.faixa.max.toLocaleString("pt-BR")} ${item.faixa.unidade}`,
    item.critico && "item crítico",
  ].filter(Boolean);

  return (
    <div
      id={`item-${item.id}`}
      data-invalid={erro ? true : undefined}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-card p-3 transition-colors",
        erro && "border-destructive/50",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground text-xs tabular-nums">
            {numero}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm">{item.texto}</p>
            <p
              className={cn(
                "text-xs",
                situacao === "NC" ? "text-destructive" : "text-muted-foreground",
                situacao === "C" && "text-green-700 dark:text-green-400",
              )}
            >
              {[SITUACAO_LABEL[situacao], ...detalhes].join(" · ")}
            </p>
          </div>
        </div>

        <div className="md:shrink-0">
          {item.tipo === "cnc" && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="lg"
              value={resposta?.valor ?? ""}
              onValueChange={(valor) => onChange({ ...resposta, valor: (valor || undefined) as ValorCnc | undefined })}
              aria-label={item.texto}
              aria-invalid={erro ? true : undefined}
            >
              {OPCOES.map((opcao) => (
                <ToggleGroupItem
                  key={opcao.valor}
                  value={opcao.valor}
                  aria-label={opcao.aria}
                  className={cn("h-11 min-w-14 font-medium", opcao.ativo)}
                >
                  {opcao.rotulo}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {item.tipo === "numero" && item.faixa && (
            <CampoCenterline item={item} faixa={item.faixa} resposta={resposta} erro={erro} onChange={onChange} />
          )}

          {item.tipo === "texto" && (
            <Input
              className="h-11 md:w-64"
              aria-label={item.texto}
              aria-invalid={erro ? true : undefined}
              value={resposta?.texto ?? ""}
              onChange={(e) => onChange({ ...resposta, texto: e.target.value })}
            />
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {situacao === "NC" && (
          <motion.div
            key="justificativa"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={REVELAR}
            className="overflow-hidden"
          >
            <Input
              className="h-11"
              aria-label={`Justificativa: ${item.texto}`}
              aria-invalid={erro ? true : undefined}
              placeholder={`O que está fora do padrão? (mínimo ${MIN_JUSTIFICATIVA} caracteres)`}
              value={resposta?.justificativa ?? ""}
              onChange={(e) => onChange({ ...resposta, justificativa: e.target.value })}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {erro && <FieldError>{erro}</FieldError>}
    </div>
  );
}

/** Centerline com −/+ grandes e régua da faixa; −/+ num campo vazio começam do meio do padrão. */
function CampoCenterline({
  item,
  faixa,
  resposta,
  erro,
  onChange,
}: {
  item: ItemFormulario;
  faixa: NonNullable<ItemFormulario["faixa"]>;
  resposta: Resposta | undefined;
  erro: string | undefined;
  onChange: (resposta: Resposta) => void;
}) {
  const span = faixa.max - faixa.min;
  const passo = span <= 2 ? 0.1 : 1;
  const meio = Math.round(((faixa.min + faixa.max) / 2) * 10) / 10;
  const valor = resposta?.numero;

  return (
    <div className="flex w-full flex-col gap-2 md:w-56">
      <NumberField
        size="lg"
        value={valor ?? null}
        step={passo}
        format={{ maximumFractionDigits: 1 }}
        locale="pt-BR"
        onValueChange={(v) => onChange({ ...resposta, numero: v ?? undefined })}
        aria-label={item.texto}
      >
        <NumberFieldGroup
          className="h-11"
          aria-invalid={erro ? true : undefined}
          onPointerDownCapture={(event) => {
            const alvo = (event.target as HTMLElement).closest(
              '[data-slot="number-field-increment"],[data-slot="number-field-decrement"]',
            );
            if (valor === undefined && alvo) {
              event.preventDefault();
              event.stopPropagation();
              onChange({ ...resposta, numero: meio });
            }
          }}
        >
          <NumberFieldDecrement className="px-3.5" aria-label={`Diminuir ${item.texto}`} />
          <NumberFieldInput placeholder={meio.toLocaleString("pt-BR")} inputMode="decimal" />
          <NumberFieldIncrement className="px-3.5" aria-label={`Aumentar ${item.texto}`} />
        </NumberFieldGroup>
      </NumberField>
      <div className="flex items-center gap-2">
        <FaixaIndicador faixa={faixa} valor={valor} />
        <span className="shrink-0 text-muted-foreground text-xs">{faixa.unidade}</span>
      </div>
    </div>
  );
}
