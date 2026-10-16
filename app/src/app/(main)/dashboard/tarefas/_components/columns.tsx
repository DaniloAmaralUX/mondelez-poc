"use client";

import Link from "next/link";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";

import { labels, priorities, statuses, type Task } from "./data";

const statusStyles: Record<string, string> = {
  mais_tarde: "border-muted-foreground/20 bg-muted text-muted-foreground",
  a_fazer: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  em_andamento: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  atrasada: "border-destructive/20 bg-destructive/10 text-destructive",
  com_nc: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  feita: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
};

/** Situação da tarefa no Badge do template: a mesma na coluna da tabela e na lista de linhas do retrato. */
export function SituacaoBadge({ value, className }: { readonly value: string; readonly className?: string }) {
  const status = statuses.find((s) => s.value === value);
  if (!status) return null;

  return (
    <Badge
      className={cn("gap-1.5 rounded-sm border font-medium", statusStyles[status.value], className)}
      variant="outline"
    >
      {status.icon && <status.icon className="size-4" aria-hidden />}
      {status.label}
    </Badge>
  );
}

function SortIcon({ sortDirection }: { sortDirection: false | "asc" | "desc" }) {
  if (sortDirection === "desc") {
    return <ArrowDown data-icon="inline-end" />;
  }

  if (sortDirection === "asc") {
    return <ArrowUp data-icon="inline-end" />;
  }

  return <ArrowUpDown data-icon="inline-end" />;
}

function TitleColumnHeader({ column }: { column: Column<DataTableFeatures, Task, unknown> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground data-[state=open]:bg-accent">
          Tarefa
          <SortIcon sortDirection={column.getIsSorted()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
          <ArrowUp />
          Crescente
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
          <ArrowDown />
          Decrescente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => column.clearSorting()}>
          <RotateCcw />
          Limpar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<DataTableFeatures, Task>[] = [
  {
    accessorKey: "janela",
    header: "Janela",
    cell: ({ row }) => <div className="w-24 font-mono text-muted-foreground text-sm">{row.getValue("janela")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <TitleColumnHeader column={column} />,
    cell: ({ row }) => {
      const task = row.original;
      const label = labels.find((label) => label.value === task.label);
      const conteudo = (
        <>
          {label && (
            <Badge className="rounded-sm bg-transparent" variant="outline">
              {label.label}
            </Badge>
          )}
          <span className="max-w-lg truncate font-medium text-sm">{row.getValue("title")}</span>
        </>
      );

      if (task.futura) return <div className="flex min-w-0 items-center gap-2">{conteudo}</div>;

      // A linha inteira abre a tarefa (tasks.tsx); este link é o caminho do teclado e do leitor de tela.
      // prefetch: o checklist abre sem rede (lib/rotas.ts).
      return (
        <Link
          prefetch
          href={task.href}
          className="flex min-w-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {conteudo}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Situação",
    cell: ({ row }) => <SituacaoBadge value={row.getValue("status")} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: "Criticidade",
    cell: ({ row }) => {
      const priority = priorities.find((priority) => priority.value === row.getValue("priority"));

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center gap-2 text-sm">
          {priority.icon && <priority.icon className="size-4 text-muted-foreground" />}
          {priority.label}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const task = row.original as Task;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[state=open]:bg-muted">
                <MoreHorizontal />
                <span className="sr-only">Ações da tarefa</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild disabled={task.futura}>
                <Link prefetch={!task.futura} href={task.href}>
                  Abrir
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link prefetch href="/dashboard/alertas">
                  Ver alertas
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
