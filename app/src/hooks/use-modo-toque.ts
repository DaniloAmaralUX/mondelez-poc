"use client";

import { useSyncExternalStore } from "react";

const PONTEIRO_GROSSO = "(pointer: coarse)";

/**
 * Tablet (toque) ou notebook (ponteiro fino), pelo mesmo critério da variante `toque:` de src/styles/tablet.css:
 * ponteiro grosso, salvo `html[data-density="fine"]`; ou `html[data-density="touch"]` em qualquer aparelho (override da
 * demonstração). Só no navegador: leia em efeitos e eventos, nunca no render do servidor.
 */
export function modoToque(): boolean {
  const densidade = document.documentElement.dataset.density;
  if (densidade === "touch") return true;
  if (densidade === "fine") return false;
  return window.matchMedia(PONTEIRO_GROSSO).matches;
}

function assinarPonteiro(aoMudar: () => void) {
  const consulta = window.matchMedia(PONTEIRO_GROSSO);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

function assinarModoToque(aoMudar: () => void) {
  const soltarPonteiro = assinarPonteiro(aoMudar);
  // O override da demonstração muda o atributo do <html> sem recarregar.
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-density"] });
  return () => {
    soltarPonteiro();
    observador.disconnect();
  };
}

/**
 * `modoToque()` como estado do React, para decisões que o CSS não alcança (ex.: a variante de um componente). No
 * servidor e na hidratação vale `false` (notebook), igual ao HTML gerado; telas montadas depois da carga da sessão já
 * nascem com o valor do aparelho.
 */
export function useModoToque(): boolean {
  return useSyncExternalStore(assinarModoToque, modoToque, () => false);
}

const ponteiroGrosso = () => window.matchMedia(PONTEIRO_GROSSO).matches;

/**
 * Só o ponteiro do aparelho (`pointer: coarse`), sem o override `html[data-density]`: para o que depende do dedo de
 * verdade, e não da densidade da tela. Ex.: a sidebar não recolhe em ícones no toque porque o tooltip dos rótulos não
 * abre com o dedo, e com o mouse ele abre mesmo com a densidade de toque ligada. No servidor e na hidratação, `false`.
 */
export function usePonteiroGrossoReal(): boolean {
  return useSyncExternalStore(assinarPonteiro, ponteiroGrosso, () => false);
}
