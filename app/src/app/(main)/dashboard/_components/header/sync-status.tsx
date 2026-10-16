"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import type { Registro } from "@/domain/types";
import { agoraSimulado } from "@/lib/clock";
import { formatarHora } from "@/lib/format";
import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/** No toque o chip passa de text-xs (Status do template) a text-sm: aparece em todas as telas do operador (docs/12 §3.3). */
const CHIP = "toque:text-sm tabular-nums";

/** Fila do tablet por estado (RF-07). "No tablet" = tudo o que ainda não chegou ao servidor. */
function contarFila(registros: Record<string, Registro>) {
  const fila = { aguardando: 0, enviando: 0, erro: 0, noTablet: 0 };
  for (const registro of Object.values(registros)) {
    if (registro.syncStatus === "sincronizado") continue;
    fila.noTablet += 1;
    if (registro.syncStatus === "enviando") fila.enviando += 1;
    else if (registro.syncStatus === "erro") fila.erro += 1;
    // "pendente" (janela de desfazer de 10 s) e "local" (na fila, esperando a vez ou a rede).
    else fila.aguardando += 1;
  }
  return fila;
}

interface Estado {
  variante: "default" | "success" | "error" | "warning" | "info";
  rotulo: ReactNode;
  /** O ponto pulsa só quando o estado pede atenção ou mostra atividade (docs/11 §7). */
  pulsar: boolean;
  /** Como a hora da última sincronização entra no chip ("última 07:54" quando o tablet está atrasado). */
  hora?: "simples" | "ultima";
  tentarDeNovo?: boolean;
}

/**
 * Estado da fila de envio sempre visível (RF-07, docs/12 §2 item 15 e §3.5): o operador sabe que o registro não se
 * perdeu e, sem rede ou com erro, desde quando o tablet não fala com o servidor ("última 07:54").
 * Um só `role="status"` persistente (antes cada estado criava outro e o leitor de tela não anunciava a troca). A hora
 * fica fora da região viva (aria-hidden no chip e repetida em sr-only ao lado): ela é renovada a cada minuto com a rede
 * no ar, e o leitor de tela só deve falar quando o estado muda.
 * A parte longa do texto fica só para o leitor de tela no celular (max-sm:sr-only), não some.
 */
export function SyncStatus() {
  const hydrated = useSessionHydrated();
  const rede = useSessionStore((s) => s.rede);
  const registros = useSessionStore((s) => s.registros);
  const relogio = useSessionStore((s) => s.relogio);
  const ultimaSincronizacao = useSessionStore((s) => s.ultimaSincronizacao);
  const tentarEnviarDeNovo = useSessionStore((s) => s.tentarEnviarDeNovo);
  const fila = contarFila(registros);

  // A última sincronização é gravada em horário real; aqui aparece no relógio da demonstração, o mesmo do resto da
  // tela (o relógio simulado anda junto com o real a partir da âncora).
  const instante = ultimaSincronizacao ? Date.parse(ultimaSincronizacao) : Number.NaN;
  const hora = hydrated && Number.isFinite(instante) ? formatarHora(agoraSimulado(relogio, instante)) : null;

  let estado: Estado;
  if (rede === "offline") {
    estado = {
      variante: "warning",
      pulsar: true,
      hora: "ultima",
      rotulo: (
        <>
          Sem rede
          {fila.noTablet > 0 && <span className="max-sm:sr-only"> · {fila.noTablet} aguardando envio</span>}
        </>
      ),
    };
  } else if (fila.enviando > 0) {
    estado = { variante: "info", pulsar: true, rotulo: `Enviando ${fila.enviando}` };
  } else if (fila.erro > 0) {
    estado = { variante: "error", pulsar: true, hora: "ultima", rotulo: "Erro no envio", tentarDeNovo: true };
  } else if (fila.aguardando > 0) {
    estado = {
      variante: "default",
      pulsar: false,
      rotulo: (
        <>
          {fila.aguardando} aguardando<span className="max-sm:sr-only"> envio</span>
        </>
      ),
    };
  } else {
    estado = {
      variante: "success",
      pulsar: false,
      hora: "simples",
      rotulo: (
        <>
          <span className="max-sm:sr-only">Tudo </span>enviado
        </>
      ),
    };
  }
  const horaNoChip = hora && estado.hora ? ` · ${estado.hora === "ultima" ? "última " : ""}${hora}` : null;

  return (
    <div className="flex items-center gap-2 toque:gap-3">
      {/* Antes de carregar o estado do tablet a região existe vazia: assim a primeira mudança também é anunciada. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {hydrated && (
          <Status variant={estado.variante} className={CHIP}>
            <StatusIndicator className={cn(estado.pulsar ? "motion-reduce:before:hidden" : "before:hidden")} />
            <StatusLabel>
              {estado.rotulo}
              {horaNoChip && (
                <span aria-hidden="true" className="max-sm:hidden">
                  {horaNoChip}
                </span>
              )}
            </StatusLabel>
          </Status>
        )}
      </div>
      {horaNoChip && <span className="sr-only">Última sincronização {hora}</span>}
      {hydrated && estado.tentarDeNovo && (
        // ≥ 48 px no toque: a camada de densidade leva o botão a 56 px (src/styles/tablet.css).
        <Button size="sm" variant="outline" onClick={tentarEnviarDeNovo}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
