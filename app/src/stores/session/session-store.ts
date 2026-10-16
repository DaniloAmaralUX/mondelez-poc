"use client";

import { useSyncExternalStore } from "react";

import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";

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
  TarefaInstancia,
  Usuario,
} from "@/domain/types";
import { agoraSimulado, ancoraPadrao, avancar, MINUTO_MS, mesmaAncora } from "@/lib/clock";
import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";
import { aplicarBloqueio, CHAVE_OCULTO, type MotivoBloqueio } from "@/lib/sessao/bloqueio";
import {
  ATRASO_ENVIO_MS,
  concluirEnvio,
  desfazerNoEstado,
  fecharJanela,
  filaVazia,
  idsParaEnviar,
  JANELA_DESFAZER_MS,
  marcarComo,
  normalizarAoAbrir,
} from "@/lib/sessao/fila";
import { migrarSessao, type SessaoPersistida, VERSAO_SESSAO } from "@/lib/sessao/migracao";
import { podarRegistros } from "@/lib/sessao/poda";
import { assumirRascunho, gravarRascunho, type RascunhoSalvo } from "@/lib/sessao/rascunho";
import { type Rede, redeEfetiva } from "@/lib/sessao/rede";
import { criarTicker } from "@/lib/sessao/ticker";
import { removerUltimaAcao } from "@/lib/sessao/tratamentos";

import { type ArmazenamentoSessao, criarArmazenamentoSessao } from "./persistencia";

export { INATIVIDADE_MS, type MotivoBloqueio, OCULTO_MS } from "@/lib/sessao/bloqueio";
export { JANELA_DESFAZER_MS } from "@/lib/sessao/fila";
export type { SessaoPersistida } from "@/lib/sessao/migracao";
export type { RascunhoSalvo } from "@/lib/sessao/rascunho";
export type { Rede } from "@/lib/sessao/rede";

/** Cookie lido pelo `proxy.ts` para proteger as rotas do dashboard. */
export const SESSION_COOKIE = "rotinas_sessao";
const DISPOSITIVO_ID = "tablet-bis2-embalagem-01";
const NOME_ARMAZENAMENTO = "rotinas-sessao";

export type ResultadoLogin = { ok: true; usuario: Usuario } | { ok: false; campo: "matricula" | "pin"; erro: string };

export interface SessionState extends SessaoPersistida {
  /** Rede segundo o aparelho (eventos online/offline + `useOffline` do Next), mantida pela `<Plataforma />`. */
  redeNavegador: Rede;
  /** Rede efetiva: a do aparelho, com "Simular sem rede" da demo por cima. */
  rede: Rede;

  /** Login com matrícula e PIN (tela de login). Desbloqueia e lembra o posto. */
  entrar: (matricula: string, pin: string, contexto: Contexto) => ResultadoLogin;
  /** Só para o SSO simulado da demonstração: entra sem PIN. */
  entrarComo: (usuarioId: string) => void;
  /** Tela de bloqueio e troca de pessoa: confere o PIN, define a pessoa, desbloqueia e grava o cookie. */
  entrarComPin: (usuarioId: string, pin: string) => ResultadoLogin;
  /**
   * Encerra a sessão da pessoa: identidade, turno da sessão, bloqueio e quem estava no posto saem. Registros, fila,
   * conclusões, rascunhos (com o autor, para "Continuar / Descartar") e posto ficam: são dados do posto.
   */
  sair: () => void;
  /** Bloqueia o tablet ("Quem está no posto?"). Sem pessoa logada não faz nada. Ver `aplicarBloqueio`. */
  bloquear: (motivo: MotivoBloqueio, candidatoId?: string) => void;
  /** Volta para a pessoa atual sem PIN, só se o bloqueio for uma troca iniciada por ela. */
  cancelarTroca: () => void;

