import { chaveTurno, montarTurno, turnoAtual } from "@/domain/turno";
import type { KpisTurno, NumeroTurno, Turno } from "@/domain/types";

import { linhas, skus, tiposFalha } from "./seed";

/**
 * Histórico simulado das quatro linhas (v0.5): o protótipo só registra de verdade o turno atual da Bis 2. Para o
 * relatório comparar com o turno anterior, o painel comparar linhas e as tendências terem o que mostrar, os turnos
 * passados (e o turno atual das outras linhas) vêm deste gerador determinístico: a mesma linha e o mesmo turno dão
 * sempre os mesmos números, no servidor e no navegador.
 */

export interface TurnoHistorico {
  linhaId: string;
  turnoChave: string;
  /** AAAA-MM-DD do turno. */
  data: string;
  numero: NumeroTurno;
  kpis: KpisTurno;
  falhasPorTipo: Record<string, { quantidade: number; minutos: number }>;
  /** NC por item de checklist: `formularioId:itemId` → quantidade. */
  ncPorItem: Record<string, number>;
  /** Equipamento com mais falhas no turno. */
  falhasPorEquipamento: Record<string, number>;
  simulado: true;
}

/** Itens de checklist que costumam sair NC, com peso relativo. */
const ITENS_NC: { chave: string; peso: number }[] = [
  { chave: "ppli-l4:mordentes", peso: 5 },
  { chave: "ppli-l4:temp-transversal", peso: 4 },
  { chave: "ppli-l4:bandeja", peso: 2 },
  { chave: "ppli-l4:pressao", peso: 2 },
  { chave: "pre-partida-l4:area", peso: 1 },
  { chave: "rastreabilidade-envoltorio:selagem", peso: 3 },
  { chave: "rastreabilidade-envoltorio:codificacao", peso: 2 },
  { chave: "manutencao-autonoma-l4:vazamento", peso: 1 },
];

/** Peso de cada tipo de falha (enrosco é o campeão, como no mockup). */
const PESO_FALHA: Record<string, number> = {
  enrosco: 6,
  "troca-bobina": 3,
  "ajuste-mordente": 3,
  "ajuste-temperatura": 2,
  "selagem-enrugada": 2,
  "perda-sincronismo": 2,
  "falta-material": 1,
  sensor: 1,
};

/** Desempenho típico de cada linha: a Bis 3 é a que mais sofre (dá alerta de GE na demo). */
const PERFIL_LINHA: Record<string, { ge: number; falhas: number }> = {
  "bis-1": { ge: 0.88, falhas: 4 },
  "bis-2": { ge: 0.86, falhas: 5 },
  "bis-3": { ge: 0.74, falhas: 7 },
  "bis-4": { ge: 0.89, falhas: 4 },
};

const EQUIPAMENTOS_EMBALAGEM = ["loeschpack-2", "loeschpack-4", "loeschpack-5"];

