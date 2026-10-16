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
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
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

        <Status variant={STATUS_VARIANTE[status]}>
          <StatusIndicator className={status === "critico" ? undefined : "before:hidden"} />
          <StatusLabel>{STATUS_LABEL[status]}</StatusLabel>
        </Status>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-xs text-xs outline">
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
          <div className="grid size-7 shrink-0 place-items-center rounded-xs text-xs outline">
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
          <div className="text-muted-foreground text-xs leading-none">Alerta</div>
          <div className="truncate text-sm tracking-tight">{alerta.titulo}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-muted-foreground text-xs leading-none">Idade</div>
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
  const filtrosAjudaId = React.useId();
  const [filtro, setFiltro] = React.useState<Filtro>("todos");
  const [busca, setBusca] = React.useState("");
  const contagem = (f: Filtro) => (f === "todos" ? alertas.length : alertas.filter((a) => a.estado === f).length);
  const termo = busca.trim().toLowerCase();
  const visiveis = alertas.filter(
    (a) => (filtro === "todos" || a.estado === filtro) && (!termo || a.titulo.toLowerCase().includes(termo)),
  );

  return (
    <Card className="h-full rounded-none ring-0">
      <CardHeader>
        <CardTitle className="font-normal text-xl">Alertas</CardTitle>
        {/* Botão desabilitado sem explicação não serve no toque (não há tooltip): o motivo fica escrito, como em Recados. */}
        <CardDescription id={filtrosAjudaId}>Filtros: em breve.</CardDescription>
        <CardAction>
          <Button size="icon-sm" variant="ghost" aria-label="Filtros" aria-describedby={filtrosAjudaId} disabled>
            <SlidersHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
          {/* Na lista de 360 px (ou com texto ampliado) as abas quebram linha em vez de ficarem cortadas pela borda do
              card: rolar abas para o lado não serve com luva. Se couberem, a linha é a mesma do template. */}
          <TabsList
            className="w-full flex-wrap gap-y-2 border-b px-4 group-data-horizontal/tabs:h-auto group-data-horizontal/tabs:min-h-8"
            variant="line"
          >
            {FILTROS.map((f) => (
              // min-h-6: a mesma altura que o h-8 da lista dava ao gatilho no template (no toque, a camada dá 56 px).
              <TabsTrigger key={f.value} className="min-h-6 text-xs" value={f.value}>
                {f.label} ({contagem(f.value)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label="Buscar alertas"
              placeholder="Buscar alertas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Rolagem própria só lado a lado; na pilha do retrato a lista cresce e a página rola.
            py-1: o anel do item ativo e o de foco não são cortados pela borda da área de rolagem. */}
        <ScrollArea className="@4xl/content:h-0 @4xl/content:flex-1">
          <div className="flex flex-col gap-4 px-4 py-1">
            {visiveis.length === 0 && (
              <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-muted-foreground text-sm">
                {alertas.length === 0 ? "Nenhum alerta neste turno." : "Nenhum alerta neste filtro."}
              </div>
            )}
            {visiveis.map((alerta) => (
              // Reordenação por estado e criticidade desliza em vez de pular (oportunidades de movimento, item 4).
              <motion.div key={alerta.id} layout="position" transition={REORDENAR}>
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
