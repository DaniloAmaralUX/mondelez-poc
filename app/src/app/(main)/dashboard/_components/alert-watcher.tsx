"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useAlertas } from "@/hooks/use-turno";
import { useUsuarioAtual } from "@/stores/session/session-store";

const ALERTAS = "/dashboard/alertas";

/** Crítico fica 10 s na tela (docs/12 §2 item 5): quem está andando pela linha tem tempo de chegar ao tablet. */
const DURACAO_CRITICO_MS = 10_000;

/**
 * Abre o alerta. Já na tela de Alertas, só troca `?alerta=` pelo History API (integrado ao router do Next): a tela segue
 * a URL a qualquer momento e abre o detalhe, sem ida ao servidor, então funciona sem rede. Fora dela, navega.
 */
function abrirAlerta(alertaId: string, irPara: (href: string) => void) {
  const href = `${ALERTAS}?alerta=${encodeURIComponent(alertaId)}`;
  if (window.location.pathname === ALERTAS) window.history.pushState(null, "", href);
  else irPara(href);
}

/** Avisa a liderança quando surge um alerta novo, em qualquer tela (auditoria de UX do doc 09, padrão 25). */
export function AlertWatcher() {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const alertas = useAlertas();
  const conhecidos = useRef<Set<string> | null>(null);
  const lideranca = usuario !== undefined && usuario.perfil !== "operacao";

  useEffect(() => {
    const abertos = alertas.filter((a) => a.estado === "aberto");
    // Primeira leitura só registra o que já existe: o aviso é para o que surgir depois.
    if (conhecidos.current === null) {
      conhecidos.current = new Set(abertos.map((a) => a.id));
      return;
    }
    for (const alerta of abertos) {
      if (conhecidos.current.has(alerta.id)) continue;
      conhecidos.current.add(alerta.id);
      if (!lideranca) continue;
      const critico = alerta.criticidade === "critico";
      const avisar = critico ? toast.error : toast.warning;
      avisar(alerta.titulo, {
        description:
          alerta.regra === "A-NC" ? "Não conformidade registrada no posto." : "Tarefa obrigatória sem registro.",
        // Atenção: os 8 s padrão do Toaster.
        duration: critico ? DURACAO_CRITICO_MS : undefined,
        action: {
          label: "Ver",
          onClick: () => abrirAlerta(alerta.id, (href) => router.push(href)),
        },
      });
    }
  }, [alertas, lideranca, router]);

  return null;
}
