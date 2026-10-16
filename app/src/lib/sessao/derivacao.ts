import { localRepository } from "@/data/repository";
import { gerarAlertas } from "@/domain/alert-engine";
import { gerarTarefas } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import type { AcaoAlerta, Alerta, Conclusao, Perfil, Registro, TarefaInstancia } from "@/domain/types";

type Conclusoes = Readonly<Record<string, Conclusao>>;
type Registros = Readonly<Record<string, Registro>>;
type Tratamentos = Readonly<Record<string, AcaoAlerta[]>>;

interface EntradaTarefas {
  agora: number;
  conclusoes: Conclusoes;
  tarefas: TarefaInstancia[];
}

interface EntradaAlertas {
  linhaId: string;
  agora: number;
  conclusoes: Conclusoes;
  registros: Registros;
  tratamentos: Tratamentos;
  alertas: Alerta[];
}

/** Uma entrada por posto e perfil: Minha Rotina, menu, checklist, Tarefas e Alertas compartilham o mesmo cálculo. */
const tarefasPorPosto = new Map<string, EntradaTarefas>();
let ultimaLinha: EntradaAlertas | undefined;

/**
 * Tarefas do turno de `agora` para um posto e um perfil. Mesmo instante (o snapshot do relógio único muda uma vez por
 * minuto) e mesma referência de `conclusoes` devolvem o mesmo array, sem regerar.
 */
export function tarefasDoTurno(
  postoId: string,
  perfil: Perfil,
  agora: Date,
  conclusoes: Conclusoes,
): TarefaInstancia[] {
  const chave = `${postoId}|${perfil}`;
  const instante = agora.getTime();
  const cache = tarefasPorPosto.get(chave);
  if (cache && cache.agora === instante && cache.conclusoes === conclusoes) return cache.tarefas;

  const tarefas = gerarTarefas({
    templates: localRepository.templates(),
    postoId,
    perfil,
    turno: turnoAtual(agora),
    agora,
    conclusoes,
  });
  tarefasPorPosto.set(chave, { agora: instante, conclusoes, tarefas });
  return tarefas;
}

/** Alertas dos postos de uma linha (RN-01, RN-02), calculados uma vez por tick e por mudança de estado. */
export function alertasDaLinha(
  linhaId: string,
  agora: Date,
  conclusoes: Conclusoes,
  registros: Registros,
  tratamentos: Tratamentos,
): Alerta[] {
  const instante = agora.getTime();
  const c = ultimaLinha;
  if (
    c &&
    c.linhaId === linhaId &&
    c.agora === instante &&
    c.conclusoes === conclusoes &&
    c.registros === registros &&
    c.tratamentos === tratamentos
  ) {
    return c.alertas;
  }

  const tarefas = localRepository
    .postos(linhaId)
    .flatMap((posto) =>
      tarefasDoTurno(posto.id, "operacao", agora, conclusoes).map((tarefa) => ({ postoId: posto.id, tarefa })),
    );
  const alertas = gerarAlertas({
    tarefas,
    registros: Object.values(registros),
    formularios: localRepository.formulariosPorId(),
    tratamentos,
    agora,
  });
  ultimaLinha = { linhaId, agora: instante, conclusoes, registros, tratamentos, alertas };
  return alertas;
}
