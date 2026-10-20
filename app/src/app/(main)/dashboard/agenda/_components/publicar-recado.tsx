"use client";

import * as React from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { LIMITES } from "@/domain/limites";
import type { TipoRecado } from "@/domain/types";
import { useDeslocamentoDoTeclado } from "@/hooks/use-visual-viewport";
import { JANELA_DESFAZER_MS, useSessionStore } from "@/stores/session/session-store";

import { ICONE_DO_TIPO, NOME_DO_TIPO, rotuloDoDia, TIPOS_DE_RECADO } from "./recados";

interface Erros {
  tipo?: string;
  titulo?: string;
  data?: string;
  horario?: string;
}

/** "14:00–16:00", "a partir das 14:00" ou nada. */
function faixa(das: string, as: string): string | undefined {
  if (!das) return undefined;
  return as ? `${das}–${as}` : `a partir das ${das}`;
}

const ITEM_GRANDE =
  "h-11 toque:h-14 w-full text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/5 dark:data-[state=on]:bg-primary/10";

/**
 * Publicar na agenda (jobs da Gerência e da Assistência: "publicar parada, visita ou evento na agenda"). Sheet à
 * direita, como o Pedir ajuda: tipo e onde em escolhas grandes, título curto, e dia e horário quando é compromisso.
 * Publicado, vai para os tablets da fábrica e para a caixa de saída (e-mail simulado), com "Desfazer" por 10 s.
 *
 * Quem monta passa `key={usuarioId}` (app/CONVENCOES.md).
 */
