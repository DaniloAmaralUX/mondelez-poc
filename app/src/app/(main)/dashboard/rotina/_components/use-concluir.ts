"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import type { TarefaInstancia } from "@/domain/types";
import { hrefDaTarefa } from "@/lib/rotas";
import { JANELA_DESFAZER_MS, useSessionStore } from "@/stores/session/session-store";

/**
 * Tarefas com formulário abrem a tela de registro; as demais concluem na hora, sem confirmação, com "Desfazer" por
 * 10 s (a mesma janela do registro de checklist, docs/12 §2 item 5). No toque o botão do aviso tem 44 px e 16 px de
 * texto pela camada de densidade (src/styles/tablet.css).
 */
export function useConcluirTarefa() {
  const router = useRouter();
  const confirmarTarefa = useSessionStore((s) => s.confirmarTarefa);
  const desfazerConclusao = useSessionStore((s) => s.desfazerConclusao);

  return (tarefa: TarefaInstancia) => {
    if (temTela(tarefa)) {
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

export function temTela(tarefa: TarefaInstancia) {
  return tarefa.formularioId !== undefined || tarefa.rota !== undefined;
}
