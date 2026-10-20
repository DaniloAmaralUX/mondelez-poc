"use client";

import * as React from "react";

import { cn } from "cn";
import { Bell, BellOff, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localRepository } from "@/data/repository";
import type { Alerta, EstadoAlerta } from "@/domain/types";
import { useModoToque } from "@/hooks/use-modo-toque";
import { formatarHora, primeiroNome } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { useAgora } from "@/stores/session/session-store";

import { STATUS_LABEL, STATUS_VARIANTE, type StatusVisual, statusVisual } from "./alerta-estilos";
import { idadeDoAlerta, progressoDoAlerta } from "./idade";

type Filtro = "todos" | EstadoAlerta;

const REORDENAR = { duration: 0.2, ease: [0.23, 1, 0.32, 1] } as const;

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aberto", label: "Abertos" },
  { value: "em_tratamento", label: "Em tratamento" },
  { value: "resolvido", label: "Resolvidos" },
];

type AlertCardProps = {
  active?: boolean;
  /** O alerta ativo foi escolhido (toque ou `?alerta=`), e não só o primeiro da lista mostrado por padrão. */
  explicito?: boolean;
  onSelectAlert: (alertaId: string) => void;
  alerta: Alerta;
  agora: Date;
};

type AlertListProps = {
  onSelectAlert: (alertaId: string) => void;
  selectedAlertId: string | null;
  /** `false` quando `selectedAlertId` é só o primeiro da lista, que o detalhe lado a lado mostra por padrão. */
  selecaoExplicita: boolean;
  alertas: Alerta[];
};

/** Cor do bloco do ícone e da barra de escalonamento por estado (mesmas cores do selo). */
const TINTA: Record<StatusVisual, { bloco: string; barra: string }> = {
  critico: { bloco: "bg-destructive/10 text-red-700 dark:text-red-400", barra: "bg-destructive" },
  atencao: { bloco: "bg-amber-500/12 text-amber-700 dark:text-amber-400", barra: "bg-amber-500" },
  tratamento: { bloco: "bg-primary/10 text-primary dark:text-violet-400", barra: "bg-primary" },
  resolvido: { bloco: "bg-green-600/10 text-green-700 dark:text-green-400", barra: "bg-green-600" },
};

const DESTAQUE_ATIVO = "bg-primary/[0.06] ring-2 ring-primary/50";
// Sem escolha explícita, o primeiro alerta só está "aberto" quando o detalhe está ao lado (@4xl/content); na pilha do
// retrato a lista aparece sozinha e nenhum card fica marcado.
const DESTAQUE_PADRAO = "@4xl/content:bg-primary/[0.06] @4xl/content:ring-2 @4xl/content:ring-primary/50";

/**
 * Linha da caixa de alertas. v0.4 (docs/14): no lugar do card de remessa da tela Logistics (linha tracejada, caixas com
 * número e iniciais), uma linha no padrão do Mail: ícone do módulo tingido pelo estado, o que aconteceu como título,
 * onde (linha, posto, regra) como subtítulo, e embaixo o selo, quem está com ele e a idade. A barra fina mostra quanto
 * do prazo de escalonamento já passou, a mesma informação da linha tracejada.
 */
