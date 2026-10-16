import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { AcaoAlerta, Conclusao, Contexto, Rascunho, Registro } from "@/domain/types";
import { agoraSimulado, type ClockAnchor } from "@/lib/clock";

import type { MotivoBloqueio } from "./bloqueio";
import type { RascunhoSalvo } from "./rascunho";

/** Versão do estado salvo no IndexedDB. v3 = v0.3 (sessão compartilhada, fila com desfazer, rede real). */
export const VERSAO_SESSAO = 3;

/** O que fica salvo no tablet (v3). Rede do navegador e rede efetiva não são salvas: vêm do aparelho ao abrir. */
export interface SessaoPersistida {
  usuarioId: string | null;
  /** Posto lembrado pelo tablet: sobrevive à troca de pessoa e ao sair. */
  contexto: Contexto | null;
  relogio: ClockAnchor;
  /** "Simular sem rede" do painel de demonstração. */
  simularSemRede: boolean;
  conclusoes: Record<string, Conclusao>;
  registros: Record<string, Registro>;
  /** Ações da liderança sobre cada alerta. */
  tratamentos: Record<string, AcaoAlerta[]>;
  rascunhos: Record<string, RascunhoSalvo>;
  bloqueado: boolean;
  motivoBloqueio: MotivoBloqueio | null;
  /** Quem estava no posto quando o tablet bloqueou (pré-seleção do "Quem está no posto?"). */
  ultimoUsuarioId: string | null;
  /** Pessoa pré-selecionada na troca pelo header. */
  candidatoId: string | null;
  /** Última sincronização com o servidor (ISO, horário real do aparelho). */
  ultimaSincronizacao: string | null;
  /** Turno simulado em que a pessoa atual entrou; base do bloqueio na virada de turno. */
  turnoDaSessao: string | null;
}

/** Estado salvo pela v0.2 (`version: 2`). */
interface SessaoV2 {
  usuarioId?: string | null;
  contexto?: Contexto | null;
  relogio: ClockAnchor;
  rede?: "online" | "offline";
  conclusoes?: Record<string, Conclusao>;
  registros?: Record<string, Registro>;
  tratamentos?: Record<string, AcaoAlerta[]>;
  rascunhos?: Record<string, Rascunho>;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function ehSessaoV2(valor: unknown): valor is SessaoV2 {
  return (
    ehObjeto(valor) &&
    ehObjeto(valor.relogio) &&
    typeof valor.relogio.simulado === "string" &&
    typeof valor.relogio.real === "number"
  );
}

/**
 * v2 → v3: preserva posto, pessoa, relógio, conclusões, registros, tratamentos e rascunhos; a simulação de rede vira
 * `simularSemRede`; os rascunhos ganham autor (a pessoa logada na v0.2; "" quando não havia ninguém) e início (agora,
 * no relógio da demo).
 */
function v2ParaV3(v2: SessaoV2, realAgora: number): SessaoPersistida {
  const agora = agoraSimulado(v2.relogio, realAgora);
  const usuarioId = v2.usuarioId ?? null;
  const rascunhos: Record<string, RascunhoSalvo> = {};
  for (const [tarefaId, r] of Object.entries(v2.rascunhos ?? {})) {
    rascunhos[tarefaId] = {
      ...r,
      iniciadoPor: r.iniciadoPor ?? usuarioId ?? "",
      iniciadoEm: r.iniciadoEm ?? agora.toISOString(),
    };
  }

  return {
    usuarioId,
    contexto: v2.contexto ?? null,
    relogio: v2.relogio,
    simularSemRede: v2.rede === "offline",
    conclusoes: v2.conclusoes ?? {},
    registros: v2.registros ?? {},
    tratamentos: v2.tratamentos ?? {},
    rascunhos,
    bloqueado: false,
    motivoBloqueio: null,
    ultimoUsuarioId: null,
    candidatoId: null,
    ultimaSincronizacao: null,
    // Quem já estava logado continua no turno de agora: a migração não bloqueia o tablet.
    turnoDaSessao: usuarioId ? chaveTurno(turnoAtual(agora)) : null,
  };
}

/**
 * Migração incremental do estado salvo. Devolve `null` quando não dá para aproveitar (versões < 2 não têm registros
 * nem alertas, ou o conteúdo não tem a forma esperada): o store recomeça a demo.
 */
export function migrarSessao(
  persistido: unknown,
  versao: number,
  realAgora: number = Date.now(),
): SessaoPersistida | null {
  if (versao < 2) return null;
  let estado: unknown = persistido;
  if (versao <= 2) {
    if (!ehSessaoV2(estado)) return null;
    estado = v2ParaV3(estado, realAgora);
  }
  // Próximas versões: `if (versao <= 3) estado = v3ParaV4(estado)`.
  return ehObjeto(estado) ? (estado as unknown as SessaoPersistida) : null;
}
