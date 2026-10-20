"use client";

import * as React from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { type DiaDeEscala, escalaDoDia, turnoDaTurma } from "@/domain/escala";
import { LIMITES } from "@/domain/limites";
import type { Usuario } from "@/domain/types";
import { useDeslocamentoDoTeclado } from "@/hooks/use-visual-viewport";
import { JANELA_DESFAZER_MS, useSessionStore } from "@/stores/session/session-store";

import { rotuloDoDia } from "./recados";
import { DIAS_DE_ESCALA, faixaDoTurno, nomeDoDia } from "./turnos";

export interface AlvoDoAjuste {
  usuarioId: string;
  data: string;
}

const ITEM_GRANDE =
  "h-11 toque:h-14 w-full text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/5 dark:data-[state=on]:bg-primary/10";

/**
 * Ajuste pontual da escala (job da Assistência: "editar a escala uma vez e todos verem"). Abre com a pessoa e o dia
 * tocados na escala do posto; mostra o que a turma faria naquele dia, para o ajuste ficar claro, e permite voltar à
 * escala da turma quando já há um ajuste. Salvar e voltar têm "Desfazer" por 10 s.
 *
 * Quem monta passa `key={usuarioId}` (app/CONVENCOES.md).
 */
export function AjustarEscala({
  alvo,
  pessoas,
  hoje,
  onFechar,
}: {
  readonly alvo: AlvoDoAjuste | null;
  readonly pessoas: readonly Usuario[];
  readonly hoje: string;
  readonly onFechar: () => void;
}) {
  const teclado = useDeslocamentoDoTeclado();
  return (
    <Sheet open={alvo !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        style={teclado > 0 ? { bottom: teclado, height: "auto" } : undefined}
      >
        {alvo && (
          <Formulario
            key={`${alvo.usuarioId}|${alvo.data}`}
            alvo={alvo}
            pessoas={pessoas}
            hoje={hoje}
            fechar={onFechar}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Formulario({
  alvo,
  pessoas,
  hoje,
  fechar,
}: {
  readonly alvo: AlvoDoAjuste;
  readonly pessoas: readonly Usuario[];
  readonly hoje: string;
  readonly fechar: () => void;
}) {
  const ajustes = useSessionStore((s) => s.ajustesEscala);
  const [usuarioId, setUsuarioId] = React.useState(alvo.usuarioId);
  const [data, setData] = React.useState(alvo.data);
  const atualInicial = (() => {
    const u = localRepository.usuario(alvo.usuarioId);
    return u ? escalaDoDia(u, alvo.data, ajustes)?.dia : undefined;
  })();
  const [dia, setDia] = React.useState<DiaDeEscala | "">(atualInicial ?? "");
  const [motivo, setMotivo] = React.useState("");
  const [erros, setErros] = React.useState<{ data?: string; dia?: string }>({});
  const ids = React.useId();
  const dataRef = React.useRef<HTMLInputElement>(null);
  const diasRef = React.useRef<HTMLDivElement>(null);

  const pessoa = localRepository.usuario(usuarioId);
  const ajusteId = `${usuarioId}|${data}`;
  const ajusteAtual = ajustes[ajusteId];
  const daTurma = pessoa?.turma && data ? turnoDaTurma(pessoa.turma, data) : undefined;
  const autorDoAjuste = ajusteAtual ? localRepository.usuario(ajusteAtual.autorId)?.nome : undefined;

  function desfazerPara(anterior: typeof ajusteAtual) {
    const loja = useSessionStore.getState();
    const ok = anterior
      ? loja.ajustarEscala({
          usuarioId: anterior.usuarioId,
          data: anterior.data,
          turno: anterior.turno,
          motivo: anterior.motivo,
        })
      : loja.removerAjusteEscala(ajusteId);
    if (!ok) toast.info("Não dá para desfazer", { description: "Desbloqueie o tablet e tente de novo." });
  }

  function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const novos: typeof erros = {};
    if (!data) novos.data = "Escolha o dia.";
    if (dia === "") novos.dia = "Escolha o turno ou a folga.";
    setErros(novos);
    if (novos.data) return dataRef.current?.focus();
    if (novos.dia) return diasRef.current?.querySelector<HTMLElement>("button")?.focus();
    if (dia === "" || !pessoa) return;
    const anterior = ajusteAtual;
    const ajuste = useSessionStore.getState().ajustarEscala({ usuarioId, data, turno: dia, motivo });
    if (!ajuste) {
      toast.error("Não foi possível ajustar", {
        description: "Confira se o tablet está desbloqueado.",
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }
    fechar();
    toast.success("Escala ajustada", {
      description: `${pessoa.nome} · ${nomeDoDia(dia)} · ${rotuloDoDia(data, hoje)}. Todos os tablets já mostram.`,
      duration: JANELA_DESFAZER_MS,
      action: { label: "Desfazer", onClick: () => desfazerPara(anterior) },
    });
  }

  function voltarParaTurma() {
    if (!ajusteAtual || !pessoa) return;
    const anterior = ajusteAtual;
    if (!useSessionStore.getState().removerAjusteEscala(ajusteId)) {
      toast.error("Não foi possível desfazer o ajuste", { description: "Confira se o tablet está desbloqueado." });
      return;
    }
    fechar();
    toast.success("Voltou à escala da turma", {
      description: `${pessoa.nome} · ${daTurma ? nomeDoDia(daTurma) : "sem turma"} · ${rotuloDoDia(data, hoje)}.`,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          const { usuarioId: u, data: d, turno, motivo: m } = anterior;
          if (!useSessionStore.getState().ajustarEscala({ usuarioId: u, data: d, turno, motivo: m })) {
            toast.info("Não dá para desfazer", { description: "Desbloqueie o tablet e tente de novo." });
          }
        },
      },
    });
  }

  return (
    <form noValidate onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b pt-[max(--spacing(4),env(safe-area-inset-top))]">
        <SheetTitle className="text-lg">Ajustar a escala</SheetTitle>
        <SheetDescription className="toque:text-base">
          Vale só para o dia escolhido. A escala da turma continua igual nos outros dias.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <FieldSet className="gap-3">
          <FieldLegend id={`${ids}-pessoa`} variant="label" className="text-base">
            Pessoa
          </FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={3}
            value={usuarioId}
            onValueChange={(v) => {
              if (!v) return;
              setUsuarioId(v);
              const u = localRepository.usuario(v);
              const atual = u && data ? escalaDoDia(u, data, ajustes)?.dia : undefined;
              setDia(atual ?? "");
            }}
            aria-labelledby={`${ids}-pessoa`}
            className="grid w-full grid-cols-2 gap-3"
          >
            {pessoas.map((p) => (
              <ToggleGroupItem
                key={p.id}
                value={p.id}
                className={`${ITEM_GRANDE} h-auto toque:h-auto min-h-11 toque:min-h-14 flex-col gap-0 py-1.5`}
              >
                <span className="truncate">{p.nome}</span>
                <span className="font-normal text-muted-foreground text-sm">Turma {p.turma}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <Field data-invalid={erros.data ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-data`} className="text-base">
            Dia
          </FieldLabel>
          <Input
            ref={dataRef}
            id={`${ids}-data`}
            type="date"
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              const atual = pessoa && e.target.value ? escalaDoDia(pessoa, e.target.value, ajustes)?.dia : undefined;
              setDia(atual ?? "");
              if (erros.data) setErros((x) => ({ ...x, data: undefined }));
            }}
            aria-invalid={erros.data ? true : undefined}
            aria-describedby={`${ids}-ajuda-data`}
          />
          <FieldDescription id={`${ids}-ajuda-data`}>
            {data && pessoa
              ? `${rotuloDoDia(data, hoje)}. Pela turma ${pessoa.turma}: ${daTurma ? nomeDoDia(daTurma) : "sem escala"}${
                  ajusteAtual
                    ? `. Já ajustado para ${nomeDoDia(ajusteAtual.turno)}${autorDoAjuste ? ` por ${autorDoAjuste}` : ""}${ajusteAtual.motivo ? ` (${ajusteAtual.motivo})` : ""}.`
                    : "."
                }`
              : "Escolha o dia."}
          </FieldDescription>
          {erros.data && <FieldError>{erros.data}</FieldError>}
        </Field>

        <FieldSet className="gap-3">
          <FieldLegend id={`${ids}-turno`} variant="label" className="text-base">
            Neste dia
          </FieldLegend>
          <ToggleGroup
            ref={diasRef}
            type="single"
            variant="outline"
            spacing={3}
            value={dia === "" ? "" : String(dia)}
            onValueChange={(v) => {
              if (!v) return;
              setDia(v === "folga" ? "folga" : (Number(v) as 1 | 2 | 3));
              setErros((x) => ({ ...x, dia: undefined }));
            }}
            aria-labelledby={`${ids}-turno`}
            aria-invalid={erros.dia ? true : undefined}
            className="grid w-full grid-cols-2 gap-3"
          >
            {DIAS_DE_ESCALA.map((d) => (
              <ToggleGroupItem key={String(d)} value={String(d)} className={ITEM_GRANDE}>
                {nomeDoDia(d)}
                {d !== "folga" && (
                  <span className="font-normal text-muted-foreground tabular-nums">{faixaDoTurno(d)}</span>
                )}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {erros.dia && <FieldError>{erros.dia}</FieldError>}
        </FieldSet>

        <Field>
          <FieldLabel htmlFor={`${ids}-motivo`} className="text-base">
            Motivo (opcional)
          </FieldLabel>
          <Input
            id={`${ids}-motivo`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: troca com a turma C, banco de horas"
            maxLength={LIMITES.titulo}
            autoComplete="off"
            className="wrap-anywhere"
          />
        </Field>

        {ajusteAtual && (
          <Button type="button" variant="outline" className="toque:h-14 self-start" onClick={voltarParaTurma}>
            Voltar à escala da turma neste dia
          </Button>
        )}
      </div>

      <SheetFooter className="flex-row justify-end gap-3 border-t pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" className="h-11 toque:h-16 px-5" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 toque:h-16 px-5 text-base">
          Salvar ajuste
        </Button>
      </SheetFooter>
    </form>
  );
}