export function PublicarRecado({
  aberto,
  onAbertoChange,
  dataInicial,
  hoje,
}: {
  readonly aberto: boolean;
  readonly onAbertoChange: (aberto: boolean) => void;
  /** Dia escolhido no calendário, que já vem preenchido. */
  readonly dataInicial: string;
  readonly hoje: string;
}) {
  const teclado = useDeslocamentoDoTeclado();
  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        style={teclado > 0 ? { bottom: teclado, height: "auto" } : undefined}
      >
        {/* key: o formulário recomeça com o dia escolhido a cada abertura. */}
        <Formulario
          key={`${aberto}|${dataInicial}`}
          dataInicial={dataInicial}
          hoje={hoje}
          fechar={() => onAbertoChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function Formulario({
  dataInicial,
  hoje,
  fechar,
}: {
  readonly dataInicial: string;
  readonly hoje: string;
  readonly fechar: () => void;
}) {
  const linhas = localRepository.plantas().flatMap((p) => localRepository.linhas(p.id));
  const [tipo, setTipo] = React.useState<TipoRecado | "">("");
  const [titulo, setTitulo] = React.useState("");
  const [onde, setOnde] = React.useState("fabrica");
  const [data, setData] = React.useState(dataInicial);
  const [das, setDas] = React.useState("");
  const [as, setAs] = React.useState("");
  const [erros, setErros] = React.useState<Erros>({});
  const ids = React.useId();
  const tiposRef = React.useRef<HTMLDivElement>(null);
  const tituloRef = React.useRef<HTMLInputElement>(null);
  const dataRef = React.useRef<HTMLInputElement>(null);
  const dasRef = React.useRef<HTMLInputElement>(null);
  const compromisso = tipo !== "" && tipo !== "recado";

  function publicar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const novos: Erros = {};
    if (!tipo) novos.tipo = "Escolha o tipo.";
    if (!titulo.trim()) novos.titulo = "Escreva o título, como vai aparecer nos tablets.";
    if (compromisso && !data) novos.data = "Escolha o dia.";
    else if (compromisso && data < hoje) novos.data = "O dia já passou. Escolha hoje ou um dia à frente.";
    if (compromisso && as && !das) novos.horario = "Diga também a hora de início.";
    else if (compromisso && das && as && as <= das) novos.horario = "A hora de fim vem depois da de início.";
    setErros(novos);
    if (novos.tipo) return tiposRef.current?.querySelector<HTMLElement>("button")?.focus();
    if (novos.titulo) return tituloRef.current?.focus();
    if (novos.data) return dataRef.current?.focus();
    if (novos.horario) return dasRef.current?.focus();
    if (!tipo) return;

    const recado = useSessionStore.getState().publicarRecado({
      tipo,
      titulo,
      linhaId: onde === "fabrica" ? undefined : onde,
      data: compromisso ? data : undefined,
      horario: compromisso ? faixa(das, as) : undefined,
    });
    if (!recado) {
      toast.error("Não foi possível publicar", {
        description: "Confira se o tablet está desbloqueado e tente de novo.",
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }
    fechar();
    toast.success("Publicado na agenda", {
      description: `${recado.titulo}. Os tablets ${recado.linhaId ? `da ${localRepository.linha(recado.linhaId)?.nome}` : "da fábrica"} já mostram, e o aviso por e-mail foi para a caixa de saída.`,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          if (!useSessionStore.getState().removerRecado(recado.id)) {
            toast.info("Não dá para desfazer", { description: "Só quem publicou retira, com o tablet desbloqueado." });
          }
        },
      },
    });
  }

  return (
    <form noValidate onSubmit={publicar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b pt-[max(--spacing(4),env(safe-area-inset-top))]">
        <SheetTitle className="text-lg">Publicar na agenda</SheetTitle>
        <SheetDescription className="toque:text-base">
          Aparece na Agenda e nos Recados da Minha Rotina de quem estiver na linha escolhida.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <FieldSet className="gap-3">
          <FieldLegend id={`${ids}-tipo`} variant="label" className="text-base">
            Tipo
          </FieldLegend>
          <ToggleGroup
            ref={tiposRef}
            type="single"
            variant="outline"
            spacing={3}
            value={tipo}
            onValueChange={(v) => {
              if (!v) return;
              setTipo(v as TipoRecado);
              setErros((e) => ({ ...e, tipo: undefined }));
            }}
            aria-labelledby={`${ids}-tipo`}
            aria-invalid={erros.tipo ? true : undefined}
            aria-describedby={erros.tipo ? `${ids}-erro-tipo` : undefined}
            className="grid w-full grid-cols-2 gap-3"
          >
            {TIPOS_DE_RECADO.map((t) => {
              const Icone = ICONE_DO_TIPO[t];
              return (
                <ToggleGroupItem key={t} value={t} className={ITEM_GRANDE}>
                  <Icone aria-hidden />
                  {NOME_DO_TIPO[t]}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          {erros.tipo && <FieldError id={`${ids}-erro-tipo`}>{erros.tipo}</FieldError>}
        </FieldSet>

        <Field data-invalid={erros.titulo ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-titulo`} className="text-base">
            Título
          </FieldLabel>
          <Input
            ref={tituloRef}
            id={`${ids}-titulo`}
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              if (erros.titulo) setErros((x) => ({ ...x, titulo: undefined }));
            }}
            placeholder="Ex.: Parada da Bis 2 para troca de formato"
            maxLength={LIMITES.titulo}
            autoComplete="off"
            enterKeyHint="next"
            className="wrap-anywhere"
            aria-invalid={erros.titulo ? true : undefined}
            aria-describedby={erros.titulo ? `${ids}-erro-titulo` : undefined}
          />
          {erros.titulo && <FieldError id={`${ids}-erro-titulo`}>{erros.titulo}</FieldError>}
        </Field>

        <FieldSet className="gap-3">
          <FieldLegend id={`${ids}-onde`} variant="label" className="text-base">
            Para quem
          </FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={3}
            value={onde}
            onValueChange={(v) => v && setOnde(v)}
            aria-labelledby={`${ids}-onde`}
            className="grid w-full grid-cols-2 gap-3"
          >
            <ToggleGroupItem value="fabrica" className={ITEM_GRANDE}>
              Fábrica toda
            </ToggleGroupItem>
            {linhas.map((l) => (
              <ToggleGroupItem key={l.id} value={l.id} className={ITEM_GRANDE}>
                {l.nome}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        {compromisso && (
          <>
            <Field data-invalid={erros.data ? true : undefined}>
              <FieldLabel htmlFor={`${ids}-data`} className="text-base">
                Dia
              </FieldLabel>
              <Input
                ref={dataRef}
                id={`${ids}-data`}
                type="date"
                min={hoje}
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  if (erros.data) setErros((x) => ({ ...x, data: undefined }));
                }}
                aria-invalid={erros.data ? true : undefined}
                aria-describedby={[`${ids}-ajuda-data`, erros.data ? `${ids}-erro-data` : undefined]
                  .filter(Boolean)
                  .join(" ")}
              />
              <FieldDescription id={`${ids}-ajuda-data`}>
                {data ? rotuloDoDia(data, hoje) : "Sem dia escolhido."}
              </FieldDescription>
              {erros.data && <FieldError id={`${ids}-erro-data`}>{erros.data}</FieldError>}
            </Field>

            <FieldSet className="gap-3" data-invalid={erros.horario ? true : undefined}>
              <FieldLegend variant="label" className="text-base">
                Horário (opcional)
              </FieldLegend>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor={`${ids}-das`}>Das</FieldLabel>
                  <Input
                    ref={dasRef}
                    id={`${ids}-das`}
                    type="time"
                    value={das}
                    onChange={(e) => setDas(e.target.value)}
                    aria-invalid={erros.horario ? true : undefined}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${ids}-as`}>Às</FieldLabel>
                  <Input
                    id={`${ids}-as`}
                    type="time"
                    value={as}
                    onChange={(e) => setAs(e.target.value)}
                    aria-invalid={erros.horario ? true : undefined}
                  />
                </Field>
              </div>
              {erros.horario && <FieldError>{erros.horario}</FieldError>}
            </FieldSet>
          </>
        )}
      </div>

      <SheetFooter className="flex-row justify-end gap-3 border-t pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" className="h-11 toque:h-16 px-5" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 toque:h-16 px-5 text-base">
          Publicar
        </Button>
      </SheetFooter>
    </form>
  );
}