  /** Salva o rascunho (autor e início preservados; preenchidos na primeira gravação). */
  salvarRascunho: (tarefaId: string, valores: Rascunho) => void;
  descartarRascunho: (tarefaId: string) => void;
  /** "Continuar" o rascunho de outra pessoa: a autoria passa para quem está no posto. */
  assumirRascunho: (tarefaId: string) => void;
  /** Cria o registro como `pendente` e só o põe na fila depois de `JANELA_DESFAZER_MS`. */
  registrarChecklist: (input: {
    tarefa: TarefaInstancia;
    formulario: Formulario;
    rascunho: Rascunho;
  }) => Registro | undefined;
  /**
   * Dentro da janela: apaga o registro e a conclusão e devolve o rascunho. false se já entrou na fila, se o tablet
   * está bloqueado ou se quem está no posto não é quem registrou.
   */
  desfazerRegistro: (registroId: string) => boolean;
  /** Reenvia `local` e `erro` quando há rede (também roda sozinho ao voltar a rede, ao focar e a cada minuto). */
  tentarEnviarDeNovo: () => void;

  confirmarTarefa: (tarefaId: string) => void;
  /** Desfaz a conclusão só se foi a pessoa no posto que concluiu e o tablet está desbloqueado. */
  desfazerConclusao: (tarefaId: string) => void;
  tratarAlerta: (alertaId: string, tipo: AcaoAlerta["tipo"], texto: string) => void;
  /** Remove a última ação da pessoa atual no alerta (desfazer de "Assumir"). */
  desfazerTratamento: (alertaId: string) => void;

  avancarRelogio: (minutos: number) => void;
  irParaFimDoTurno: () => void;
  /** Chamado pela `<Plataforma />`. Ao ficar online, envia a fila sozinho. */
  definirRedeNavegador: (rede: Rede) => void;
  /** Liga/desliga "Simular sem rede" (demo). */
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
    rascunhos: {} as Record<string, RascunhoSalvo>,
    simularSemRede: false,
    ultimaSincronizacao: null,
  };
}

function sessaoInicial(realAgora: number = Date.now()): SessaoPersistida {
  return {
    usuarioId: null,
    contexto: CONTEXTO_PADRAO,
    ...estadoInicialDemo(realAgora),
    bloqueado: false,
    motivoBloqueio: null,
    ultimoUsuarioId: null,
    candidatoId: null,
    turnoDaSessao: null,
  };
}

/** O que vai para o IndexedDB. */
function partializar(s: SessionState): SessaoPersistida {
  return {
    usuarioId: s.usuarioId,
    contexto: s.contexto,
    relogio: s.relogio,
    simularSemRede: s.simularSemRede,
    conclusoes: s.conclusoes,
    registros: s.registros,
    tratamentos: s.tratamentos,
    rascunhos: s.rascunhos,
    bloqueado: s.bloqueado,
    motivoBloqueio: s.motivoBloqueio,
    ultimoUsuarioId: s.ultimoUsuarioId,
    candidatoId: s.candidatoId,
    ultimaSincronizacao: s.ultimaSincronizacao,
    turnoDaSessao: s.turnoDaSessao,
  };
}

/** Mapas por id: entre abas, cada aba só leva para o banco as chaves que mudou (persistencia.ts). */
const CAMPOS_POR_CHAVE = ["registros", "conclusoes", "tratamentos", "rascunhos"] as const;
/**
 * Com a fila vazia, a "última sincronização" é renovada no máximo a cada 50 s: o pulso de cada minuto a atualiza, mas
 * foco, volta da rede e outra aba não viram uma escrita no banco (e um aviso às outras abas) a cada chamada.
 */
const RENOVAR_SINCRONIZACAO_MS = MINUTO_MS - 10_000;

function sincronizacaoVencida(ultima: string | null, agoraReal: number = Date.now()): boolean {
  const instante = ultima ? Date.parse(ultima) : Number.NaN;
  return !Number.isFinite(instante) || agoraReal - instante >= RENOVAR_SINCRONIZACAO_MS;
}

/** Quem acabou de entrar está no posto: uma marca antiga de segundo plano (use-bloqueio.ts) não pode bloquear. */
function limparMarcaDeSegundoPlano() {
  try {
    window.localStorage.removeItem(CHAVE_OCULTO);
  } catch {
    // Sem window (testes, servidor) ou sem localStorage: não há marca a limpar.
  }
}

