import type { AcaoAlerta } from "@/domain/types";

/**
 * Desfazer uma ação num alerta (ex.: "Assumir" por engano). Só a última ação do histórico sai, e só se for da pessoa:
 * depois que outra pessoa agiu no alerta, o desfazer não reescreve o que ela já viu. Com `em`, só a ação com esse
 * instante (a do aviso que a pessoa tocou), para um "Desfazer" antigo não apagar uma ação mais nova dela.
 * Devolve o mesmo mapa quando não há o que desfazer; sem ações restantes, a chave do alerta sai.
 */
export function removerUltimaAcao(
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>,
  alertaId: string,
  usuarioId: string,
  em?: string,
): Readonly<Record<string, AcaoAlerta[]>> {
  const acoes = tratamentos[alertaId] ?? [];
  const ultima = acoes.at(-1);
  if (!ultima || ultima.usuarioId !== usuarioId || (em !== undefined && ultima.em !== em)) return tratamentos;

  const restantes = acoes.slice(0, -1);
  const proximo = { ...tratamentos };
  if (restantes.length > 0) proximo[alertaId] = restantes;
  else delete proximo[alertaId];
  return proximo;
}
