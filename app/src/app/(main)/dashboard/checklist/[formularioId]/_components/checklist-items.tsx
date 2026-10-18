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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAX_JUSTIFICATIVA, MAX_TEXTO_DO_ITEM, MIN_JUSTIFICATIVA, situacaoItem } from "@/domain/formulario-engine";
import type { ItemFormulario, Resposta, ValorCnc } from "@/domain/types";
import { PRESSAO } from "@/lib/pressao";

import type { ChecklistFormValues } from "./data";
import { FaixaIndicador } from "./faixa-indicador";

const SITUACAO_LABEL = { pendente: "Pendente", C: "Conforme", NC: "Não conforme", NA: "Não se aplica" } as const;

// Cor do resultado escolhido: a resposta se lê de longe, não só pela posição do botão.
const OPCOES: { valor: ValorCnc; rotulo: string; aria: string; ativo: string }[] = [
  {
    valor: "C",
    rotulo: "C",
    aria: "Conforme",
    // green-800 (e green-400 no escuro): sobre green-600/10 o green-700 dava 4,42:1, abaixo de 4,5:1.
    ativo:
      "data-[state=on]:border-green-600/40 data-[state=on]:bg-green-600/10 data-[state=on]:text-green-800 dark:data-[state=on]:text-green-400",
  },
  {
    valor: "NC",
    rotulo: "NC",
    aria: "Não conforme",
    // red-700 (e red-400 no escuro), não text-destructive: sobre destructive/10 o token dava 4,01:1, abaixo de 4,5:1.
    ativo:
      "data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/10 data-[state=on]:text-red-700 dark:data-[state=on]:text-red-400",
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
    // v0.4 (docs/14): os itens da etapa numa lista agrupada (inset grouped do iOS), um card com divisórias finas, em vez
    // de um card por item.
    <div
      data-checklist-itens
      className="@container/itens flex flex-col divide-y divide-border/70 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5"
    >
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
  const idAjudaJustificativa = `justificativa-ajuda-${item.id}`;

  return (
    // Uma linha da lista agrupada. scroll-mt: abaixo do header do dashboard (64 px no toque); scroll-mb: acima da barra fixa
    // (64 px de ação + 24 de respiro + 12 da borda), para o item que recebe foco ou é rolado até a vista não ficar sob ela.
    <div
      id={`item-${item.id}`}
      data-invalid={erro ? true : undefined}
      className={cn("flex scroll-mt-24 scroll-mb-36 flex-col gap-3 p-4 transition-colors", erro && "bg-destructive/5")}
    >
      <div className="flex @2xl/itens:flex-row flex-col @2xl/itens:items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground text-sm tabular-nums">
            {numero}
          </span>
          <div className="min-w-0">
            {/* Lido a um braço de distância no tablet: 18 px no toque (docs/12 §3.3), 16 px no notebook. */}
            <p className="font-medium text-base toque:text-lg">{item.texto}</p>
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
                  venceria um min-w-* e voltaria a 56 px.
                  Nome acessível começa pelo texto visível (WCAG 2.5.3): quem usa controle por voz diz "NC".
                  PRESSAO: retorno no pointerdown (o Toggle do template só muda de cor no clique); troca a transição
                  de cor do template pela de escala, e a cor da resposta muda na hora. */}
              {OPCOES.map((opcao) => (
                <ToggleGroupItem
                  key={opcao.valor}
                  value={opcao.valor}
                  aria-label={`${opcao.rotulo} (${opcao.aria})`}
                  className={cn("h-11 toque:h-16 toque:w-20 min-w-14 font-medium text-base", PRESSAO, opcao.ativo)}
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
              // Limite da fronteira de dados (domain/limites.ts); o documento quebra o lote sem separador na coluna.
              maxLength={MAX_TEXTO_DO_ITEM}
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
            // -m-1/p-1: o overflow-hidden da animação não corta o anel de foco do campo. A margem de cima também anima:
            // fechado, −8 − 4 px anulam o gap-3 do cartão (sem os 4 px que sobravam e sumiam de uma vez no fim);
            // aberto, −4 e −4, como o -m-1 de antes.
            initial={{ opacity: 0, height: 0, marginTop: -8, marginBottom: -4 }}
            animate={{ opacity: 1, height: "auto", marginTop: -4, marginBottom: -4 }}
            exit={{ opacity: 0, height: 0, marginTop: -8, marginBottom: -4 }}
            transition={REVELAR}
            className="-mx-1 overflow-hidden"
          >
            {/* Rótulo visível e a regra numa descrição (o placeholder some ao digitar). "done" fecha o teclado. */}
            <Field className="gap-2 p-1" data-invalid={erro ? true : undefined}>
              <FieldLabel htmlFor={idJustificativa}>Justificativa</FieldLabel>
              <Input
                id={idJustificativa}
                className="h-11"
                aria-label={`Justificativa: ${item.texto}`}
                aria-invalid={erro ? true : undefined}
                aria-describedby={[idAjudaJustificativa, idErro].filter(Boolean).join(" ")}
                enterKeyHint="done"
                autoComplete="off"
                maxLength={MAX_JUSTIFICATIVA}
                onKeyDown={(e) => aoEnter(e, "concluir")}
                placeholder="O que está fora do padrão?"
                value={resposta?.justificativa ?? ""}
                onChange={(e) => onChange({ ...resposta, justificativa: e.target.value })}
              />
              <FieldDescription id={idAjudaJustificativa}>
                Mínimo de {MIN_JUSTIFICATIVA} caracteres. Vai para a supervisão junto com o alerta.
              </FieldDescription>
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
      {/* role="none" no lugar do role="alert" do FieldError: com 3 pendências na etapa, 3 alertas entravam juntos com
          o aviso "Faltam 3 itens". O resumo fica no aviso, e o erro de cada item é lido no foco (aria-describedby). */}
      {erro && (
        <FieldError id={idErro} role="none">
          {erro}
        </FieldError>
      )}
    </div>
  );
}

const SELETOR_PASSO = '[data-slot="number-field-increment"],[data-slot="number-field-decrement"]';

/** Soma de passos sem resíduo de ponto flutuante (5,5 + 0,1 = 5,6, não 5,6000000000000005). */
function arredondar(valor: number, passo: number) {
  const casas = passo < 1 ? 10 : 1;
  return Math.round(valor * casas) / casas;
}

/**
 * Centerline com −/+ grandes e régua da faixa; −/+ num campo vazio começam do meio do padrão.
 *
 * Um toque, um passo. O NumberField do base-ui repete o passo enquanto o botão fica pressionado (começa em 400 ms e
 * repete a cada 60 ms, também no toque); com luva, um toque demorado vira vários graus. Aqui o toque nos −/+ é tratado
 * antes do componente (captura do pointerdown): aplica um passo e não deixa a repetição começar. O clique sem ponteiro
 * (leitor de tela) continua com o próprio componente, que também dá um passo. Teclado: setas no campo, como antes.
 */
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
    // w-64 em duas colunas: com os −/+ de 64 px, o campo ainda mostra um valor de 11 caracteres (100.100.100) inteiro.
    <div className="flex @2xl/itens:w-64 w-full flex-col gap-2">
      <NumberField
        size="lg"
        value={valor ?? null}
        step={passo}
        format={{ maximumFractionDigits: 1 }}
        locale="pt-BR"
        onValueChange={(v) => onChange({ ...resposta, numero: v ?? undefined })}
        aria-label={item.texto}
      >
        {/* −/+ são a forma de responder estes itens: no toque, alvos de resposta (64 px de largura, 62 de altura dentro
            da borda do grupo de 64). toque:w-16 e não min-w-*: o min-width da camada de toque venceria. */}
        <NumberFieldGroup
          className="h-11 toque:h-16"
          aria-invalid={erro ? true : undefined}
          onPointerDownCapture={(event) => {
            if (event.button !== 0) return;
            const alvo = (event.target as HTMLElement).closest<HTMLElement>(SELETOR_PASSO);
            // :disabled cobre o fieldset desabilitado dos modos registrado e consulta.
            if (!alvo || alvo.matches(":disabled") || alvo.getAttribute("aria-disabled") === "true") return;
            event.preventDefault();
            event.stopPropagation();
            const sentido = alvo.dataset.slot === "number-field-increment" ? 1 : -1;
            onChange({ ...resposta, numero: valor === undefined ? meio : arredondar(valor + sentido * passo, passo) });
          }}
        >
          <NumberFieldDecrement className="toque:w-16 px-3.5" aria-label={`Diminuir ${item.texto}`} />
          <NumberFieldInput
            className="tabular-nums"
            placeholder={meio.toLocaleString("pt-BR")}
            inputMode="decimal"
            aria-describedby={idErro}
          />
          <NumberFieldIncrement className="toque:w-16 px-3.5" aria-label={`Aumentar ${item.texto}`} />
        </NumberFieldGroup>
      </NumberField>
      <div className="flex items-center gap-2">
        <FaixaIndicador faixa={faixa} valor={valor} />
        <span className="shrink-0 text-muted-foreground text-sm">{faixa.unidade}</span>
      </div>
    </div>
  );
}
