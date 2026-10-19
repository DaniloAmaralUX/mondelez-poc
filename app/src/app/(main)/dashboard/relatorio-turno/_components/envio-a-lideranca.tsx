"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { localRepository } from "@/data/repository";
import { LIMITES } from "@/domain/limites";
import { pode } from "@/domain/permissoes";
import type { LinhaNoRelatorio } from "@/hooks/use-producao";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { PRESSAO } from "@/lib/pressao";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { CartaoTeams, EmailSimulado } from "../../notificacoes/_components/mensagem";
import { assuntoDoRelatorio, resumoDoRelatorio } from "./resumo";

/** Relatório já enviado desta linha neste turno (id `linhaId|turnoChave`). */
export function useRelatorioEnviado(linhaId: string, turnoChave: string) {
  return useSessionStore((s) => s.relatoriosEnviados[`${linhaId}|${turnoChave}`]);
}

/**
 * "Enviar à liderança" (Supervisão, RM-12): prévia do cartão do Teams e do e-mail exatamente como vão para a caixa de
 * saída, uma observação opcional, e o envio, que também conclui a tarefa "Fechar relatório do turno". O texto é gerado
 * pelo app; a supervisão só acrescenta o que quiser.
 */
export function EnviarRelatorio({
  linha,
  outras,
  turnoChave,
}: {
  linha: LinhaNoRelatorio;
  outras: readonly LinhaNoRelatorio[];
  turnoChave: string;
}) {
  const usuario = useUsuarioAtual();
  const [aberto, setAberto] = React.useState(false);
  const enviado = useRelatorioEnviado(linha.linha.id, turnoChave);
  if (!usuario || !pode(usuario.perfil, "relatorio", "escrever")) return null;

  return (
    <>
      <Button type="button" onClick={() => setAberto(true)} className={`toque:h-14 toque:px-5 ${PRESSAO}`}>
        <Send data-icon="inline-start" />
        {enviado ? "Enviar de novo" : "Enviar à liderança"}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        {aberto && (
          <DialogEnvio
            // A observação digitada não passa para a próxima pessoa do tablet (RNF-06).
            key={usuario.id}
            linha={linha}
            outras={outras}
            turnoChave={turnoChave}
            fechar={() => setAberto(false)}
          />
        )}
      </Dialog>
    </>
  );
}

function DialogEnvio({
  linha,
  outras,
  turnoChave,
  fechar,
}: {
  linha: LinhaNoRelatorio;
  outras: readonly LinhaNoRelatorio[];
  turnoChave: string;
  fechar: () => void;
}) {
  const router = useRouter();
  const agora = useAgora();
  const enviarRelatorio = useSessionStore((s) => s.enviarRelatorio);
  const tarefa = useMinhasTarefas().find((t) => t.templateId === "sup-relatorio");
  const [observacao, setObservacao] = React.useState("");
  const resumo = resumoDoRelatorio(linha, outras, turnoChave, observacao);
  const assunto = assuntoDoRelatorio(linha.linha.nome, turnoChave);
  const campoId = React.useId();

  function enviar() {
    const enviado = enviarRelatorio({ linhaId: linha.linha.id, turnoChave, resumo, tarefaId: tarefa?.id });
    if (!enviado) {
      toast.error("Não foi possível enviar", {
        description: "Confira se o tablet está desbloqueado e envie de novo.",
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }
    fechar();
    toast.success("Relatório enviado à liderança", {
      description: "Teams no canal da linha e e-mail para a Gerência (simulados).",
      action: { label: "Ver", onClick: () => router.push("/dashboard/notificacoes") },
    });
  }

  return (
    <DialogContent
      showCloseButton={false}
      className="toque:top-[4%] max-h-[calc(100dvh-2rem)] toque:max-h-[92dvh] toque:translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl"
    >
      <DialogHeader>
        <DialogTitle>Enviar o relatório da {linha.linha.nome}</DialogTitle>
        <DialogDescription>
          Teams no canal da linha (Gerência e Especialista) e e-mail para a Gerência. No protótipo o envio é simulado:
          as mensagens ficam na caixa de saída de Notificações.
        </DialogDescription>
      </DialogHeader>

      <div className="-mx-4 flex min-h-0 flex-col gap-4 overflow-y-auto px-4">
        <Tabs defaultValue="teams" className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="teams">
              <MessageSquare />
              Teams
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail />
              E-mail
            </TabsTrigger>
          </TabsList>
          <TabsContent value="teams" className="rounded-xl bg-muted/60 p-4">
            <CartaoTeams assunto={assunto} corpo={resumo} para={["gerencia", "especialista"]} em={agora} />
          </TabsContent>
          <TabsContent value="email" className="rounded-xl bg-muted/60 p-4">
            <EmailSimulado assunto={assunto} corpo={resumo} para={["gerencia"]} em={agora} />
          </TabsContent>
        </Tabs>

        <Field className="gap-1.5">
          <FieldLabel htmlFor={campoId}>Observação da supervisão</FieldLabel>
          <Textarea
            id={campoId}
            rows={2}
            maxLength={LIMITES.observacao}
            className="wrap-anywhere"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional. Ex.: Bis 2 recuperou a meta depois da troca de bobina."
          />
          <FieldDescription>Vai no fim da mensagem. Os números já estão preenchidos.</FieldDescription>
        </Field>
      </div>

      <DialogFooter className="gap-4 sm:items-center">
        <Button variant="outline" onClick={fechar}>
          Cancelar
        </Button>
        <Button className={`toque:h-16 toque:px-6 toque:text-base ${PRESSAO}`} onClick={enviar}>
          <Send data-icon="inline-start" />
          Enviar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/** Quando e por quem o relatório desta linha foi enviado (ou que ainda falta), para a gerência e para a supervisão. */
export function SituacaoDoEnvio({ linhaId, turnoChave }: { linhaId: string; turnoChave: string }) {
  const enviado = useRelatorioEnviado(linhaId, turnoChave);
  const quem = enviado ? localRepository.usuario(enviado.enviadoPor) : undefined;
  const linha = localRepository.linha(linhaId);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Envio à liderança</CardTitle>
        <CardDescription>
          {enviado
            ? `Enviado por ${quem?.nome ?? "—"} às ${formatarHora(new Date(enviado.em))}.`
            : `O relatório da ${linha?.nome ?? "linha"} ainda não foi enviado neste turno.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
            <MessageSquare className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">Teams · canal da linha</span>
            <span className="text-muted-foreground">Gerência e Especialista</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
            <Mail className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">E-mail</span>
            <span className="text-muted-foreground">Gerência</span>
          </div>
        </div>
        <p className="text-muted-foreground">
          {enviado
            ? "Se chegarem registros depois, o relatório na tela se atualiza; envie de novo se mudar algo importante."
            : "A supervisão envia no fim do turno, com um toque. Os números se atualizam sozinhos até lá."}
        </p>
      </CardContent>
    </Card>
  );
}
