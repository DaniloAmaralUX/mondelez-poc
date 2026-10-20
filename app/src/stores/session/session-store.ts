"use client";

import { useCallback, useDeferredValue, useMemo, useSyncExternalStore } from "react";

import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";

import { definirCadastrosDoTablet, localRepository } from "@/data/repository";
import { recadosIniciais } from "@/data/seed";
import { alinharEscalaAoDia } from "@/domain/escala";
import { limitarRespostas, resumirRespostas } from "@/domain/formulario-engine";
import { LIMITES, limitarTexto } from "@/domain/limites";
import { dataLocal } from "@/domain/producao";
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
import { dadosV5Vazios, migrarSessao, type SessaoPersistida, VERSAO_SESSAO } from "@/lib/sessao/migracao";
import { assinarDesbloqueioDoPin, bloqueioVigente, conferirPin, mensagemDeEsperaDoPin } from "@/lib/sessao/pin";
import { podarRegistros } from "@/lib/sessao/poda";
import { assumirRascunho, gravarRascunho, type RascunhoSalvo } from "@/lib/sessao/rascunho";
import { type Rede, redeEfetiva } from "@/lib/sessao/rede";
import { criarTicker } from "@/lib/sessao/ticker";
import { removerUltimaAcao } from "@/lib/sessao/tratamentos";

import { type AcoesV05, criarAcoesV05 } from "./acoes-v05";
import { type ArmazenamentoSessao, criarArmazenamentoSessao } from "./persistencia";

export { INATIVIDADE_MS, type MotivoBloqueio, OCULTO_MS } from "@/lib/sessao/bloqueio";
export { JANELA_DESFAZER_MS } from "@/lib/sessao/fila";
export type { RelatorioEnviado, SessaoPersistida } from "@/lib/sessao/migracao";
export { ESPERA_PIN_MS, MAX_TENTATIVAS_PIN, mensagemDeEsperaDoPin, segundosParaDesbloquear } from "@/lib/sessao/pin";
export type { RascunhoSalvo } from "@/lib/sessao/rascunho";
export type { Rede } from "@/lib/sessao/rede";

export { JANELA_APAGAR_FALHA_MS, type ResultadoCadastro } from "./acoes-v05";

/** Cookie lido pelo `proxy.ts` para proteger as rotas do dashboard. */
export const SESSION_COOKIE = "rotinas_sessao";
const DISPOSITIVO_ID = "tablet-bis2-embalagem-01";
const NOME_ARMAZENAMENTO = "rotinas-sessao";

/**
 * Resultado de `entrar` e `entrarComPin`. Com o PIN bloqueado por tentativas (lib/sessao/pin.ts), `campo: "pin"` traz
 * `bloqueadoAte` (ISO, horário real): até lá nenhum PIN é conferido. Para a tela seguir o desbloqueio, `usePinBloqueadoAte`.
 */
export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; campo: "matricula" | "pin"; erro: string; bloqueadoAte?: string };

export interface SessionState extends SessaoPersistida, AcoesV05 {
  /** Rede segundo o aparelho (eventos online/offline + `useOffline` do Next), mantida pela `<Plataforma />`. */
  redeNavegador: Rede;
  /** Rede efetiva: a do aparelho, com "Simular sem rede" da demo por cima. */
  rede: Rede;

  /**
   * Login com matrícula e PIN (tela de login). Desbloqueia e lembra o posto. Conta os PINs errados da pessoa: no 5º
   * seguido, o PIN dela fica bloqueado por 60 s (`MAX_TENTATIVAS_PIN`, `ESPERA_PIN_MS`); o acerto zera a contagem.
   */
  entrar: (matricula: string, pin: string, contexto: Contexto) => ResultadoLogin;
  /** Só para o SSO simulado da demonstração: entra sem PIN. */
  entrarComo: (usuarioId: string) => void;
  /**
   * Tela de bloqueio e troca de pessoa: confere o PIN, define a pessoa, desbloqueia e grava o cookie. Mesma contagem de
   * PINs errados de `entrar` (por pessoa, salva no tablet: recarregar não zera).
   */
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

