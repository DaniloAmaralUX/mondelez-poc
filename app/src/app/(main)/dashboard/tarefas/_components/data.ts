import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, OctagonAlert, Timer } from "lucide-react";

import { localRepository } from "@/data/repository";
import type { TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { hrefDaTarefa } from "@/lib/rotas";

/** Linha da tabela: uma tarefa do posto no turno, no formato da tela Tasks do template. */
export type Task = {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
  href: string;
  janela: string;
  futura: boolean;
  /**
   * Tem tela para abrir: já abriu e tem checklist ou rota própria. As tarefas do operador sem formulário (ex.: "Hora x
   * Hora · apontar caixas") são feitas na Minha Rotina de quem opera; para a liderança, o fallback de `hrefDaTarefa`
   * levaria à Minha Rotina dela, onde a tarefa não existe.
   */
  abrivel: boolean;
};

export function paraLinha(tarefa: TarefaInstancia): Task {
  return {
    id: tarefa.id,
    title: tarefa.titulo,
    status: tarefa.futura ? "mais_tarde" : tarefa.estado,
    label: tarefa.moduloSlug,
    priority: tarefa.criticidade,
    href: hrefDaTarefa(tarefa),
    janela: `${formatarHora(tarefa.abre)}–${formatarHora(tarefa.prazo)}`,
    futura: tarefa.futura,
    abrivel: !tarefa.futura && (tarefa.formularioId !== undefined || tarefa.rota !== undefined),
  };
}

export const labels = localRepository.modulos().map((m) => ({ value: m.slug, label: m.nome }));

export const statuses = [
  { value: "mais_tarde", label: "Mais tarde", icon: Circle },
  { value: "a_fazer", label: "A fazer", icon: Circle },
  { value: "em_andamento", label: "Em andamento", icon: Timer },
  { value: "atrasada", label: "Atrasada", icon: AlertTriangle },
  { value: "com_nc", label: "Com NC", icon: OctagonAlert },
  { value: "feita", label: "Feita", icon: CheckCircle },
];

export const priorities = [
  { label: "Normal", value: "normal", icon: ArrowDown },
  { label: "Alta", value: "alta", icon: ArrowRight },
  { label: "Crítica", value: "critica", icon: ArrowUp },
];
