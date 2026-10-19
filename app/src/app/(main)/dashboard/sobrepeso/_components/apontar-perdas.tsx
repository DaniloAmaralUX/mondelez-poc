"use client";

import { type FormEvent, type RefObject, useId, useRef } from "react";

import { cn } from "cn";
import { BellRing, CircleCheck, Lock, Scale } from "lucide-react";
import { toast } from "sonner";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { LIMITE_REFUGO_KG, LIMITE_SOBREPESO_G } from "@/domain/alertas-indicadores";
import { LIMITES } from "@/domain/limites";
import type { ApontamentoPerdas, TarefaInstancia } from "@/domain/types";
import { formatarHora, primeiroNome } from "@/lib/format";
import { PRESSAO } from "@/lib/pressao";
import { useSessionStore } from "@/stores/session/session-store";

import { gramas, MOTIVOS_PERDA, quilos, rotuloDoBloco } from "./formato";

export interface RascunhoPerdas {
  tarefaId: string;
  sobrepesoG: number | null;
  refugoKg: number | null;
  reprocessoKg: number | null;
  motivo: string;
  observacao: string;
  erros: Partial<Record<"sobrepesoG" | "refugoKg" | "reprocessoKg" | "motivo" | "observacao", string>>;
}

export const rascunhoDe = (tarefaId: string, a?: ApontamentoPerdas): RascunhoPerdas => ({
  tarefaId,
  sobrepesoG: a?.sobrepesoG ?? null,
  refugoKg: a?.refugoKg ?? null,
  reprocessoKg: a?.reprocessoKg ?? null,
  motivo: a?.motivo ?? "",
  observacao: a?.observacao ?? "",
  erros: {},
});

const SELETOR_PASSO = '[data-slot="number-field-increment"],[data-slot="number-field-decrement"]';

function arredondar(n: number) {
  return Math.round(n * 10) / 10;
}

/** Campo numérico grande com −/+ de um passo por toque (mesma solução do centerline do checklist). */
function CampoNumero({
  rotulo,
  unidade,
  passo,
  valor,
  erro,
  limite,
  grupoRef,
  onChange,
}: {
  readonly rotulo: string;
  readonly unidade: string;
  readonly passo: number;
  readonly valor: number | null;
  readonly erro: string | undefined;
  /** Limite que dispara o A-PERDA, quando houver. */
  readonly limite?: { valor: number; texto: string };
  readonly grupoRef: RefObject<HTMLDivElement | null>;
  readonly onChange: (v: number | null) => void;
}) {
  const ids = useId();
  const acima = limite !== undefined && valor !== null && valor > limite.valor;
  const idErro = `${ids}-erro`;
  const idAjuda = `${ids}-ajuda`;

  return (
    <Field data-invalid={erro ? true : undefined}>
      <FieldLabel htmlFor={`${ids}-campo`} className="text-base">
        {rotulo}
      </FieldLabel>
      <NumberField
        size="lg"
        value={valor}
        min={0}
        max={10_000}
        step={passo}
        locale="pt-BR"
        format={{ maximumFractionDigits: 1 }}
        onValueChange={(v) => onChange(v === null ? null : arredondar(v))}
      >
        <NumberFieldGroup
          ref={grupoRef}
          className="h-12 toque:h-16 text-xl"
          aria-invalid={erro ? true : undefined}
          onPointerDownCapture={(event) => {
            if (event.button !== 0) return;
            const botao = (event.target as HTMLElement).closest<HTMLElement>(SELETOR_PASSO);
            if (!botao || botao.matches(":disabled")) return;
            event.preventDefault();
            event.stopPropagation();
            const sentido = botao.dataset.slot === "number-field-increment" ? 1 : -1;
            onChange(Math.max(0, arredondar((valor ?? 0) + (valor === null ? 0 : sentido * passo))));
          }}
        >
          <NumberFieldDecrement className="toque:w-16 px-4" aria-label={`Diminuir ${rotulo}`} />
          <NumberFieldInput
            id={`${ids}-campo`}
            className="font-semibold tabular-nums"
            placeholder="0"
            inputMode="decimal"
            aria-describedby={erro ? `${idErro} ${idAjuda}` : idAjuda}
          />
          <NumberFieldIncrement className="toque:w-16 px-4" aria-label={`Aumentar ${rotulo}`} />
        </NumberFieldGroup>
      </NumberField>
      <FieldDescription
        id={idAjuda}
        className={cn("tabular-nums", acima && "font-medium text-red-700 dark:text-red-400")}
      >
        {unidade}
        {limite && (acima ? ` · acima do limite de ${limite.texto}` : ` · limite ${limite.texto}`)}
      </FieldDescription>
      {erro && <FieldError id={idErro}>{erro}</FieldError>}
    </Field>
  );
}

