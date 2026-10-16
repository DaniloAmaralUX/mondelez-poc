"use client";

import * as React from "react";

import { TriangleAlert } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MIN_JUSTIFICATIVA, situacaoItem } from "@/domain/formulario-engine";
import type { Formulario, Resposta } from "@/domain/types";
import { useDeslocamentoDoTeclado } from "@/hooks/use-visual-viewport";
import { JANELA_DESFAZER_MS } from "@/stores/session/session-store";

import type { ChecklistFormValues } from "./data";
import { useAvisosDaTela } from "./use-avisos-da-tela";

const SITUACAO = { pendente: "Sem resposta", C: "Conforme", NC: "Não conforme", NA: "Não se aplica" } as const;

interface Erros {
  item?: string;
  justificativa?: string;
}

/**
 * "Registrar desvio" em qualquer etapa (docs/12 §3.4). Forma mais simples que cumpre NC + justificativa sem sair da
 * etapa atual: escolher o item (de qualquer etapa) e descrever o desvio. O resultado é o mesmo de tocar NC no item e
 * escrever a justificativa: a resposta do item vira NC no rascunho e o alerta sai quando o checklist for registrado.
 * Desfazer por 10 s no toast, sem diálogo de confirmação.
 *
 * Sheet à direita, com os campos no topo (um Sheet inferior ficaria sob o teclado no iPad). O Sheet encolhe acima do
 * teclado (visualViewport) para "Registrar desvio" continuar à vista enquanto a pessoa digita.
 */
