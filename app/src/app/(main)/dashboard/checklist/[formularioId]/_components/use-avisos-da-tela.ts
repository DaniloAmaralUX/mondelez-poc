"use client";

import * as React from "react";

import { toast } from "sonner";

/**
 * Toasts cujo "Desfazer" mexe no formulário aberto (Restantes conformes, Registrar desvio). Se a tela fechar antes dos
 * 10 s, eles somem junto: um "Desfazer" que não faz nada é pior que nenhum. Uso: `avisar(toast(...))`.
 *
 * `dispensar()` tira os avisos desta tela antes da hora: ao trocar de etapa (o "Desfazer" de uma etapa que saiu da
 * vista mexeria em itens que a pessoa não vê, e os avisos empilhados cobrem o cabeçalho do modo foco) e ao abrir
 * "Ver documento" (cobririam Imprimir). As respostas continuam editáveis item a item.
 */
export function useAvisosDaTela() {
  const abertos = React.useRef(new Set<string | number>());

  const dispensar = React.useCallback(() => {
    const ids = abertos.current;
    for (const id of ids) toast.dismiss(id);
    ids.clear();
  }, []);

  React.useEffect(() => dispensar, [dispensar]);

  const avisar = React.useCallback((id: string | number) => {
    abertos.current.add(id);
    return id;
  }, []);

  return { avisar, dispensar };
}