interface Props {
  readonly tarefa: TarefaInstancia | undefined;
  readonly apontamento: ApontamentoPerdas | undefined;
  readonly corrigindo: boolean;
  readonly podeEscrever: boolean;
  readonly proxima: TarefaInstancia | undefined;
  readonly rascunho: RascunhoPerdas | undefined;
  readonly onRascunho: (r: RascunhoPerdas) => void;
  readonly onCancelarCorrecao: () => void;
  readonly onGravado: () => void;
}

/**
 * Apontamento de perdas do bloco de 2 horas (RM-03): sobrepeso médio por pacote, refugo e reprocesso, com os limites do
 * alerta A-PERDA à vista. Acima de um limite, o motivo passa a ser obrigatório e o aviso diz que a liderança recebeu o
 * alerta. Mesmo desenho do card de apontar do Hora x Hora.
 */
export function ApontarPerdas(props: Props) {
  if (!props.tarefa) return <TudoApontado proxima={props.proxima} />;
  if (!props.podeEscrever) return <SoLeitura tarefa={props.tarefa} />;
  return <Formulario {...props} tarefa={props.tarefa} />;
}

function Formulario({
  tarefa,
  apontamento,
  corrigindo,
  rascunho: doPai,
  onRascunho,
  onCancelarCorrecao,
  onGravado,
}: Props & { readonly tarefa: TarefaInstancia }) {
  const ids = useId();
  const refs = {
    sobrepesoG: useRef<HTMLDivElement>(null),
    refugoKg: useRef<HTMLDivElement>(null),
    reprocessoKg: useRef<HTMLDivElement>(null),
    motivo: useRef<HTMLDivElement>(null),
    observacao: useRef<HTMLTextAreaElement>(null),
  };

  const rascunho = doPai?.tarefaId === tarefa.id ? doPai : rascunhoDe(tarefa.id);
  const { sobrepesoG, refugoKg, reprocessoKg, motivo, observacao, erros } = rascunho;
  const mudar = (parcial: Partial<RascunhoPerdas>, campo?: keyof RascunhoPerdas["erros"]) =>
    onRascunho({ ...rascunho, ...parcial, erros: campo ? { ...erros, [campo]: undefined } : erros });

  const bloco = rotuloDoBloco(tarefa);
  const acimaRefugo = refugoKg !== null && refugoKg > LIMITE_REFUGO_KG;
  const acimaSobrepeso = sobrepesoG !== null && sobrepesoG > LIMITE_SOBREPESO_G;
  const acima = acimaRefugo || acimaSobrepeso;
  const atrasada = tarefa.estado === "atrasada";
  const autor = apontamento ? localRepository.usuario(apontamento.usuarioId) : undefined;

  let situacao = `Aponte até ${formatarHora(tarefa.prazo)}`;
  if (corrigindo && apontamento) {
    situacao = `Apontado por ${autor ? primeiroNome(autor.nome) : "alguém"} às ${formatarHora(new Date(apontamento.em))}`;
  } else if (atrasada) {
    situacao = `Pendente: venceu às ${formatarHora(tarefa.prazo)}`;
  }

  const idMotivos = `${ids}-motivos`;
  const idErroMotivo = `${ids}-erro-motivo`;
  const idObs = `${ids}-obs`;
  const idErroObs = `${ids}-erro-obs`;

  function gravar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const novos: RascunhoPerdas["erros"] = {};
    if (sobrepesoG === null) novos.sobrepesoG = "Digite o sobrepeso médio (0 se não houve).";
    if (refugoKg === null) novos.refugoKg = "Digite o refugo (0 se não houve).";
    if (reprocessoKg === null) novos.reprocessoKg = "Digite o reprocesso (0 se não houve).";
    if (acima && !motivo) novos.motivo = "Acima do limite: escolha o motivo.";
    if (motivo === "Outro" && !observacao.trim()) novos.observacao = "Descreva o motivo na observação.";

    const primeiro = (["sobrepesoG", "refugoKg", "reprocessoKg", "motivo", "observacao"] as const).find(
      (c) => novos[c],
    );
    if (primeiro) {
      onRascunho({ ...rascunho, erros: novos });
      const alvo = refs[primeiro].current;
      if (alvo instanceof HTMLTextAreaElement) alvo.focus();
      else alvo?.querySelector<HTMLElement>(primeiro === "motivo" ? "button" : 'input:not([tabindex="-1"])')?.focus();
      return;
    }
    if (sobrepesoG === null || refugoKg === null || reprocessoKg === null) return;

    const gravado = useSessionStore.getState().apontarPerdas({
      tarefa,
      sobrepesoG,
      refugoKg,
      reprocessoKg,
      motivo: motivo || undefined,
      observacao,
    });
    if (!gravado) {
      toast.error("Não deu para apontar", {
        description: "O tablet está bloqueado ou o seu perfil não aponta produção.",
      });
      return;
    }
    const resumo = `Sobrepeso ${gramas(gravado.sobrepesoG)} · refugo ${quilos(gravado.refugoKg)} · reprocesso ${quilos(gravado.reprocessoKg)}`;
    if (acima) {
      toast.warning(`Bloco das ${bloco} acima do limite`, {
        description: `${resumo}. A liderança recebeu o alerta A-PERDA.`,
      });
    } else {
      toast.success(corrigindo ? `Bloco das ${bloco} corrigido` : `Bloco das ${bloco} apontado`, {
        description: resumo,
      });
    }
    onGravado();
  }

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <div
          aria-hidden
          className={cn(
            "row-span-2 grid size-12 toque:size-14 place-items-center rounded-xl",
            atrasada && !corrigindo ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <Scale className="size-6" />
        </div>
        <CardDescription
          className={cn("tabular-nums", atrasada && !corrigindo && "font-medium text-red-700 dark:text-red-400")}
        >
          {situacao}
        </CardDescription>
        <CardTitle className="text-balance text-2xl leading-tight">
          {corrigindo ? `Corrigir o bloco das ${bloco}` : `Perdas das ${bloco}`}
        </CardTitle>
      </CardHeader>

      <form noValidate onSubmit={gravar} className="flex flex-1 flex-col gap-6">
        <CardContent className="flex flex-1 flex-col gap-6">
          {/* Três números lado a lado quando o card é largo (container do card, não da tela). */}
          <div className="@container/perdas">
            <div className="grid @min-[34rem]/perdas:grid-cols-3 gap-5">
              <CampoNumero
                rotulo="Sobrepeso médio"
                unidade="gramas por pacote"
                passo={0.1}
                valor={sobrepesoG}
                erro={erros.sobrepesoG}
                limite={{ valor: LIMITE_SOBREPESO_G, texto: gramas(LIMITE_SOBREPESO_G) }}
                grupoRef={refs.sobrepesoG}
                onChange={(v) => mudar({ sobrepesoG: v }, "sobrepesoG")}
              />
              <CampoNumero
                rotulo="Refugo"
                unidade="quilos no bloco"
                passo={0.5}
                valor={refugoKg}
                erro={erros.refugoKg}
                limite={{ valor: LIMITE_REFUGO_KG, texto: quilos(LIMITE_REFUGO_KG) }}
                grupoRef={refs.refugoKg}
                onChange={(v) => mudar({ refugoKg: v }, "refugoKg")}
              />
              <CampoNumero
                rotulo="Reprocesso"
                unidade="quilos no bloco"
                passo={0.5}
                valor={reprocessoKg}
                erro={erros.reprocessoKg}
                grupoRef={refs.reprocessoKg}
                onChange={(v) => mudar({ reprocessoKg: v }, "reprocessoKg")}
              />
            </div>
          </div>

          {acima && (
            <p
              role="status"
              className="flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-red-800 dark:text-red-300"
            >
              <BellRing className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span className="text-pretty">
                Acima do limite. Ao gravar, a liderança da linha recebe o alerta A-PERDA com estes números e o motivo.
              </span>
            </p>
          )}

          <FieldSet className="gap-3" data-invalid={erros.motivo ? true : undefined}>
            <FieldLegend id={idMotivos} variant="label" className="text-base">
              Motivo {acima ? "" : "(opcional)"}
            </FieldLegend>
            <ToggleGroup
              ref={refs.motivo}
              type="single"
              variant="outline"
              spacing={3}
              value={motivo}
              onValueChange={(v) => mudar({ motivo: v }, "motivo")}
              aria-labelledby={idMotivos}
              aria-invalid={erros.motivo ? true : undefined}
              aria-describedby={erros.motivo ? idErroMotivo : undefined}
              className="w-full flex-wrap"
            >
              {MOTIVOS_PERDA.map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className={cn(
                    "h-11 toque:h-14 px-4 text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
                    PRESSAO,
                  )}
                >
                  {m}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {erros.motivo && <FieldError id={idErroMotivo}>{erros.motivo}</FieldError>}
          </FieldSet>

          <Field data-invalid={erros.observacao ? true : undefined}>
            <FieldLabel htmlFor={idObs} className="text-base">
              Observação {motivo === "Outro" ? "" : "(opcional)"}
            </FieldLabel>
            <Textarea
              ref={refs.observacao}
              id={idObs}
              value={observacao}
              maxLength={LIMITES.observacao}
              rows={2}
              placeholder="Ex.: balança da Loeschpack 4 recalibrada às 07:20"
              onChange={(e) => mudar({ observacao: e.target.value }, "observacao")}
              aria-invalid={erros.observacao ? true : undefined}
              aria-describedby={erros.observacao ? idErroObs : undefined}
              className="toque:min-h-24 text-base"
            />
            {erros.observacao && <FieldError id={idErroObs}>{erros.observacao}</FieldError>}
          </Field>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 border-t">
          <Button type="submit" size="lg" className={cn("h-11 toque:h-16 w-full text-base", PRESSAO)}>
            {corrigindo ? "Salvar correção" : `Apontar ${bloco}`}
          </Button>
          {corrigindo && (
            <Button type="button" variant="ghost" className="h-11 toque:h-14" onClick={onCancelarCorrecao}>
              Cancelar correção
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function TudoApontado({ proxima }: { readonly proxima: TarefaInstancia | undefined }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>Perdas do bloco</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
          <CircleCheck className="size-6 text-green-600" aria-hidden />
          Tudo apontado
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {proxima
          ? `O bloco das ${rotuloDoBloco(proxima)} abre para apontar às ${formatarHora(proxima.abre)}.`
          : "Todos os blocos do turno estão apontados."}{" "}
        Para mudar um bloco, toque em Corrigir na lista.
      </CardContent>
    </Card>
  );
}

function SoLeitura({ tarefa }: { readonly tarefa: TarefaInstancia }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Lock className="size-3.5" aria-hidden />
          Só leitura
        </CardDescription>
        <CardTitle className="text-2xl tracking-tight">Bloco das {rotuloDoBloco(tarefa)} em aberto</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Quem aponta as perdas é a Operação do posto, ou a Supervisão da linha. O seu perfil acompanha os números.
      </CardContent>
    </Card>
  );
}
