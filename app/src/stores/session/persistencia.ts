import { createStore, del, get, set } from "idb-keyval";
import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Escritas agrupadas: digitar no rascunho não serializa o estado do tablet a cada tecla. Mudanças que fecham um estado
 * (entrar, registrar, bloquear...) não esperam: o store chama `gravarAgora` logo depois delas.
 */
export const ATRASO_GRAVACAO_MS = 400;
/** Mudanças seguidas (digitação contínua) não adiam a escrita além disso. */
const ESPERA_MAXIMA_MS = 2000;
/** Canal entre abas do mesmo aparelho (mesmo nome da chave salva). */
const NOME_CANAL = "rotinas-sessao";
/** Trava entre abas (Web Locks API): ler, juntar e gravar acontecem uma aba de cada vez. */
const NOME_TRAVA = "rotinas-sessao";
/** Banco e object store do tablet (os mesmos do `createStore` do idb-keyval). */
const NOME_BANCO = "rotinas-db";
const NOME_STORE = "sessao";

type Banco = ReturnType<typeof createStore>;
type Objeto = Record<string, unknown>;

/** O que fica no IndexedDB: o valor do persist com a revisão (conta as gravações de todas as abas). */
type ValorSalvo<S> = StorageValue<S> & { rev?: number };

export interface ArmazenamentoSessao<S> extends PersistStorage<S> {
  /**
   * Grava já o que estiver pendente (mudança que fecha um estado, antes de uma ação que pode fechar a página). Resolve
   * quando o banco tem o estado atual, inclusive se a gravação já tinha começado.
   */
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
 * - escrita com debounce de 400 ms (no máximo 2 s), sempre do estado atual; `gravarAgora` pula a espera;
 * - na saída da página (`pagehide` / oculto), o que ainda não está no banco é gravado de forma síncrona
 *   (`gravarNaSaida`): com promessas no caminho, o `put` não saía antes do descarte e uma recarga perdia a mudança;
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
  let ultimaGravacao: Promise<void> = Promise.resolve();
  /**
   * Conexão própria, já aberta, só para a gravação na saída da página: ali não dá para esperar promessas (a do
   * `createStore` resolve depois que a página já foi descartada).
   */
  let conexao: IDBDatabase | undefined;
  let abrindoConexao = false;
  /** Aumenta a cada gravação na saída: a gravação comum que estava no meio é abandonada (a da saída levou tudo). */
  let gravacoesNaSaida = 0;
  /**
   * Avisos de outras abas recebidos e já juntados com a memória, e uma gravação no meio da junção com o que outra aba
   * gravou. Enquanto houver algo por juntar, gravar às cegas na saída apagaria do banco o que a outra aba gravou.
   */
  let avisosRecebidos = 0;
  let avisosJuntados = 0;
  let juntandoOutraAba = false;

  const obterBanco = () => {
    banco ??= createStore(NOME_BANCO, NOME_STORE);
    return banco;
  };

