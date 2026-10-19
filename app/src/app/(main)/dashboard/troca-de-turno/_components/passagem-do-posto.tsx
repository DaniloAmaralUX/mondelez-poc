"use client";

import * as React from "react";

import { cn } from "cn";
import { CircleCheck, Clock, FileText, Minus, Plus, Send, UserRoundCheck } from "lucide-react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { localRepository } from "@/data/repository";
import { LIMITES } from "@/domain/limites";
import type { TarefaInstancia, TrocaDeTurno } from "@/domain/types";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora, primeiroNome } from "@/lib/format";
import { PRESSAO } from "@/lib/pressao";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { AceiteDoTurno } from "./aceite-do-turno";
import { CAMPOS_DE_INDICADOR, KpisDaPassagem } from "./kpis-da-passagem";
import { PapelDaPassagem, type RespostasDaPassagem } from "./papel-da-passagem";
import { candidatosAoAceite, type Passagem, turmaDoTurnoSeguinte, usePassagem } from "./use-passagem";

/** Perguntas guiadas (etiquetas, onde, paradas, pendências, pedidos de ajuda, comentário). */
const CAMPOS_DE_PERGUNTA = 6;

function valoresIniciais(passagem: Passagem): RespostasDaPassagem {
  const { troca, sugestoes } = passagem;
  if (troca) {
    return {
      etiquetasAbertas: String(troca.etiquetasAbertas),
      ondeEtiquetas: troca.ondeEtiquetas,
      paradas: troca.paradas,
      pendencias: troca.pendencias,
      pedidosAjuda: troca.pedidosAjuda,
      comentario: troca.comentario,
    };
  }
  return { etiquetasAbertas: "", ondeEtiquetas: "", comentario: "", ...sugestoes };
}

/**
 * Passagem do posto pelo operador (RM-13, RN-10), no padrão Invoice: formulário e documento. Os números vêm prontos e
 * as perguntas guiadas já trazem o que o app sabe (falhas, pendências, pedidos de ajuda); a pessoa responde só as
 * etiquetas e o comentário. Depois de entregar, quem recebe confirma com o PIN no mesmo tablet.
 */
export function PassagemDoPosto() {
  const usuario = useUsuarioAtual();
  const postoId = useSessionStore((s) => s.contexto?.postoId);
  const passagem = usePassagem(postoId);
  const tarefa = useMinhasTarefas().find((t) => t.templateId === "troca-de-turno-op");

  if (!postoId) return null;
  return (
    <FormularioDaPassagem
      // Remonta com a troca gravada (entregue, recebida) e na troca de pessoa: o texto digitado por quem saiu não
      // passa para quem entrou (RNF-06). Na virada do turno, recomeça com os números do turno novo.
      key={`${usuario?.id ?? ""}|${passagem.turnoChave}|${passagem.troca?.entregueEm ?? "aberta"}`}
      postoId={postoId}
      passagem={passagem}
      tarefa={tarefa}
    />
  );
}

