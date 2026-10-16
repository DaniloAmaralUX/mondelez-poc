"use client";

import { useEffect, useState } from "react";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { localRepository } from "@/data/repository";
import { resumirRespostas } from "@/domain/formulario-engine";
import { chaveTurno, montarTurno, turnoAtual } from "@/domain/turno";
import type {
  AcaoAlerta,
  Conclusao,
  Contexto,
  Formulario,
  Rascunho,
  Registro,
  Resposta,
  TarefaInstancia,
  Usuario,
} from "@/domain/types";
import { agoraSimulado, ancoraPadrao, avancar, type ClockAnchor } from "@/lib/clock";
import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";

/** Cookie lido pelo `proxy.ts` para proteger as rotas do dashboard. */
export const SESSION_COOKIE = "rotinas_sessao";
const DISPOSITIVO_ID = "tablet-bis2-embalagem-01";
const ATRASO_ENVIO_MS = 1200;

const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: (name, value) => set(name, value),
  removeItem: (name) => del(name),
};

export type ResultadoLogin = { ok: true; usuario: Usuario } | { ok: false; campo: "matricula" | "pin"; erro: string };

interface SessionState {
  usuarioId: string | null;
  /** Posto lembrado pelo tablet: sobrevive à troca de usuário. */
  contexto: Contexto | null;
  relogio: ClockAnchor;
  rede: "online" | "offline";
  conclusoes: Record<string, Conclusao>;
  registros: Record<string, Registro>;
  /** Ações da liderança sobre cada alerta. */
  tratamentos: Record<string, AcaoAlerta[]>;
  rascunhos: Record<string, Rascunho>;

  entrar: (matricula: string, pin: string, contexto: Contexto) => ResultadoLogin;
  entrarComo: (usuarioId: string) => void;
  sair: () => void;
  salvarRascunho: (tarefaId: string, rascunho: Rascunho) => void;
  registrarChecklist: (input: {
    tarefa: TarefaInstancia;
    formulario: Formulario;
    rascunho: Rascunho;
  }) => Registro | undefined;
  confirmarTarefa: (tarefaId: string) => void;
  tratarAlerta: (alertaId: string, tipo: AcaoAlerta["tipo"], texto: string) => void;
  avancarRelogio: (minutos: number) => void;
  irParaFimDoTurno: () => void;
  alternarRede: () => void;
  resetarDemo: () => void;
}

const CONTEXTO_PADRAO: Contexto = { plantaId: "chocolate", linhaId: "bis-2", postoId: "bis-2-embalagem" };

