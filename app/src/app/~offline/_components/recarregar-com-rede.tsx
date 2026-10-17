"use client";

import { useEffect } from "react";

/**
 * A página offline ocupa a URL da tela pedida: quando a rede volta, recarregar abre a tela de verdade, como o
 * `dashboard/loading.tsx` faz sozinho com o retry do Next. Não há nada digitado aqui para perder.
 */
export function RecarregarComRede() {
  useEffect(() => {
    const recarregar = () => window.location.reload();
    window.addEventListener("online", recarregar);
    return () => window.removeEventListener("online", recarregar);
  }, []);

  return null;
}
