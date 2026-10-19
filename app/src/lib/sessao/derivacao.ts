import { localRepository } from "@/data/repository";
import { compararAlertas, gerarAlertas } from "@/domain/alert-engine";
import { gerarTarefas } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import type { AcaoAlerta, Alerta, Conclusao, Perfil, Registro, TarefaInstancia } from "@/domain/types";

import { alertasDeIndicadoresDaLinha, type DadosIndicadores } from "./indicadores";

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
  dados?: DadosIndicadores;
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

/**
 * Alertas dos postos de uma linha, calculados uma vez por tick e por mudança de estado: atraso e NC (RN-01, RN-02) e,
 * com `dados` (v0.5), os de indicador, falha repetida, perdas e pedido de ajuda (RN-07, RF-14).
 */
export function alertasDaLinha(
  linhaId: string,
  agora: Date,
  conclusoes: Conclusoes,
  registros: Registros,
  tratamentos: Tratamentos,
  dados?: DadosIndicadores,
): Alerta[] {
  const instante = agora.getTime();
  const c = ultimaLinha;
  if (
    c &&
    c.linhaId === linhaId &&
    c.agora === instante &&
    c.conclusoes === conclusoes &&
    c.registros === registros &&
    c.tratamentos === tratamentos &&
    mesmosDados(c.dados, dados)
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
  const todos = dados
    ? [...alertas, ...alertasDeIndicadoresDaLinha(linhaId, agora, dados, tratamentos)].sort(compararAlertas)
    : alertas;
  ultimaLinha = { linhaId, agora: instante, conclusoes, registros, tratamentos, dados, alertas: todos };
  return todos;
}

function mesmosDados(a: DadosIndicadores | undefined, b: DadosIndicadores | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.apontamentosHora === b.apontamentosHora &&
    a.apontamentosPerdas === b.apontamentosPerdas &&
    a.falhas === b.falhas &&
    a.pedidosAjuda === b.pedidosAjuda &&
    a.planos === b.planos
  );
}
