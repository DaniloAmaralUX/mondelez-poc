"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import type { TarefaInstancia } from "@/domain/types";
import { hrefDaTarefa } from "@/lib/rotas";
import { useSessionStore } from "@/stores/session/session-store";

/** Tarefas com formulário abrem a tela de registro; as demais concluem na hora, com "Desfazer". */
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
    toast.success("Tarefa concluída", {
      description: tarefa.titulo,
      action: { label: "Desfazer", onClick: () => desfazerConclusao(tarefa.id) },
    });
  };
}

export function temTela(tarefa: TarefaInstancia) {
  return tarefa.formularioId !== undefined || tarefa.rota !== undefined;
}
