"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { CircleCheck, Clock, Hash, Info, TriangleAlert } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { equipamentos } from "@/data/seed";
import { validarRespostas } from "@/domain/formulario-engine";
import type { Formulario, Registro, TarefaInstancia } from "@/domain/types";
import { useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { ChecklistStepper, ETAPA_REVISAR, etapasDoFormulario } from "./checklist-form";
import { type ChecklistFormValues, RASCUNHO_VAZIO } from "./data";

export type ModoChecklist = "preencher" | "registrado" | "consulta";

export function Checklist({ formularioId }: { formularioId: string }) {
  const formulario = localRepository.formulario(formularioId);
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const tarefas = useTarefas(contexto?.postoId, "operacao");
  const doFormulario = tarefas.filter((t) => t.formularioId === formularioId);
  const tarefa = doFormulario.find((t) => !t.futura) ?? doFormulario[0];
  const registros = useSessionStore((s) => s.registros);
  const registro = tarefa ? Object.values(registros).find((r) => r.tarefaId === tarefa.id) : undefined;

  if (!formulario) return null;

  let modo: ModoChecklist = "consulta";
  if (registro) modo = "registrado";
  // Tarefa já concluída (mesmo sem registro detalhado) não reabre para preencher.
  else if (tarefa && !tarefa.futura && !tarefa.concluidaEm && usuario?.perfil === "operacao") modo = "preencher";

  return (
    <ChecklistEditor
      // Recria o formulário quando a tarefa ou o registro mudam (troca de turno, relógio da demo).
      key={`${tarefa?.id ?? "sem-tarefa"}:${registro?.id ?? "aberto"}`}
      formulario={formulario}
      tarefa={tarefa}
      registro={registro}
      modo={modo}
    />
  );
}

function ChecklistEditor({
  formulario,
  tarefa,
  registro,
  modo,
}: {
  formulario: Formulario;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  modo: ModoChecklist;
}) {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const salvarRascunho = useSessionStore((s) => s.salvarRascunho);
  const registrarChecklist = useSessionStore((s) => s.registrarChecklist);
  const rascunho = useSessionStore((s) => (tarefa ? s.rascunhos[tarefa.id] : undefined));
  const etapas = etapasDoFormulario(formulario);
  const [etapa, setEtapa] = React.useState(modo === "preencher" ? (etapas[0]?.value ?? ETAPA_REVISAR) : ETAPA_REVISAR);
  const doPosto = equipamentos.filter((e) => e.postoId === contexto?.postoId);

  const form = useForm<ChecklistFormValues>({
    defaultValues: registro
      ? { respostas: registro.respostas, equipamentoId: registro.equipamentoId, observacao: registro.observacao ?? "" }
      : (rascunho ?? { ...RASCUNHO_VAZIO, equipamentoId: tarefa?.equipamentoId }),
  });

  // Cada resposta fica salva no tablet (RF-07): nada se perde se a pessoa sair da tela.
  React.useEffect(() => {
    if (modo !== "preencher" || !tarefa) return;
    const { unsubscribe } = form.watch((values) => salvarRascunho(tarefa.id, values as ChecklistFormValues));
    return unsubscribe;
  }, [form, modo, tarefa, salvarRascunho]);

  function enviar(values: ChecklistFormValues) {
    if (modo !== "preencher" || !tarefa) return;

    const pendentes = Object.keys(validarRespostas(formulario, values.respostas));
    if (pendentes.length > 0) {
      // Volta para a primeira etapa com pendência, onde o erro aparece junto do item.
      const primeira = etapas.find((e) => e.itens.some((item) => pendentes.includes(item.id)));
      if (primeira) setEtapa(primeira.value);
      toast.error(pendentes.length === 1 ? "Falta 1 item" : `Faltam ${pendentes.length} itens`, {
        description: "Complete as etapas marcadas antes de registrar.",
      });
      return;
    }

    const novo = registrarChecklist({ tarefa, formulario, rascunho: values });
    if (!novo) return;

    if (novo.naoConformes > 0) {
      toast.warning(
        `Registrado com ${novo.naoConformes} ${novo.naoConformes === 1 ? "não conformidade" : "não conformidades"}`,
        { description: "Alerta enviado à supervisão e à especialista." },
      );
    } else {
      toast.success("Checklist registrado", { description: formulario.titulo });
    }
    router.push("/dashboard/rotina");
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-medium text-3xl leading-none tracking-tight">{formulario.titulo}</h1>
            {modo === "preencher" && (
              <Status variant="success">
                <StatusIndicator className="before:hidden" />
                <StatusLabel>Rascunho salvo no tablet</StatusLabel>
              </Status>
            )}
          </div>
          {/* Metadados numa linha: o primeiro item aparece já na primeira dobra (UI Audit, checklist #4). */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1 font-normal">
              <Hash />
              {formulario.id} · versão {formulario.versao}
            </Badge>
            {tarefa && (
              <Badge variant="outline" className="gap-1 font-normal tabular-nums">
                <Clock />
                {formatarHora(tarefa.abre)}–{formatarHora(tarefa.prazo)}
              </Badge>
            )}
            <Controller
              control={form.control}
              name="equipamentoId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={modo !== "preencher" || doPosto.length === 0}
                >
                  <SelectTrigger size="sm" className="min-w-40" aria-label="Equipamento">
                    <SelectValue placeholder={doPosto.length ? "Equipamento" : "Posto sem equipamentos"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {doPosto.map((equipamento) => (
                        <SelectItem key={equipamento.id} value={equipamento.id}>
                          {equipamento.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <AvisoDoModo modo={modo} tarefa={tarefa} registro={registro} perfilOperacao={usuario?.perfil === "operacao"} />

        <form id="checklist-form" noValidate onSubmit={form.handleSubmit(enviar)}>
          <ChecklistStepper
            formulario={formulario}
            tarefa={tarefa}
            registro={registro}
            somenteLeitura={modo !== "preencher"}
            etapa={etapa}
            onEtapaChange={setEtapa}
          />
        </form>
      </div>
    </FormProvider>
  );
}

function AvisoDoModo({
  modo,
  tarefa,
  registro,
  perfilOperacao,
}: {
  modo: ModoChecklist;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  perfilOperacao: boolean;
}) {
  if (modo === "registrado" && registro) {
    const autor = localRepository.usuario(registro.usuarioId);
    return (
      <Alert>
        {registro.naoConformes > 0 ? <TriangleAlert /> : <CircleCheck />}
        <AlertTitle>
          Registrado às {formatarHora(new Date(registro.criadoEm))} por {autor?.nome}
          {registro.naoConformes > 0 &&
            ` · ${registro.naoConformes} não conforme${registro.naoConformes > 1 ? "s" : ""}`}
        </AlertTitle>
        <AlertDescription>
          {registro.syncStatus === "sincronizado"
            ? "Enviado ao servidor. O registro não pode ser editado; correções geram uma nova versão."
            : "Salvo no tablet. Será enviado assim que houver rede."}
        </AlertDescription>
      </Alert>
    );
  }

  if (modo === "consulta") {
    let texto = "Este checklist não tem tarefa no turno atual deste posto.";
    if (tarefa?.concluidaEm)
      texto = `Tarefa concluída às ${formatarHora(tarefa.concluidaEm)}, antes do registro detalhado.`;
    else if (tarefa?.futura) texto = `A janela deste checklist abre às ${formatarHora(tarefa.abre)}.`;
    else if (tarefa && !perfilOperacao) texto = "Visualização da liderança: o registro é feito pela operação do posto.";
    return (
      <Alert>
        <Info />
        <AlertTitle>Somente consulta</AlertTitle>
        <AlertDescription>{texto}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
