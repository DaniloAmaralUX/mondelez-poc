import { cn } from "cn";

import type { ItemFormulario } from "@/domain/types";

/**
 * Régua do centerline: faixa aceita no meio e o valor medido como marcador.
 * Mostra de relance se o número cai dentro do padrão (aposta de acurácia).
 */
export function FaixaIndicador({ faixa, valor }: { faixa: NonNullable<ItemFormulario["faixa"]>; valor?: number }) {
  const span = faixa.max - faixa.min;
  // Régua com meia faixa de folga de cada lado; valores fora ficam presos na borda.
  const inicio = faixa.min - span / 2;
  const fim = faixa.max + span / 2;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - inicio) / (fim - inicio)) * 100));
  const fora = valor !== undefined && (valor < faixa.min || valor > faixa.max);

  return (
    <div className="relative h-1.5 w-full rounded-full bg-muted" aria-hidden>
      <div
        className="absolute inset-y-0 rounded-full bg-green-600/25"
        style={{ left: `${pos(faixa.min)}%`, right: `${100 - pos(faixa.max)}%` }}
      />
      {valor !== undefined && (
        // O trilho inteiro desliza (transform): animar `left` forçaria layout a cada quadro.
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${pos(valor)}%)` }}
        >
          <div
            className={cn(
              "absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-xs",
              fora ? "bg-destructive" : "bg-green-600",
            )}
          />
        </div>
      )}
    </div>
  );
}
