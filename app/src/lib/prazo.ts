import type { TarefaInstancia } from "@/domain/types";

import { formatarDuracao, formatarHora } from "./format";

const UM_MINUTO = 60 * 1000;

/** Prazo da tarefa em linguagem direta: quando vence, há quanto venceu ou quando foi feita. */
export function descreverPrazo(t: TarefaInstancia, agora: Date): string {
  if (t.concluidaEm) return `Feita às ${formatarHora(t.concluidaEm)}`;
  if (t.futura) return `Abre às ${formatarHora(t.abre)}`;

  const diferenca = Math.abs(t.prazo.getTime() - agora.getTime());
  if (t.estado === "atrasada") {
    return diferenca < UM_MINUTO ? "Venceu agora" : `Venceu há ${formatarDuracao(diferenca)}`;
  }
  return diferenca < UM_MINUTO ? "Vence agora" : `Vence em ${formatarDuracao(diferenca)}`;
}
