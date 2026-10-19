"use client";

import { useEffect, useState } from "react";

import { createStore, del, get, set } from "idb-keyval";

/**
 * Fotos de evidência (v0.5, RM-08): ficam num banco próprio do IndexedDB, fora do estado do Zustand, para a gravação
 * agrupada e a junção entre abas (stores/session/persistencia.ts) não carregarem imagens. O registro guarda só os ids
 * (`Resposta.fotos`). No piloto, as fotos sobem para o servidor com retenção de 10 anos (RNF-07); no protótipo ficam no
 * tablet.
 */
const banco = typeof indexedDB === "undefined" ? undefined : createStore("rotinas-fotos", "fotos");

/** Lado maior da foto guardada, em pixels: legível para lote e etiqueta, leve para o tablet. */
const LADO_MAXIMO = 1280;
const QUALIDADE = 0.8;

/** Reduz e converte para JPEG. Sem canvas (teste, navegador antigo), guarda o arquivo como veio. */
async function comprimir(arquivo: Blob): Promise<Blob> {
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") return arquivo;
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    imagem.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? arquivo), "image/jpeg", QUALIDADE));
  } catch {
    return arquivo;
  }
}

/** Guarda a foto e devolve o id para pôr na resposta do item. */
export async function salvarFoto(arquivo: Blob): Promise<string> {
  const id = `foto-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  if (!banco) return id;
  await set(id, await comprimir(arquivo), banco);
  return id;
}

export async function apagarFoto(id: string): Promise<void> {
  if (banco) await del(id, banco);
}

/** URL da foto para `<img src>`, ou null enquanto carrega ou se ela não está neste tablet. */
export function useFoto(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id || !banco) return;
    let ativo = true;
    let criada: string | null = null;
    void get<Blob>(id, banco).then((blob) => {
      if (!ativo || !blob) return;
      criada = URL.createObjectURL(blob);
      setUrl(criada);
    });
    return () => {
      ativo = false;
      if (criada) URL.revokeObjectURL(criada);
      setUrl(null);
    };
  }, [id]);
  return url;
}
