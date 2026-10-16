"use client";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/** Estado da fila de envio sempre visível (RF-07): o operador sabe que o registro não se perdeu. */
export function SyncStatus() {
  const hydrated = useSessionHydrated();
  const rede = useSessionStore((s) => s.rede);
  const pendentes = useSessionStore(
    (s) => Object.values(s.registros).filter((r) => r.syncStatus !== "sincronizado").length,
  );

  if (!hydrated) return null;

  if (rede === "offline") {
    return (
      <Status variant="warning" role="status" aria-live="polite">
        <StatusIndicator />
        <StatusLabel>
          Sem rede<span className="hidden sm:inline">{pendentes > 0 ? ` · ${pendentes} no tablet` : ""}</span>
        </StatusLabel>
      </Status>
    );
  }

  if (pendentes > 0) {
    return (
      <Status variant="info" role="status" aria-live="polite">
        <StatusIndicator />
        <StatusLabel>Enviando {pendentes}</StatusLabel>
      </Status>
    );
  }

  return (
    <Status variant="success" role="status" aria-live="polite">
      <StatusIndicator className="before:hidden" />
      <StatusLabel>
        <span className="hidden sm:inline">Tudo </span>enviado
      </StatusLabel>
    </Status>
  );
}
