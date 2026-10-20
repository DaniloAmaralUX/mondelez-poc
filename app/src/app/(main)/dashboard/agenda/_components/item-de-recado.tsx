"use client";

import { cn } from "cn";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Recado } from "@/domain/types";
import { useSessionStore } from "@/stores/session/session-store";

import { ICONE_DO_TIPO, NOME_DO_TIPO, ondeDoRecado, publicacao, quandoDoRecado, TINTA_DO_TIPO } from "./recados";

/**
 * Um recado ou compromisso, como linha da lista: ícone do tipo num bloco tingido (o tipo também vem escrito), título,
 * onde e quando, e quem publicou. "Retirar" aparece para quem publicou e para a Gerência (regra de `removerRecado`).
 *
 * Retirar pede confirmação (AlertDialog) e não tem desfazer: o contrato não tem como restaurar um recado, e publicar de
 * novo mandaria outro aviso por e-mail para a fábrica toda (app/CONVENCOES.md: AlertDialog só para o irreversível).
 */
export function ItemDeRecado({
  recado,
  agora,
  podeRetirar,
  mostrarData = true,
}: {
  readonly recado: Recado;
  readonly agora: Date;
  readonly podeRetirar: boolean;
  readonly mostrarData?: boolean;
}) {
  const Icone = ICONE_DO_TIPO[recado.tipo];
  const quando = mostrarData ? quandoDoRecado(recado) : recado.horario;

  return (
    <div className="flex items-start gap-3 py-3">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TINTA_DO_TIPO[recado.tipo])}>
        <Icone className="size-5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="wrap-anywhere font-medium text-base leading-snug">{recado.titulo}</p>
        <p className="text-sm">
          <span className="font-medium">{NOME_DO_TIPO[recado.tipo]}</span> · {ondeDoRecado(recado)}
          {quando && <span className="tabular-nums"> · {quando}</span>}
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">{publicacao(recado, agora)}</p>
      </div>
      {podeRetirar && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground toque:text-sm">
              <Trash2 data-icon="inline-start" />
              Retirar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirar da agenda?</AlertDialogTitle>
              <AlertDialogDescription>
                “{recado.titulo}” sai da Agenda e dos Recados de todos os tablets. Para voltar, é preciso publicar de
                novo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="toque:h-14">Manter</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="toque:h-14"
                onClick={() => {
                  if (useSessionStore.getState().removerRecado(recado.id)) toast.success("Retirado da agenda");
                  else toast.info("Não deu para retirar", { description: "Só quem publicou ou a Gerência retira." });
                }}
              >
                Retirar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
