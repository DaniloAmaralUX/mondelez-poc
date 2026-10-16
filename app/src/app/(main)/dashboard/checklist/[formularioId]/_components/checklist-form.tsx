"use client";

import * as React from "react";

import { cn } from "cn";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Send } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { resumirRespostas, situacaoItem, validarRespostas } from "@/domain/formulario-engine";
import type { Formulario, Registro, TarefaInstancia } from "@/domain/types";

import { ChecklistItems } from "./checklist-items";
import { ChecklistNotes } from "./checklist-notes";
import { ChecklistPreview } from "./checklist-preview";
import type { ChecklistFormValues } from "./data";

export const ETAPA_REVISAR = "revisar";
const PRESSAO = "transition-transform duration-150 ease-out active:scale-[0.97]";

function slug(grupo: string) {
  return grupo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function etapasDoFormulario(formulario: Formulario) {
  const grupos = [...new Set(formulario.itens.map((item) => item.grupo))];
  return grupos.map((grupo) => ({
    value: slug(grupo),
    titulo: grupo,
    itens: formulario.itens.filter((item) => item.grupo === grupo),
  }));
}

/**
 * Checklist em etapas (padrão de steppers do UI Audit): um grupo por vez, revisão com o documento no fim
 * e uma barra fixa com progresso e a próxima ação sempre ao alcance do polegar.
 */
export function ChecklistStepper({
  formulario,
  tarefa,
  registro,
  somenteLeitura,
  etapa,
  onEtapaChange,
}: {
  formulario: Formulario;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  somenteLeitura: boolean;
  etapa: string;
  onEtapaChange: (etapa: string) => void;
}) {
  const { getValues, setValue } = useFormContext<ChecklistFormValues>();
  const valores = useWatch<ChecklistFormValues>() as ChecklistFormValues;
  const respostas = valores.respostas ?? {};
  const etapas = etapasDoFormulario(formulario);
  const numeros = Object.fromEntries(formulario.itens.map((item, index) => [item.id, index + 1]));
  const [tentadas, setTentadas] = React.useState<Set<string>>(new Set());
  const resumo = resumirRespostas(formulario, respostas);
  const atual = etapas.find((e) => e.value === etapa);

  const errosDa = (itens: Formulario["itens"]) => validarRespostas({ ...formulario, itens }, respostas);

  const valoresEtapas = [...etapas.map((e) => e.value), ETAPA_REVISAR];
  const indice = valoresEtapas.indexOf(etapa);

  const onValidate: NonNullable<StepperProps["onValidate"]> = (_value, direction) => {
    if (somenteLeitura || direction === "prev" || !atual) return true;
    const erros = errosDa(atual.itens);
    const pendentes = Object.keys(erros);
    if (pendentes.length === 0) return true;
    setTentadas((prev) => new Set(prev).add(atual.value));
    toast.info(pendentes.length === 1 ? "Falta 1 item nesta etapa" : `Faltam ${pendentes.length} itens nesta etapa`);
    document.getElementById(`item-${pendentes[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  };

  const restantes = (atual?.itens ?? []).filter(
    (item) => item.tipo === "cnc" && situacaoItem(item, respostas[item.id]) === "pendente",
  );

  function marcarRestantesConformes() {
    const proximas = { ...(getValues("respostas") ?? {}) };
    for (const item of restantes) proximas[item.id] = { ...proximas[item.id], valor: "C" };
    setValue("respostas", proximas, { shouldDirty: true });
  }

  return (
    <Stepper value={etapa} onValueChange={onEtapaChange} onValidate={onValidate} className="flex flex-col gap-5">
      <StepperList className="no-scrollbar overflow-x-auto">
        {[...etapas, { value: ETAPA_REVISAR, titulo: "Revisar", itens: formulario.itens }].map((e, posicao) => {
          const ehRevisar = e.value === ETAPA_REVISAR;
          const respondidos = e.itens.filter((item) => situacaoItem(item, respostas[item.id]) !== "pendente").length;
          const completa = !ehRevisar && Object.keys(errosDa(e.itens)).length === 0;
          return (
            <StepperItem key={e.value} value={e.value} completed={completa}>
              <StepperTrigger className="min-h-11">
                <StepperIndicator>
                  {(estado) => (estado === "completed" ? <Check className="size-3.5" aria-hidden /> : posicao + 1)}
                </StepperIndicator>
                <div className="flex flex-col items-start gap-0.5 text-left">
                  <StepperTitle>{e.titulo}</StepperTitle>
                  <StepperDescription className="tabular-nums">
                    {ehRevisar ? `${resumo.respondidos}/${resumo.total} itens` : `${respondidos}/${e.itens.length}`}
                  </StepperDescription>
                </div>
              </StepperTrigger>
              <StepperSeparator className="mx-3 min-w-6" />
            </StepperItem>
          );
        })}
      </StepperList>

      <fieldset disabled={somenteLeitura} className="min-w-0">
        {etapas.map((e) => (
          <StepperContent key={e.value} value={e.value}>
            <ChecklistItems itens={e.itens} numeros={numeros} erros={tentadas.has(e.value) ? errosDa(e.itens) : {}} />
          </StepperContent>
        ))}
      </fieldset>
      <StepperContent value={ETAPA_REVISAR} className="flex flex-col gap-5">
        <ResumoDaRevisao formulario={formulario} valores={valores} />
        <fieldset disabled={somenteLeitura} className="min-w-0">
          <ChecklistNotes />
        </fieldset>
        <ChecklistPreview formulario={formulario} valores={valores} tarefa={tarefa} registro={registro} />
      </StepperContent>

      {/* Barra fixa: progresso e próxima ação sempre visíveis no tablet (UI Audit, prioridade 1). */}
      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="hidden min-w-0 flex-1 flex-col gap-1.5 sm:flex">
          <span className="truncate text-muted-foreground text-xs tabular-nums">
            {resumo.respondidos} de {resumo.total} respondidos
            {resumo.naoConformes > 0 && ` · ${resumo.naoConformes} não conforme${resumo.naoConformes > 1 ? "s" : ""}`}
          </span>
          <Progress value={(resumo.respondidos / resumo.total) * 100} className="h-1.5 max-w-60" />
        </div>
        {!somenteLeitura && etapa !== ETAPA_REVISAR && (
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            onClick={marcarRestantesConformes}
            disabled={restantes.length === 0}
          >
            <CheckCheck data-icon="inline-start" />
            <span className="hidden sm:inline">Restantes</span> conformes
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* Navegação própria: o StepperNext/Prev do registry só habilita depois de um segundo render. */}
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={indice <= 0}
            onClick={() => onEtapaChange(valoresEtapas[indice - 1] ?? etapa)}
          >
            <ArrowLeft data-icon="inline-start" />
            Voltar
          </Button>
          {etapa === ETAPA_REVISAR ? (
            !somenteLeitura && (
              <Button type="submit" className={cn("h-11 px-5", PRESSAO)}>
                <Send data-icon="inline-start" />
                Registrar
              </Button>
            )
          ) : (
            <Button
              type="button"
              className={cn("h-11 px-5", PRESSAO)}
              onClick={() => {
                if (onValidate(etapa, "next") === true) onEtapaChange(valoresEtapas[indice + 1] ?? etapa);
              }}
            >
              Próximo
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </Stepper>
  );
}

function ResumoDaRevisao({ formulario, valores }: { formulario: Formulario; valores: ChecklistFormValues }) {
  const respostas = valores.respostas ?? {};
  const resumo = resumirRespostas(formulario, respostas);
  const ncs = formulario.itens.filter((item) => situacaoItem(item, respostas[item.id]) === "NC");

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="font-medium tracking-tight">Resumo</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { rotulo: "Conformes", valor: resumo.conformes },
          { rotulo: "Não conformes", valor: resumo.naoConformes },
          { rotulo: "Não se aplica", valor: resumo.naoAplicaveis },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl tabular-nums tracking-tight">{c.valor}</div>
            <div className="text-muted-foreground text-xs">{c.rotulo}</div>
          </div>
        ))}
      </div>
      {ncs.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {ncs.map((item) => (
            <li key={item.id} className="text-destructive">
              {item.texto}
              {respostas[item.id]?.justificativa && (
                <span className="text-muted-foreground"> · {respostas[item.id]?.justificativa}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {resumo.respondidos < resumo.total && (
        <p className="text-muted-foreground text-sm">
          Faltam {resumo.total - resumo.respondidos} itens. Volte às etapas anteriores para completar.
        </p>
      )}
    </section>
  );
}
