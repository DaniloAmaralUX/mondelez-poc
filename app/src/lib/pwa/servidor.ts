/**
 * O servidor responde? Um HEAD em `/api/saude` (src/app/api/saude/route.ts), que o service worker não atende: ele só
 * trata GET (lib/pwa/regras-do-cache.ts). Com o service worker, a página não vê a falha de rede: a tela ou o RSC sai do
 * cache, ou vem o 503 que abre a tela pelo navegador, e o `useOffline` do Next conta isso como resposta do servidor.
 * `navigator.onLine` também não basta: com o Wi-Fi ligado e o servidor fora, ele segue `true`.
 *
 * - A `<Plataforma />` sonda ao abrir, quando o Wi-Fi volta (`online`), quando o service worker avisa que um pedido não
 *   chegou (`AVISO_SEM_REDE`) e antes de cada envio da fila (`definirConfirmacaoDoEnvio` no session-store).
 * - Uma sondagem por vez: quem chama no meio dela recebe o mesmo resultado.
 * - Sem resposta em `PRAZO_DA_SONDAGEM_MS` (Wi-Fi ligado que não responde) ou com erro, tenta de novo depois de
 *   `ESPERAS_ENTRE_SONDAGENS_MS`, enquanto o navegador estiver com rede; o `online` recomeça.
 * - `offline` do navegador (`semRedeNoNavegador`): sem resposta na hora, sem sondar até o `online`.
 *
 * Começa respondendo (`true`), como a rede do store antes da primeira leitura: o chip não pisca "Sem rede" a cada carga.
 */
export const ENDERECO_DA_SAUDE = "/api/saude";
export const PRAZO_DA_SONDAGEM_MS = 4000;
export const ESPERAS_ENTRE_SONDAGENS_MS = [1000, 2000, 4000, 8000] as const;

let responde = true;
let emCurso: Promise<boolean> | null = null;
let tentativas = 0;
let proxima: ReturnType<typeof setTimeout> | undefined;
const ouvintes = new Set<() => void>();

function definir(valor: boolean) {
  if (responde === valor) return;
  responde = valor;
  for (const ouvinte of ouvintes) ouvinte();
}

function cancelarProxima() {
  clearTimeout(proxima);
  proxima = undefined;
}

async function pedirSaude(): Promise<boolean> {
  const controle = new AbortController();
  const prazo = setTimeout(() => controle.abort(), PRAZO_DA_SONDAGEM_MS);
  try {
    const resposta = await fetch(ENDERECO_DA_SAUDE, { method: "HEAD", cache: "no-store", signal: controle.signal });
    return resposta.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(prazo);
  }
}

/** Confere agora se o servidor responde; `true` quando um pedido de verdade chegou a ele. */
export function sondarServidor(): Promise<boolean> {
  if (emCurso !== null) return emCurso;
  cancelarProxima();
  emCurso = pedirSaude().then((ok) => {
    emCurso = null;
    definir(ok);
    if (ok) {
      tentativas = 0;
    } else if (navigator.onLine) {
      const espera = ESPERAS_ENTRE_SONDAGENS_MS[Math.min(tentativas, ESPERAS_ENTRE_SONDAGENS_MS.length - 1)];
      tentativas += 1;
      proxima = setTimeout(() => void sondarServidor(), espera);
    }
    return ok;
  });
  return emCurso;
}

/** O navegador perdeu a rede (`offline`): o servidor não responde, e a próxima sondagem fica para o `online`. */
export function semRedeNoNavegador() {
  cancelarProxima();
  tentativas = 0;
  definir(false);
}

export function servidorResponde(): boolean {
  return responde;
}

export function assinarServidor(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}
