import { localRepository } from "@/data/repository";
import { BLOCO_DE_PERDAS_MS, MOTIVO_AJUDA } from "@/domain/alertas-indicadores";
import { duracaoMin } from "@/domain/falhas";
import { alcanceDoHistorico } from "@/domain/permissoes";
import { toneladas } from "@/domain/producao";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { Perfil, Usuario } from "@/domain/types";
import type { SessionState } from "@/stores/session/session-store";

export type TipoEvento = "checklist" | "hora" | "perdas" | "falha" | "troca" | "ajuda" | "alerta";

export const NOME_DO_TIPO: Record<TipoEvento, string> = {
  checklist: "Checklist",
  hora: "Hora x Hora",
  perdas: "Sobrepeso e refugo",
  falha: "Falha (MTBF)",
  troca: "Troca de turno",
  ajuda: "Pedido de ajuda",
  alerta: "Ação em alerta",
};

/** Uma linha do histórico (RF-09): o registro com o carimbo de rastreabilidade (RF-06). */
export interface EventoHistorico {
  id: string;
  tipo: TipoEvento;
  /** ISO, relógio da demo. */
  em: string;
  turnoChave: string;
  linhaId?: string;
  postoId?: string;
  equipamentoId?: string;
  titulo: string;
  detalhe: string;
  /** Situação curta: NC, abaixo da meta, em curso, aceita… */
  situacao?: string;
  destaque?: "nc" | "alerta";
  usuarioId: string;
  versao?: number;
  href?: string;
}

const linhaDoPosto = (postoId: string | undefined) => (postoId ? localRepository.posto(postoId)?.linhaId : undefined);
const chaveDe = (iso: string) => chaveTurno(turnoAtual(new Date(iso)));
const horaCheia = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const num = (n: number, casas = 1) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

type Dados = Pick<
  SessionState,
  "registros" | "apontamentosHora" | "apontamentosPerdas" | "falhas" | "trocasDeTurno" | "pedidosAjuda" | "tratamentos"
>;

const TITULO_DA_ACAO: Partial<Record<string, string>> = {
  assumir: "Assumiu alerta",
  acao: "Registrou ação",
  resolver: "Resolveu alerta",
};