// Estado desta aba que não vai para o banco: janelas de desfazer abertas, rascunhos que voltam se o registro for
// desfeito e envios em curso. Uma recarga fecha as janelas (o registro entra na fila) e reenvia o que estava no meio.
const janelasDeDesfazer = new Map<string, ReturnType<typeof setTimeout>>();
const rascunhosParaDesfazer = new Map<string, RascunhoSalvo>();
const emEnvioNestaAba = new Set<string>();

// Carga inicial do IndexedDB. Só ela conta: o que outra aba grava é juntado sem voltar a "carregando".
let sessaoCarregada = false;
const ouvintesDaCarga = new Set<() => void>();
function marcarSessaoCarregada() {
  if (sessaoCarregada) return;
  sessaoCarregada = true;
  for (const ouvinte of [...ouvintesDaCarga]) ouvinte();
}

// Tipos explícitos: as funções leem o store criado logo abaixo (sem eles o tipo do store vira circular).
const armazenamento: ArmazenamentoSessao<SessaoPersistida> = criarArmazenamentoSessao<SessaoPersistida>({
  lerValor: (): StorageValue<SessaoPersistida> => ({
    state: partializar(useSessionStore.getState()),
    version: VERSAO_SESSAO,
  }),
  // Flag de módulo, e não `persist.hasHydrated()`: esta não volta a false e nenhuma escrita é descartada no meio.
  podeGravar: (): boolean => sessaoCarregada,
  camposPorChave: CAMPOS_POR_CHAVE,
  aplicar: (estado: SessaoPersistida): void => aplicarDeOutraAba(estado),
});