/** Estado inicial da demo: 07:40 do 1º turno, com a pré-partida e o primeiro Hora x Hora já feitos. */
function estadoInicialDemo(realAgora: number = Date.now()) {
  const relogio = ancoraPadrao(realAgora);
  const turno = montarTurno(1, agoraSimulado(relogio, realAgora));
  const chave = chaveTurno(turno);
  const em = (h: number, m: number) => {
    const d = new Date(turno.data);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const conclusoes: Record<string, Conclusao> = {
    [`pre-partida-l4@${chave}`]: { estado: "feita", em: em(6, 12), usuarioId: "u-alberto" },
    [`hora-x-hora@${chave}#06`]: { estado: "feita", em: em(7, 4), usuarioId: "u-alberto" },
    [`sup-passagem@${chave}`]: { estado: "feita", em: em(6, 25), usuarioId: "u-renata" },
  };

  return {
    relogio,
    conclusoes,
    registros: {} as Record<string, Registro>,
    tratamentos: {} as Record<string, AcaoAlerta[]>,
    rascunhos: {} as Record<string, Rascunho>,
    rede: "online" as const,
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (setState, getState) => {
      const agora = () => agoraSimulado(getState().relogio);

      /** Simula o envio da fila local quando há rede. */
      const sincronizarFila = () => {
        if (getState().rede !== "online") return;
        setState((s) => ({ registros: marcarSync(s.registros, "local", "enviando") }));
        window.setTimeout(() => {
          if (getState().rede !== "online") return;
          setState((s) => ({ registros: marcarSync(s.registros, "enviando", "sincronizado") }));
        }, ATRASO_ENVIO_MS);
      };

      return {
        usuarioId: null,
        contexto: CONTEXTO_PADRAO,
        ...estadoInicialDemo(),

        entrar: (matricula, pin, contexto) => {
          const usuario = localRepository.usuarioPorMatricula(matricula);
          if (!usuario) return { ok: false, campo: "matricula", erro: "Matrícula não encontrada. Confira o crachá." };
          if (usuario.pin !== pin) return { ok: false, campo: "pin", erro: "PIN incorreto." };
          setState({ usuarioId: usuario.id, contexto });
          setClientCookie(SESSION_COOKIE, usuario.id, 1);
          return { ok: true, usuario };
        },

        entrarComo: (usuarioId) => {
          if (!localRepository.usuario(usuarioId)) return;
          setState({ usuarioId });
          setClientCookie(SESSION_COOKIE, usuarioId, 1);
        },

        sair: () => {
          setState({ usuarioId: null });
          deleteClientCookie(SESSION_COOKIE);
        },

        salvarRascunho: (tarefaId, rascunho) => setState((s) => ({ rascunhos: { ...s.rascunhos, [tarefaId]: rascunho } })),

        registrarChecklist: ({ tarefa, formulario, rascunho }) => {
          const { respostas } = rascunho;
          const { usuarioId, contexto } = getState();
          if (!usuarioId || !contexto) return undefined;

          const criadoEm = agora();
          const resumo = resumirRespostas(formulario, respostas);
          const registro: Registro = {
            id: `reg-${criadoEm.getTime().toString(36)}`,
            tarefaId: tarefa.id,
            formularioId: formulario.id,
            versaoFormulario: formulario.versao,
            respostas,
            criadoEm: criadoEm.toISOString(),
            turnoChave: chaveTurno(turnoAtual(criadoEm)),
            postoId: contexto.postoId,
            equipamentoId: rascunho.equipamentoId ?? tarefa.equipamentoId,
            usuarioId,
            dispositivoId: DISPOSITIVO_ID,
            syncStatus: "local",
            naoConformes: resumo.naoConformes,
            observacao: rascunho.observacao.trim() || undefined,
          };

          setState((s) => ({
            registros: { ...s.registros, [registro.id]: registro },
            rascunhos: Object.fromEntries(Object.entries(s.rascunhos).filter(([id]) => id !== tarefa.id)),
            conclusoes: {
              ...s.conclusoes,
              [tarefa.id]: {
                estado: resumo.naoConformes > 0 ? "com_nc" : "feita",
                em: registro.criadoEm,
                usuarioId,
              },
            },
          }));
          sincronizarFila();
          return registro;
        },

        confirmarTarefa: (tarefaId) => {
          const { usuarioId } = getState();
          if (!usuarioId) return;
          setState((s) => ({
            conclusoes: { ...s.conclusoes, [tarefaId]: { estado: "feita", em: agora().toISOString(), usuarioId } },
          }));
        },

        tratarAlerta: (alertaId, tipo, texto) => {
          const { usuarioId } = getState();
          if (!usuarioId) return;
          const acao: AcaoAlerta = { tipo, texto, usuarioId, em: agora().toISOString() };
          setState((s) => ({ tratamentos: { ...s.tratamentos, [alertaId]: [...(s.tratamentos[alertaId] ?? []), acao] } }));
        },

        avancarRelogio: (minutos) => setState((s) => ({ relogio: avancar(s.relogio, minutos) })),

        irParaFimDoTurno: () => {
          const atual = agora();
          const fim = turnoAtual(atual).fim;
          const minutos = Math.max(0, Math.round((fim.getTime() - atual.getTime()) / 60000) - 5);
          setState((s) => ({ relogio: avancar(s.relogio, minutos) }));
        },

        alternarRede: () => {
          setState((s) => ({ rede: s.rede === "online" ? "offline" : "online" }));
          sincronizarFila();
        },

        resetarDemo: () => setState({ ...estadoInicialDemo() }),
      };
    },
    {
      name: "rotinas-sessao",
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ usuarioId, contexto, relogio, rede, conclusoes, registros, tratamentos, rascunhos }) => ({
        usuarioId,
        contexto,
        relogio,
        rede,
        conclusoes,
        registros,
        tratamentos,
        rascunhos,
      }),
      // Versões antigas do estado salvo não têm registros nem alertas: recomeça a demo.
      migrate: () => ({ usuarioId: null, contexto: CONTEXTO_PADRAO, ...estadoInicialDemo() }),
    },
  ),
);

function marcarSync(registros: Record<string, Registro>, de: Registro["syncStatus"], para: Registro["syncStatus"]) {
  return Object.fromEntries(
    Object.entries(registros).map(([id, r]) => [id, r.syncStatus === de ? { ...r, syncStatus: para } : r]),
  );
}

/** true depois que o estado salvo no IndexedDB foi carregado. */
export function useSessionHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubHydrate = useSessionStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinish = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSessionStore.persist.hasHydrated());
    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, []);

  return hydrated;
}

export function useUsuarioAtual(): Usuario | undefined {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  return usuarioId ? localRepository.usuario(usuarioId) : undefined;
}

/** Horário simulado da demo, atualizado a cada `intervaloMs`. */
export function useAgora(intervaloMs = 15_000): Date {
  const relogio = useSessionStore((s) => s.relogio);
  const [agora, setAgora] = useState(() => agoraSimulado(relogio));

  useEffect(() => {
    setAgora(agoraSimulado(relogio));
    const id = window.setInterval(() => setAgora(agoraSimulado(relogio)), intervaloMs);
    return () => window.clearInterval(id);
  }, [relogio, intervaloMs]);

  return agora;
}
