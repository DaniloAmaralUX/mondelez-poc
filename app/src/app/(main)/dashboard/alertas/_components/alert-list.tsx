"use client";

import * as React from "react";

import { cn } from "cn";
import { Bell, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localRepository } from "@/data/repository";
import type { Alerta, EstadoAlerta } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { useAgora } from "@/stores/session/session-store";

import { getProgressRingClass, STATUS_LABEL, statusVisual } from "./alerta-estilos";
import { idadeDoAlerta, progressoDoAlerta } from "./idade";

type Filtro = "todos" | EstadoAlerta;

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aberto", label: "Abertos" },
  { value: "em_tratamento", label: "Em tratamento" },
  { value: "resolvido", label: "Resolvidos" },
];

type AlertCardProps = {
  active?: boolean;
  onSelectAlert: (alertaId: string) => void;
  alerta: Alerta;
  agora: Date;
};

type AlertListProps = {
  onSelectAlert: (alertaId: string) => void;
  selectedAlertId: string | null;
  alertas: Alerta[];
};

function AlertCard({ alerta, active, onSelectAlert, agora }: AlertCardProps) {
  const progresso = progressoDoAlerta(alerta, agora);
  const angle = (progresso / 100) * 360;
  const status = statusVisual(alerta);
  const Icon = ICONE_MODULO[alerta.moduloSlug] ?? Bell;
  const posto = localRepository.posto(alerta.postoId);
  const linha = posto ? localRepository.linhas("chocolate").find((l) => l.id === posto.linhaId) : undefined;
  const responsavel = alerta.responsavelId ? localRepository.usuario(alerta.responsavelId) : undefined;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur();
        onSelectAlert(alerta.id);
      }}
      className={cn(
        "flex w-full flex-col gap-5 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div>#{alerta.regra}</div>

        <div className="flex items-center gap-1">
          <div style={{ "--angle": `${angle}deg` } as React.CSSProperties} className={getProgressRingClass(status)}>
            <div className="grid size-2 place-items-center rounded-full bg-card">
              <div className="size-1 rounded-full bg-current" />
            </div>
          </div>
          <div className="text-muted-foreground text-xs">{STATUS_LABEL[status]}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="grid size-7 place-items-center rounded-xs text-xs outline">{linha?.nome.replace(/\D/g, "")}</div>
          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-xs leading-none">{linha?.nome},</div>
            <div className="text-muted-foreground text-xs">{posto?.nome}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-xs leading-none">Supervisão,</div>
            <div className="text-muted-foreground text-xs">{responsavel?.nome ?? "sem responsável"}</div>
          </div>
          <div className="grid size-7 place-items-center rounded-xs text-xs outline">
            {responsavel ? responsavel.nome.slice(0, 1) : "?"}
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
            <span className="ml-1 font-normal text-muted-foreground text-xs">desde {formatarHora(alerta.criadoEm)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function AlertList({ alertas, selectedAlertId, onSelectAlert }: AlertListProps) {
  const agora = useAgora();
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
        <CardAction>
          <Button size="icon-sm" variant="ghost" aria-label="Filtros" disabled>
            <SlidersHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
          <TabsList className="w-full border-b px-4" variant="line">
            {FILTROS.map((f) => (
              <TabsTrigger key={f.value} className="text-xs" value={f.value}>
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

        <ScrollArea className="h-0 flex-1">
          <div className="flex flex-col gap-4 px-4">
            {visiveis.length === 0 && (
              <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-muted-foreground text-sm">
                {alertas.length === 0 ? "Nenhum alerta neste turno." : "Nenhum alerta neste filtro."}
              </div>
            )}
            {visiveis.map((alerta) => (
              <AlertCard
                active={alerta.id === selectedAlertId}
                key={alerta.id}
                alerta={alerta}
                agora={agora}
                onSelectAlert={onSelectAlert}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
