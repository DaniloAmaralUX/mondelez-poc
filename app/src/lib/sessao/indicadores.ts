import { localRepository } from "@/data/repository";
import { gerarAlertasDeIndicadores } from "@/domain/alertas-indicadores";
import { falhasDoTurno } from "@/domain/falhas";
import { dataLocal, type HoraDoTurno, metaHora, semanaDe, serieDoTurno, skuDoDia } from "@/domain/producao";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type {
  AcaoAlerta,
  Alerta,
  ApontamentoHora,
  ApontamentoPerdas,
  EventoFalha,
  PedidoAjuda,
  PlanoProducao,
  Turno,
} from "@/domain/types";

/** Mapas da v0.5 que entram nos indicadores e nos alertas de indicador. */
export interface DadosIndicadores {
  apontamentosHora: Readonly<Record<string, ApontamentoHora>>;
  apontamentosPerdas: Readonly<Record<string, ApontamentoPerdas>>;
  falhas: Readonly<Record<string, EventoFalha>>;
  pedidosAjuda: Readonly<Record<string, PedidoAjuda>>;
  planos: Readonly<Record<string, PlanoProducao>>;
}

/** Plano vigente da semana de `data`: o importado, ou o de exemplo do seed. */
export function planoVigente(planos: Readonly<Record<string, PlanoProducao>>, data: Date): PlanoProducao {
  const semana = semanaDe(data);
  return planos[semana] ?? localRepository.planoSeed(semana);
}

/** Meta da hora e SKU do dia de uma linha, a partir do plano vigente (RN-05). */
export function metaDaLinha(planos: Readonly<Record<string, PlanoProducao>>, linhaId: string, turno: Turno) {
  const plano = planoVigente(planos, turno.data);
  const data = dataLocal(turno.data);
  const skuId = skuDoDia(plano.itens, linhaId, data) ?? localRepository.skus(linhaId)[0]?.id ?? "";
  return { metaHoraTon: metaHora(plano.itens, linhaId, data), skuId, plano };
}

/** Série do Hora x Hora de um posto no turno de `agora`. */
export function serieDoPosto(
  postoId: string,
  agora: Date,
  dados: Pick<DadosIndicadores, "apontamentosHora" | "planos">,
  turno: Turno = turnoAtual(agora),
): HoraDoTurno[] {
  const posto = localRepository.posto(postoId);
  if (!posto) return [];
  const chave = chaveTurno(turno);
  const { metaHoraTon, skuId } = metaDaLinha(dados.planos, posto.linhaId, turno);
  const apontamentos = Object.values(dados.apontamentosHora).filter(
    (a) => a.postoId === postoId && a.turnoChave === chave,
  );
  return serieDoTurno({
    turno,
    agora,
    apontamentos,
    skus: localRepository.skusPorId(),
    metaHoraTon,
    skuPadraoId: skuId,
  });
}

/** Alertas de indicador, falha repetida, perdas e pedidos de ajuda dos postos de uma linha no turno de `agora`. */
export function alertasDeIndicadoresDaLinha(
  linhaId: string,
  agora: Date,
  dados: DadosIndicadores,
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>,
): Alerta[] {
  const turno = turnoAtual(agora);
  const turnoChave = chaveTurno(turno);
  const tipos = localRepository.tiposFalha();
  const falhas = Object.values(dados.falhas);
  const perdas = Object.values(dados.apontamentosPerdas);
  const pedidos = Object.values(dados.pedidosAjuda);
  const emAte = (iso: string) => new Date(iso) <= agora;

  return localRepository.postos(linhaId).flatMap((posto) =>
    gerarAlertasDeIndicadores({
      postoId: posto.id,
      turno,
      turnoChave,
      agora,
      serie: serieDoPosto(posto.id, agora, dados, turno),
      falhas: falhasDoTurno(falhas, turnoChave, posto.id).filter((f) => emAte(f.inicio)),
      tipos,
      perdas: perdas.filter((p) => p.postoId === posto.id && p.turnoChave === turnoChave && emAte(p.em)),
      pedidos: pedidos.filter(
        (p) => p.postoId === posto.id && emAte(p.em) && chaveTurno(turnoAtual(new Date(p.em))) === turnoChave,
      ),
      tratamentos,
    }),
  );
}
