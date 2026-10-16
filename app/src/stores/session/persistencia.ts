import { createStore, del, get, set } from "idb-keyval";
import type { PersistStorage, StorageValue } from "zustand/middleware";

/** Escritas agrupadas: responder o checklist não serializa o estado do tablet a cada toque. */
export const ATRASO_GRAVACAO_MS = 400;
/** Mudanças seguidas (digitação contínua) não adiam a escrita além disso. */
const ESPERA_MAXIMA_MS = 2000;
/** Canal entre abas do mesmo aparelho (mesmo nome da chave salva). */
const NOME_CANAL = "rotinas-sessao";
/** Trava entre abas (Web Locks API): ler, juntar e gravar acontecem uma aba de cada vez. */
const NOME_TRAVA = "rotinas-sessao";

type Banco = ReturnType<typeof createStore>;
type Objeto = Record<string, unknown>;

/** O que fica no IndexedDB: o valor do persist com a revisão (conta as gravações de todas as abas). */
type ValorSalvo<S> = StorageValue<S> & { rev?: number };

export interface ArmazenamentoSessao<S> extends PersistStorage<S> {
  /** Grava já o que estiver pendente (saída da página, antes de uma ação que pode fechar a página). */
  gravarAgora: () => Promise<void>;
  /**
   * Avisa quando outra aba gravou: esta relê o banco e junta com o que mudou nela e ainda não foi gravado (nada se
   * perde dos dois lados). Devolve o desligamento.
   */
  ouvirOutrasAbas: () => () => void;
}

interface OpcoesArmazenamento<S> {
  /** Valor a gravar, lido na hora da escrita (nunca um retrato antigo do estado). */
  lerValor: () => StorageValue<S>;
  /** Só grava depois de carregar o que já estava salvo: nunca sobrescreve o banco com o estado inicial. */
  podeGravar: () => boolean;
  /** Campos que são mapas por id (registros, conclusões...): entre abas, a junção é chave a chave. */
  camposPorChave: readonly (keyof S & string)[];
  /** Põe na memória desta aba o resultado da junção com o que outra aba gravou. */
  aplicar: (estado: S) => void;
}

const comoObjeto = (valor: unknown): Objeto => (typeof valor === "object" && valor !== null ? (valor as Objeto) : {});

