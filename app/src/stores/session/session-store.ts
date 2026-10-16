"use client";

import { useEffect, useState } from "react";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { localRepository } from "@/data/repository";
import { chaveTurno, montarTurno } from "@/domain/turno";
import type { Conclusao, Contexto, Usuario } from "@/domain/types";
import { agoraSimulado, ancoraPadrao, type ClockAnchor } from "@/lib/clock";

const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: (name, value) => set(name, value),
  removeItem: (name) => del(name),
};

export type ResultadoLogin = { ok: true; usuario: Usuario } | { ok: false; campo: "matricula" | "pin"; erro: string };

interface SessionState {
  usuarioId: string | null;
  /** Contexto lembrado por dispositivo: sobrevive à troca de usuário. */
  contexto: Contexto | null;
  relogio: ClockAnchor;
  conclusoes: Record<string, Conclusao>;
  entrar: (matricula: string, pin: string) => ResultadoLogin;
  sair: () => void;
  definirContexto: (contexto: Contexto) => void;
  concluirTarefa: (tarefaId: string, agora: Date) => void;
  resetarDemo: () => void;
}

/** Estado inicial da demo: o operador já fez a pré-partida e o primeiro Hora x Hora do 1º turno. */
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

  return { relogio, conclusoes };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (setState) => ({
      usuarioId: null,
      contexto: null,
      ...estadoInicialDemo(),

      entrar: (matricula, pin) => {
        const usuario = localRepository.usuarioPorMatricula(matricula);
        if (!usuario)
          return { ok: false, campo: "matricula", erro: "Matrícula não encontrada. Confira o número no crachá." };
        if (usuario.pin !== pin)
          return { ok: false, campo: "pin", erro: "PIN incorreto. Digite os 4 números de novo." };
        setState({ usuarioId: usuario.id });
        return { ok: true, usuario };
      },

      sair: () => setState({ usuarioId: null }),

      definirContexto: (contexto) => setState({ contexto }),

      concluirTarefa: (tarefaId, agora) =>
        setState((s) =>
          s.usuarioId
            ? {
                conclusoes: {
                  ...s.conclusoes,
                  [tarefaId]: { estado: "feita", em: agora.toISOString(), usuarioId: s.usuarioId },
                },
              }
            : s,
        ),

      resetarDemo: () => setState({ ...estadoInicialDemo() }),
    }),
    {
      name: "rotinas-sessao",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ usuarioId, contexto, relogio, conclusoes }) => ({ usuarioId, contexto, relogio, conclusoes }),
    },
  ),
);

/** true depois que o estado salvo no IndexedDB foi carregado. Evita redirecionar antes da hora. */
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

/** Horário simulado, atualizado a cada `intervaloMs`. */
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