/** Todos os registros do tablet como eventos do histórico, até `agora`, o mais recente primeiro. */
export function eventosDoTablet(dados: Dados, agora: Date): EventoHistorico[] {
  const eventos: EventoHistorico[] = [];

  for (const r of Object.values(dados.registros)) {
    const form = localRepository.formulario(r.formularioId);
    eventos.push({
      id: r.id,
      tipo: "checklist",
      em: r.criadoEm,
      turnoChave: r.turnoChave,
      linhaId: linhaDoPosto(r.postoId),
      postoId: r.postoId,
      equipamentoId: r.equipamentoId,
      titulo: form?.titulo ?? r.formularioId,
      detalhe: r.naoConformes > 0 ? `${r.naoConformes} não conforme(s)` : "Todos os itens no padrão",
      situacao: r.naoConformes > 0 ? "NC" : "Conforme",
      destaque: r.naoConformes > 0 ? "nc" : undefined,
      usuarioId: r.usuarioId,
      versao: r.versaoFormulario,
      href: `/dashboard/checklist/${r.formularioId}`,
    });
  }

  for (const a of Object.values(dados.apontamentosHora)) {
    const sku = localRepository.sku(a.skuId);
    const hora = new Date(a.bloco).getHours();
    eventos.push({
      id: a.id,
      tipo: "hora",
      em: a.em,
      turnoChave: a.turnoChave,
      linhaId: a.linhaId,
      postoId: a.postoId,
      titulo: `Hora das ${String(hora).padStart(2, "0")}:00`,
      detalhe: `${a.caixas.toLocaleString("pt-BR")} caixas · ${sku ? num(toneladas(a.caixas, sku), 2) : "—"} t${a.motivo ? ` · ${a.motivo}` : ""}`,
      situacao: a.motivo ? "Abaixo da meta" : undefined,
      destaque: a.motivo ? "alerta" : undefined,
      usuarioId: a.usuarioId,
      href: "/dashboard/hora-x-hora",
    });
  }

  for (const p of Object.values(dados.apontamentosPerdas)) {
    eventos.push({
      id: p.id,
      tipo: "perdas",
      em: p.em,
      turnoChave: p.turnoChave,
      linhaId: linhaDoPosto(p.postoId),
      postoId: p.postoId,
      titulo: `Perdas do bloco ${horaCheia(new Date(p.bloco))}–${horaCheia(new Date(new Date(p.bloco).getTime() + BLOCO_DE_PERDAS_MS))}`,
      detalhe: `Sobrepeso ${num(p.sobrepesoG)} g · refugo ${num(p.refugoKg)} kg · reprocesso ${num(p.reprocessoKg)} kg`,
      usuarioId: p.usuarioId,
      href: "/dashboard/sobrepeso",
    });
  }

  for (const f of Object.values(dados.falhas)) {
    const tipo = localRepository.tiposFalha().find((t) => t.id === f.tipoId);
    eventos.push({
      id: f.id,
      tipo: "falha",
      em: f.inicio,
      turnoChave: f.turnoChave,
      linhaId: linhaDoPosto(f.postoId),
      postoId: f.postoId,
      equipamentoId: f.equipamentoId,
      titulo: tipo?.nome ?? f.tipoId,
      detalhe: f.fim ? `${Math.round(duracaoMin(f, agora))} min parado` : "Em curso",
      situacao: f.fim ? undefined : "Em curso",
      usuarioId: f.usuarioId,
      href: "/dashboard/mtbf",
    });
  }

  for (const t of Object.values(dados.trocasDeTurno)) {
    eventos.push({
      id: t.id,
      tipo: "troca",
      em: t.entregueEm,
      turnoChave: t.turnoChave,
      linhaId: linhaDoPosto(t.postoId),
      postoId: t.postoId,
      titulo: "Passagem do posto",
      detalhe: t.aceitePor
        ? `Recebida por ${localRepository.usuario(t.aceitePor)?.nome ?? "—"}`
        : "Aguardando quem recebe",
      situacao: t.aceitePor ? "Recebida" : "Entregue",
      usuarioId: t.entreguePor,
      href: "/dashboard/troca-de-turno",
    });
  }

  for (const p of Object.values(dados.pedidosAjuda)) {
    eventos.push({
      id: p.id,
      tipo: "ajuda",
      em: p.em,
      turnoChave: chaveDe(p.em),
      linhaId: linhaDoPosto(p.postoId),
      postoId: p.postoId,
      equipamentoId: p.equipamentoId,
      titulo: `Pedido de ajuda · ${MOTIVO_AJUDA[p.motivo]}`,
      detalhe: p.texto,
      usuarioId: p.usuarioId,
    });
  }

  for (const [alertaId, acoes] of Object.entries(dados.tratamentos)) {
    for (const acao of acoes) {
      if (!acao.usuarioId) continue;
      eventos.push({
        id: `${alertaId}@${acao.em}`,
        tipo: "alerta",
        em: acao.em,
        turnoChave: chaveDe(acao.em),
        titulo: TITULO_DA_ACAO[acao.tipo] ?? "Alerta",
        detalhe: acao.texto || alertaId,
        usuarioId: acao.usuarioId,
        href: `/dashboard/alertas?alerta=${encodeURIComponent(alertaId)}`,
      });
    }
  }

  return eventos.filter((e) => new Date(e.em) <= agora).sort((a, b) => b.em.localeCompare(a.em));
}

/** Alcance do histórico por perfil (doc 05 §4): próprio, linha, seção ou domínio. */
export function noAlcance(
  eventos: readonly EventoHistorico[],
  usuario: Usuario | undefined,
  linhaId: string | undefined,
) {
  if (!usuario) return [];
  const alcance = alcanceDoHistorico(usuario.perfil as Perfil);
  switch (alcance) {
    case "proprio":
      return eventos.filter((e) => e.usuarioId === usuario.id);
    case "linha":
      return eventos.filter((e) => !e.linhaId || e.linhaId === linhaId);
    case "dominio":
      return eventos.filter((e) => e.tipo === "checklist" || e.tipo === "falha" || e.tipo === "alerta");
    case "secao":
      return [...eventos];
    default:
      return [];
  }
}

export const DESCRICAO_DO_ALCANCE: Record<string, string> = {
  proprio: "Seus registros",
  linha: "Registros da sua linha",
  secao: "Registros da seção",
  dominio: "Checklists, falhas e alertas (seu domínio)",
};
