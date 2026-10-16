"use client";

import type * as React from "react";

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
import { Label } from "@/components/ui/label";
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

/**
 * Enter no teclado virtual faz o que a tecla diz (enterKeyHint): "next" vai para o próximo campo da lista,
 * "done" fecha o teclado. Também evita o envio implícito do formulário no meio de uma etapa.
 */
function aoEnter(event: React.KeyboardEvent<HTMLInputElement>, acao: "proximo" | "concluir") {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
  event.preventDefault();
  const atual = event.currentTarget;
  if (acao === "proximo") {
    // Só campos que a pessoa alcança: o NumberField (base-ui) tem um input oculto com tabIndex -1.
    const campos = Array.from(
      atual
        .closest("[data-checklist-itens]")
        ?.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])') ?? [],
    );
    const proximo = campos[campos.indexOf(atual) + 1];
    if (proximo) {
      proximo.focus();
      return;
    }
  }
  atual.blur();
}

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
    // Container query: a linha do item se divide pela largura do painel, não do viewport (sidebar aberta ou não).
    <div data-checklist-itens className="@container/itens flex flex-col gap-3">
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
  const idErro = erro ? `erro-${item.id}` : undefined;
  const idJustificativa = `justificativa-${item.id}`;

  return (
    <div
      id={`item-${item.id}`}
      data-invalid={erro ? true : undefined}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-card p-3 transition-colors",
        erro && "border-destructive/50",
      )}
    >
      <div className="flex @2xl/itens:flex-row flex-col @2xl/itens:items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground text-sm tabular-nums">
            {numero}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-base">{item.texto}</p>
            <p
              className={cn(
                "text-sm",
                situacao === "NC" ? "text-destructive" : "text-muted-foreground",
                situacao === "C" && "text-green-700 dark:text-green-400",
              )}
            >
              {[SITUACAO_LABEL[situacao], ...detalhes].join(" · ")}
            </p>
          </div>
        </div>

        <div className="@2xl/itens:shrink-0">
          {item.tipo === "cnc" && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="lg"
              // 16 px entre C, NC e N/A: respostas opostas (docs/12 §2 item 2 e §3.3); cumpre o piso de 12 px.
              spacing={4}
              value={resposta?.valor ?? ""}
              // O segundo toque não desmarca: com luva, um toque repetido não pode apagar a resposta.
              onValueChange={(valor) => {
                if (valor) onChange({ ...resposta, valor: valor as ValorCnc });
              }}
              aria-label={item.texto}
              aria-invalid={erro ? true : undefined}
              aria-describedby={idErro}
            >
              {/* No toque, 64 × 80 px (resposta é a ação primária); no notebook, os 44 px da v0.2 (docs/12 §3.1).
                  toque:w-20, não toque:min-w-20: o min-width da camada de toque (src/styles/tablet.css, sem layer)
                  venceria um min-w-* e voltaria a 56 px. */}
              {OPCOES.map((opcao) => (
                <ToggleGroupItem
                  key={opcao.valor}
                  value={opcao.valor}
                  aria-label={opcao.aria}
                  className={cn("h-11 toque:h-16 toque:w-20 min-w-14 font-medium text-base", opcao.ativo)}
                >
                  {opcao.rotulo}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {item.tipo === "numero" && item.faixa && (
            <CampoCenterline
              item={item}
              faixa={item.faixa}
              resposta={resposta}
              erro={erro}
              idErro={idErro}
              onChange={onChange}
            />
          )}

          {item.tipo === "texto" && (
            <Input
              className="h-11 @2xl/itens:w-64"
              aria-label={item.texto}
              aria-invalid={erro ? true : undefined}
              aria-describedby={idErro}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              onKeyDown={(e) => aoEnter(e, "proximo")}
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
            // -m-1/p-1: o overflow-hidden da animação não corta o anel de foco do campo.
            className="-m-1 overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-1">
              <Label htmlFor={idJustificativa}>Justificativa</Label>
              <Input
                id={idJustificativa}
                className="h-11"
                aria-label={`Justificativa: ${item.texto}`}
                aria-invalid={erro ? true : undefined}
                aria-describedby={idErro}
                enterKeyHint="done"
                onKeyDown={(e) => aoEnter(e, "concluir")}
                placeholder={`O que está fora do padrão? (mínimo ${MIN_JUSTIFICATIVA} caracteres)`}
                value={resposta?.justificativa ?? ""}
                onChange={(e) => onChange({ ...resposta, justificativa: e.target.value })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {erro && <FieldError id={idErro}>{erro}</FieldError>}
    </div>
  );
}

/** Centerline com −/+ grandes e régua da faixa; −/+ num campo vazio começam do meio do padrão. */
function CampoCenterline({
  item,
  faixa,
  resposta,
  erro,
  idErro,
  onChange,
}: {
  item: ItemFormulario;
  faixa: NonNullable<ItemFormulario["faixa"]>;
  resposta: Resposta | undefined;
  erro: string | undefined;
  idErro: string | undefined;
  onChange: (resposta: Resposta) => void;
}) {
  const span = faixa.max - faixa.min;
  const passo = span <= 2 ? 0.1 : 1;
  const meio = Math.round(((faixa.min + faixa.max) / 2) * 10) / 10;
  const valor = resposta?.numero;

  return (
    <div className="flex @2xl/itens:w-56 w-full flex-col gap-2">
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
          <NumberFieldInput placeholder={meio.toLocaleString("pt-BR")} inputMode="decimal" aria-describedby={idErro} />
          <NumberFieldIncrement className="px-3.5" aria-label={`Aumentar ${item.texto}`} />
        </NumberFieldGroup>
      </NumberField>
      <div className="flex items-center gap-2">
        <FaixaIndicador faixa={faixa} valor={valor} />
        <span className="shrink-0 text-muted-foreground text-sm">{faixa.unidade}</span>
      </div>
    </div>
  );
}
