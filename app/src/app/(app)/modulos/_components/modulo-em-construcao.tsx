"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "cn";
import { ArrowLeft, Check, Construction } from "lucide-react";
import { toast } from "sonner";

import { ICONE_MODULO } from "@/components/rotina/icone-modulo";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { localRepository } from "@/data/repository";
import { concluida, gerarTarefas } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import { toque } from "@/lib/touch";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

const INCREMENTO: Record<string, string> = {
  "ppli-centerlining": "I2",
  alertas: "I2",
  "hora-x-hora": "I3",
  mtbf: "I3",
  "troca-de-turno": "I4",
  "relatorio-do-turno": "I4",
};

/** Placeholder do I1: o formulário real de cada módulo chega no incremento indicado. */
export function ModuloEmConstrucao({ slug }: { slug: string }) {
  const router = useRouter();
  const tarefaId = useSearchParams().get("tarefa");
  const modulo = localRepository.modulo(slug);
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const concluirTarefa = useSessionStore((s) => s.concluirTarefa);
  const agora = useAgora();

  if (!modulo) return null;
  const Icone = ICONE_MODULO[slug] ?? Construction;

  const tarefa =
    tarefaId && usuario && contexto
      ? gerarTarefas({
          templates: localRepository.templates(),
          postoId: contexto.postoId,
          perfil: usuario.perfil,
          turno: turnoAtual(agora),
          agora,
          conclusoes,
        }).find((t) => t.id === tarefaId)
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" className={cn(toque.botao, "-ml-3 self-start")}>
        <Link href="/rotina">
          <ArrowLeft data-icon="inline-start" />
          Minha Rotina
        </Link>
      </Button>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icone />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">{tarefa?.titulo ?? modulo.nome}</EmptyTitle>
          <EmptyDescription className="text-base">
            {modulo.descricao} O formulário deste módulo chega no incremento {INCREMENTO[slug] ?? "I5"}.
          </EmptyDescription>
        </EmptyHeader>
        {tarefa && !concluida(tarefa) && (
          <EmptyContent>
            <Button
              className={toque.botao}
              onClick={() => {
                concluirTarefa(tarefa.id, agora);
                toast.success("Tarefa registrada", { description: tarefa.titulo });
                router.push("/rotina");
              }}
            >
              <Check data-icon="inline-start" />
              Marcar como feita
            </Button>
            <p className="text-muted-foreground text-sm">Atalho só do I1, até o formulário existir.</p>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
