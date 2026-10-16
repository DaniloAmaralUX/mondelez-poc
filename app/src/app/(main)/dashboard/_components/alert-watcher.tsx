"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useAlertas } from "@/hooks/use-turno";
import { useUsuarioAtual } from "@/stores/session/session-store";

/** Avisa a liderança quando surge um alerta novo, em qualquer tela (feedback do UI Audit, padrão 25). */
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
      const avisar = alerta.criticidade === "critico" ? toast.error : toast.warning;
      avisar(alerta.titulo, {
        description: alerta.regra === "A-NC" ? "Não conformidade registrada no posto." : "Tarefa obrigatória sem registro.",
        action: { label: "Ver", onClick: () => router.push(`/dashboard/alertas?alerta=${encodeURIComponent(alerta.id)}`) },
      });
    }
  }, [alertas, lideranca, router]);

  return null;
}
