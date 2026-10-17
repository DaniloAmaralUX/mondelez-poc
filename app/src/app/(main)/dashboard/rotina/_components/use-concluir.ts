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
    if (temFormulario(tarefa)) {
      router.push(hrefDaTarefa(tarefa));
      return;
    }
    confirmarTarefa(tarefa.id);
    toast.success("Concluída", {
      description: tarefa.titulo,
      duration: JANELA_DESFAZER_MS,
      action: { label: "Desfazer", onClick: () => desfazerConclusao(tarefa.id) },
    });
  };
}

/** A tarefa se conclui registrando um formulário (checklist): a linha e "Fazer agora" levam ao registro. */
export function temFormulario(tarefa: TarefaInstancia) {
  return tarefa.formularioId !== undefined;
}

const ROTULO_DA_ROTA: Record<string, string> = {
  "/dashboard/alertas": "Abrir alertas",
};

/** Atalho para a tela onde a tarefa é feita, quando ela não tem formulário (ex.: "Abrir alertas"). */
export function rotuloDaRota(tarefa: TarefaInstancia): string | undefined {
  if (temFormulario(tarefa) || !tarefa.rota) return undefined;
  return ROTULO_DA_ROTA[tarefa.rota] ?? "Abrir";
}
