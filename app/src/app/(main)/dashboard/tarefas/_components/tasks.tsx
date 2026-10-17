"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { cn } from "cn";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table-features";

import { columns } from "./columns";
import type { Task } from "./data";
import { LinhaTarefa } from "./linha-tarefa";
import { TasksToolbar } from "./tasks-toolbar";

interface TasksProps {
  data: Task[];
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

/** Toque em controle da linha (link do título, menu de ações e seus itens, que chegam pelo portal do React). */
const CONTROLE = "a, button, input, [role='menuitem'], [role='menuitemcheckbox'], [data-slot='dropdown-menu-content']";

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];

  return [currentPage - 1, currentPage, currentPage + 1];
}

export function Tasks({ data }: TasksProps) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const linhas = table.getRowModel().rows;
  const totalNoFiltro = table.getFilteredRowModel().rows.length;

  /**
   * Linha inteira da tabela abre a tarefa (toque ou clique em qualquer célula). Toques no link do título e no menu de
   * ações seguem o caminho deles; texto selecionado com o mouse não navega.
   */
  function abrirLinha(event: React.MouseEvent<HTMLTableRowElement>, task: Task) {
    if (!task.abrivel) return;
    if (event.target instanceof Element && event.target.closest(CONTROLE)) return;
    if (window.getSelection()?.toString()) return;
    router.push(task.href);
  }

  return (
    // @container/tarefas: tabela ou lista pela largura do próprio card, não do viewport.
    <div className="@container/tarefas overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="border-b px-4 py-4">
        <TasksToolbar table={table} />
      </div>

      {/* Abaixo de 896 px de card (tablet em retrato: 772 px; paisagem com a sidebar aberta: 860 px) a tabela de 5
          colunas cortava Criticidade e as ações: vira lista de linhas tocáveis com a mesma página, filtro e ordem.
          As duas ficam no HTML e o CSS escolhe: sem medir em JS, sem divergência de hidratação, e ao girar o tablet
          a troca é imediata. Só a visível entra na árvore de acessibilidade e no prefetch. */}
      <ul className="@4xl/tarefas:hidden divide-y divide-border/60" aria-label="Tarefas do posto">
        {linhas.length ? (
          linhas.map((row) => (
            <li key={row.id}>
              <LinhaTarefa task={row.original} />
            </li>
          ))
        ) : (
          <li className="p-4 text-center text-muted-foreground text-sm">Nenhuma tarefa encontrada.</li>
        )}
      </ul>

      <div className="@4xl/tarefas:block hidden">
        <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 font-medium text-muted-foreground"
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {linhas.length ? (
              linhas.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-border/60 hover:bg-muted/20",
                    row.original.abrivel && "cursor-pointer active:bg-muted/50",
                  )}
                  data-state={table.state.rowSelection[row.id] && "selected"}
                  onClick={(event) => abrirLinha(event, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 align-middle">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé que quebra em linhas no lugar de espremer o texto ("Página 1 de / 2"): contagem, depois linhas por
          página e página atual, depois a paginação. No toque, 12 px entre os alvos de 56 px (docs/12 §2 item 2). */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-4 py-4">
        <div className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
          {totalNoFiltro} {totalNoFiltro === 1 ? "tarefa" : "tarefas"} no filtro.
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8">
          <div className="flex items-center gap-2 toque:gap-3">
            <p className="whitespace-nowrap font-medium text-muted-foreground text-sm">Linhas por página</p>
            <Select
              value={`${table.state.pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-18" aria-label="Linhas por página">
                <SelectValue placeholder={table.state.pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="whitespace-nowrap font-medium text-sm tabular-nums">
            Página {currentPage} de {pageCount}
          </div>
          <Pagination className="mx-0 w-auto justify-start" aria-label="Páginas das tarefas">
            <PaginationContent className="gap-1 toque:gap-3">
              <PaginationItem className="hidden lg:block">
                <PaginationLink
                  href="#"
                  aria-label="Primeira página"
                  aria-disabled={!canPreviousPage}
                  className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canPreviousPage) table.setPageIndex(0);
                  }}
                >
                  <ChevronsLeft />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                {/* toque:min-w-14: abaixo de 640 px o template esconde "Anterior"/"Próxima" e o link fica só com o
                    ícone (34 px), mas sem o data-size de ícone que a camada de toque deixa quadrado. */}
                <PaginationPrevious
                  href="#"
                  text="Anterior"
                  aria-label="Página anterior"
                  aria-disabled={!canPreviousPage}
                  className={cn("toque:min-w-14", !canPreviousPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canPreviousPage) table.previousPage();
                  }}
                />
              </PaginationItem>
              {pageNumbers[0] > 1 ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              {pageNumbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageIndex === pageNumber - 1}
                    aria-label={`Página ${pageNumber}`}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.setPageIndex(pageNumber - 1);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Próxima"
                  aria-label="Próxima página"
                  aria-disabled={!canNextPage}
                  className={cn("toque:min-w-14", !canNextPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canNextPage) table.nextPage();
                  }}
                />
              </PaginationItem>
              <PaginationItem className="hidden lg:block">
                <PaginationLink
                  href="#"
                  aria-label="Última página"
                  aria-disabled={!canNextPage}
                  className={cn(!canNextPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canNextPage) table.setPageIndex(pageCount - 1);
                  }}
                >
                  <ChevronsRight />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