  /**
   * Salva o rascunho (autor e início preservados; preenchidos na primeira gravação). É a única mudança que espera os
   * 400 ms da gravação agrupada: as que fecham um estado vão já para o banco (`gravarJa`).
   */
  salvarRascunho: (tarefaId: string, valores: Rascunho) => void;
  descartarRascunho: (tarefaId: string) => void;
  /**
   * Desfazer do "Descartar": o rascunho volta como estava, com quem começou e quando. Só para quem descartou, nesta aba
   * e com o tablet desbloqueado; false se recusou.
   */
  restaurarRascunho: (tarefaId: string, rascunho: RascunhoSalvo) => boolean;
  /** "Continuar" o rascunho de outra pessoa: a autoria passa para quem está no posto, com o horário de agora. */
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
  /** Desfaz a conclusão só se foi a pessoa no posto que concluiu e o tablet está desbloqueado; false se recusou. */
  desfazerConclusao: (tarefaId: string) => boolean;
  /** Registra a ação no histórico do alerta e a devolve (o `em` dela identifica a ação no desfazer). */
  tratarAlerta: (alertaId: string, tipo: AcaoAlerta["tipo"], texto: string) => AcaoAlerta | undefined;
  /**
   * Desfaz a última ação do alerta, só se for da pessoa atual e com o tablet desbloqueado (`removerUltimaAcao`). Com
   * `em`, só a ação desse instante (a que o aviso anunciou). false se recusou.
   */
  desfazerTratamento: (alertaId: string, em?: string) => boolean;

  avancarRelogio: (minutos: number) => void;
  irParaFimDoTurno: () => void;
  /** Chamado pela `<Plataforma />`. Ao ficar online, envia a fila sozinho. */
  definirRedeNavegador: (rede: Rede) => void;
  /** Liga/desliga "Simular sem rede" (demo). */
  alternarRede: () => void;
  resetarDemo: () => void;
}

const CONTEXTO_PADRAO: Contexto = { plantaId: "chocolate", linhaId: "bis-2", postoId: "bis-2-embalagem" };

/**
 * Horário fixo para o HTML do servidor e a hidratação (07:40 locais, o mesmo nos dois lados, em qualquer fuso).
 * Depois da hidratação vale o relógio da demo. Telas que mostram hora continuam esperando `useSessionHydrated`.
 */
const AGORA_NO_SERVIDOR = new Date(2026, 9, 16, 7, 40);

/**
 * Estado inicial da demo: 07:40 do 1º turno, com a pré-partida e o primeiro Hora x Hora já feitos (v0.5: com as caixas
 * da hora das 06:00 apontadas), três falhas no turno, a última ainda sem encerrar, e os recados do dia.
 */
function estadoInicialDemo(realAgora: number = Date.now()) {
  const relogio = ancoraPadrao(realAgora);
  // A escala das turmas segue o dia da demo: a turma A (quem está no posto) no 1º turno (domain/escala.ts).
  alinharEscalaAoDia(dataLocal(agoraSimulado(relogio, realAgora)));
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

  const v5 = dadosV5Vazios();
  const blocoSeis = `hora-x-hora@${chave}#06`;
  v5.apontamentosHora[blocoSeis] = {
    id: blocoSeis,
    postoId: "bis-2-embalagem",
    linhaId: "bis-2",
    turnoChave: chave,
    bloco: em(6, 0),
    skuId: "bis-leite-126",
    caixas: 668,
    usuarioId: "u-alberto",
    em: em(7, 4),
  };
  const falha = (id: string, equipamentoId: string, tipoId: string, inicio: string, fim?: string) => {
    v5.falhas[id] = {
      id,
      postoId: "bis-2-embalagem",
      equipamentoId,
      turnoChave: chave,
      tipoId,
      inicio,
      ...(fim ? { fim } : {}),
      usuarioId: "u-alberto",
    };
  };
  falha("falha-demo-1", "loeschpack-4", "enrosco", em(6, 22), em(6, 28));
  falha("falha-demo-2", "loeschpack-4", "troca-bobina", em(7, 5), em(7, 14));
  falha("falha-demo-3", "loeschpack-2", "enrosco", em(7, 31), em(7, 35));
  v5.recados = Object.fromEntries(recadosIniciais(turno.data).map((r) => [r.id, r]));

  return {
    ...v5,
    relogio,
    conclusoes,
    registros: {} as Record<string, Registro>,
    tratamentos: {} as Record<string, AcaoAlerta[]>,
    rascunhos: {} as Record<string, RascunhoSalvo>,
    simularSemRede: false,
    ultimaSincronizacao: null,
    ultimaSincronizacaoSimulada: null,
  };
}

