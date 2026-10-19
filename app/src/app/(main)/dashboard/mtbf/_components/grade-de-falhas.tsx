"use client";

import * as React from "react";

import { cn } from "cn";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { duracaoMin } from "@/domain/falhas";
import type { Equipamento, EventoFalha, TipoFalha } from "@/domain/types";
import { formatarDuracao, formatarHora } from "@/lib/format";
import { PRESSAO } from "@/lib/pressao";
import { JANELA_DESFAZER_MS, useAgora, useSessionStore } from "@/stores/session/session-store";

/** O tempo da falha em curso, como o operador fala: "desde 08:12 · 14 min". */
function tempoCorrendo(falha: EventoFalha, agora: Date) {
  return `desde ${formatarHora(new Date(falha.inicio))} · ${formatarDuracao(duracaoMin(falha, agora) * 60_000)}`;
}

/**
 * Grade de tipos de falha do equipamento escolhido, em blocos grandes para luva (96 px ou mais no toque). Primeiro
 * toque abre a falha com a hora do relógio da demonstração; o bloco passa a "em curso", com o tempo correndo e
 * "Resolvido" à vista; o segundo toque encerra. Toque errado: o aviso traz "Desfazer" por 10 s, e depois disso a linha
 * do tempo mantém o "Desfazer" para quem apontou, até `JANELA_APAGAR_FALHA_MS`.
 *
 * O retorno é o do tema no pointer-down (scale 0.97, `PRESSAO`); nenhuma animação além dele, porque o apontamento se
 * repete dezenas de vezes por turno (Emil).
 */
