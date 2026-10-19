"use client";

import * as React from "react";

import { cn } from "cn";
import { FileText, MessageSquareQuote, UserRoundCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { passagemTurnoAnterior, rotinaTemplates } from "@/data/seed";
import { pode } from "@/domain/permissoes";
import type { Posto, TrocaDeTurno } from "@/domain/types";
import { formatarHora, primeiroNome } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { formatarGe, formatarMinutos, rotuloDoTurno } from "../../relatorio-turno/_components/indicadores";
import { AceiteDoTurno } from "./aceite-do-turno";
import { PapelDaPassagem, type RespostasDaPassagem } from "./papel-da-passagem";
import { chaveDoTurnoAnterior, usePassagem } from "./use-passagem";

type Situacao = "pendente" | "entregue" | "recebida";

const SITUACAO: Record<Situacao, { rotulo: string; variante: "warning" | "info" | "success" }> = {
  pendente: { rotulo: "Pendente", variante: "warning" },
  entregue: { rotulo: "Entregue", variante: "info" },
  recebida: { rotulo: "Recebida", variante: "success" },
};

/** Janela da troca pelo template de rotina (30 min antes do fim do turno). */
const JANELA = rotinaTemplates.find((t) => t.id === "troca-de-turno-op")?.janela;

function respostasDe(troca: TrocaDeTurno): RespostasDaPassagem {
  return {
    etiquetasAbertas: String(troca.etiquetasAbertas),
    ondeEtiquetas: troca.ondeEtiquetas,
    paradas: troca.paradas,
    pendencias: troca.pendencias,
    pedidosAjuda: troca.pedidosAjuda,
    comentario: troca.comentario,
  };
}

/**
 * Visão da liderança (supervisão confere e recebe na ausência; gerência e especialista só leem): a situação da passagem
 * de cada posto da linha e o que o turno anterior deixou. Notebook: postos (7/12) e turno anterior (5/12) lado a lado;
 * iPad: um embaixo do outro, na mesma ordem do DOM.
 */
export function VisaoDaLinha() {
  const linhaId = useSessionStore((s) => s.contexto?.linhaId) ?? "bis-2";
  const postos = localRepository.postos(linhaId);

  return (
    <div className="grid @5xl/content:grid-cols-12 items-start gap-6">
      <Card className="@5xl/content:col-span-7 min-w-0">
        <CardHeader>
          <CardTitle>Postos da linha</CardTitle>
          <CardDescription>
            Cada posto entrega com os números do turno; quem chega aceita com o PIN.
            {JANELA ? " A entrega abre 30 min antes do fim do turno." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {postos.map((posto) => (
            <LinhaDoPosto key={posto.id} posto={posto} />
          ))}
        </CardContent>
      </Card>

      <div className="@5xl/content:col-span-5 min-w-0">
        <PassagemAnterior postos={postos} />
      </div>
    </div>
  );
}

function LinhaDoPosto({ posto }: { posto: Posto }) {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const { troca, kpis, turno, sugestoes } = usePassagem(posto.id);
  const [vendo, setVendo] = React.useState(false);
  const [recebendo, setRecebendo] = React.useState(false);
  let situacao: Situacao = "pendente";
  if (troca?.aceitePor) situacao = "recebida";
  else if (troca) situacao = "entregue";
  const podeReceber = situacao === "entregue" && usuario && pode(usuario.perfil, "troca-de-turno", "tratar");
  const numeros = troca?.kpis ?? kpis;
  const entregou = troca ? localRepository.usuario(troca.entreguePor) : undefined;
  const recebeu = troca?.aceitePor ? localRepository.usuario(troca.aceitePor) : undefined;

  let detalhe = "Ainda não entregue.";
  if (troca && recebeu && troca.aceiteEm)
    detalhe = `Entregue por ${primeiroNome(entregou?.nome ?? "")} às ${formatarHora(new Date(troca.entregueEm))}; recebida por ${primeiroNome(recebeu.nome)} às ${formatarHora(new Date(troca.aceiteEm))}.`;
  else if (troca)
    detalhe = `Entregue por ${primeiroNome(entregou?.nome ?? "")} às ${formatarHora(new Date(troca.entregueEm))}. Falta o aceite.`;
  else if (JANELA) {
    const abre = new Date(turno.inicio.getTime() + JANELA.inicioMin * 60_000);
    detalhe =
      agora < abre
        ? `Ainda não entregue. A entrega abre às ${formatarHora(abre)}.`
        : `Ainda não entregue. A janela está aberta até ${formatarHora(turno.fim)}.`;
  }

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="font-semibold text-base">{posto.nome}</h3>
          <Status variant={SITUACAO[situacao].variante} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
            <StatusIndicator className="before:hidden" />
            <StatusLabel>{SITUACAO[situacao].rotulo}</StatusLabel>
          </Status>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setVendo(true)}>
            <FileText data-icon="inline-start" />
            {troca ? "Ver passagem" : "Ver prévia"}
          </Button>
          {podeReceber && (
            <Button type="button" onClick={() => setRecebendo(true)}>
              <UserRoundCheck data-icon="inline-start" />
              Receber na ausência
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-sm">{detalhe}</p>
      {numeros && (
        <dl className="grid @md/content:grid-cols-4 grid-cols-2 gap-3">
          <Numero rotulo="GE" valor={formatarGe(numeros.ge)} />
          <Numero rotulo="MTBF" valor={formatarMinutos(numeros.mtbfMin)} />
          <Numero rotulo="Falhas" valor={String(numeros.falhas)} />
          <Numero
            rotulo="Pendências"
            valor={String(numeros.alertasAbertos + numeros.tarefasAtrasadas)}
            alerta={numeros.alertasAbertos + numeros.tarefasAtrasadas > 0}
          />
        </dl>
      )}

      <Sheet open={vendo} onOpenChange={setVendo}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        >
          <SheetHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b px-4 pt-[max(--spacing(3),env(safe-area-inset-top))] pb-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <SheetTitle>Passagem · {posto.nome}</SheetTitle>
              <SheetDescription>{troca ? "Como foi entregue." : "Prévia com os números de agora."}</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button type="button">Fechar</Button>
            </SheetClose>
          </SheetHeader>
          <section
            // biome-ignore lint/a11y/noNoninteractiveTabindex: região com rolagem precisa de foco para o teclado rolar (WCAG 2.1.1).
            tabIndex={0}
            aria-label={`Documento da passagem do posto ${posto.nome}`}
            className="min-h-0 flex-1 overflow-auto overscroll-contain bg-stone-200 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset dark:bg-stone-800"
          >
            <div className="mx-auto w-full shadow-sm">
              <PapelDaPassagem
                postoId={posto.id}
                turno={turno}
                operadorId={troca?.entreguePor}
                kpis={numeros}
                troca={troca}
                respostas={
                  troca ? respostasDe(troca) : { etiquetasAbertas: "", ondeEtiquetas: "", comentario: "", ...sugestoes }
                }
              />
            </div>
          </section>
        </SheetContent>
      </Sheet>

      {troca && (
        <Dialog open={recebendo} onOpenChange={setRecebendo}>
          <DialogContent showCloseButton={false} className="toque:top-[8%] toque:translate-y-0 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Receber o posto {posto.nome}</DialogTitle>
              <DialogDescription>
                Na ausência de quem chega, a supervisão confirma a passagem com o próprio PIN (RN-10).
              </DialogDescription>
            </DialogHeader>
            {usuario && (
              <AceiteDoTurno
                key={usuario.id}
                troca={troca}
                operadores={[]}
                supervisao={[usuario]}
                aoReceber={() => setRecebendo(false)}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecebendo(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Numero({ rotulo, valor, alerta = false }: { rotulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-muted-foreground text-sm">{rotulo}</dt>
      <dd
        className={cn(
          "font-semibold text-lg tabular-nums leading-tight",
          alerta && "text-orange-700 dark:text-orange-400",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

/**
 * O que o turno anterior deixou, por posto. Sem troca gravada no turno anterior (a demonstração começa no 1º turno), o
 * exemplo do mockup da Mondelez, como no card da Minha Rotina.
 */
function PassagemAnterior({ postos }: { postos: readonly Posto[] }) {
  const agora = useAgora();
  const chave = chaveDoTurnoAnterior(agora);
  const trocas = useSessionStore((s) => s.trocasDeTurno);
  const anteriores = chave
    ? postos.map((p) => trocas[`${p.id}|${chave}`]).filter((t): t is TrocaDeTurno => t !== undefined)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Do turno anterior</CardTitle>
        <CardDescription>
          {chave ? `Passagem do turno ${rotuloDoTurno(chave)}.` : "Passagem do turno anterior."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {anteriores.length === 0 ? (
          <Recado
            origem={`Embalagem · ${passagemTurnoAnterior.autor}`}
            titulo={passagemTurnoAnterior.pendencia}
            texto={passagemTurnoAnterior.sugestao}
          />
        ) : (
          anteriores.map((t) => {
            const posto = localRepository.posto(t.postoId);
            const autor = localRepository.usuario(t.entreguePor);
            const titulo =
              t.etiquetasAbertas > 0
                ? `${t.etiquetasAbertas} etiqueta${t.etiquetasAbertas > 1 ? "s" : ""} aberta${t.etiquetasAbertas > 1 ? "s" : ""}: ${t.ondeEtiquetas}`
                : t.pendencias.split("\n")[0] || "Sem pendências";
            return (
              <Recado
                key={t.id}
                origem={`${posto?.nome ?? ""} · ${autor?.nome ?? ""}`}
                titulo={titulo}
                texto={t.comentario || t.paradas.split("\n")[0] || ""}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function Recado({ origem, titulo, texto }: { origem: string; titulo: string; texto: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
      <div
        aria-hidden
        className="row-span-3 grid size-9 place-items-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-400"
      >
        <MessageSquareQuote className="size-5" />
      </div>
      <p className="text-muted-foreground text-sm">{origem}</p>
      <p className="wrap-anywhere font-semibold text-base leading-snug">{titulo}</p>
      {texto && <p className="wrap-anywhere text-muted-foreground text-sm">{texto}</p>}
    </div>
  );
}
