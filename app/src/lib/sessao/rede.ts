export type Rede = "online" | "offline";

/**
 * Rede efetiva do tablet: a do navegador (eventos online/offline + `useOffline` do Next), com o simulador da demo
 * como override. "Simular sem rede" desliga mesmo com Wi-Fi; nunca liga uma rede que não existe.
 */
export function redeEfetiva(navegador: Rede, simularSemRede: boolean): Rede {
  return simularSemRede || navegador === "offline" ? "offline" : "online";
}
