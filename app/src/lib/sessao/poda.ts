import { chaveTurno, DURACAO_TURNO_HORAS, turnoAtual } from "@/domain/turno";
import type { Registro } from "@/domain/types";

/** Chave do turno anterior ao de `agora` (os turnos são contíguos, de 8 h). */
export function chaveDoTurnoAnterior(agora: Date): string {
  return chaveTurno(turnoAtual(new Date(agora.getTime() - DURACAO_TURNO_HORAS * 60 * 60 * 1000)));
}

/**
 * Poda do IndexedDB: saem os registros já sincronizados de turnos anteriores ao turno anterior. O turno atual e o
 * anterior ficam (passagem de turno, consulta); nada que ainda não foi enviado sai. Devolve o mesmo objeto quando não
 * há o que podar, para não invalidar quem depende da referência.
 */
export function podarRegistros<T extends Readonly<Record<string, Registro>>>(registros: T, agora: Date): T {
  const limite = chaveDoTurnoAnterior(agora);
  // As chaves "AAAA-MM-DDTn" ordenam como texto na mesma ordem do tempo.
  const velhos = Object.values(registros).filter((r) => r.syncStatus === "sincronizado" && r.turnoChave < limite);
  if (velhos.length === 0) return registros;

  const podados: Record<string, Registro> = { ...registros };
  for (const r of velhos) delete podados[r.id];
  return podados as T;
}
