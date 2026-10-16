"use client";

import NumberFlow from "@number-flow/react";

/** Duração em "1 h 20 min" com dígitos animados quando o relógio avança. */
export function Duracao({ ms }: { readonly ms: number }) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;

  return (
    <span className="tabular-nums">
      {horas > 0 && (
        <>
          <NumberFlow value={horas} /> h{minutos > 0 ? " " : ""}
        </>
      )}
      {(horas === 0 || minutos > 0) && (
        <>
          <NumberFlow value={minutos} /> min
        </>
      )}
    </span>
  );
}
