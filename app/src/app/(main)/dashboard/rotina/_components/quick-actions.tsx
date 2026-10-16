"use client";

import Link from "next/link";

import { Bell, ClipboardCheck, HardHat, ListTodo, PackageSearch, SprayCan, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUsuarioAtual } from "@/stores/session/session-store";

const checklists = [
  { label: "PPLI e Centerlining", icon: ClipboardCheck, href: "/dashboard/checklist/ppli-l4" },
  { label: "Pré-partida", icon: HardHat, href: "/dashboard/checklist/pre-partida-l4" },
  { label: "Rastreabilidade", icon: PackageSearch, href: "/dashboard/checklist/rastreabilidade-envoltorio" },
  { label: "Manutenção autônoma", icon: Wrench, href: "/dashboard/checklist/manutencao-autonoma-l4" },
  { label: "Limpeza semanal", icon: SprayCan, href: "/dashboard/checklist/limpeza-semanal" },
] as const;

const lideranca = [
  { label: "Alertas", icon: Bell, href: "/dashboard/alertas" },
  { label: "Tarefas do posto", icon: ListTodo, href: "/dashboard/tarefas" },
] as const;

export function QuickActions() {
  const usuario = useUsuarioAtual();
  const quickActions = usuario?.perfil === "operacao" ? checklists : lideranca;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">Registros rápidos</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Button key={action.label} variant="outline" className="justify-start" asChild>
            <Link prefetch={false} href={action.href}>
              <action.icon data-icon="inline-start" />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