export function GradeDeFalhas({
  equipamentos,
  equipamento,
  onEquipamentoChange,
  falhas,
  aponta,
}: {
  equipamentos: readonly Equipamento[];
  equipamento: Equipamento | undefined;
  onEquipamentoChange: (id: string) => void;
  falhas: readonly EventoFalha[];
  aponta: boolean;
}) {
  const agora = useAgora();
  const abrirFalha = useSessionStore((s) => s.abrirFalha);
  const encerrarFalha = useSessionStore((s) => s.encerrarFalha);
  const apagarFalha = useSessionStore((s) => s.apagarFalha);
  const tipos = localRepository.tiposFalha();
  const tituloId = React.useId();

  const doEquipamento = falhas.filter((f) => f.equipamentoId === equipamento?.id);
  const emCursoPorEquipamento = new Set(falhas.filter((f) => !f.fim).map((f) => f.equipamentoId));

  function tocar(tipo: TipoFalha) {
    if (!equipamento) return;
    const aberta = doEquipamento.find((f) => f.tipoId === tipo.id && !f.fim);
    if (aberta) {
      if (!encerrarFalha(aberta.id)) {
        toast.error("Não foi possível encerrar", { description: "Confira se o tablet está desbloqueado." });
        return;
      }
      toast.success(`${tipo.nome} resolvida`, {
        description: `${equipamento.nome} · parada de ${formatarDuracao(duracaoMin(aberta, agora) * 60_000)}.`,
      });
      return;
    }

    const nova = abrirFalha({ equipamentoId: equipamento.id, tipoId: tipo.id });
    if (!nova) {
      toast.error("Não foi possível apontar", { description: "Confira se o tablet está desbloqueado." });
      return;
    }
    toast.warning(`${tipo.nome} às ${formatarHora(new Date(nova.inicio))}`, {
      description: `${equipamento.nome}. Toque de novo no bloco quando a máquina voltar.`,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          // O store recusa com o tablet bloqueado, para outra pessoa e depois da janela de apagar.
          if (apagarFalha(nova.id))
            toast.info("Apontamento apagado", { description: `${tipo.nome} não conta no MTBF.` });
          else toast.info("Não dá para desfazer", { description: "Só quem apontou apaga, até 5 minutos depois." });
        },
      },
    });
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle id={tituloId}>{aponta ? "Apontar falha" : "Falhas por tipo"}</CardTitle>
        <CardDescription>
          {aponta
            ? "Um toque abre a falha na hora certa. O segundo toque, ou Resolvido, encerra."
            : "Situação de cada tipo no equipamento escolhido."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <SeletorDeEquipamento
          opcoes={equipamentos}
          valor={equipamento?.id}
          onChange={onEquipamentoChange}
          emCurso={emCursoPorEquipamento}
        />

        {equipamento ? (
          <ul
            aria-labelledby={tituloId}
            className="grid @min-[36rem]/content:grid-cols-3 @min-[52rem]/content:grid-cols-4 grid-cols-2 gap-3"
          >
            {tipos.map((tipo) => {
              const doTipo = doEquipamento.filter((f) => f.tipoId === tipo.id);
              const aberta = doTipo.find((f) => !f.fim);
              return (
                <li key={tipo.id} className="min-w-0">
                  <BlocoDeFalha
                    tipo={tipo}
                    vezes={doTipo.length}
                    aberta={aberta}
                    agora={agora}
                    onTocar={aponta ? () => tocar(tipo) : undefined}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Posto sem equipamentos cadastrados.</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Equipamento como escolha grande, no padrão do checklist (`CampoEquipamento`): botões lado a lado, um toque troca, o
 * segundo toque não desmarca. Um ponto âmbar marca o equipamento com falha em curso.
 */
function SeletorDeEquipamento({
  opcoes,
  valor,
  onChange,
  emCurso,
}: {
  opcoes: readonly Equipamento[];
  valor: string | undefined;
  onChange: (id: string) => void;
  emCurso: ReadonlySet<string>;
}) {
  const rotuloId = React.useId();
  if (opcoes.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span id={rotuloId} className="font-medium text-sm">
        Equipamento
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={3}
        value={valor ?? ""}
        onValueChange={(id) => {
          if (id) onChange(id);
        }}
        aria-labelledby={rotuloId}
        className="flex-wrap"
      >
        {opcoes.map((opcao) => (
          <ToggleGroupItem
            key={opcao.id}
            value={opcao.id}
            className="h-11 px-4 text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/5 dark:data-[state=on]:bg-primary/10"
          >
            {opcao.nome}
            {emCurso.has(opcao.id) && (
              <>
                <span aria-hidden className="size-2 rounded-full bg-amber-500" />
                <span className="sr-only">, com falha em curso</span>
              </>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const BLOCO =
  "flex h-24 toque:h-28 w-full flex-col items-start justify-between gap-2 whitespace-normal rounded-xl p-3 toque:p-4 text-left";

function BlocoDeFalha({
  tipo,
  vezes,
  aberta,
  agora,
  onTocar,
}: {
  tipo: TipoFalha;
  vezes: number;
  aberta: EventoFalha | undefined;
  agora: Date;
  onTocar: (() => void) | undefined;
}) {
  const nome = (
    <span className="flex w-full items-start justify-between gap-2">
      <span className="font-medium text-base leading-snug">{tipo.nome}</span>
      {tipo.critica && <ShieldAlert aria-label="Segurança ou qualidade" className="mt-0.5 size-4 shrink-0" />}
    </span>
  );
  const rodape = aberta ? (
    <span className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <span className="text-amber-800 text-sm tabular-nums dark:text-amber-300">{tempoCorrendo(aberta, agora)}</span>
      {onTocar && (
        <span className="rounded-full bg-amber-600 px-2.5 py-0.5 font-medium text-sm text-white dark:bg-amber-500 dark:text-amber-950">
          Resolvido
        </span>
      )}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm tabular-nums">
      {vezes === 0 ? "Nenhuma no turno" : `${vezes} no turno`}
    </span>
  );
  const emCurso = aberta
    ? "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15 dark:border-amber-400/40 dark:bg-amber-400/10"
    : undefined;

  if (!onTocar) {
    return (
      <div className={cn(BLOCO, "border bg-card", emCurso)}>
        {nome}
        {rodape}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onTocar}
      aria-pressed={Boolean(aberta)}
      aria-label={
        aberta
          ? `${tipo.nome}, em curso ${tempoCorrendo(aberta, agora)}. Tocar encerra: resolvido.`
          : `${tipo.nome}, ${vezes === 0 ? "nenhuma" : vezes} no turno. Tocar abre a falha.`
      }
      className={cn(BLOCO, PRESSAO, "touch-manipulation", emCurso)}
    >
      {nome}
      {rodape}
    </Button>
  );
}
