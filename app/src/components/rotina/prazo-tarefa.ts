import type { TarefaInstancia } from "@/domain/types";
import { formatarDuracao, formatarHora } from "@/lib/format";

const UM_MINUTO = 60 * 1000;

/** Linha de tempo da tarefa em linguagem direta: prazo, atraso ou quando foi feita. */
export function descreverPrazo(t: TarefaInstancia, agora: Date): string {
  if (t.concluidaEm) return `Feita às ${formatarHora(t.concluidaEm)}`;
  if (t.futura) return `Das ${formatarHora(t.abre)} às ${formatarHora(t.prazo)}`;

  const venceu = `Venceu às ${formatarHora(t.prazo)}`;
  const ate = `Até ${formatarHora(t.prazo)}`;
  const diferenca = Math.abs(t.prazo.getTime() - agora.getTime());

  if (diferenca < UM_MINUTO) return t.estado === "atrasada" ? `${venceu} · agora` : `${ate} · vence agora`;
  if (t.estado === "atrasada") return `${venceu} · há ${formatarDuracao(diferenca)}`;
  return `${ate} · faltam ${formatarDuracao(diferenca)}`;
}