function AlertCard({ alerta, active, explicito = true, onSelectAlert, agora }: AlertCardProps) {
  const progresso = progressoDoAlerta(alerta, agora);
  const status = statusVisual(alerta);
  const Icon = ICONE_MODULO[alerta.moduloSlug] ?? Bell;
  const posto = localRepository.posto(alerta.postoId);
  const linha = posto ? localRepository.linhas("chocolate").find((l) => l.id === posto.linhaId) : undefined;
  const responsavel = alerta.responsavelId ? localRepository.usuario(alerta.responsavelId) : undefined;
  const onde = [linha?.nome, posto?.nome, `#${alerta.regra}`].filter(Boolean).join(" · ");

  return (
    // Sem blur() no clique: o foco fica no item (teclado e leitor de tela sabem onde estão). Ativo = alerta aberto no
    // detalhe, com anel no acento para ser visto de longe no tablet do posto. active:bg-muted/70: retorno no toque, onde
    // o hover não existe e o flash do navegador está desligado (src/styles/tablet.css).
    <button
      type="button"
      aria-current={active && explicito ? "true" : undefined}
      onClick={() => onSelectAlert(alerta.id)}
      className={cn(
        "flex w-full gap-3 rounded-xl bg-card p-3 text-left shadow-xs ring-1 ring-foreground/5 transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/70",
        active && (explicito ? DESTAQUE_ATIVO : DESTAQUE_PADRAO),
      )}
    >
      <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TINTA[status].bloco)}>
        <Icon className="size-5" />
      </span>

      {/* No toque, nada de leitura abaixo de 14 px (docs/12 §3.3). */}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold text-[0.9375rem] leading-snug">{alerta.titulo}</span>
          <time
            dateTime={alerta.criadoEm.toISOString()}
            className="shrink-0 text-muted-foreground text-xs toque:text-sm tabular-nums"
          >
            {formatarHora(alerta.criadoEm)}
          </time>
        </span>
        <span className="truncate text-muted-foreground text-sm">{onde}</span>
        <span className="mt-1 flex items-center justify-between gap-3">
          <Status variant={STATUS_VARIANTE[status]} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
            <StatusIndicator className={status === "critico" ? undefined : "before:hidden"} />
            <StatusLabel>{STATUS_LABEL[status]}</StatusLabel>
          </Status>
          <span className="min-w-0 truncate text-right text-muted-foreground text-xs toque:text-sm">
            {responsavel ? `Com ${primeiroNome(responsavel.nome)}` : "Ninguém assumiu"} ·{" "}
            <span className="text-foreground tabular-nums">{idadeDoAlerta(alerta, agora)}</span>
          </span>
        </span>
        <span className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className={cn("block h-full rounded-full", TINTA[status].barra)} style={{ width: `${progresso}%` }} />
        </span>
      </span>
    </button>
  );
}

