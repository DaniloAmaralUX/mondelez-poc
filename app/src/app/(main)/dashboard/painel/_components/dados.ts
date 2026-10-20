import type { TurnoHistorico } from "@/data/historico";
import { localRepository } from "@/data/repository";
import type { KpisTurno } from "@/domain/types";
import type { LinhaNoRelatorio } from "@/hooks/use-producao";

import { rotuloDoTurno } from "../../relatorio-turno/_components/indicadores";

/**
 * Cor de cada linha (identidade, ordem fixa, nunca pela posição no ranking). Validada com um verificador de cores para gráficos
 * no fundo claro: o `--chart-3` do tema (lilás claro) reprovou em luminosidade e croma e foi trocado pelo sky-600 do
 * Tailwind. O par âmbar/verde fica na faixa 6–8 de ΔE para protanopia, legal com o rótulo direto no fim de cada linha e a
 * tabela embaixo.
 */
export const COR_DA_LINHA: Record<string, { cor: string; amostra: string }> = {
  "bis-1": { cor: "var(--color-sky-600)", amostra: "bg-sky-600 dark:bg-sky-400" },
  "bis-2": { cor: "var(--chart-1)", amostra: "bg-(--chart-1)" },
  "bis-3": { cor: "var(--chart-5)", amostra: "bg-(--chart-5)" },
  "bis-4": { cor: "var(--chart-4)", amostra: "bg-(--chart-4)" },
};

export interface ColunaDeTurno {
  chave: string;
  rotulo: string;
  /** O turno em curso (parcial; a Bis 2 com os dados do tablet). */
  atual: boolean;
  porLinha: Record<string, KpisTurno | undefined>;
}

/** Turnos do mais antigo ao atual, cada um com os indicadores das quatro linhas. */
export function colunasDeTurno(
  historico: readonly TurnoHistorico[],
  relatorio: readonly LinhaNoRelatorio[],
  turnoChave: string,
): ColunaDeTurno[] {
  const chaves = [...new Set(historico.map((h) => h.turnoChave))].reverse();
  const passadas = chaves.map((chave) => ({
    chave,
    rotulo: rotuloDoTurno(chave),
    atual: false,
    porLinha: Object.fromEntries(historico.filter((h) => h.turnoChave === chave).map((h) => [h.linhaId, h.kpis])),
  }));
  const atual: ColunaDeTurno = {
    chave: turnoChave,
    rotulo: "Agora",
    atual: true,
    porLinha: Object.fromEntries(relatorio.map((r) => [r.linha.id, r.kpis])),
  };
  return [...passadas, atual];
}

/** Tipo de falha que mais parou (minutos somados) nos turnos do histórico, nas quatro linhas. */
export function falhaQueMaisParou(historico: readonly TurnoHistorico[]) {
  const soma: Record<string, { minutos: number; quantidade: number; linhas: Set<string> }> = {};
  for (const h of historico) {
    for (const [tipo, f] of Object.entries(h.falhasPorTipo)) {
      const atual = soma[tipo] ?? { minutos: 0, quantidade: 0, linhas: new Set<string>() };
      atual.minutos += f.minutos;
      atual.quantidade += f.quantidade;
      atual.linhas.add(h.linhaId);
      soma[tipo] = atual;
    }
  }
  const [tipoId, dados] = Object.entries(soma).sort((a, b) => b[1].minutos - a[1].minutos)[0] ?? [];
  if (!tipoId || !dados) return undefined;
  const nome = localRepository.tiposFalha().find((t) => t.id === tipoId)?.nome ?? tipoId;
  return { nome, minutos: dados.minutos, quantidade: dados.quantidade, linhas: dados.linhas.size };
}
