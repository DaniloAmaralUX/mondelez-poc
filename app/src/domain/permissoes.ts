// Matriz de permissões por perfil (doc 05 §4, RF-08, RN-14). Puro.

import type { Perfil } from "./types";

export type Recurso =
  | "rotina"
  | "checklists"
  | "apontamentos"
  | "troca-de-turno"
  | "alertas"
  | "relatorio"
  | "painel"
  | "plano"
  | "documentos"
  | "escala"
  | "agenda"
  | "historico"
  | "tendencias"
  | "notificacoes"
  | "usuarios"
  | "padroes";

/** L = ler · E = escrever (criar registro) · T = tratar · A = administrar conteúdo. */
export type Acao = "ler" | "escrever" | "tratar" | "administrar";

type Matriz = Record<Recurso, Partial<Record<Perfil, readonly Acao[]>>>;

const L = ["ler"] as const;
const LE = ["ler", "escrever"] as const;
const LT = ["ler", "tratar"] as const;
const LA = ["ler", "administrar"] as const;

/**
 * Doc 05 §4, com as telas novas da v0.5 encaixadas no recurso mais próximo:
 * painel e tendências seguem o relatório (liderança); notificações seguem os alertas; usuários e padrões são o "Admin".
 * Alertas da operação: só as próprias pendências (pedidos de ajuda), sem o painel (RN-14).
 */
const MATRIZ: Matriz = {
  rotina: { operacao: LE, supervisao: LE, gerencia: LE, especialista: LE, assistencia: LE },
  checklists: { operacao: LE, supervisao: LE, gerencia: L, especialista: LA },
  apontamentos: { operacao: LE, supervisao: LE, gerencia: L, especialista: L },
  "troca-de-turno": { operacao: LE, supervisao: ["ler", "escrever", "tratar"], gerencia: L, especialista: L },
  alertas: { supervisao: LT, gerencia: LT, especialista: LT },
  relatorio: { supervisao: ["ler", "escrever"], gerencia: L, especialista: L, assistencia: L },
  painel: { supervisao: L, gerencia: L, especialista: L },
  plano: { operacao: L, supervisao: L, gerencia: L, especialista: L, assistencia: LA },
  documentos: { operacao: L, supervisao: L, gerencia: L, especialista: LA },
  escala: { operacao: L, supervisao: L, gerencia: L, especialista: L, assistencia: LA },
  agenda: { operacao: L, supervisao: L, gerencia: LA, especialista: L, assistencia: LA },
  historico: { operacao: L, supervisao: L, gerencia: L, especialista: L },
  tendencias: { gerencia: L, especialista: L, supervisao: L },
  notificacoes: { supervisao: L, gerencia: L, especialista: L },
  usuarios: { gerencia: LA, assistencia: LA },
  padroes: { gerencia: LA, especialista: LA },
};

export function pode(perfil: Perfil | undefined, recurso: Recurso, acao: Acao = "ler"): boolean {
  if (!perfil) return false;
  return MATRIZ[recurso][perfil]?.includes(acao) ?? false;
}

/** Alcance do histórico (doc 05 §4): próprio, linha, seção, domínio. */
export function alcanceDoHistorico(perfil: Perfil): "proprio" | "linha" | "secao" | "dominio" | null {
  switch (perfil) {
    case "operacao":
      return "proprio";
    case "supervisao":
      return "linha";
    case "gerencia":
      return "secao";
    case "especialista":
      return "dominio";
    default:
      return null;
  }
}

export const NOME_DO_PERFIL: Record<Perfil, string> = {
  operacao: "Operação",
  supervisao: "Supervisão",
  gerencia: "Gerência",
  especialista: "Especialista",
  assistencia: "Assistência",
};
