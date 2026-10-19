"use client";

import { cn } from "cn";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { diaCurto, diaMes, formatarTon, type GrupoDaLinha } from "./semana";

/** Célula de toneladas: zero vira traço esmaecido (domingo sem produção), sem competir com os números. */
function Ton({ valor, forte }: { readonly valor: number; readonly forte?: boolean }) {
  if (valor <= 0) return <span className="text-muted-foreground/60">–</span>;
  return <span className={cn(forte && "font-semibold")}>{formatarTon(valor)}</span>;
}

/**
 * Plano da semana (RM-01) no padrão da tabela do Ecommerce/Tasks: linhas de produção como grupos, SKU por linha, um
 * valor por dia, total da semana por SKU e por linha, e o total da fábrica no rodapé. O dia de hoje tem coluna
 * tingida e o rótulo "Hoje" escrito (não só a cor).
 *
 * Duas apresentações no HTML e o CSS escolhe pela largura do próprio card (`@container/semana`, docs/13 §2): a tabela
 * de 9 colunas a partir de 50 rem (notebook e iPad em paisagem, 860 px úteis) e, abaixo disso (iPad em retrato), uma
 * lista por linha com os sete dias em grade, que cabe em 772 px sem rolagem lateral.
 */
export function TabelaDaSemana({
  grupos,
  dias,
  hoje,
}: {
  readonly grupos: readonly GrupoDaLinha[];
  readonly dias: readonly string[];
  readonly hoje: string;
}) {
  const totalPorDia = dias.map((_, i) => grupos.reduce((s, g) => s + (g.porDia[i] ?? 0), 0));
  const totalSemana = totalPorDia.reduce((s, t) => s + t, 0);
  const destaque = (data: string) => data === hoje && "bg-muted/70";

  return (
    <>
      <div className="@min-[50rem]/semana:block hidden">
        <Table className="tabular-nums **:data-[slot=table-cell]:px-3 **:data-[slot=table-head]:px-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 pl-4! font-medium text-muted-foreground">Linha e SKU</TableHead>
              {dias.map((data) => (
                <TableHead
                  key={data}
                  className={cn("h-12 text-right font-medium text-muted-foreground", destaque(data))}
                  aria-label={data === hoje ? `Hoje, ${diaCurto(data)} ${diaMes(data)}` : undefined}
                >
                  <span className={cn("block leading-tight", data === hoje && "font-semibold text-foreground")}>
                    {data === hoje ? "Hoje" : diaCurto(data)}
                  </span>
                  <span className="block font-normal text-muted-foreground text-xs leading-tight toque:text-sm">
                    {diaMes(data)}
                  </span>
                </TableHead>
              ))}
              <TableHead className="h-12 pr-4! text-right font-medium text-muted-foreground">Semana</TableHead>
            </TableRow>
          </TableHeader>
          {grupos.map((grupo) => (
            <TableBody key={grupo.linha.id} className="border-t-4 border-t-background first-of-type:border-t-0">
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell className="py-2.5 pl-4! font-semibold">{grupo.linha.nome}</TableCell>
                {grupo.porDia.map((t, i) => (
                  <TableCell key={dias[i]} className={cn("py-2.5 text-right", destaque(dias[i] ?? ""))}>
                    <Ton valor={t} forte />
                  </TableCell>
                ))}
                <TableCell className="py-2.5 pr-4! text-right">
                  <Ton valor={grupo.total} forte />
                </TableCell>
              </TableRow>
              {grupo.skus.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={dias.length + 2} className="py-3 pl-4! text-muted-foreground">
                    Sem plano nesta semana.
                  </TableCell>
                </TableRow>
              )}
              {grupo.skus.map((l) => (
                <TableRow key={l.sku.id} className="border-border/60 hover:bg-muted/20">
                  <TableCell className="max-w-64 py-2.5 pl-4!">
                    <div className="truncate font-medium">{l.sku.descricao}</div>
                    <div className="text-muted-foreground text-xs toque:text-sm">SKU {l.sku.codigo}</div>
                  </TableCell>
                  {l.porDia.map((t, i) => (
                    <TableCell key={dias[i]} className={cn("py-2.5 text-right", destaque(dias[i] ?? ""))}>
                      <Ton valor={t} />
                    </TableCell>
                  ))}
                  <TableCell className="py-2.5 pr-4! text-right">
                    <Ton valor={l.total} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ))}
          <TableFooter className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell className="py-3 pl-4! font-semibold">Fábrica</TableCell>
              {totalPorDia.map((t, i) => (
                <TableCell key={dias[i]} className={cn("py-3 text-right", destaque(dias[i] ?? ""))}>
                  <Ton valor={t} forte />
                </TableCell>
              ))}
              <TableCell className="py-3 pr-4! text-right">
                <Ton valor={totalSemana} forte />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <ul className="@min-[50rem]/semana:hidden flex flex-col divide-y divide-border/60">
        {grupos.map((grupo) => (
          <li key={grupo.linha.id} className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-semibold text-base">{grupo.linha.nome}</h3>
              <p className="text-muted-foreground text-sm tabular-nums">
                <span className="font-semibold text-foreground">{formatarTon(grupo.total)} t</span> na semana
              </p>
            </div>
            {grupo.skus.length === 0 && <p className="text-muted-foreground text-sm">Sem plano nesta semana.</p>}
            {grupo.skus.map((l) => (
              <div key={l.sku.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{l.sku.descricao}</div>
                    <div className="text-muted-foreground text-sm">SKU {l.sku.codigo}</div>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{formatarTon(l.total)} t</span>
                </div>
                <dl className="grid grid-cols-7 gap-1.5 tabular-nums">
                  {dias.map((data, i) => (
                    <div
                      key={data}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg bg-muted/40 px-1 py-2",
                        data === hoje && "bg-muted ring-1 ring-foreground/15",
                      )}
                    >
                      <dt
                        className={cn(
                          "text-muted-foreground text-sm",
                          data === hoje && "font-semibold text-foreground",
                        )}
                      >
                        {data === hoje ? "Hoje" : diaCurto(data)}
                      </dt>
                      <dd className="text-sm">
                        <Ton valor={l.porDia[i] ?? 0} forte={data === hoje} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 px-4 py-4">
          <span className="font-semibold">Fábrica na semana</span>
          <span className="font-semibold tabular-nums">{formatarTon(totalSemana)} t</span>
        </li>
      </ul>
    </>
  );
}