export function AlertList({ alertas, selectedAlertId, selecaoExplicita, onSelectAlert }: AlertListProps) {
  const agora = useAgora();
  // A lista só monta depois de carregar a sessão (SessionGate): já nasce com o ponteiro do aparelho, sem trocar de
  // variante depois da hidratação.
  const toque = useModoToque();
  const filtrosAjudaId = React.useId();
  // As abas filtram a lista abaixo: aria-controls aponta para ela (o padrão do Radix aponta para um TabsContent que esta tela não usa).
  const listaId = React.useId();
  const [filtro, setFiltro] = React.useState<Filtro>("todos");
  const [busca, setBusca] = React.useState("");
  const contagem = (f: Filtro) => (f === "todos" ? alertas.length : alertas.filter((a) => a.estado === f).length);
  const termo = busca.trim().toLowerCase();
  const visiveis = alertas.filter(
    (a) => (filtro === "todos" || a.estado === filtro) && (!termo || a.titulo.toLowerCase().includes(termo)),
  );

  return (
    // @container/lista: as abas decidem o arranjo pela largura da própria lista (360 px ao lado do detalhe, a tela
    // inteira na pilha do retrato), não pelo viewport.
    <Card className="@container/lista h-full rounded-none bg-transparent ring-0">
      <CardHeader>
        {/* h1 da tela (auditoria de UX, 10.5): a lista é a entrada de Alertas; o detalhe tem o próprio título. */}
        <CardTitle className="text-2xl">
          <h1>Alertas</h1>
        </CardTitle>
        {/* Botão desabilitado sem explicação não serve no toque (não há tooltip): o motivo fica escrito, como em Recados. */}
        <CardDescription id={filtrosAjudaId}>Filtros: em breve.</CardDescription>
        <CardAction>
          <Button size="icon-sm" variant="ghost" aria-label="Filtros" aria-describedby={filtrosAjudaId} disabled>
            <SlidersHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden px-0">
        <Tabs
          value={filtro}
          onValueChange={(value) => setFiltro(value as Filtro)}
          className={toque ? "px-4" : undefined}
        >
          {toque ? (
            // Toque: abas em grade, sem quebra nem rolagem lateral: 2 × 2 na lista estreita (360 px na paisagem,
            // Split View) e uma linha de 4 a partir de 672 px de lista (retrato). Na grade o sublinhado da variante
            // "line" ficaria solto entre as linhas; a variante padrão do template (segmentado) marca a aba ativa em
            // qualquer arranjo. 56 px por aba (camada de densidade) e 12 px entre elas nas duas direções (docs/12 §2
            // item 2); h-auto deixa o rótulo quebrar com texto ampliado, sem cortar a contagem.
            <TabsList className="grid w-full @2xl/lista:grid-cols-4 grid-cols-2 gap-3 group-data-horizontal/tabs:h-auto">
              {FILTROS.map((f) => (
                <TabsTrigger
                  key={f.value}
                  className="h-auto min-h-7 whitespace-normal py-1 text-center tabular-nums"
                  value={f.value}
                  aria-controls={listaId}
                >
                  {f.label} ({contagem(f.value)})
                </TabsTrigger>
              ))}
            </TabsList>
          ) : (
            // Notebook (ponteiro fino): a linha do template, como na v0.2 (docs/12 §3.1: o notebook mantém a
            // densidade). A lista tem 420 px no notebook (alertas.tsx), o bastante para as 4 abas numa linha de 32 px.
            <TabsList className="w-full border-b px-4" variant="line">
              {FILTROS.map((f) => (
                // min-h-6: a mesma altura que o h-8 da lista dava ao gatilho no template.
                <TabsTrigger
                  key={f.value}
                  className="min-h-6 text-xs tabular-nums"
                  value={f.value}
                  aria-controls={listaId}
                >
                  {f.label} ({contagem(f.value)})
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </Tabs>

        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label="Buscar alertas"
              placeholder="Buscar alertas…"
              enterKeyHint="search"
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Rolagem própria só lado a lado; na pilha do retrato a lista cresce e a página rola.
            O viewport do Radix envolve o conteúdo num div com display: table, que cresce até o texto sem quebra dos
            cards (truncate) e cortava Responsável e Idade à direita: block! (vence o estilo inline) prende os cards
            à largura da coluna e o truncate volta a valer.
            py-1: o anel do item ativo e o de foco não são cortados pela borda da área de rolagem.
            key: busca e filtro são escolha da pessoa, então a lista remonta (sem deslize, que a cada tecla levava
            cards por até 630 px sobre os que entravam); a reordenação vinda dos dados (assumir, alerta novo) anima. */}
        <ScrollArea className="[&_[data-slot=scroll-area-viewport]>div]:block! @4xl/content:h-0 @4xl/content:flex-1">
          <div id={listaId} key={`${filtro}|${termo}`} className="flex flex-col gap-4 px-4 py-1">
            {visiveis.length === 0 && (
              <Empty className="min-h-48 p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BellOff />
                  </EmptyMedia>
                  <EmptyTitle>
                    {alertas.length === 0 ? "Nenhum alerta neste turno" : "Nenhum alerta neste filtro"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {alertas.length === 0
                      ? "Atrasos e não conformidades aparecem aqui assim que acontecem."
                      : "Troque a aba ou limpe a busca para ver os outros."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {visiveis.map((alerta, indice) => (
              // Reordenação por estado e criticidade desliza em vez de pular (oportunidades de movimento, item 4).
              // layoutDependency: o motion só mede quando a posição do card na lista muda (estado, filtro, alerta novo),
              // e não a cada virada de minuto do relógio, que re-renderiza a lista inteira (docs/12 §3.6).
              // rounded-xl bg-card: um card que desliza passa por cima, e não através, de outro que entra no meio.
              <motion.div
                key={alerta.id}
                layout="position"
                layoutDependency={indice}
                transition={REORDENAR}
                className="rounded-xl bg-card"
              >
                <AlertCard
                  active={alerta.id === selectedAlertId}
                  explicito={selecaoExplicita}
                  alerta={alerta}
                  agora={agora}
                  onSelectAlert={onSelectAlert}
                />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
