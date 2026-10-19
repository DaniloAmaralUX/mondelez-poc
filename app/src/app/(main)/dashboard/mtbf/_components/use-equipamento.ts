"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import type { Equipamento, EventoFalha } from "@/domain/types";

/** Parâmetro da URL com o equipamento da tela: o pedido de ajuda da sidebar lê o mesmo valor como contexto. */
export const PARAMETRO_EQUIPAMENTO = "equipamento";

/**
 * Equipamento escolhido no MTBF. Fica em `?equipamento=` (com `history.replaceState`, como a seleção de Alertas): não
 * passa pelo servidor, recarregar volta ao mesmo equipamento e o pedido de ajuda sabe de qual máquina se fala. Sem
 * escolha, abre no equipamento com falha em curso (a máquina parada é a que a pessoa veio apontar), senão no primeiro.
 */
export function useEquipamentoDaTela(opcoes: readonly Equipamento[], falhas: readonly EventoFalha[]) {
  const daUrl = useSearchParams().get(PARAMETRO_EQUIPAMENTO);
  const [escolhido, setEscolhido] = React.useState(daUrl);

  const parado = falhas.find((f) => !f.fim && opcoes.some((e) => e.id === f.equipamentoId))?.equipamentoId;
  const atual = opcoes.find((e) => e.id === escolhido) ?? opcoes.find((e) => e.id === parado) ?? opcoes[0];

  React.useEffect(() => {
    if (!atual) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(PARAMETRO_EQUIPAMENTO) === atual.id) return;
    params.set(PARAMETRO_EQUIPAMENTO, atual.id);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [atual]);

  return [atual, setEscolhido] as const;
}