export const useSessionStore = create<SessionState>()(
  persist(
    (setState, getState) => {
      const agora = () => agoraSimulado(getState().relogio);
      const chaveDoTurnoAgora = () => chaveTurno(turnoAtual(agora()));

      const iniciarSessao = (usuarioId: string, contexto?: Contexto) => {
        setState({
          usuarioId,
          ...(contexto ? { contexto } : {}),
          bloqueado: false,
          motivoBloqueio: null,
          candidatoId: null,
          turnoDaSessao: chaveDoTurnoAgora(),
        });
        setClientCookie(SESSION_COOKIE, usuarioId, 1);
        limparMarcaDeSegundoPlano();
      };

      /** Simula o envio da fila ao servidor quando há rede. */
      const enviarFila = () => {
        const s = getState();
        if (s.rede !== "online") return;
        const ids = idsParaEnviar(s.registros, emEnvioNestaAba, janelasDeDesfazer, agora().getTime());
        if (ids.length === 0) {
          // Nada a enviar e nada no meio do caminho: o tablet está em dia com o servidor.
          if (filaVazia(s.registros) && sincronizacaoVencida(s.ultimaSincronizacao)) {
            setState({ ultimaSincronizacao: new Date().toISOString() });
          }
          return;
        }
        for (const id of ids) emEnvioNestaAba.add(id);
        setState({ registros: marcarComo(s.registros, ids, "enviando") });

        setTimeout(() => {
          for (const id of ids) emEnvioNestaAba.delete(id);
          const atual = getState();
          const registros = concluirEnvio(atual.registros, ids, atual.rede);
          if (atual.rede === "online") {
            setState({ registros: podarRegistros(registros, agora()), ultimaSincronizacao: new Date().toISOString() });
          } else {
            setState({ registros });
          }
        }, ATRASO_ENVIO_MS);
      };

      const fecharJanelaDeDesfazer = (registroId: string) => {
        janelasDeDesfazer.delete(registroId);
        rascunhosParaDesfazer.delete(registroId);
        setState((s) => ({ registros: fecharJanela(s.registros, registroId) }));
        enviarFila();
      };

      const limparEstadoDaAba = () => {
        for (const timer of janelasDeDesfazer.values()) clearTimeout(timer);
        janelasDeDesfazer.clear();
        rascunhosParaDesfazer.clear();
        emEnvioNestaAba.clear();
      };

      return {
        ...sessaoInicial(),
        redeNavegador: "online",
        rede: "online",

        entrar: (matricula, pin, contexto) => {
          const usuario = localRepository.usuarioPorMatricula(matricula);
          if (!usuario) return { ok: false, campo: "matricula", erro: "Matrícula não encontrada. Confira o crachá." };
          if (usuario.pin !== pin) return { ok: false, campo: "pin", erro: "PIN incorreto." };
          iniciarSessao(usuario.id, contexto);
          return { ok: true, usuario };
        },

        entrarComo: (usuarioId) => {
          if (!localRepository.usuario(usuarioId)) return;
          iniciarSessao(usuarioId);
        },

        entrarComPin: (usuarioId, pin) => {
          const usuario = localRepository.usuario(usuarioId);
          if (!usuario) return { ok: false, campo: "matricula", erro: "Pessoa não encontrada. Confira o crachá." };
          if (usuario.pin !== pin) return { ok: false, campo: "pin", erro: "PIN incorreto." };
          iniciarSessao(usuario.id);
          return { ok: true, usuario };
        },

        sair: () => {
          setState({
            usuarioId: null,
            bloqueado: false,
            motivoBloqueio: null,
            ultimoUsuarioId: null,
            candidatoId: null,
            turnoDaSessao: null,
          });
          deleteClientCookie(SESSION_COOKIE);
        },

        bloquear: (motivo, candidatoId) => {
          const mudanca = aplicarBloqueio(getState(), motivo, candidatoId);
          if (mudanca) setState(mudanca);
        },

        cancelarTroca: () => {
          const s = getState();
          if (!s.bloqueado || s.motivoBloqueio !== "troca" || !s.usuarioId) return;
          setState({ bloqueado: false, motivoBloqueio: null, candidatoId: null });
        },

        salvarRascunho: (tarefaId, valores) => {
          const s = getState();
          const existente = s.rascunhos[tarefaId];
          const autor = s.usuarioId ?? existente?.iniciadoPor;
          // Sem pessoa no posto não há autor: nada a gravar.
          if (!autor) return;
          setState({
            rascunhos: {
              ...s.rascunhos,
              [tarefaId]: gravarRascunho(existente, valores, autor, agora().toISOString()),
            },
          });
        },

        descartarRascunho: (tarefaId) => {
          const { rascunhos } = getState();
          if (!(tarefaId in rascunhos)) return;
          setState({ rascunhos: Object.fromEntries(Object.entries(rascunhos).filter(([id]) => id !== tarefaId)) });
        },

        assumirRascunho: (tarefaId) => {
          const { usuarioId, rascunhos } = getState();
          const rascunho = rascunhos[tarefaId];
          if (!usuarioId || !rascunho || rascunho.iniciadoPor === usuarioId) return;
          setState({ rascunhos: { ...rascunhos, [tarefaId]: assumirRascunho(rascunho, usuarioId) } });
        },

        registrarChecklist: ({ tarefa, formulario, rascunho }) => {
          const { respostas } = rascunho;
          const { usuarioId, contexto, bloqueado, rascunhos } = getState();
          // Tablet bloqueado: ninguém registra em nome da pessoa anterior (RNF-06).
          if (!usuarioId || !contexto || bloqueado) return undefined;

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
            syncStatus: "pendente",
            naoConformes: resumo.naoConformes,
            observacao: rascunho.observacao.trim() || undefined,
          };

          // O rascunho volta igual se o registro for desfeito, inclusive com quem começou.
          rascunhosParaDesfazer.set(
            registro.id,
            gravarRascunho(rascunhos[tarefa.id], rascunho, usuarioId, registro.criadoEm),
          );

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

          janelasDeDesfazer.set(
            registro.id,
            setTimeout(() => fecharJanelaDeDesfazer(registro.id), JANELA_DESFAZER_MS),
          );
          return registro;
        },

        desfazerRegistro: (registroId) => {
          const timer = janelasDeDesfazer.get(registroId);
          if (timer === undefined) return false;
          const s = getState();
          // RNF-06: o aviso com "Desfazer" pode seguir na tela depois de sair (o Toaster é do layout raiz). Só quem
          // registrou desfaz, e com o tablet desbloqueado.
          if (s.bloqueado || !s.usuarioId || s.registros[registroId]?.usuarioId !== s.usuarioId) return false;
          const desfeito = desfazerNoEstado(s, registroId, rascunhosParaDesfazer.get(registroId));
          if (!desfeito) return false;
          clearTimeout(timer);
          janelasDeDesfazer.delete(registroId);
          rascunhosParaDesfazer.delete(registroId);
          setState(desfeito);
          return true;
        },

        tentarEnviarDeNovo: () => enviarFila(),

        confirmarTarefa: (tarefaId) => {
          const { usuarioId, bloqueado } = getState();
          if (!usuarioId || bloqueado) return;
          setState((s) => ({
            conclusoes: { ...s.conclusoes, [tarefaId]: { estado: "feita", em: agora().toISOString(), usuarioId } },
          }));
        },

        desfazerConclusao: (tarefaId) => {
          const { usuarioId, bloqueado, conclusoes } = getState();
          if (bloqueado || !usuarioId || conclusoes[tarefaId]?.usuarioId !== usuarioId) return;
          setState((s) => ({
            conclusoes: Object.fromEntries(Object.entries(s.conclusoes).filter(([id]) => id !== tarefaId)),
          }));
        },

        tratarAlerta: (alertaId, tipo, texto) => {
          const { usuarioId, bloqueado } = getState();
          if (!usuarioId || bloqueado) return;
          const acao: AcaoAlerta = { tipo, texto, usuarioId, em: agora().toISOString() };
          setState((s) => ({
            tratamentos: { ...s.tratamentos, [alertaId]: [...(s.tratamentos[alertaId] ?? []), acao] },
          }));
        },

        desfazerTratamento: (alertaId) => {
          const { usuarioId, tratamentos } = getState();
          if (!usuarioId) return;
          const proximo = removerUltimaAcao(tratamentos, alertaId, usuarioId);
          if (proximo !== tratamentos) setState({ tratamentos: proximo });
        },

        avancarRelogio: (minutos) => setState((s) => ({ relogio: avancar(s.relogio, minutos) })),

        irParaFimDoTurno: () => {
          const atual = agora();
          const fim = turnoAtual(atual).fim;
          const minutos = Math.max(0, Math.round((fim.getTime() - atual.getTime()) / 60000) - 5);
          setState((s) => ({ relogio: avancar(s.relogio, minutos) }));
        },

        definirRedeNavegador: (redeNavegador) => {
          const s = getState();
          if (s.redeNavegador === redeNavegador) return;
          const rede = redeEfetiva(redeNavegador, s.simularSemRede);
          setState({ redeNavegador, rede });
          if (rede === "online" && s.rede !== "online") enviarFila();
        },

        alternarRede: () => {
          const s = getState();
          const simularSemRede = !s.simularSemRede;
          const rede = redeEfetiva(s.redeNavegador, simularSemRede);
          setState({ simularSemRede, rede });
          if (rede === "online") enviarFila();
        },

        resetarDemo: () => {
          limparEstadoDaAba();
          const s = getState();
          const demo = estadoInicialDemo();
          setState({
            ...demo,
            rede: redeEfetiva(s.redeNavegador, demo.simularSemRede),
            // Quem está logado continua no turno do relógio novo: resetar não bloqueia o tablet.
            turnoDaSessao: s.usuarioId ? chaveTurno(turnoAtual(agoraSimulado(demo.relogio))) : null,
          });
        },
      };
    },
    {
      name: NOME_ARMAZENAMENTO,
      version: VERSAO_SESSAO,
      storage: armazenamento,
      // No servidor não há IndexedDB: só o navegador lê o estado salvo.
      skipHydration: typeof window === "undefined",
      partialize: partializar,
      // v2 → v3 preserva tudo; versões anteriores não têm registros nem alertas: recomeça a demo.
      migrate: (persistido, versao) => migrarSessao(persistido, versao) ?? sessaoInicial(),
      // Só na carga inicial: o que outra aba grava depois é juntado por `aplicarDeOutraAba` (ver `ouvirOutrasAbas`).
      merge: (persistido, atual) => {
        if (typeof persistido !== "object" || persistido === null) return atual;
        const salvo = persistido as Partial<SessaoPersistida>;
        const relogio = salvo.relogio ?? atual.relogio;
        const simularSemRede = salvo.simularSemRede ?? atual.simularSemRede;
        // Ao abrir o app, janelas de desfazer e envios interrompidos voltam para a fila.
        const registros = podarRegistros(normalizarAoAbrir(salvo.registros ?? atual.registros), agoraSimulado(relogio));
        return {
          ...atual,
          ...salvo,
          relogio,
          simularSemRede,
          registros,
          redeNavegador: atual.redeNavegador,
          rede: redeEfetiva(atual.redeNavegador, simularSemRede),
        };
      },
      // Sucesso ou falha ao ler o IndexedDB: o app segue (com o estado salvo ou, sem banco, só em memória).
      onRehydrateStorage: () => () => marcarSessaoCarregada(),
    },
  ),
);

