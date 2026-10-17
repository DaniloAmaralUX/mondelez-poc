"use client";
import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { DataTableFeatures } from "@/lib/data-table-features";

import { TaskPriorityFilter } from "./task-priority-filter";
import { TaskStatusFilter } from "./task-status-filter";

const COLUNA_LABEL: Record<string, string> = {
  janela: "janela",
  title: "tarefa",
  status: "situação",
  priority: "criticidade",
};

interface TasksToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function TasksToolbar<TData extends RowData>({ table }: TasksToolbarProps<TData>) {
  const isFiltered = table.state.columnFilters.length > 0;
  const searchValue = (table.getColumn("title")?.getFilterValue() as string | undefined) ?? "";
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());
  const hiddenColumns = hideableColumns.filter((column) => !column.getIsVisible());

  // Arranjo pela largura do card (@container/tarefas em tasks.tsx), como a troca tabela/lista. No toque, 12 px entre os
  // controles de 56 px (camada de densidade, docs/12 §2 item 2); o filtro de texto tem 56 px e 16 px de fonte.
  return (
    <div className="flex @4xl/tarefas:flex-row flex-col @4xl/tarefas:items-center @4xl/tarefas:justify-between gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-2 toque:gap-3">
        <Input
          aria-label="Filtrar tarefas"
          placeholder="Filtrar tarefas…"
          enterKeyHint="search"
          autoComplete="off"
          value={searchValue}
          onChange={(event) => {
            table.getColumn("title")?.setFilterValue(event.target.value);
            table.setPageIndex(0);
          }}
          className="w-full bg-background text-foreground placeholder:text-muted-foreground sm:w-64"
        />
        <TaskStatusFilter table={table} />
        <TaskPriorityFilter table={table} />
        {isFiltered && (
          <Button
            variant="destructive"
            onClick={() => {
              table.resetColumnFilters();
              table.setPageIndex(0);
            }}
          >
            <X data-icon="inline-start" />
            Limpar
          </Button>
        )}
      </div>
      {/* "Colunas" aparece junto com a tabela (896 px de card ou mais): na lista de linhas não há colunas a esconder. */}
      <div className="@4xl/tarefas:flex hidden justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("ml-auto", hiddenColumns.length > 0 && "bg-muted text-foreground")}
            >
              <Settings2 data-icon="inline-start" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-38">
            <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {COLUNA_LABEL[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
