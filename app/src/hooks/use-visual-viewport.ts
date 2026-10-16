"use client";

import { useSyncExternalStore } from "react";

function assinar(aoMudar: () => void) {
  const vv = window.visualViewport;
  window.addEventListener("resize", aoMudar);
  vv?.addEventListener("resize", aoMudar);
  vv?.addEventListener("scroll", aoMudar);
  return () => {
    window.removeEventListener("resize", aoMudar);
    vv?.removeEventListener("resize", aoMudar);
    vv?.removeEventListener("scroll", aoMudar);
  };
}

function lerDeslocamento(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  // Zoom com pinça também encolhe a área visível, mas não é teclado: a barra fica onde está.
  if (vv.scale > 1.01) return 0;
  const coberto = window.innerHeight - (vv.height + vv.offsetTop);
  return coberto >= 1 ? Math.round(coberto) : 0;
}

// No servidor e na hidratação não há teclado: 0. O valor real só é lido depois de montar.
const semDeslocamento = () => 0;

/**
 * Quantos pixels do rodapé da janela o teclado virtual cobre agora (0 sem teclado).
 *
 * No Chrome do Android o `interactive-widget=resizes-content` do viewport já encolhe a janela e o valor fica 0. No iPad
 * o Safari ignora essa opção: a janela (layout viewport) continua do tamanho da tela e o teclado só encolhe a área
 * visível (`visualViewport`). O que fica sob o teclado é `innerHeight − (vv.height + vv.offsetTop)`; uma barra fixa no
 * rodapé sobe exatamente isso para continuar à vista.
 *
 * Um número primitivo como snapshot: só renderiza de novo quando o deslocamento muda (rolar sem teclado não renderiza).
 */
export function useDeslocamentoDoTeclado(): number {
  return useSyncExternalStore(assinar, lerDeslocamento, semDeslocamento);
}