function FormularioDaPassagem({
  postoId,
  passagem,
  tarefa,
}: {
  postoId: string;
  passagem: Passagem;
  tarefa: TarefaInstancia | undefined;
}) {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const entregarTurno = useSessionStore((s) => s.entregarTurno);
  const { troca, kpis, turno } = passagem;
  const recebida = Boolean(troca?.aceitePor);
  const aceiteRef = React.useRef<HTMLDivElement>(null);
  const form = useForm<RespostasDaPassagem>({ defaultValues: valoresIniciais(passagem) });
  const respostas = useWatch({ control: form.control }) as RespostasDaPassagem;
  const antesDaJanela = Boolean(tarefa?.futura);

  const preenchidas =
    CAMPOS_DE_INDICADOR +
    (["paradas", "pendencias", "pedidosAjuda"] as const).filter((c) => passagem.sugestoes[c]).length;
  const total = CAMPOS_DE_INDICADOR + CAMPOS_DE_PERGUNTA;

  let ajudaDaEntrega = "Entregar grava a passagem; o aceite vem em seguida.";
  if (antesDaJanela && tarefa)
    ajudaDaEntrega = `A entrega abre às ${formatarHora(tarefa.abre)}, 30 min antes do fim do turno.`;
  else if (troca) ajudaDaEntrega = "Mudou algo? Atualize antes do aceite.";

  function enviar(valores: RespostasDaPassagem) {
    if (!kpis || recebida) return;
    const etiquetas = Number.parseInt(valores.etiquetasAbertas, 10);
    const novo = entregarTurno({
      etiquetasAbertas: etiquetas,
      ondeEtiquetas: etiquetas > 0 ? valores.ondeEtiquetas : "",
      paradas: valores.paradas,
      pendencias: valores.pendencias,
      pedidosAjuda: valores.pedidosAjuda,
      comentario: valores.comentario,
      kpis,
      tarefaId: tarefa?.id,
    });
    if (!novo) {
      toast.error("Não foi possível entregar", {
        description: "Confira se o tablet está desbloqueado e entregue de novo. As respostas continuam aqui.",
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }
    toast.success(troca ? "Passagem atualizada" : "Turno entregue", {
      description: "Agora quem recebe confirma com o PIN, logo abaixo.",
    });
  }

  // Depois de entregar, a tela leva ao aceite (o formulário remonta com a troca gravada).
  React.useEffect(() => {
    if (troca && !troca.aceitePor) aceiteRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [troca]);

  const papel = (
    <PapelDaPassagem
      postoId={postoId}
      turno={turno}
      operadorId={troca?.entreguePor ?? usuario?.id}
      kpis={troca?.kpis ?? kpis}
      respostas={respostas}
      troca={troca}
    />
  );

  return (
    <FormProvider {...form}>
      {/* Notebook (64 rem de área útil ou mais): formulário e documento lado a lado, como no Invoice. iPad (retrato e
          paisagem): coluna única e o documento em "Ver documento", na escala 1. */}
      <div className="grid @5xl/content:grid-cols-12 items-start gap-6">
        <div className="@5xl/content:col-span-7 flex min-w-0 flex-col gap-6">
          <EstadoDaPassagem troca={troca} tarefa={tarefa} />

          {kpis && (
            <KpisDaPassagem
              kpis={troca?.kpis ?? kpis}
              descricao={
                troca
                  ? `Fotografia da entrega, às ${formatarHora(new Date(troca.entregueEm))}.`
                  : `Preenchidos pelo app até ${formatarHora(agora)}. Não precisa digitar.`
              }
              prontos={troca ? undefined : preenchidas}
              total={troca ? undefined : total}
            />
          )}

          <form id="passagem-form" noValidate onSubmit={form.handleSubmit(enviar)}>
            <Card>
              <CardHeader>
                <CardTitle>Perguntas da passagem</CardTitle>
                <CardDescription>
                  {recebida
                    ? "Respostas como foram entregues."
                    : `Paradas, pendências e pedidos de ajuda já vêm do turno. Revise e complete.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Perguntas somenteLeitura={recebida} />
              </CardContent>
              {!recebida && (
                <CardFooter className="@md/content:flex-row flex-col @md/content:items-center items-stretch @md/content:justify-between gap-3 border-t">
                  <p id="passagem-ajuda" className="text-muted-foreground text-sm">
                    {ajudaDaEntrega}
                  </p>
                  <Button
                    type="submit"
                    disabled={antesDaJanela}
                    aria-describedby="passagem-ajuda"
                    className={cn("h-11 toque:h-16 toque:px-6 toque:text-base", PRESSAO)}
                  >
                    <Send data-icon="inline-start" />
                    {troca ? "Atualizar entrega" : "Entregar turno"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </form>

          {troca && !recebida && (
            <div ref={aceiteRef} className="scroll-mt-[calc(var(--dashboard-header-height)+1rem)]">
              <CardDoAceite troca={troca} passagem={passagem} />
            </div>
          )}

          <div className="@5xl/content:hidden">
            <PreviaDoDocumento>{papel}</PreviaDoDocumento>
          </div>
        </div>

        <aside aria-label="Documento da passagem" className="@5xl/content:col-span-5 @5xl/content:block hidden min-w-0">
          <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-foreground/10">{papel}</div>
        </aside>
      </div>
    </FormProvider>
  );
}

function EstadoDaPassagem({ troca, tarefa }: { troca: TrocaDeTurno | undefined; tarefa: TarefaInstancia | undefined }) {
  if (troca?.aceitePor && troca.aceiteEm) {
    const quem = localRepository.usuario(troca.aceitePor);
    return (
      <Alert>
        <UserRoundCheck />
        <AlertTitle>
          Recebido por {quem?.nome} às {formatarHora(new Date(troca.aceiteEm))}
        </AlertTitle>
        <AlertDescription>Passagem concluída. Bom descanso.</AlertDescription>
      </Alert>
    );
  }
  if (troca) {
    return (
      <Alert>
        <CircleCheck />
        <AlertTitle>Entregue às {formatarHora(new Date(troca.entregueEm))}</AlertTitle>
        <AlertDescription>Falta o aceite de quem recebe o posto, com o PIN dessa pessoa.</AlertDescription>
      </Alert>
    );
  }
  if (tarefa?.futura) {
    return (
      <Alert>
        <Clock />
        <AlertTitle>A passagem abre às {formatarHora(tarefa.abre)}</AlertTitle>
        <AlertDescription>
          Os números abaixo já são os do turno até agora. Dá para revisar as respostas antes.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

function CardDoAceite({ troca, passagem }: { troca: TrocaDeTurno; passagem: Passagem }) {
  const usuario = useUsuarioAtual();
  const { operadores, supervisao } = candidatosAoAceite(troca, passagem.turno);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aceite de quem recebe</CardTitle>
        <CardDescription>A turma do próximo turno vem primeiro. Na ausência dela, a supervisão recebe.</CardDescription>
      </CardHeader>
      <CardContent>
        <AceiteDoTurno
          key={usuario?.id ?? ""}
          troca={troca}
          operadores={operadores}
          supervisao={supervisao}
          turmaSeguinte={turmaDoTurnoSeguinte(passagem.turno)}
        />
      </CardContent>
    </Card>
  );
}

function Perguntas({ somenteLeitura }: { somenteLeitura: boolean }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RespostasDaPassagem>();
  const etiquetas = Number.parseInt(useWatch({ control, name: "etiquetasAbertas" }) ?? "", 10);

  return (
    <FieldGroup className="gap-6">
      <div className="grid @xl/content:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
        <Controller
          control={control}
          name="etiquetasAbertas"
          rules={{
            validate: (v) => (/^\d+$/.test(v.trim()) ? true : "Diga quantas etiquetas ficaram abertas (0 se nenhuma)."),
          }}
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={Boolean(fieldState.error)}>
              <FieldLabel htmlFor="etiquetas">Etiquetas abertas</FieldLabel>
              <Contador
                id="etiquetas"
                valor={field.value}
                aoMudar={field.onChange}
                aoSair={field.onBlur}
                inputRef={field.ref}
                invalido={Boolean(fieldState.error)}
                somenteLeitura={somenteLeitura}
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : (
                <FieldDescription>Quantas ficaram para o próximo turno.</FieldDescription>
              )}
            </Field>
          )}
        />
        <Field className="gap-1.5" data-invalid={Boolean(errors.ondeEtiquetas)}>
          <FieldLabel htmlFor="onde-etiquetas">Onde</FieldLabel>
          <Input
            id="onde-etiquetas"
            maxLength={LIMITES.observacao}
            readOnly={somenteLeitura}
            disabled={!somenteLeitura && !(etiquetas > 0)}
            aria-invalid={Boolean(errors.ondeEtiquetas)}
            className="wrap-anywhere h-11"
            placeholder={somenteLeitura ? undefined : "Equipamento e o que está pendente"}
            {...register("ondeEtiquetas", {
              validate: (v, valores) =>
                Number.parseInt(valores.etiquetasAbertas, 10) > 0 && !v.trim()
                  ? "Diga onde estão as etiquetas abertas."
                  : true,
            })}
          />
          {errors.ondeEtiquetas ? (
            <FieldError>{errors.ondeEtiquetas.message}</FieldError>
          ) : (
            <FieldDescription>
              {etiquetas > 0 || somenteLeitura
                ? "Ex.: Loeschpack 4, desalinhamento da correia."
                : "Só com etiqueta aberta."}
            </FieldDescription>
          )}
        </Field>
      </div>

      <Pergunta
        id="paradas"
        rotulo="Paradas"
        ajuda="Do apontamento de falhas do turno."
        somenteLeitura={somenteLeitura}
      />
      <Pergunta
        id="pendencias"
        rotulo="Pendências"
        ajuda="Tarefas atrasadas e alertas ainda abertos no posto."
        somenteLeitura={somenteLeitura}
      />
      <Pergunta
        id="pedidosAjuda"
        rotulo="Pedidos de ajuda"
        ajuda="Os pedidos do turno e se alguém já atendeu."
        somenteLeitura={somenteLeitura}
      />
      <Pergunta
        id="comentario"
        rotulo="Comentário"
        ajuda="Opcional. Uma sugestão para quem chega, por exemplo."
        placeholder="Algo que a máquina não sabe?"
        somenteLeitura={somenteLeitura}
      />
    </FieldGroup>
  );
}

function Pergunta({
  id,
  rotulo,
  ajuda,
  placeholder,
  somenteLeitura,
}: {
  id: "paradas" | "pendencias" | "pedidosAjuda" | "comentario";
  rotulo: string;
  ajuda: string;
  placeholder?: string;
  somenteLeitura: boolean;
}) {
  const { register } = useFormContext<RespostasDaPassagem>();
  const campoId = `passagem-${id}`;
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={campoId}>{rotulo}</FieldLabel>
      <Textarea
        id={campoId}
        rows={2}
        maxLength={LIMITES.observacao}
        readOnly={somenteLeitura}
        placeholder={somenteLeitura ? undefined : placeholder}
        className="wrap-anywhere"
        {...register(id)}
      />
      <FieldDescription>{ajuda}</FieldDescription>
    </Field>
  );
}

/**
 * Quantidade com − e + de 64 px no toque (resposta do operador) e o número no meio, que também aceita digitar. Um toque,
 * um passo; nada de repetir enquanto segura (luva).
 */
function Contador({
  id,
  valor,
  aoMudar,
  aoSair,
  inputRef,
  invalido,
  somenteLeitura,
}: {
  id: string;
  valor: string;
  aoMudar: (valor: string) => void;
  aoSair: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  invalido: boolean;
  somenteLeitura: boolean;
}) {
  const atual = Number.parseInt(valor, 10);
  const passo = (sentido: 1 | -1) => {
    const base = Number.isFinite(atual) ? atual : 0;
    aoMudar(String(Math.max(0, base + sentido)));
  };
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Menos uma etiqueta"
        disabled={somenteLeitura || !(atual > 0)}
        onClick={() => passo(-1)}
        className={cn("size-11 toque:size-16", PRESSAO)}
      >
        <Minus />
      </Button>
      <Input
        ref={inputRef}
        id={id}
        value={valor}
        readOnly={somenteLeitura}
        onChange={(e) => aoMudar(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={aoSair}
        inputMode="numeric"
        autoComplete="off"
        placeholder="—"
        aria-invalid={invalido}
        className="h-11 toque:h-16 w-20 text-center text-lg toque:text-xl tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Mais uma etiqueta"
        disabled={somenteLeitura}
        onClick={() => passo(1)}
        className={cn("size-11 toque:size-16", PRESSAO)}
      >
        <Plus />
      </Button>
    </div>
  );
}

/** Documento atrás de "Ver documento" no iPad (como no checklist): Sheet em tela cheia com a folha na escala 1. */
function PreviaDoDocumento({ children }: { children: React.ReactNode }) {
  const usuario = useUsuarioAtual();
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="font-semibold tracking-tight">Relatório de troca de turno</h2>
        <p className="text-muted-foreground text-sm">
          Como a passagem fica para quem recebe
          {usuario ? `, entregue por ${primeiroNome(usuario.nome)}` : ""}.
        </p>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="toque:h-14">
            <FileText data-icon="inline-start" />
            Ver documento
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
        >
          <SheetHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b px-4 pt-[max(--spacing(3),env(safe-area-inset-top))] pb-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <SheetTitle>Relatório de troca de turno</SheetTitle>
              <SheetDescription>Prévia do documento da passagem.</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button type="button">Fechar</Button>
            </SheetClose>
          </SheetHeader>
          <section
            // biome-ignore lint/a11y/noNoninteractiveTabindex: região com rolagem precisa de foco para o teclado rolar (WCAG 2.1.1).
            tabIndex={0}
            aria-label="Documento da passagem"
            className="min-h-0 flex-1 overflow-auto overscroll-contain bg-stone-200 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset dark:bg-stone-800"
          >
            <div className="mx-auto w-full max-w-3xl shadow-sm">{children}</div>
          </section>
        </SheetContent>
      </Sheet>
    </section>
  );
}
