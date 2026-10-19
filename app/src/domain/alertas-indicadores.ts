// Alertas de indicador, falha repetida, perdas e pedido de ajuda (RN-07, RN-08, RF-14, RM-03). Puro.

import { compararAlertas, envio, montar } from "./alert-engine";
import { duracaoMin, falhasNaHora, falhasRepetidas, LIMITE_REPETICAO } from "./falhas";
import type { HoraDoTurno } from "./producao";
import type {
  AcaoAlerta,
  Alerta,
  ApontamentoPerdas,
  EventoFalha,
  MotivoAjuda,
  PedidoAjuda,
  TipoFalha,
  Turno,
} from "./types";

const MIN_MS = 60_000;

/** A-GE: GE acumulado abaixo de 70 % depois de 3 h de turno (RN-07). */
export const LIMITE_GE = 0.7;
export const HORAS_ANTES_DO_ALERTA_GE = 3;
/** A-META: acumulado abaixo da meta acumulada menos 1,3 t (RN-07, configurável). */
export const TOLERANCIA_META_TON = 1.3;
/** A-PERDA: refugo da hora e sobrepeso médio acima destes limites (RM-03). */
export const LIMITE_REFUGO_KG = 20;
export const LIMITE_SOBREPESO_G = 2.5;
/** Duração do bloco de apontamento de perdas (RM-03): 2 h. */
export const BLOCO_DE_PERDAS_MS = 2 * 60 * 60 * 1000;

export const MOTIVO_AJUDA: Record<MotivoAjuda, string> = {
  manutencao: "Manutenção",
  qualidade: "Qualidade",
  material: "Material",
  seguranca: "Segurança",
  processo: "Processo",
  outro: "Outro",
};

export interface AlertasIndicadoresInput {
  postoId: string;
  turno: Turno;
  turnoChave: string;
  agora: Date;
  /** Série do Hora x Hora do posto no turno (`serieDoTurno`). */
  serie: readonly HoraDoTurno[];
  /** Falhas do posto no turno. */
  falhas: readonly EventoFalha[];
  tipos: readonly TipoFalha[];
  perdas: readonly ApontamentoPerdas[];
  /** Pedidos de ajuda do posto no turno. */
  pedidos: readonly PedidoAjuda[];
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>;
}

const fmtHora = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const fmtTon = (t: number) => `${t.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`;
const fmtPct = (v: number) => `${Math.round(v * 100)} %`;

/** Quando uma hora "aconteceu" para o alerta: o apontamento, ou o fim da janela de apontar (hora pendente). */
function momentoDaHora(h: HoraDoTurno): Date {
  if (h.apontamento) return new Date(h.apontamento.em);
  return new Date(new Date(h.bloco).getTime() + 70 * MIN_MS);
}

/**
 * Alerta de indicador que dispara na primeira hora em que a condição vale e fecha sozinho (RN-08) na primeira hora
 * seguinte em que ela deixa de valer, com nota automática. Um alerta por regra, posto e turno.
 */
function alertaDeCondicao(
  input: AlertasIndicadoresInput,
  cfg: {
    id: string;
    regra: "A-GE" | "A-META";
    vale: (h: HoraDoTurno) => boolean;
    titulo: (h: HoraDoTurno) => string;
    descricao: string;
    contexto: (h: HoraDoTurno) => string[];
    recuperou: (h: HoraDoTurno) => string;
  },
): Alerta | undefined {
  const contadas = input.serie.filter(
    (h) => (h.estado === "apontada" || h.estado === "pendente") && momentoDaHora(h) <= input.agora,
  );
  const disparo = contadas.find(cfg.vale);
  if (!disparo) return undefined;
  const criadoEm = momentoDaHora(disparo);
  const depois = contadas.filter((h) => momentoDaHora(h) > criadoEm);
  const recuperacao = depois.find((h) => !cfg.vale(h));
  const acoes: AcaoAlerta[] = [envio(criadoEm), ...(input.tratamentos[cfg.id] ?? [])];
  if (recuperacao) {
    acoes.push({ tipo: "automatica", texto: cfg.recuperou(recuperacao), em: momentoDaHora(recuperacao).toISOString() });
  }
  return montar({
    id: cfg.id,
    regra: cfg.regra,
    criticidade: "critico",
    titulo: cfg.titulo(disparo),
    descricao: cfg.descricao,
    postoId: input.postoId,
    moduloSlug: "hora-x-hora",
    criadoEm,
    contexto: cfg.contexto(disparo),
    acoes,
    itensNaoConformes: [],
  });
}