/**
 * Resultado da junção com o que outra aba gravou (o que esta aba mudou e ainda não gravou já está nele). As mesmas
 * regras da carga: registros podados e rede efetiva desta aba.
 */
function aplicarDeOutraAba(estado: SessaoPersistida) {
  const { redeNavegador } = useSessionStore.getState();
  useSessionStore.setState({
    ...estado,
    registros: podarRegistros(estado.registros, agoraSimulado(estado.relogio)),
    rede: redeEfetiva(redeNavegador, estado.simularSemRede),
  });
}

function assinarCarga(ouvinte: () => void) {
  ouvintesDaCarga.add(ouvinte);
  return () => {
    ouvintesDaCarga.delete(ouvinte);
  };
}

/**
 * true depois que o estado salvo no IndexedDB foi carregado (no servidor e na hidratação, sempre false). Não volta a
 * false quando outra aba força uma releitura: a tela não pisca nem perde o formulário.
 */
export function useSessionHydrated(): boolean {
  return useSyncExternalStore(
    assinarCarga,
    () => sessaoCarregada,
    () => false,
  );
}

export function useUsuarioAtual(): Usuario | undefined {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  return usuarioId ? localRepository.usuario(usuarioId) : undefined;
}

/** Relógio único do app (um timer), alinhado à virada do minuto simulado. */
const ticker = criarTicker({
  lerAncora: () => useSessionStore.getState().relogio,
  assinarAncora: (aoMudar) =>
    useSessionStore.subscribe((s, anterior) => {
      // Por valor: o mesmo relógio vindo do IndexedDB (outra aba) chega em outro objeto e não é uma mudança. Comparar
      // por referência acordava o ticker e o envio da fila a cada leitura, e duas abas entravam em laço.
      if (!mesmaAncora(s.relogio, anterior.relogio)) aoMudar();
    }),
});

