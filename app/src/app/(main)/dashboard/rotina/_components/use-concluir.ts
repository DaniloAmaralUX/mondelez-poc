"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import type { TarefaInstancia } from "@/domain/types";
import { hrefDaTarefa } from "@/lib/rotas";
import { JANELA_DESFAZER_MS, useSessionStore } from "@/stores/session/session-store";

/**
 * Tarefas com formulário abrem a tela de registro (o registro é que as conclui); as demais concluem na hora, sem
 * confirmação, com "Desfazer" por 10 s (a mesma janela do registro de checklist, docs/12 §2 item 5). Passado o aviso,
 * quem concluiu ainda desfaz pela linha em "Feitas" (tasks-section.tsx). No toque o botão do aviso tem 44 px e 16 px
 * de texto pela camada de densidade (src/styles/tablet.css).
 *
 * Tarefa com rota e sem formulário ("Revisar alertas abertos"): a rota é só onde o trabalho é feito; nada lá conclui
 * a tarefa. Ela conclui como as demais, e a rota vira um atalho ao lado (`rotuloDaRota`).
 */
export function useConcluirTarefa() {
  const router = useRouter();
  const confirmarTarefa = useSessionStore((s) => s.confirmarTarefa);
  const desfazerConclusao = useSessionStore((s) => s.desfazerConclusao);

  return (tarefa: TarefaInstancia) => {
    if (abreTela(tarefa)) {
      router.push(hrefDaTarefa(tarefa));
      return;
    }
    confirmarTarefa(tarefa.id);
    toast.success("Concluída", {
      description: tarefa.titulo,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          // O store recusa se o tablet bloqueou ou se quem está no posto não é quem concluiu.
          if (!desfazerConclusao(tarefa.id)) {
            toast.info("Não dá para desfazer", { description: "Só quem concluiu desfaz a conclusão." });
          }
        },
      },
    });
  };
}

/** A tarefa se conclui registrando um formulário (checklist): a linha e "Fazer agora" levam ao registro. */
export function temFormulario(tarefa: TarefaInstancia) {
  return tarefa.formularioId !== undefined;
}

/**
 * A tarefa se conclui numa tela (v0.5): o checklist do formulário, ou a tela da rota quando ela mesma grava a conclusão
 * (`concluiNaTela`: apontar a hora, apontar perdas, entregar o turno, enviar o relatório). Essas tarefas não têm
 * "Concluir": a linha e "Fazer agora" levam até a tela.
 */
export function abreTela(tarefa: TarefaInstancia) {
  return temFormulario(tarefa) || Boolean(tarefa.concluiNaTela && tarefa.rota);
}

const ACAO_DA_ROTA: Record<string, string> = {
  "/dashboard/hora-x-hora": "Apontar",
  "/dashboard/sobrepeso": "Apontar",
  "/dashboard/troca-de-turno": "Passar turno",
  "/dashboard/relatorio-turno": "Abrir relatório",
};

/** Rótulo da ação principal de uma tarefa que abre tela ("Registrar", "Apontar", "Passar turno"). */
export function rotuloDaAcao(tarefa: TarefaInstancia): string {
  if (temFormulario(tarefa)) return "Registrar";
  return (tarefa.rota && ACAO_DA_ROTA[tarefa.rota]) || "Abrir";
}

const ROTULO_DA_ROTA: Record<string, string> = {
  "/dashboard/alertas": "Abrir alertas",
  "/dashboard/troca-de-turno": "Abrir passagem",
  "/dashboard/relatorio-turno": "Abrir relatório",
  "/dashboard/plano": "Abrir plano",
  "/dashboard/agenda": "Abrir agenda",
};

/** Atalho para a tela onde a tarefa é feita, quando é ela que se conclui com "Concluir" (ex.: "Abrir alertas"). */
export function rotuloDaRota(tarefa: TarefaInstancia): string | undefined {
  if (abreTela(tarefa) || !tarefa.rota) return undefined;
  return ROTULO_DA_ROTA[tarefa.rota] ?? "Abrir";
}