  function abrirConexao() {
    if (conexao !== undefined || abrindoConexao) return;
    if (typeof indexedDB === "undefined" || typeof indexedDB.open !== "function") return;
    abrindoConexao = true;
    try {
      const pedido = indexedDB.open(NOME_BANCO);
      // Mesmo upgrade do `createStore`: quem abrir primeiro cria o store.
      pedido.onupgradeneeded = () => pedido.result.createObjectStore(NOME_STORE);
      pedido.onsuccess = () => {
        abrindoConexao = false;
        const db = pedido.result;
        conexao = db;
        // Navegador fechou a conexão ou outra versão do banco pediu passagem: a saída volta ao caminho comum.
        db.onclose = () => {
          if (conexao === db) conexao = undefined;
        };
        db.onversionchange = () => {
          db.close();
          if (conexao === db) conexao = undefined;
        };
      };
      pedido.onerror = () => {
        abrindoConexao = false;
      };
    } catch {
      abrindoConexao = false;
    }
  }

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
    ultimaGravacao = comTrava(async () => {
      const saida = gravacoesNaSaida;
      const avisos = avisosRecebidos;
      const valor = lerValor();
      if (base !== undefined && mesmoConteudo(base, valor.state)) return;
      const noBanco = await lerDoBanco(nome);
      // A saída da página gravou enquanto esta lia, com o estado mais novo: não há o que acrescentar.
      if (saida !== gravacoesNaSaida) return;
      const outraAbaGravou = noBanco !== null && base !== undefined && noBanco.rev !== revisao;
      const gravado: ValorSalvo<S> = {
        state:
          outraAbaGravou && base !== undefined ? mesclarEstados(noBanco.state, base, valor.state, campos) : valor.state,
        version: valor.version,
        rev: (noBanco?.rev ?? 0) + 1,
      };
      juntandoOutraAba = outraAbaGravou;
      try {
        try {
          await set(nome, gravado, obterBanco());
        } catch {
          // Cota cheia ou banco indisponível: o estado continua em memória e a próxima mudança tenta de novo.
          return;
        }
        // A saída gravou depois desta (só acontece sem junção pendente): base e revisão já são as dela.
        if (saida !== gravacoesNaSaida) return;
        if (outraAbaGravou) {
          // O banco agora tem também o que a outra aba gravou: a memória daqui passa a ter.
          incorporar(gravado, valor.state);
        } else {
          base = valor.state;
          revisao = gravado.rev;
        }
        avisosJuntados = Math.max(avisosJuntados, avisos);
      } finally {
        juntandoOutraAba = false;
      }
      obterCanal()?.postMessage({ tipo: "gravou" });
      if (legadoParaApagar !== null) {
        const legado = legadoParaApagar;
        legadoParaApagar = null;
        await del(legado).catch(() => undefined);
      }
    });
    return ultimaGravacao;
  }

  function reler(nome: string): Promise<void> {
    return comTrava(async () => {
      // Antes da primeira leitura não há base: a carga inicial já traz o que estiver salvo.
      if (base === undefined) return;
      const avisos = avisosRecebidos;
      const lido = await lerDoBanco(nome);
      if (lido && lido.rev !== revisao) incorporar(lido, base);
      avisosJuntados = Math.max(avisosJuntados, avisos);
    });
  }

  function cancelarPendente() {
    if (pendente) clearTimeout(pendente.timer);
    pendente = null;
  }

  /**
   * Sem escrita agendada, devolve a última gravação (pode estar no meio): quem espera sabe quando está no banco. Com a
   * página oculta (indo embora), grava de forma síncrona como na saída: o `visibilitychange` do checklist salva o
   * rascunho e chama isto depois do `pagehide`, e uma gravação por promessas não terminaria.
   */
  function gravarAgora() {
    if (typeof document !== "undefined" && document.visibilityState === "hidden" && gravarNaSaida()) {
      return Promise.resolve();
    }
    if (!pendente) return ultimaGravacao;
    const { nome } = pendente;
    cancelarPendente();
    return gravar(nome);
  }

  /**
   * Saída da página (`pagehide`, oculto): o que a memória tem e o banco ainda não (escrita agendada ou uma gravação no
   * meio da trava ou da leitura) vai já, numa transação síncrona da conexão aberta, com `commit()`, sem trava entre
   * abas e sem ler o banco antes. É a única forma de o `put` sair antes do descarte. Só grava às cegas quando é seguro:
   * nenhuma outra aba gravou algo que esta ainda não juntou. Devolve false quando não deu (fica o caminho comum).
   */
  function gravarNaSaida(): boolean {
    const nome = nomeLido ?? pendente?.nome;
    if (conexao === undefined || nome === undefined || base === undefined || !podeGravar()) return false;
    if (juntandoOutraAba || avisosJuntados !== avisosRecebidos) return false;
    const valor = lerValor();
    if (mesmoConteudo(base, valor.state)) {
      cancelarPendente();
      return true;
    }
    const baseAntes = base;
    const revisaoAntes = revisao;
    const gravado: ValorSalvo<S> = { state: valor.state, version: valor.version, rev: (revisao ?? 0) + 1 };
    try {
      const transacao = conexao.transaction(NOME_STORE, "readwrite");
      transacao.objectStore(NOME_STORE).put(gravado, nome);
      // Se a gravação falhar (página viva, ex.: só oculta), a memória volta a valer como "não gravada".
      transacao.onabort = () => {
        if (revisao !== gravado.rev) return;
        base = baseAntes;
        revisao = revisaoAntes;
        void gravar(nome);
      };
      // Pede a gravação já, sem esperar o fim da tarefa (Chrome 76+, Safari 15+).
      if (typeof transacao.commit === "function") transacao.commit();
    } catch {
      return false;
    }
    cancelarPendente();
    gravacoesNaSaida += 1;
    base = valor.state;
    revisao = gravado.rev;
    obterCanal()?.postMessage({ tipo: "gravou" });
    return true;
  }

  if (typeof window !== "undefined") {
    const aoSair = () => {
      if (!gravarNaSaida()) void gravarAgora();
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
      abrirConexao();
      const avisos = avisosRecebidos;
      const atual = await lerDoBanco(nome);
      avisosJuntados = Math.max(avisosJuntados, avisos);
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
      // Se o navegador fechou a conexão da saída (Safari faz isso), reabre para a próxima saída.
      abrirConexao();
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
      cancelarPendente();
      base = undefined;
      revisao = undefined;
      if (typeof indexedDB !== "undefined") await del(nome, obterBanco());
    },

    gravarAgora,

    ouvirOutrasAbas() {
      const c = obterCanal();
      if (!c) return () => undefined;
      const aoReceber = () => {
        avisosRecebidos += 1;
        if (nomeLido !== undefined) void reler(nomeLido);
      };
      c.addEventListener("message", aoReceber);
      return () => c.removeEventListener("message", aoReceber);
    },
  };
}