function contextoDeFalhas(input: AlertasIndicadoresInput, h: HoraDoTurno): string[] {
  const corte = input.agora;
  const falhas = falhasNaHora(input.falhas, h.bloco).map((f) => {
    const nome = input.tipos.find((t) => t.id === f.tipoId)?.nome ?? f.tipoId;
    return `${fmtHora(new Date(f.inicio))} ${nome} (${Math.round(duracaoMin(f, corte))} min parado)`;
  });
  return falhas.length > 0
    ? [`Falhas da hora das ${h.rotulo}:`, ...falhas]
    : [`Sem falhas apontadas na hora das ${h.rotulo}.`];
}

export function gerarAlertasDeIndicadores(input: AlertasIndicadoresInput): Alerta[] {
  const alertas: Alerta[] = [];
  const { postoId, turnoChave, turno } = input;
  const inicioAlertaGe = turno.inicio.getTime() + HORAS_ANTES_DO_ALERTA_GE * 60 * MIN_MS;

  const alertaGe = alertaDeCondicao(input, {
    id: `ge:${postoId}:${turnoChave}`,
    regra: "A-GE",
    vale: (h) =>
      new Date(h.bloco).getTime() + 60 * MIN_MS >= inicioAlertaGe &&
      h.geAcumulado !== null &&
      h.geAcumulado < LIMITE_GE,
    titulo: (h) => `GE acumulado em ${fmtPct(h.geAcumulado ?? 0)}, abaixo de ${fmtPct(LIMITE_GE)}`,
    descricao: "Eficiência global do turno abaixo do limite depois de 3 horas.",
    contexto: (h) => [`GE acumulado até as ${h.rotulo}: ${fmtPct(h.geAcumulado ?? 0)}.`, ...contextoDeFalhas(input, h)],
    recuperou: (h) => `GE acumulado voltou a ${fmtPct(h.geAcumulado ?? 0)}. Alerta encerrado automaticamente.`,
  });
  if (alertaGe) alertas.push(alertaGe);

  const alertaMeta = alertaDeCondicao(input, {
    id: `meta:${postoId}:${turnoChave}`,
    regra: "A-META",
    vale: (h) => h.metaAcumulada - h.toneladasAcumuladas > TOLERANCIA_META_TON,
    titulo: (h) => `Produção ${fmtTon(h.metaAcumulada - h.toneladasAcumuladas)} abaixo da meta`,
    descricao: "Produção acumulada abaixo da meta acumulada além da tolerância.",
    contexto: (h) => [
      `Até as ${h.rotulo}: ${fmtTon(h.toneladasAcumuladas)} de ${fmtTon(h.metaAcumulada)} planejadas.`,
      ...contextoDeFalhas(input, h),
    ],
    recuperou: () => "Produção acumulada voltou para dentro da tolerância. Alerta encerrado automaticamente.",
  });
  if (alertaMeta) alertas.push(alertaMeta);

  for (const rep of falhasRepetidas(input.falhas)) {
    const tipo = input.tipos.find((t) => t.id === rep.tipoId);
    const id = `repet:${postoId}:${turnoChave}:${rep.tipoId}`;
    const criadoEm = new Date(rep.atingidoEm);
    const vezes = input.falhas
      .filter((f) => f.tipoId === rep.tipoId)
      .map((f) => `${fmtHora(new Date(f.inicio))} · ${Math.round(duracaoMin(f, input.agora))} min`);
    alertas.push(
      montar({
        id,
        regra: "A-REPET",
        criticidade: tipo?.critica ? "critico" : "atencao",
        titulo: `${tipo?.nome ?? rep.tipoId} se repetiu ${rep.vezes} vezes no turno`,
        descricao: `${LIMITE_REPETICAO} ou mais falhas do mesmo tipo no turno: escalar para manutenção ou especialista.`,
        postoId,
        equipamentoId: input.falhas.find((f) => f.tipoId === rep.tipoId)?.equipamentoId,
        moduloSlug: "mtbf",
        criadoEm,
        contexto: vezes,
        acoes: [envio(criadoEm), ...(input.tratamentos[id] ?? [])],
        itensNaoConformes: [],
      }),
    );
  }

  for (const p of input.perdas) {
    const acimaRefugo = p.refugoKg > LIMITE_REFUGO_KG;
    const acimaSobrepeso = p.sobrepesoG > LIMITE_SOBREPESO_G;
    if (!acimaRefugo && !acimaSobrepeso) continue;
    const id = `perda:${p.id}`;
    const criadoEm = new Date(p.em);
    const partes = [
      acimaRefugo ? `refugo de ${p.refugoKg.toLocaleString("pt-BR")} kg (limite ${LIMITE_REFUGO_KG} kg)` : null,
      acimaSobrepeso
        ? `sobrepeso médio de ${p.sobrepesoG.toLocaleString("pt-BR")} g (limite ${LIMITE_SOBREPESO_G.toLocaleString("pt-BR")} g)`
        : null,
    ].filter(Boolean);
    alertas.push(
      montar({
        id,
        regra: "A-PERDA",
        criticidade: "atencao",
        titulo: `Perdas acima do limite no bloco ${fmtHora(new Date(p.bloco))}–${fmtHora(new Date(new Date(p.bloco).getTime() + BLOCO_DE_PERDAS_MS))}`,
        descricao: `Apontamento com ${partes.join(" e ")}.`,
        postoId,
        moduloSlug: "sobrepeso-refugo",
        tarefaId: p.id,
        criadoEm,
        contexto: [p.motivo ? `Motivo: ${p.motivo}` : "Sem motivo informado.", ...(p.observacao ? [p.observacao] : [])],
        acoes: [envio(criadoEm), ...(input.tratamentos[id] ?? [])],
        itensNaoConformes: [],
      }),
    );
  }

  for (const pedido of input.pedidos) {
    const id = alertaDoPedido(pedido.id);
    const criadoEm = new Date(pedido.em);
    alertas.push(
      montar({
        id,
        regra: "A-AJUDA",
        criticidade: pedido.motivo === "seguranca" ? "critico" : "atencao",
        titulo: `Pedido de ajuda · ${MOTIVO_AJUDA[pedido.motivo]}`,
        descricao: pedido.texto,
        postoId: pedido.postoId,
        equipamentoId: pedido.equipamentoId,
        moduloSlug: "ajuda",
        tarefaId: pedido.tarefaId,
        pedidoAjudaId: pedido.id,
        criadoEm,
        contexto: pedido.origem ? [`Pedido feito na tela ${pedido.origem}.`] : [],
        acoes: [envio(criadoEm), ...(input.tratamentos[id] ?? [])],
        itensNaoConformes: [],
      }),
    );
  }

  return alertas.sort(compararAlertas);
}

export function alertaDoPedido(pedidoId: string): string {
  return `ajuda:${pedidoId}`;
}

export type SituacaoPedido = "enviado" | "visto" | "atendido";

/**
 * Situação do pedido para quem pediu, derivada do tratamento do alerta A-AJUDA: "visto" quando alguém da liderança
 * assume ou registra ação; "atendido" quando resolve. É o "saber que alguém viu" do job do operador.
 */
export function situacaoDoPedido(
  pedido: PedidoAjuda,
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>,
): { situacao: SituacaoPedido; por?: string; em?: string; resposta?: string } {
  const acoes = tratamentos[alertaDoPedido(pedido.id)] ?? [];
  const resolvido = acoes.find((a) => a.tipo === "resolver");
  if (resolvido) return { situacao: "atendido", por: resolvido.usuarioId, em: resolvido.em, resposta: resolvido.texto };
  const visto = acoes.find((a) => a.tipo === "assumir" || a.tipo === "acao");
  if (visto)
    return {
      situacao: "visto",
      por: visto.usuarioId,
      em: visto.em,
      resposta: visto.tipo === "acao" ? visto.texto : undefined,
    };
  return { situacao: "enviado" };
}
