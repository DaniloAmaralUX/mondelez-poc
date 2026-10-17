"use client";

import * as React from "react";

import { cn } from "cn";
import { Bell, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localRepository } from "@/data/repository";
import type { Alerta, EstadoAlerta } from "@/domain/types";
import { useModoToque } from "@/hooks/use-modo-toque";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { getInitials } from "@/lib/utils";
import { useAgora } from "@/stores/session/session-store";

import { STATUS_LABEL, STATUS_VARIANTE, statusVisual } from "./alerta-estilos";
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

const DESTAQUE_ATIVO = "border-primary bg-muted/50 ring-1 ring-primary/40";
// Sem escolha explícita, o primeiro alerta só está "aberto" quando o detalhe está ao lado (@4xl/content); na pilha do
// retrato a lista aparece sozinha e nenhum card fica marcado.
const DESTAQUE_PADRAO =
  "@4xl/content:border-primary @4xl/content:bg-muted/50 @4xl/content:ring-1 @4xl/content:ring-primary/40";

function AlertCard({ alerta, active, explicito = true, onSelectAlert, agora }: AlertCardProps) {
  const progresso = progressoDoAlerta(alerta, agora);
  const status = statusVisual(alerta);
  const Icon = ICONE_MODULO[alerta.moduloSlug] ?? Bell;
  const posto = localRepository.posto(alerta.postoId);
  const linha = posto ? localRepository.linhas("chocolate").find((l) => l.id === posto.linhaId) : undefined;
  const responsavel = alerta.responsavelId ? localRepository.usuario(alerta.responsavelId) : undefined;

  return (
    // Sem blur() no clique: o foco fica no item (teclado e leitor de tela sabem onde estão). Ativo = alerta aberto no
    // detalhe; a borda primária ganha um anel para ser vista de longe, no tablet do posto. active:bg-muted/70: retorno
    // no toque, onde o hover não existe e o flash do navegador está desligado (src/styles/tablet.css).
    <button
      type="button"
      aria-current={active && explicito ? "true" : undefined}
      onClick={() => onSelectAlert(alerta.id)}
      className={cn(
        "flex w-full flex-col gap-5 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/70",
        active && (explicito ? DESTAQUE_ATIVO : DESTAQUE_PADRAO),
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>#{alerta.regra}</div>

        <Status variant={STATUS_VARIANTE[status]} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
          <StatusIndicator className={status === "critico" ? undefined : "before:hidden"} />
          <StatusLabel>{STATUS_LABEL[status]}</StatusLabel>
        </Status>
      </div>

      {/* No toque, nada de leitura abaixo de 14 px (docs/12 §3.3): rótulos e marcas passam de text-xs a text-sm. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="grid size-7 toque:size-8 shrink-0 place-items-center rounded-xs text-xs toque:text-sm outline">
            {linha?.nome.replace(/\D/g, "")}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="font-medium text-sm leading-none">{linha?.nome},</div>
            <div className="truncate text-muted-foreground text-sm">{posto?.nome}</div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-right">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="font-medium text-sm leading-none">Responsável,</div>
            <div className="truncate text-muted-foreground text-sm">{responsavel?.nome ?? "ninguém assumiu"}</div>
          </div>
          <div className="grid size-7 toque:size-8 shrink-0 place-items-center rounded-xs text-xs toque:text-sm outline">
            {responsavel ? getInitials(responsavel.nome) : "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <span
          className="h-px min-w-0 border-foreground border-t border-dashed"
          style={{ flexGrow: progresso, flexBasis: 0 }}
        />
        <Icon className="size-3.5" />
        <span
          className="h-px min-w-0 border-border border-t border-dashed"
          style={{ flexGrow: 100 - progresso, flexBasis: 0 }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs toque:text-sm leading-none">Alerta</div>
          <div className="truncate text-sm tracking-tight">{alerta.titulo}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-muted-foreground text-xs toque:text-sm leading-none">Idade</div>
          <div className="text-sm tabular-nums tracking-tight">
            {idadeDoAlerta(alerta, agora)}
            <span className="ml-1 font-normal text-muted-foreground text-sm">
              desde {formatarHora(alerta.criadoEm)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function AlertList({ alertas, selectedAlertId, selecaoExplicita, onSelectAlert }: AlertListProps) {
  const agora = useAgora();
  // A lista só monta depois de carregar a sessão (SessionGate): já nasce com o ponteiro do aparelho, sem trocar de
  // variante depois da hidratação.
  const toque = useModoToque();
  const filtrosAjudaId = React.useId();
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
    <Card className="@container/lista h-full rounded-none ring-0">
      <CardHeader>
        {/* h1 da tela (UI Audit 10.5): a lista é a entrada de Alertas; o detalhe tem o próprio título. */}
        <CardTitle className="font-normal text-xl">
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
                <TabsTrigger key={f.value} className="min-h-6 text-xs tabular-nums" value={f.value}>
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
          <div key={`${filtro}|${termo}`} className="flex flex-col gap-4 px-4 py-1">
            {visiveis.length === 0 && (
              <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-muted-foreground text-sm">
                {alertas.length === 0 ? "Nenhum alerta neste turno." : "Nenhum alerta neste filtro."}
              </div>
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
