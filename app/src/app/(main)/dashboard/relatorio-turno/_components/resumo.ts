import type { Turno } from "@/domain/types";
import type { LinhaNoRelatorio } from "@/hooks/use-producao";

import {
  aderenciaAMeta,
  compararGe,
  compararMtbf,
  formatarGe,
  formatarMinutos,
  formatarPercentual,
  formatarToneladas,
  rotuloDoTurno,
} from "./indicadores";

/**
 * Texto do relatório que vai para o Teams e o e-mail (sem digitação: RN-11, "relatório gerado sem digitação"). Uma
 * linha "Rótulo: valor" por indicador, que o cartão do Teams mostra como fatos. A observação da supervisão, se houver,
 * entra no fim.
 */
export function resumoDoRelatorio(
  linha: LinhaNoRelatorio,
  outras: readonly LinhaNoRelatorio[],
  turnoChave: string,
  observacao = "",
): string {
  const k = linha.kpis;
  const linhas = [`Linha: ${linha.linha.nome} · turno ${rotuloDoTurno(turnoChave)}`];
  if (k) {
    const ge = compararGe(k.ge, linha.anterior.ge);
    const mtbf = compararMtbf(k.mtbfMin, linha.anterior.mtbfMin);
    const aderencia = aderenciaAMeta(k);
    linhas.push(
      `GE: ${formatarGe(k.ge)}${ge ? ` (${ge.texto} vs turno anterior)` : ""}`,
      `Toneladas: ${formatarToneladas(k.toneladas)} de ${formatarToneladas(k.metaToneladas)}${aderencia !== null ? ` (${formatarPercentual(aderencia)} da meta)` : ""}`,
      `MTBF: ${formatarMinutos(k.mtbfMin)}${mtbf ? ` (${mtbf.texto})` : ""}`,
      `Maior parada: ${k.maiorParada ? `${k.maiorParada.nome} · ${k.maiorParada.minutos} min` : "nenhuma"}`,
      `Alertas: ${k.alertasAbertos} abertos · ${k.alertasTratados} tratados`,
      `Pedidos de ajuda: ${k.pedidosAjuda}`,
      `Tarefas: ${k.tarefasFeitas} de ${k.tarefasTotal} feitas · ${k.tarefasAtrasadas} atrasadas`,
    );
  }
  if (outras.length > 0) {
    linhas.push(
      `Demais linhas: ${outras.map((o) => `${o.linha.nome} ${formatarGe(o.kpis?.ge ?? null)}`).join(" · ")} de GE`,
    );
  }
  const obs = observacao.trim();
  if (obs) linhas.push(`Observação da supervisão: ${obs}`);
  return linhas.join("\n");
}

const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Assunto como o store grava (para a prévia sair igual ao que vai para a caixa de saída). */
export function assuntoDoRelatorio(nomeDaLinha: string, turnoChave: string): string {
  return `Relatório do turno · ${nomeDaLinha} · ${turnoChave.replace("T", " · turno ")}`;
}

export function rotuloCurtoDoTurno(turno: Turno): string {
  return `${turno.numero}º turno de ${DIA_CURTO.format(turno.data)}`;
}
