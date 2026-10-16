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
    // 8 s para alcançar "Desfazer" com luva; no toque o botão cresce para 44 px pela camada (src/styles/tablet.css).
    toast.success("Tarefa concluída", {
      description: tarefa.titulo,
      duration: 8000,
      action: { label: "Desfazer", onClick: () => desfazerConclusao(tarefa.id) },
    });
  };
}

export function temTela(tarefa: TarefaInstancia) {
  return tarefa.formularioId !== undefined || tarefa.rota !== undefined;
}