/**
 * Estado antes de ler o IndexedDB, o mesmo no servidor e na hidratação: a demo no dia de `AGORA_NO_SERVIDOR`, como o
 * `useAgora` desses dois momentos. Montado com o dia real, ele dependia de quando e onde o módulo carregou: um servidor
 * de antes da meia-noite (ou em UTC, à noite no Brasil) e o navegador já no dia seguinte guardavam as conclusões em
 * turnos diferentes, e a contagem de alertas do menu não batia na hidratação (React #418). Sem nada salvo no tablet, a
 * carga troca este estado pela demo de hoje (`merge`).
 */
function sessaoAntesDaCarga(): SessaoPersistida {
  return sessaoInicial(AGORA_NO_SERVIDOR.getTime());
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
    tentativasPin: {},
    pinBloqueadoAte: {},
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
    ultimaSincronizacaoSimulada: s.ultimaSincronizacaoSimulada,
    turnoDaSessao: s.turnoDaSessao,
    tentativasPin: s.tentativasPin,
    pinBloqueadoAte: s.pinBloqueadoAte,
    apontamentosHora: s.apontamentosHora,
    apontamentosPerdas: s.apontamentosPerdas,
    falhas: s.falhas,
    trocasDeTurno: s.trocasDeTurno,
    rascunhosTroca: s.rascunhosTroca,
    pedidosAjuda: s.pedidosAjuda,
    recados: s.recados,
    planos: s.planos,
    ajustesEscala: s.ajustesEscala,
    usuariosCadastrados: s.usuariosCadastrados,
    formulariosPublicados: s.formulariosPublicados,
    notificacoes: s.notificacoes,
    relatoriosEnviados: s.relatoriosEnviados,
  };
}

/** Mapas por id: entre abas, cada aba só leva para o banco as chaves que mudou (persistencia.ts). */
const CAMPOS_POR_CHAVE = [
  "registros",
  "conclusoes",
  "tratamentos",
  "rascunhos",
  "tentativasPin",
  "pinBloqueadoAte",
  "apontamentosHora",
  "apontamentosPerdas",
  "falhas",
  "trocasDeTurno",
  "rascunhosTroca",
  "pedidosAjuda",
  "recados",
  "planos",
  "ajustesEscala",
  "usuariosCadastrados",
  "formulariosPublicados",
  "notificacoes",
  "relatoriosEnviados",
] as const;
/**
 * Com a fila vazia, a "última sincronização" é renovada no máximo a cada 50 s: o pulso de cada minuto a atualiza, mas
 * foco, volta da rede e outra aba não viram uma escrita no banco (e um aviso às outras abas) a cada chamada. A conta é
 * no relógio da demo, o mesmo da hora mostrada: se ele pula (avançar, resetar), a próxima chamada já renova, e o chip
 * nunca mostra uma sincronização fora do relógio.
 */
const RENOVAR_SINCRONIZACAO_MS = MINUTO_MS - 10_000;

