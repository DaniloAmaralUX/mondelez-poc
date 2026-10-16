"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { CircleCheck, Info, Save, Send, TriangleAlert } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { localRepository } from "@/data/repository";
import { validarRespostas } from "@/domain/formulario-engine";
import type { Formulario, Registro, TarefaInstancia } from "@/domain/types";
import { useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { ChecklistForm } from "./checklist-form";
import { ChecklistPreview } from "./checklist-preview";
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
  else if (tarefa && !tarefa.futura && usuario?.perfil === "operacao") modo = "preencher";

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
  const salvarRascunho = useSessionStore((s) => s.salvarRascunho);
  const registrarChecklist = useSessionStore((s) => s.registrarChecklist);
  const rascunho = useSessionStore((s) => (tarefa ? s.rascunhos[tarefa.id] : undefined));
  const [tentouEnviar, setTentouEnviar] = React.useState(false);

  const form = useForm<ChecklistFormValues>({
    defaultValues: registro
      ? { respostas: registro.respostas, equipamentoId: registro.equipamentoId, observacao: registro.observacao ?? "" }
      : (rascunho ?? { ...RASCUNHO_VAZIO, equipamentoId: tarefa?.equipamentoId }),
  });
  const valores = useWatch({ control: form.control }) as ChecklistFormValues;
  const erros = tentouEnviar ? validarRespostas(formulario, valores.respostas ?? {}) : {};

  // Cada resposta fica salva no tablet (RF-07): nada se perde se a pessoa sair da tela.
  React.useEffect(() => {
    if (modo !== "preencher" || !tarefa) return;
    const { unsubscribe } = form.watch((values) => salvarRascunho(tarefa.id, values as ChecklistFormValues));
    return unsubscribe;
  }, [form, modo, tarefa, salvarRascunho]);

  function enviar(values: ChecklistFormValues) {
    if (modo !== "preencher" || !tarefa) return;
    setTentouEnviar(true);

    const errosAtuais = validarRespostas(formulario, values.respostas);
    const pendentes = Object.keys(errosAtuais);
    if (pendentes.length > 0) {
      toast.error(pendentes.length === 1 ? "Falta 1 item" : `Faltam ${pendentes.length} itens`, {
        description: "Confira os itens marcados antes de registrar.",
      });
      document.getElementById(`item-${pendentes[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const novo = registrarChecklist({ tarefa, formulario, rascunho: values });
    if (!novo) return;

    if (novo.naoConformes > 0) {
      toast.warning(`Registrado com ${novo.naoConformes} ${novo.naoConformes === 1 ? "não conformidade" : "não conformidades"}`, {
        description: "Alerta enviado à supervisão e à especialista.",
      });
    } else {
      toast.success("Checklist registrado", { description: formulario.titulo });
    }
    router.push("/dashboard/rotina");
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-medium text-3xl leading-none tracking-tight">{formulario.titulo}</h1>
            <p className="text-muted-foreground text-sm">
              Responda cada item. Item não conforme pede justificativa e abre alerta para a supervisão.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={modo !== "preencher"}
              onClick={() => {
                if (!tarefa) return;
                salvarRascunho(tarefa.id, form.getValues());
                toast("Rascunho salvo no tablet", { description: "Continue de onde parou quando voltar." });
              }}
            >
              <Save data-icon="inline-start" />
              Salvar rascunho
            </Button>
            <Button type="submit" form="checklist-form" disabled={modo !== "preencher"}>
              <Send data-icon="inline-start" />
              Registrar checklist
            </Button>
          </div>
        </div>

        <AvisoDoModo modo={modo} tarefa={tarefa} registro={registro} perfilOperacao={usuario?.perfil === "operacao"} />

        <form
          id="checklist-form"
          className="grid gap-5 xl:grid-cols-2"
          noValidate
          onSubmit={form.handleSubmit(enviar)}
        >
          <ChecklistForm formulario={formulario} tarefa={tarefa} erros={erros} somenteLeitura={modo !== "preencher"} />
          <ChecklistPreview formulario={formulario} valores={valores} tarefa={tarefa} registro={registro} />
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
          {registro.naoConformes > 0 && ` · ${registro.naoConformes} não conforme${registro.naoConformes > 1 ? "s" : ""}`}
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
    if (tarefa?.futura) texto = `A janela deste checklist abre às ${formatarHora(tarefa.abre)}.`;
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
