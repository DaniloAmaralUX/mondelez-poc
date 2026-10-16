import type { AcaoAlerta } from "@/domain/types";

/**
 * Desfazer a última ação da pessoa num alerta (ex.: "Assumir" por engano). Ações de outras pessoas ficam.
 * Devolve o mesmo mapa quando não há ação dela; sem ações restantes, a chave do alerta sai.
 */
export function removerUltimaAcao(
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>,
  alertaId: string,
  usuarioId: string,
): Readonly<Record<string, AcaoAlerta[]>> {
  const acoes = tratamentos[alertaId] ?? [];
  let indice = -1;
  for (let i = acoes.length - 1; i >= 0; i--) {
    if (acoes[i]?.usuarioId === usuarioId) {
      indice = i;
      break;
    }
  }
  if (indice < 0) return tratamentos;

  const restantes = acoes.filter((_, i) => i !== indice);
  const proximo = { ...tratamentos };
  if (restantes.length > 0) proximo[alertaId] = restantes;
  else delete proximo[alertaId];
  return proximo;
}