function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: aleatório determinístico a partir da semente. */
function aleatorio(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortearPonderado<T extends string>(rand: () => number, pesos: Record<T, number>): T {
  const total = Object.values<number>(pesos).reduce((s, p) => s + p, 0);
  let r = rand() * total;
  for (const [chave, peso] of Object.entries<number>(pesos)) {
    r -= peso;
    if (r <= 0) return chave as T;
  }
  return Object.keys(pesos)[0] as T;
}

function dataDoTurno(turno: Turno): string {
  const d = turno.data;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Um turno simulado de uma linha. `fracao` (0–1) é quanto do turno já passou: o turno atual das outras linhas sai com
 * os números até agora.
 */
export function turnoSimulado(linhaId: string, turno: Turno, fracao = 1): TurnoHistorico {
  const chave = chaveTurno(turno);
  const rand = aleatorio(semente(`${linhaId}|${chave}`));
  const perfil = PERFIL_LINHA[linhaId] ?? { ge: 0.85, falhas: 5 };
  const sku = skus.find((s) => s.linhaId === linhaId);
  const capacidade = sku?.capacidadeTonHora ?? 3;
  const horas = 8 * fracao;

  const geBase = perfil.ge + (rand() - 0.5) * 0.14 - (turno.numero === 3 ? 0.03 : 0);
  const geTurno = Math.min(0.98, Math.max(0.55, geBase));
  const toneladas = geTurno * capacidade * horas;
  const metaTurno = capacidade * 0.9 * 8;
  const metaToneladas = metaTurno * fracao;

  const nFalhas = Math.max(0, Math.round((perfil.falhas + (rand() - 0.5) * 4) * fracao));
  const falhasPorTipo: TurnoHistorico["falhasPorTipo"] = {};
  const falhasPorEquipamento: Record<string, number> = {};
  let minutosParados = 0;
  for (let i = 0; i < nFalhas; i++) {
    const tipo = sortearPonderado(rand, PESO_FALHA);
    const minutos = Math.round(3 + rand() * 14);
    const atual = falhasPorTipo[tipo] ?? { quantidade: 0, minutos: 0 };
    falhasPorTipo[tipo] = { quantidade: atual.quantidade + 1, minutos: atual.minutos + minutos };
    minutosParados += minutos;
    const equipamento = EQUIPAMENTOS_EMBALAGEM[Math.floor(rand() * EQUIPAMENTOS_EMBALAGEM.length)] ?? "loeschpack-4";
    falhasPorEquipamento[equipamento] = (falhasPorEquipamento[equipamento] ?? 0) + 1;
  }
  const maior = Object.entries(falhasPorTipo).sort((a, b) => b[1].minutos - a[1].minutos)[0];

  const ncPorItem: Record<string, number> = {};
  const nNc = Math.round(rand() * 3 * fracao + (linhaId === "bis-3" ? 1 : 0));
  for (let i = 0; i < nNc; i++) {
    const item = sortearPonderado(rand, Object.fromEntries(ITENS_NC.map((n) => [n.chave, n.peso])));
    ncPorItem[item] = (ncPorItem[item] ?? 0) + 1;
  }

  const minutosOperando = Math.max(0, horas * 60 - minutosParados);
  const tarefasTotal = Math.round(17 * fracao) || 1;
  const atrasadas = Math.round(rand() * 2 * fracao);
  const alertas = nNc + atrasadas + (geTurno < 0.7 ? 1 : 0);

  return {
    linhaId,
    turnoChave: chave,
    data: dataDoTurno(turno),
    numero: turno.numero,
    kpis: {
      toneladas,
      metaToneladas,
      metaTurno,
      ge: horas > 0 ? geTurno : null,
      mtbfMin: nFalhas > 0 ? minutosOperando / nFalhas : null,
      falhas: nFalhas,
      minutosParados,
      maiorParada: maior
        ? {
            tipoId: maior[0],
            nome: tiposFalha.find((t) => t.id === maior[0])?.nome ?? maior[0],
            minutos: maior[1].minutos,
          }
        : undefined,
      naoConformes: nNc,
      alertasAbertos: Math.min(alertas, Math.round(rand() * 2 * fracao)),
      alertasTratados: alertas,
      pedidosAjuda: Math.round(rand() * 2 * fracao),
      tarefasFeitas: tarefasTotal - atrasadas,
      tarefasTotal,
      tarefasAtrasadas: atrasadas,
      refugoKg: Math.round((8 + rand() * 30) * fracao),
      sobrepesoMedioG: 1.2 + rand() * 1.6,
    },
    falhasPorTipo,
    ncPorItem,
    falhasPorEquipamento,
    simulado: true,
  };
}

/** Os `n` turnos anteriores ao turno de `agora` (o mais recente primeiro). */
export function turnosAnteriores(agora: Date, n: number): Turno[] {
  const turnos: Turno[] = [];
  let atual = turnoAtual(agora);
  for (let i = 0; i < n; i++) {
    const antes = new Date(atual.inicio.getTime() - 60_000);
    atual = turnoAtual(antes);
    turnos.push(montarTurno(atual.numero, atual.data));
  }
  return turnos;
}

/** Histórico simulado das quatro linhas nos `n` turnos anteriores ao atual (o mais recente primeiro). */
export function historicoDasLinhas(agora: Date, n = 21): TurnoHistorico[] {
  return turnosAnteriores(agora, n).flatMap((turno) => linhas.map((l) => turnoSimulado(l.id, turno)));
}