/** Igual por valor (o estado salvo é serializável). Referência igual, o caso comum, não serializa nada. */
function igual(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function mesmoConteudo(a: object, b: object): boolean {
  const oa = a as Objeto;
  const ob = b as Objeto;
  const chaves = Object.keys(oa);
  return chaves.length === Object.keys(ob).length && chaves.every((k) => igual(oa[k], ob[k]));
}

function mesmasReferencias(a: Objeto, b: Objeto): boolean {
  const chaves = Object.keys(a);
  return chaves.length === Object.keys(b).length && chaves.every((k) => a[k] === b[k]);
}

function mesclarMapa(doBanco: unknown, base: unknown, local: unknown, reaproveitar: boolean): Objeto {
  const d = comoObjeto(doBanco);
  const b = comoObjeto(base);
  const l = comoObjeto(local);
  const resultado: Objeto = {};
  for (const [chave, valor] of Object.entries(d)) {
    resultado[chave] = reaproveitar && chave in l && igual(valor, l[chave]) ? l[chave] : valor;
  }
  for (const chave of new Set([...Object.keys(b), ...Object.keys(l)])) {
    if (igual(l[chave], b[chave])) continue;
    // Mudou nesta aba (criado, alterado ou removido): a versão daqui vence só nesta chave.
    if (chave in l) resultado[chave] = l[chave];
    else delete resultado[chave];
  }
  return reaproveitar && mesmasReferencias(resultado, l) ? l : resultado;
}

/**
 * Junção em três vias, campo a campo: parte do que está no banco (`doBanco`, com o que outras abas gravaram) e aplica
 * por cima só o que esta aba mudou desde a `base` (o último estado do banco que ela incorporou). Nos mapas por id a
 * junção é chave a chave, com remoções. Com `reaproveitar`, valores iguais aos da memória mantêm a referência local
 * (o cache de tarefas e alertas não recalcula) e, se nada muda, devolve o próprio `local`.
 */
export function mesclarEstados<S extends object>(
  doBanco: S,
  base: S,
  local: S,
  camposPorChave: ReadonlySet<string>,
  reaproveitar = false,
): S {
  const d = doBanco as Objeto;
  const b = base as Objeto;
  const l = local as Objeto;
  const resultado: Objeto = {};
  for (const campo of new Set([...Object.keys(d), ...Object.keys(l)])) {
    if (camposPorChave.has(campo)) resultado[campo] = mesclarMapa(d[campo], b[campo], l[campo], reaproveitar);
    else if (!igual(l[campo], b[campo])) resultado[campo] = l[campo];
    else resultado[campo] = reaproveitar && igual(d[campo], l[campo]) ? l[campo] : d[campo];
  }
  return reaproveitar && mesmasReferencias(resultado, l) ? local : (resultado as S);
}

function decodificar<S>(valor: unknown): ValorSalvo<S> | null {
  if (typeof valor === "string") {
    try {
      return JSON.parse(valor) as ValorSalvo<S>;
    } catch {
      return null;
    }
  }
  return typeof valor === "object" && valor !== null ? (valor as ValorSalvo<S>) : null;
}

/**
 * Armazenamento do estado do tablet para o `persist` do Zustand:
 * - banco próprio no IndexedDB (`rotinas-db`, store `sessao`), com o objeto salvo direto (sem JSON);
 * - se a chave ainda não existe no banco novo, lê a da v0.2 no banco padrão do idb-keyval; ela é apagada depois da
 *   primeira gravação no banco novo (nada se perde se a página fechar no meio);
 * - escrita com debounce de 400 ms (no máximo 2 s), sempre do estado atual, e flush em `pagehide` / oculto;
 * - escrita sem mudança desde a última leitura ou gravação é descartada;
 * - várias abas: cada gravação lê o banco e, se outra aba gravou nesse meio-tempo, grava o banco com só as mudanças
 *   desta aba por cima (junção em três vias), dentro de uma trava entre abas. Depois avisa as outras pelo
 *   BroadcastChannel; quem recebe relê e junta com o que ainda não gravou. Reler não grava, então não há laço.
 */
export function criarArmazenamentoSessao<S extends object>({
  lerValor,
  podeGravar,
  camposPorChave,
  aplicar,
}: OpcoesArmazenamento<S>): ArmazenamentoSessao<S> {
  const campos: ReadonlySet<string> = new Set(camposPorChave);
  let banco: Banco | undefined;
  let canal: BroadcastChannel | null | undefined;
  let pendente: { nome: string; desde: number; timer: ReturnType<typeof setTimeout> } | null = null;
  /** Último estado do banco que esta aba incorporou (ou o dela, logo depois de gravar): base da junção. */
  let base: S | undefined;
  /** Revisão do banco que a memória desta aba já contém. */
  let revisao: number | undefined;
  let nomeLido: string | undefined;
  let legadoParaApagar: string | null = null;
  let filaDaAba: Promise<void> = Promise.resolve();

  const obterBanco = () => {
    banco ??= createStore("rotinas-db", "sessao");
    return banco;
  };

  const obterCanal = () => {
    if (canal === undefined) canal = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(NOME_CANAL);
    return canal;
  };

  /** Uma operação de cada vez: entre abas pela Web Locks API; sem ela, ao menos dentro desta aba. */
  function comTrava(tarefa: () => Promise<void>): Promise<void> {
    const travas = typeof navigator === "undefined" ? undefined : navigator.locks;
    // A trava fica com a aba até a promessa da tarefa terminar.
    if (travas) return travas.request(NOME_TRAVA, tarefa).then(() => undefined);
    const proxima = filaDaAba.then(tarefa, tarefa);
    filaDaAba = proxima.catch(() => undefined);
    return proxima;
  }

  async function lerDoBanco(nome: string): Promise<ValorSalvo<S> | null> {
    try {
      return decodificar<S>(await get(nome, obterBanco()));
    } catch {
      return null;
    }
  }

  /** Junta o que está no banco com a memória (o que mudou aqui desde `ancestral` fica) e passa a usá-lo como base. */
  function incorporar(lido: ValorSalvo<S>, ancestral: S) {
    const atual = lerValor().state;
    const mesclado = mesclarEstados(lido.state, ancestral, atual, campos, true);
    base = lido.state;
    revisao = lido.rev;
    if (mesclado !== atual) aplicar(mesclado);
  }

  function gravar(nome: string): Promise<void> {
    if (!podeGravar()) return Promise.resolve();
    return comTrava(async () => {
      const valor = lerValor();
      if (base !== undefined && mesmoConteudo(base, valor.state)) return;
      const noBanco = await lerDoBanco(nome);
      const outraAbaGravou = noBanco !== null && base !== undefined && noBanco.rev !== revisao;
      const gravado: ValorSalvo<S> = {
        state:
          outraAbaGravou && base !== undefined ? mesclarEstados(noBanco.state, base, valor.state, campos) : valor.state,
        version: valor.version,
        rev: (noBanco?.rev ?? 0) + 1,
      };
      try {
        await set(nome, gravado, obterBanco());
      } catch {
        // Cota cheia ou banco indisponível: o estado continua em memória e a próxima mudança tenta de novo.
        return;
      }
      if (outraAbaGravou) {
        // O banco agora tem também o que a outra aba gravou: a memória daqui passa a ter.
        incorporar(gravado, valor.state);
      } else {
        base = valor.state;
        revisao = gravado.rev;
      }
      obterCanal()?.postMessage({ tipo: "gravou" });
      if (legadoParaApagar !== null) {
        const legado = legadoParaApagar;
        legadoParaApagar = null;
        await del(legado).catch(() => undefined);
      }
    });
  }

  function reler(nome: string): Promise<void> {
    return comTrava(async () => {
      // Antes da primeira leitura não há base: a carga inicial já traz o que estiver salvo.
      if (base === undefined) return;
      const lido = await lerDoBanco(nome);
      if (!lido || lido.rev === revisao) return;
      incorporar(lido, base);
    });
  }

  function gravarAgora() {
    if (!pendente) return Promise.resolve();
    clearTimeout(pendente.timer);
    const { nome } = pendente;
    pendente = null;
    return gravar(nome);
  }

  if (typeof window !== "undefined") {
    const aoSair = () => {
      void gravarAgora();
    };
    window.addEventListener("pagehide", aoSair);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") aoSair();
    });
  }

  return {
    async getItem(nome) {
      if (typeof indexedDB === "undefined") return null;
      nomeLido = nome;
      const atual = await lerDoBanco(nome);
      if (atual) {
        base = atual.state;
        revisao = atual.rev;
        return atual;
      }
      // v0.2 gravava no banco padrão do idb-keyval, como texto JSON.
      const legado = decodificar<S>(await get(nome).catch(() => undefined));
      if (legado) {
        legadoParaApagar = nome;
        base = legado.state;
        return legado;
      }
      // Banco vazio: a base é o estado inicial em memória (o que mudar daqui em diante é desta aba).
      base = lerValor().state;
      return null;
    },

    setItem(nome) {
      if (typeof window === "undefined") return;
      const agora = Date.now();
      // Já esperando há tempo demais: deixa a escrita agendada sair (ela lê o estado atual na hora).
      if (pendente && agora - pendente.desde >= ESPERA_MAXIMA_MS) return;
      if (pendente) clearTimeout(pendente.timer);
      pendente = {
        nome,
        desde: pendente?.desde ?? agora,
        timer: setTimeout(() => {
          pendente = null;
          void gravar(nome);
        }, ATRASO_GRAVACAO_MS),
      };
    },

    async removeItem(nome) {
      if (pendente) clearTimeout(pendente.timer);
      pendente = null;
      base = undefined;
      revisao = undefined;
      if (typeof indexedDB !== "undefined") await del(nome, obterBanco());
    },

    gravarAgora,

    ouvirOutrasAbas() {
      const c = obterCanal();
      if (!c) return () => undefined;
      const aoReceber = () => {
        if (nomeLido !== undefined) void reler(nomeLido);
      };
      c.addEventListener("message", aoReceber);
      return () => c.removeEventListener("message", aoReceber);
    },
  };
}
