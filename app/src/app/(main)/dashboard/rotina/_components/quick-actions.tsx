"use client";

import Link from "next/link";

import { Bell, ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUsuarioAtual } from "@/stores/session/session-store";

const lideranca = [
  { label: "Alertas", icon: Bell, href: "/dashboard/alertas" },
  { label: "Tarefas do posto", icon: ListTodo, href: "/dashboard/tarefas" },
] as const;

export function QuickActions() {
  const usuario = useUsuarioAtual();
  // Para o operador os atalhos repetiam a lista de tarefas (UI Audit); ficam só para a liderança.
  if (!usuario || usuario.perfil === "operacao") return null;
  const quickActions = lideranca;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">Registros rápidos</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Button key={action.label} variant="outline" className="justify-start" asChild>
            {/* prefetch: Alertas e Tarefas em cache para a liderança navegar sem rede (lib/rotas.ts). */}
            <Link prefetch href={action.href}>
              <action.icon data-icon="inline-start" />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
