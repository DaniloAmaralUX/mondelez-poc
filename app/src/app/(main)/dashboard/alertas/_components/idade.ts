import type { Alerta } from "@/domain/types";
import { formatarDuracao } from "@/lib/format";

import { ESCALONAMENTO_ATRASO_MIN } from "@/domain/alert-engine";

/** Fim do ciclo: a última ação de encerramento, ou agora. */
export function fimDoAlerta(alerta: Alerta, agora: Date): Date {
  const encerramento = [...alerta.acoes].reverse().find((a) => a.tipo === "resolver" || a.tipo === "automatica");
  return encerramento ? new Date(encerramento.em) : agora;
}

export function idadeDoAlerta(alerta: Alerta, agora: Date): string {
  return formatarDuracao(fimDoAlerta(alerta, agora).getTime() - alerta.criadoEm.getTime());
}

/** Progresso do anel: quanto do prazo de escalonamento já passou (resolvido = completo). */
export function progressoDoAlerta(alerta: Alerta, agora: Date): number {
  if (alerta.estado === "resolvido") return 100;
  const minutos = (agora.getTime() - alerta.criadoEm.getTime()) / 60000;
  return Math.max(4, Math.min(100, Math.round((minutos / ESCALONAMENTO_ATRASO_MIN) * 100)));
}