function sincronizacaoVencida(ultimaSimulada: string | null, agoraSimuladoMs: number): boolean {
  const instante = ultimaSimulada ? Date.parse(ultimaSimulada) : Number.NaN;
  if (!Number.isFinite(instante)) return true;
  const passou = agoraSimuladoMs - instante;
  return passou < 0 || passou >= RENOVAR_SINCRONIZACAO_MS;
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
/** Quem descartou cada rascunho nesta aba: só essa pessoa desfaz o descarte (`restaurarRascunho`). */
const descartesNestaAba = new Map<string, string>();

/**
 * Confirmação do envio simulado com o servidor de verdade: a `<Plataforma />` instala `sondarServidor`
 * (src/lib/pwa/servidor.ts), um pedido que o service worker não atende. Com o service worker, a rede do Next pode
 * parecer no ar com o servidor fora (as telas e o RSC saem do cache), e a fila marcava "sincronizado" sem nada ter
 * chegado. Assim, só vira "sincronizado", e só renova a hora da última sincronização, o que passou por um pedido que
 * chegou ao servidor. Sem ela (testes), vale a rede efetiva.
 */
let confirmarComOServidor: (() => Promise<boolean>) | null = null;

export function definirConfirmacaoDoEnvio(confirmar: (() => Promise<boolean>) | null) {
  confirmarComOServidor = confirmar;
}

/** `aoConcluir(true)` quando o servidor recebeu: na hora sem confirmação instalada; senão, depois do pedido. */
function depoisDaConfirmacao(aoConcluir: (chegou: boolean) => void) {
  if (!confirmarComOServidor) {
    aoConcluir(true);
    return;
  }
  void confirmarComOServidor().then(aoConcluir, () => aoConcluir(false));
}

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
      /**
       * Mudança que fecha um estado (entrar, sair, bloquear, registrar, concluir, tratar, relógio, rede, reset): vai já
       * para o IndexedDB, sem os 400 ms da gravação agrupada, que ficam para a digitação do rascunho e o envio da fila.
       * Com a espera, outras mudanças logo depois (sincronização, rede) adiavam a escrita até 2 s e uma recarga nesse
       * meio-tempo voltava ao login com o cookie ainda gravado, ou perdia o registro com o toast já na tela.
       */
      const gravarJa = () => {
        void armazenamento.gravarAgora();
      };

      const iniciarSessao = (usuarioId: string, contexto?: Contexto) => {
        setState({
          usuarioId,
          ...(contexto ? { contexto } : {}),
          bloqueado: false,
          motivoBloqueio: null,
          candidatoId: null,
          turnoDaSessao: chaveDoTurnoAgora(),
        });
        gravarJa();
        setClientCookie(SESSION_COOKIE, usuarioId, 1);
        limparMarcaDeSegundoPlano();
      };

      /** A sincronização com o servidor acabou de acontecer: horário real (auditoria) e o do relógio da demo (chip). */
      const sincronizadoAgora = () => ({
        ultimaSincronizacao: new Date().toISOString(),
        ultimaSincronizacaoSimulada: agora().toISOString(),
      });

      /**
       * PIN de `usuario` em `entrar` e `entrarComPin` (lib/sessao/pin.ts). `null`: certo e sem bloqueio, pode entrar.
       * A contagem vai já para o banco: recarregar a página não dá mais tentativas.
       */
      const conferirPinDe = (usuario: Usuario, pin: string): ResultadoLogin | null => {
        const agoraReal = Date.now();
        const conferencia = conferirPin(getState(), usuario.id, usuario.pin === pin, agoraReal);
        if (conferencia.mudanca) setState(conferencia.mudanca);
        // O acerto grava junto com o início da sessão (`iniciarSessao`).
        if (conferencia.resultado === "certo") return null;
        if (conferencia.mudanca) gravarJa();
        if (conferencia.resultado === "errado") {
          const erro =
            conferencia.restantes === 1 ? "PIN incorreto. Mais um erro bloqueia o PIN por 1 minuto." : "PIN incorreto.";
          return { ok: false, campo: "pin", erro };
        }
        const { bloqueadoAte } = conferencia;
        return {
          ok: false,
          campo: "pin",
          erro: mensagemDeEsperaDoPin(Date.parse(bloqueadoAte), agoraReal),
          bloqueadoAte,
        };
      };

      /**
       * Simula o envio da fila ao servidor quando há rede. O resultado depende da rede efetiva no fim e da confirmação
       * com o servidor (`definirConfirmacaoDoEnvio`): sem ela, o que estava "enviando" vira "erro" e volta na próxima
       * tentativa (rede de volta, foco, minuto).
       */
      const enviarFila = () => {
        const s = getState();
        if (s.rede !== "online") return;
        const ids = idsParaEnviar(s.registros, emEnvioNestaAba, janelasDeDesfazer, agora().getTime());
        if (ids.length === 0) {
          // Nada a enviar e nada no meio do caminho: o tablet está em dia com o servidor, se ele responder.
          if (filaVazia(s.registros) && sincronizacaoVencida(s.ultimaSincronizacaoSimulada, agora().getTime())) {
            depoisDaConfirmacao((chegou) => {
              if (chegou && getState().rede === "online") setState(sincronizadoAgora());
            });
          }
          return;
        }
        for (const id of ids) emEnvioNestaAba.add(id);
        setState({ registros: marcarComo(s.registros, ids, "enviando") });

        setTimeout(() => {
          depoisDaConfirmacao((chegou) => {
            for (const id of ids) emEnvioNestaAba.delete(id);
            const atual = getState();
            const rede = chegou ? atual.rede : "offline";
            const registros = concluirEnvio(atual.registros, ids, rede);
            if (rede === "online") {
              setState({ registros: podarRegistros(registros, agora()), ...sincronizadoAgora() });
            } else {
              setState({ registros });
            }
          });
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
        descartesNestaAba.clear();
      };

      const acoesV05 = criarAcoesV05({
        getState,
        setState,
        agora,
        gravarJa,
        conferirPin: (usuario, pin) => {
          const recusa = conferirPinDe(usuario, pin);
          return recusa && !recusa.ok ? { erro: recusa.erro } : null;
        },
      });

      return {
        ...sessaoAntesDaCarga(),
        ...acoesV05,
        redeNavegador: "online",
        rede: "online",

        entrar: (matricula, pin, contexto) => {
          const usuario = localRepository.usuarioPorMatricula(matricula);
          if (!usuario) return { ok: false, campo: "matricula", erro: "Matrícula não encontrada. Confira o crachá." };
          const recusa = conferirPinDe(usuario, pin);
          if (recusa) return recusa;
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
          const recusa = conferirPinDe(usuario, pin);
          if (recusa) return recusa;
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
          gravarJa();
          deleteClientCookie(SESSION_COOKIE);
        },

        bloquear: (motivo, candidatoId) => {
          const mudanca = aplicarBloqueio(getState(), motivo, candidatoId);
          if (!mudanca) return;
          setState(mudanca);
          gravarJa();
        },

        cancelarTroca: () => {
          const s = getState();
          if (!s.bloqueado || s.motivoBloqueio !== "troca" || !s.usuarioId) return;
          setState({ bloqueado: false, motivoBloqueio: null, candidatoId: null });
          gravarJa();
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
          const { rascunhos, usuarioId } = getState();
          if (!(tarefaId in rascunhos)) return;
          if (usuarioId) descartesNestaAba.set(tarefaId, usuarioId);
          else descartesNestaAba.delete(tarefaId);
          setState({ rascunhos: Object.fromEntries(Object.entries(rascunhos).filter(([id]) => id !== tarefaId)) });
          gravarJa();
        },

        restaurarRascunho: (tarefaId, rascunho) => {
          const { usuarioId, bloqueado } = getState();
          // O aviso com "Desfazer" pode seguir na tela depois da troca: a pessoa seguinte não traz de volta o que a
          // anterior descartou.
          if (bloqueado || !usuarioId || descartesNestaAba.get(tarefaId) !== usuarioId) return false;
          descartesNestaAba.delete(tarefaId);
          setState((s) => ({ rascunhos: { ...s.rascunhos, [tarefaId]: rascunho } }));
          gravarJa();
          return true;
        },

        assumirRascunho: (tarefaId) => {
          const { usuarioId, rascunhos } = getState();
          const rascunho = rascunhos[tarefaId];
          if (!usuarioId || !rascunho || rascunho.iniciadoPor === usuarioId) return;
          setState({
            rascunhos: { ...rascunhos, [tarefaId]: assumirRascunho(rascunho, usuarioId, agora().toISOString()) },
          });
          gravarJa();
        },

        registrarChecklist: ({ tarefa, formulario, rascunho }) => {
          // Fronteira de dados: nada acima dos limites de tamanho entra na fila (domain/limites.ts).
          const respostas = limitarRespostas(rascunho.respostas);
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
            observacao: limitarTexto(rascunho.observacao.trim(), LIMITES.observacao) || undefined,
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
          gravarJa();

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
          gravarJa();
          return true;
        },

        tentarEnviarDeNovo: () => enviarFila(),

        confirmarTarefa: (tarefaId) => {
          const { usuarioId, bloqueado } = getState();
          if (!usuarioId || bloqueado) return;
          setState((s) => ({
            conclusoes: { ...s.conclusoes, [tarefaId]: { estado: "feita", em: agora().toISOString(), usuarioId } },
          }));
          gravarJa();
        },

        desfazerConclusao: (tarefaId) => {
          const { usuarioId, bloqueado, conclusoes } = getState();
          if (bloqueado || !usuarioId || conclusoes[tarefaId]?.usuarioId !== usuarioId) return false;
          setState((s) => ({
            conclusoes: Object.fromEntries(Object.entries(s.conclusoes).filter(([id]) => id !== tarefaId)),
          }));
          gravarJa();
          return true;
        },

        tratarAlerta: (alertaId, tipo, texto) => {
          const { usuarioId, bloqueado } = getState();
          if (!usuarioId || bloqueado) return undefined;
          const acao: AcaoAlerta = {
            tipo,
            texto: limitarTexto(texto, LIMITES.acaoDoAlerta),
            usuarioId,
            em: agora().toISOString(),
          };
          setState((s) => ({
            tratamentos: { ...s.tratamentos, [alertaId]: [...(s.tratamentos[alertaId] ?? []), acao] },
          }));
          gravarJa();
          return acao;
        },

        desfazerTratamento: (alertaId, em) => {
          const { usuarioId, bloqueado, tratamentos } = getState();
          // Como os outros desfazer: o aviso pode seguir na tela depois da troca de pessoa ou do bloqueio.
          if (bloqueado || !usuarioId) return false;
          const proximo = removerUltimaAcao(tratamentos, alertaId, usuarioId, em);
          if (proximo === tratamentos) return false;
          setState({ tratamentos: proximo });
          gravarJa();
          return true;
        },

        avancarRelogio: (minutos) => {
          setState((s) => ({ relogio: avancar(s.relogio, minutos) }));
          gravarJa();
        },

        irParaFimDoTurno: () => {
          const atual = agora();
          const fim = turnoAtual(atual).fim;
          const minutos = Math.max(0, Math.round((fim.getTime() - atual.getTime()) / 60000) - 5);
          setState((s) => ({ relogio: avancar(s.relogio, minutos) }));
          gravarJa();
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
          gravarJa();
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
          gravarJa();
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
        // Nada salvo (primeiro uso do tablet): a demo começa hoje, no lugar do estado fixo da hidratação.
        if (typeof persistido !== "object" || persistido === null) {
          return { ...atual, ...sessaoInicial(), rede: redeEfetiva(atual.redeNavegador, false) };
        }
        const salvo = persistido as Partial<SessaoPersistida>;
        const relogio = salvo.relogio ?? atual.relogio;
        alinharEscalaAoDia(dataLocal(agoraSimulado(relogio)));
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
      // Sucesso ou falha ao ler o IndexedDB: o app segue (com o estado salvo ou, sem banco, só em memória). Na falha, a
      // demo de hoje no lugar do estado fixo da hidratação, como no primeiro uso.
      onRehydrateStorage: () => (_estado, erro) => {
        if (erro) useSessionStore.setState(sessaoInicial());
        marcarSessaoCarregada();
      },
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

/**
 * Cadastros do tablet (usuários da Assistência, checklists publicados pela Especialista) no repositório, para login,
 * rotinas e checklist enxergarem o que foi cadastrado. Roda já com o estado inicial e a cada mudança desses mapas.
 */
definirCadastrosDoTablet({
  usuarios: useSessionStore.getState().usuariosCadastrados,
  formularios: useSessionStore.getState().formulariosPublicados,
});
useSessionStore.subscribe((s, anterior) => {
  if (
    s.usuariosCadastrados !== anterior.usuariosCadastrados ||
    s.formulariosPublicados !== anterior.formulariosPublicados
  ) {
    definirCadastrosDoTablet({ usuarios: s.usuariosCadastrados, formularios: s.formulariosPublicados });
  }
});

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
 * Horário simulado da demo. Todas as chamadas compartilham um só ticker: o valor muda na virada de cada minuto
 * simulado e imediatamente quando o relógio da demo muda.
 *
 * O valor novo chega por `useDeferredValue` (critério 8): um avanço do relógio re-renderiza a tela inteira (tarefas,
 * linha do turno, prazos), e o `useSyncExternalStore` sozinho faz esse render síncrono, numa tarefa só. Adiado, o
 * React o faz em segundo plano, em fatias, e o toque que avançou o relógio não espera por ele; a tela troca de hora
 * inteira de uma vez, no mesmo commit. Ações do store usam o relógio do próprio store, nunca este valor.
 */
export function useAgora(): Date {
  return useDeferredValue(useSyncExternalStore(ticker.assinar, ticker.agora, () => AGORA_NO_SERVIDOR));
}

/** Bloqueio salvo do PIN da pessoa (ISO), se houver. */
function bloqueioSalvoDoPin(usuarioId: string | undefined): string | undefined {
  return usuarioId ? useSessionStore.getState().pinBloqueadoAte[usuarioId] : undefined;
}

function assinarMudancasDoPin(aoMudar: () => void): () => void {
  return useSessionStore.subscribe((s, anterior) => {
    if (s.pinBloqueadoAte !== anterior.pinBloqueadoAte) aoMudar();
  });
}

/**
 * Até quando o PIN da pessoa está bloqueado por tentativas (`MAX_TENTATIVAS_PIN` erros seguidos), ou `null`. Volta a
 * `null` sozinho no instante do desbloqueio, com um único `setTimeout` até esse instante (não um relógio; ver
 * `assinarDesbloqueioDoPin`). Para mostrar os segundos que faltam, `segundosParaDesbloquear`. No servidor e na
 * hidratação, `null`.
 */
export function usePinBloqueadoAte(usuarioId?: string): Date | null {
  const assinar = useCallback(
    (aoMudar: () => void) =>
      assinarDesbloqueioDoPin(
        { lerAte: () => bloqueioSalvoDoPin(usuarioId), assinarMudancas: assinarMudancasDoPin },
        aoMudar,
      ),
    [usuarioId],
  );
  const ate = useSyncExternalStore(
    assinar,
    () => bloqueioVigente(bloqueioSalvoDoPin(usuarioId), Date.now()),
    () => null,
  );
  return useMemo(() => (ate === null ? null : new Date(ate)), [ate]);
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