/**
 * Horário fixo para o HTML do servidor e a hidratação (07:40 locais, o mesmo nos dois lados, em qualquer fuso).
 * Depois da hidratação vale o relógio da demo. Telas que mostram hora continuam esperando `useSessionHydrated`.
 */
const AGORA_NO_SERVIDOR = new Date(2026, 9, 16, 7, 40);

/**
 * Horário simulado da demo. Todas as chamadas compartilham um só ticker: o valor muda na virada de cada minuto
 * simulado e imediatamente quando o relógio da demo muda. O parâmetro da v0.2 é aceito e ignorado.
 */
export function useAgora(_intervaloMs?: number): Date {
  return useSyncExternalStore(ticker.assinar, ticker.agora, () => AGORA_NO_SERVIDOR);
}

/**
 * Assina a virada do minuto simulado (e as mudanças do relógio da demo) fora do React, no mesmo ticker do `useAgora`.
 * Usado pela `<Plataforma />` para sincronizar a cada minuto.
 */
export function assinarMinuto(ouvinte: () => void): () => void {
  return ticker.assinar(() => ouvinte());
}

/**
 * Liga o aviso entre abas: quando outra aba grava, esta relê o IndexedDB e junta chave a chave com o que mudou aqui e
 * ainda não foi gravado (persistencia.ts); as duas mudanças ficam. Devolve o desligamento. Montado pela `<Plataforma />`.
 */
export function ouvirOutrasAbas(): () => void {
  return armazenamento.ouvirOutrasAbas();
}

/** Grava já o estado pendente no IndexedDB (ex.: antes de uma ação que pode fechar a página). */
export function gravarSessaoAgora(): Promise<void> {
  return armazenamento.gravarAgora();
}
