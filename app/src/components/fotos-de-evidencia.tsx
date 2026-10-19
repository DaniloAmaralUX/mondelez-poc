"use client";

import { cn } from "cn";

import { useFoto } from "@/lib/fotos";

/** Fotos de evidência só de leitura (documento do registro, detalhe do alerta). Ver lib/fotos.ts. */
export function FotosDoRegistro({
  fotos,
  className,
}: {
  readonly fotos: readonly string[];
  readonly className?: string;
}) {
  if (fotos.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Fotos de evidência">
      {fotos.map((id, indice) => (
        <FotoSoLeitura key={id} id={id} indice={indice} />
      ))}
    </ul>
  );
}

function FotoSoLeitura({ id, indice }: { readonly id: string; readonly indice: number }) {
  const url = useFoto(id);
  return (
    <li className="grid size-20 place-items-center overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
      {url ? (
        // biome-ignore lint/performance/noImgElement: foto local (blob: do IndexedDB), sem otimização do Next.
        <img src={url} alt={`Foto de evidência ${indice + 1}`} className="size-full object-cover" />
      ) : (
        <span className="px-1 text-center text-muted-foreground text-xs">Foto em outro tablet</span>
      )}
    </li>
  );
}
