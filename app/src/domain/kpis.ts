// Consolidação dos indicadores de um posto no turno (RM-12, RM-13). Puro.

import { corteDoTurno, indicadoresDeFalha, maiorParada } from "./falhas";
import { type HoraDoTurno, resumoDaSerie } from "./producao";
import { concluida } from "./routine-engine";
import type {
  Alerta,
  ApontamentoPerdas,
  EventoFalha,
  KpisTurno,
  PedidoAjuda,
  Registro,
  TarefaInstancia,
  TipoFalha,
  Turno,
} from "./types";

export interface KpisInput {
  turno: Turno;
  agora: Date;
  serie: readonly HoraDoTurno[];
  falhas: readonly EventoFalha[];
  tipos: readonly TipoFalha[];
  /** Registros do posto no turno. */
  registros: readonly Registro[];
  /** Alertas do posto no turno. */
  alertas: readonly Alerta[];
  pedidos: readonly PedidoAjuda[];
  /** Tarefas da operação do posto no turno. */
  tarefas: readonly TarefaInstancia[];
  perdas: readonly ApontamentoPerdas[];
}

export function kpisDoTurno(input: KpisInput): KpisTurno {
  const resumo = resumoDaSerie(input.serie);
  const indicadores = indicadoresDeFalha(input.falhas, input.turno, input.agora);
  const corte = corteDoTurno(input.turno, input.agora);
  const sobrepesos = input.perdas.map((p) => p.sobrepesoG);
  return {
    toneladas: resumo.toneladas,
    metaToneladas: resumo.metaAcumulada,
    metaTurno: resumo.metaTurno,
    ge: resumo.ge,
    mtbfMin: indicadores.mtbfMin,
    falhas: indicadores.falhas,
    minutosParados: indicadores.minutosParados,
    maiorParada: maiorParada(input.falhas, input.tipos, corte),
    naoConformes: input.registros.reduce((s, r) => s + r.naoConformes, 0),
    alertasAbertos: input.alertas.filter((a) => a.estado !== "resolvido").length,
    alertasTratados: input.alertas.filter((a) => a.estado === "resolvido").length,
    pedidosAjuda: input.pedidos.length,
    tarefasFeitas: input.tarefas.filter(concluida).length,
    tarefasTotal: input.tarefas.length,
    tarefasAtrasadas: input.tarefas.filter((t) => t.estado === "atrasada").length,
    refugoKg: input.perdas.reduce((s, p) => s + p.refugoKg, 0),
    sobrepesoMedioG: sobrepesos.length > 0 ? sobrepesos.reduce((s, v) => s + v, 0) / sobrepesos.length : null,
  };
}

/** Turno 100 %: todas as tarefas obrigatórias que já fecharam foram feitas no prazo e sem NC. */
export function turnoCem(
  tarefas: readonly TarefaInstancia[],
  agora: Date,
): { cem: boolean; feitasNoPrazo: number; devidas: number } {
  const devidas = tarefas.filter((t) => t.prazo <= agora || concluida(t));
  const noPrazo = devidas.filter(
    (t) => t.estado === "feita" && t.concluidaEm !== undefined && t.concluidaEm <= t.prazo,
  );
  return {
    cem: devidas.length > 0 && noPrazo.length === devidas.length,
    feitasNoPrazo: noPrazo.length,
    devidas: devidas.length,
  };
}