export function RegistrarDesvio({ formulario }: { formulario: Formulario }) {
  const { getValues, setValue } = useFormContext<ChecklistFormValues>();
  const avisar = useAvisosDaTela();
  const teclado = useDeslocamentoDoTeclado();
  const [aberto, setAberto] = React.useState(false);
  const [itemId, setItemId] = React.useState("");
  const [justificativa, setJustificativa] = React.useState("");
  const [erros, setErros] = React.useState<Erros>({});
  const ids = React.useId();
  const listaRef = React.useRef<HTMLDivElement>(null);
  const justificativaRef = React.useRef<HTMLInputElement>(null);

  // Só itens C/NC: centerline vira NC pelo valor fora da faixa e lote não tem conformidade.
  const itens = formulario.itens.filter((item) => item.tipo === "cnc");
  if (itens.length === 0) return null;

  const idLista = `${ids}-itens`;
  const idErroItem = `${ids}-erro-item`;
  const idJustificativa = `${ids}-justificativa`;
  const idAjuda = `${ids}-ajuda`;
  const idErroJustificativa = `${ids}-erro-justificativa`;
  const respostas = aberto ? (getValues("respostas") ?? {}) : {};

  function aoAbrir(abrir: boolean) {
    if (abrir) {
      setItemId("");
      setJustificativa("");
      setErros({});
    }
    setAberto(abrir);
  }

  function escolher(id: string) {
    setItemId(id);
    setErros((atual) => ({ ...atual, item: undefined }));
    // Item que já está NC: traz a justificativa dele para completar ou corrigir.
    const resposta = getValues(`respostas.${id}`);
    if (resposta?.valor === "NC" && resposta.justificativa) setJustificativa(resposta.justificativa);
  }

  function registrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Eventos de portal sobem pela árvore do React: este submit nunca pode chegar a um formulário de checklist acima.
    event.stopPropagation();

    const texto = justificativa.trim();
    const novos: Erros = {};
    if (!itemId) novos.item = "Escolha o item com desvio.";
    if (texto.length < MIN_JUSTIFICATIVA)
      novos.justificativa = `Descreva o que está fora do padrão (mínimo ${MIN_JUSTIFICATIVA} caracteres).`;
    if (novos.item || novos.justificativa) {
      setErros(novos);
      // Foco no primeiro erro (docs/12 §2 item 12).
      if (novos.item) listaRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
      else justificativaRef.current?.focus();
      return;
    }

    const item = itens.find((i) => i.id === itemId);
    if (!item) return;
    const anterior: Resposta | undefined = structuredClone(getValues(`respostas.${itemId}`));
    setValue(`respostas.${itemId}`, { ...anterior, valor: "NC", justificativa: texto }, { shouldDirty: true });
    setAberto(false);

    avisar(
      toast.warning("Item marcado como não conforme", {
        description: `${item.texto} (${item.grupo}). O alerta sai quando o checklist for registrado.`,
        duration: JANELA_DESFAZER_MS,
        action: {
          label: "Desfazer",
          onClick: () => {
            const agora = { ...(getValues("respostas") ?? {}) };
            // Só desfaz se o item ainda está como o desvio deixou; uma mudança feita depois pela pessoa fica.
            if (agora[itemId]?.valor !== "NC") return;
            if (anterior === undefined) delete agora[itemId];
            else agora[itemId] = anterior;
            setValue("respostas", agora, { shouldDirty: true });
          },
        },
      }),
    );
  }

  return (
    <Sheet open={aberto} onOpenChange={aoAbrir}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="h-11 shrink-0">
          <TriangleAlert data-icon="inline-start" />
          Registrar desvio
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        // Sem o X do canto (28 px, rótulo "Close"): Cancelar fica no rodapé, junto da ação. Esc e o toque fora também fecham.
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        // Com o teclado aberto no iPad, o Sheet termina onde o teclado começa.
        style={teclado > 0 ? { bottom: teclado, height: "auto" } : undefined}
      >
        <form noValidate onSubmit={registrar} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b pt-[max(--spacing(4),env(safe-area-inset-top))]">
            <SheetTitle className="text-lg">Registrar desvio</SheetTitle>
            <SheetDescription>
              Marque o item como não conforme e diga o que está fora do padrão. Vale para qualquer etapa.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
            <FieldSet className="gap-3">
              <FieldLegend id={idLista} variant="label" className="text-base">
                Item
              </FieldLegend>
              <RadioGroup
                ref={listaRef}
                value={itemId}
                onValueChange={escolher}
                aria-labelledby={idLista}
                aria-invalid={erros.item ? true : undefined}
                aria-describedby={erros.item ? idErroItem : undefined}
                className="gap-3"
              >
                {itens.map((item) => {
                  const idOpcao = `${ids}-item-${item.id}`;
                  return (
                    <FieldLabel key={item.id} htmlFor={idOpcao}>
                      <Field orientation="horizontal" className="min-h-14">
                        <FieldContent>
                          <FieldTitle className="text-base">{item.texto}</FieldTitle>
                          <FieldDescription>
                            {item.grupo} · {SITUACAO[situacaoItem(item, respostas[item.id])]}
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={item.id} id={idOpcao} />
                      </Field>
                    </FieldLabel>
                  );
                })}
              </RadioGroup>
              {erros.item && <FieldError id={idErroItem}>{erros.item}</FieldError>}
            </FieldSet>

            <Field data-invalid={erros.justificativa ? true : undefined}>
              <FieldLabel htmlFor={idJustificativa} className="text-base">
                Justificativa
              </FieldLabel>
              <Input
                ref={justificativaRef}
                id={idJustificativa}
                className="h-11"
                value={justificativa}
                onChange={(event) => {
                  setJustificativa(event.target.value);
                  if (erros.justificativa) setErros((atual) => ({ ...atual, justificativa: undefined }));
                }}
                placeholder="O que está fora do padrão?"
                autoComplete="off"
                enterKeyHint="done"
                onKeyDown={(event) => {
                  // "done" fecha o teclado; o envio fica no botão, à vista acima do teclado.
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
                aria-invalid={erros.justificativa ? true : undefined}
                aria-describedby={[idAjuda, erros.justificativa ? idErroJustificativa : undefined]
                  .filter(Boolean)
                  .join(" ")}
              />
              <FieldDescription id={idAjuda}>
                Mínimo de {MIN_JUSTIFICATIVA} caracteres. Vai para a supervisão junto com o alerta.
              </FieldDescription>
              {erros.justificativa && <FieldError id={idErroJustificativa}>{erros.justificativa}</FieldError>}
            </Field>
          </div>

          {/* Cancelar × Registrar são ações opostas: 16 px entre elas (docs/12 §2 item 2). Primária de 64 px no toque. */}
          <SheetFooter className="mt-0 flex-row justify-end gap-4 border-t pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" className="h-11" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 toque:h-16 px-5 toque:px-6 toque:text-base">
              <TriangleAlert data-icon="inline-start" />
              Registrar desvio
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
