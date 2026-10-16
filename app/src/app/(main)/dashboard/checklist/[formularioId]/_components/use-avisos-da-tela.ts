"use client";

import * as React from "react";

import { toast } from "sonner";

/**
 * Toasts cujo "Desfazer" mexe no formulário aberto (Restantes conformes, Registrar desvio). Se a tela fechar antes dos
 * 10 s, eles somem junto: um "Desfazer" que não faz nada é pior que nenhum. Uso: `avisar(toast(...))`.
 */
export function useAvisosDaTela() {
  const abertos = React.useRef(new Set<string | number>());

  React.useEffect(() => {
    const ids = abertos.current;
    return () => {
      for (const id of ids) toast.dismiss(id);
      ids.clear();
    };
  }, []);

  return React.useCallback((id: string | number) => {
    abertos.current.add(id);
    return id;
  }, []);
}
