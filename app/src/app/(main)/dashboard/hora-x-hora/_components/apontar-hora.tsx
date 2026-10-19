"use client";

import { type FormEvent, useId, useRef } from "react";

import Link from "next/link";

import { cn } from "cn";
import { ChartColumn, CircleCheck, Lock, TriangleAlert } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { LIMITES } from "@/domain/limites";
import { farol, ge, type HoraDoTurno, toneladas } from "@/domain/producao";
import type { Sku, TarefaInstancia } from "@/domain/types";
import { formatarHora, primeiroNome } from "@/lib/format";
import { PRESSAO } from "@/lib/pressao";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { FarolStatus } from "./farol-status";
import { inteiro, juntarMotivo, MOTIVOS_HORA, pct, tonHora } from "./formato";

export interface RascunhoHora {
  /** Hora a que o rascunho se refere (ISO); outra hora começa do zero. */
  bloco: string;
  caixas: number | null;
  motivo: string;
  detalhe: string;
  erros: { caixas?: string; motivo?: string; detalhe?: string };
}

export const rascunhoVazio = (bloco: string): RascunhoHora => ({
  bloco,
  caixas: null,
  motivo: "",
  detalhe: "",
  erros: {},
});

const SELETOR_PASSO = '[data-slot="number-field-increment"],[data-slot="number-field-decrement"]';
const PASSO_CAIXAS = 10;
const MAX_CAIXAS = 5000;
const HORA_MS = 60 * 60 * 1000;

interface Props {
  readonly alvo: HoraDoTurno | undefined;
  readonly tarefa: TarefaInstancia | undefined;
  readonly corrigindo: boolean;
  readonly podeEscrever: boolean;
  readonly sku: Sku | undefined;
  readonly metaHoraTon: number;
  readonly metaCaixas: number;
  readonly falhasNaHora: number;
  readonly proximaHora: HoraDoTurno | undefined;
  readonly rascunho: RascunhoHora | undefined;
  readonly onRascunho: (r: RascunhoHora) => void;
  readonly onCancelarCorrecao: () => void;
  readonly onGravado: () => void;
}

/**
 * A ação principal do operador (job P0 "quando fecha a hora, quero apontar as caixas e ver se estou na meta"): a hora
 * pendente mais antiga, ou a hora aberta, com o campo de caixas grande, a prévia ao vivo de toneladas, GE e farol, e o
 * motivo obrigatório abaixo da meta. Mesmo desenho do "Fazer agora" da Minha Rotina (ícone do módulo num bloco
 * tingido, título em 24 px, botão primário de 64 px no toque).
 *
 * O rascunho fica no componente pai: a tela renderiza este card em dois lugares (primeiro no iPad, ao lado do gráfico
 * no notebook) e o CSS mostra um; com o rascunho no pai, os dois mostram o mesmo número.
 */
export function ApontarHora(props: Props) {
  const { alvo, podeEscrever } = props;
  if (!alvo) return <TudoApontado proxima={props.proximaHora} />;
  if (!podeEscrever) return <SoLeitura alvo={alvo} />;
  return <FormularioDaHora {...props} alvo={alvo} />;
}

function FormularioDaHora({
  alvo,
  tarefa,
  corrigindo,
  sku,
  metaHoraTon,
  metaCaixas,
  falhasNaHora,
  rascunho: rascunhoDoPai,
  onRascunho,
  onCancelarCorrecao,
  onGravado,
}: Props & { readonly alvo: HoraDoTurno }) {
  const agora = useAgora();
  const ids = useId();
  const caixasRef = useRef<HTMLDivElement>(null);
  const motivosRef = useRef<HTMLDivElement>(null);
  const detalheRef = useRef<HTMLInputElement>(null);

  const rascunho = rascunhoDoPai?.bloco === alvo.bloco ? rascunhoDoPai : rascunhoVazio(alvo.bloco);
  const { caixas, motivo, detalhe, erros } = rascunho;
  const mudar = (parcial: Partial<RascunhoHora>) => onRascunho({ ...rascunho, ...parcial });

  const inicio = new Date(alvo.bloco);
  const fim = new Date(inicio.getTime() + HORA_MS);
  const hora = alvo.rotulo;
  const ton = caixas !== null && sku ? toneladas(caixas, sku) : null;
  const geHora = ton !== null && sku ? ge(ton, sku.capacidadeTonHora, 1) : null;
  const abaixo = ton !== null && ton < metaHoraTon;
  const pendente = alvo.estado === "pendente";
  const autor = alvo.apontamento ? localRepository.usuario(alvo.apontamento.usuarioId) : undefined;

  let situacao: string;
  if (corrigindo && alvo.apontamento) {
    situacao = `Apontada por ${autor ? primeiroNome(autor.nome) : "alguém"} às ${formatarHora(new Date(alvo.apontamento.em))}: ${inteiro(alvo.apontamento.caixas)} caixas`;
  } else if (pendente) {
    situacao = `Pendente: a hora fechou às ${formatarHora(fim)}`;
  } else if (agora < fim) {
    situacao = `Hora em curso, fecha às ${formatarHora(fim)}`;
  } else {
    situacao = `A hora fechou às ${formatarHora(fim)}`;
  }

  const idCaixas = `${ids}-caixas`;
  const idErroCaixas = `${ids}-erro-caixas`;
  const idPrevia = `${ids}-previa`;
  const idMotivos = `${ids}-motivos`;
  const idErroMotivo = `${ids}-erro-motivo`;
  const idDetalhe = `${ids}-detalhe`;
  const idErroDetalhe = `${ids}-erro-detalhe`;

  function gravar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const novos: RascunhoHora["erros"] = {};
    if (caixas === null) novos.caixas = "Digite as caixas produzidas na hora.";
    else if (abaixo && !motivo) novos.motivo = "Abaixo da meta: escolha o motivo.";
    else if (abaixo && motivo === "Outro" && !detalhe.trim()) novos.detalhe = "Descreva o motivo.";

    if (novos.caixas || novos.motivo || novos.detalhe) {
      mudar({ erros: novos });
      // Foco no primeiro erro (docs/12 §2 item 12). O input oculto do base-ui tem tabIndex -1.
      if (novos.caixas) caixasRef.current?.querySelector<HTMLInputElement>('input:not([tabindex="-1"])')?.focus();
      else if (novos.motivo) motivosRef.current?.querySelector<HTMLElement>("button")?.focus();
      else detalheRef.current?.focus();
      return;
    }
    if (caixas === null || !sku) return;
    if (!tarefa) {
      toast.error("Não deu para apontar", { description: `A tarefa da hora das ${hora} não está neste posto.` });
      return;
    }

    const gravado = useSessionStore.getState().apontarHora({
      tarefa,
      skuId: sku.id,
      caixas,
      // Na meta, o motivo não é pedido; o que a pessoa escreveu fica como observação da hora.
      motivo: juntarMotivo(abaixo ? motivo : "", detalhe),
    });
    if (!gravado) {
      toast.error("Não deu para apontar", {
        description: "O tablet está bloqueado ou o seu perfil não aponta produção.",
      });
      return;
    }
    const t = toneladas(gravado.caixas, sku);
    toast.success(corrigindo ? `Hora das ${hora} corrigida` : `Hora das ${hora} apontada`, {
      description: `${inteiro(gravado.caixas)} caixas · ${tonHora(t)} · GE ${pct(ge(t, sku.capacidadeTonHora, 1) ?? 0)}. Para mudar, toque em Corrigir na lista.`,
    });
    onGravado();
  }

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <div
          aria-hidden
          className={cn(
            "row-span-2 grid size-12 toque:size-14 place-items-center rounded-xl",
            pendente && !corrigindo ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <ChartColumn className="size-6" />
        </div>
        <CardDescription
          className={cn("tabular-nums", pendente && !corrigindo && "font-medium text-red-700 dark:text-red-400")}
        >
          {situacao}
        </CardDescription>
        <CardTitle className="text-balance text-2xl leading-tight">
          {corrigindo ? `Corrigir a hora das ${hora}` : `Apontar a hora das ${hora}`}
        </CardTitle>
      </CardHeader>

      <form noValidate onSubmit={gravar} className="flex flex-1 flex-col gap-6">
        <CardContent className="flex flex-1 flex-col gap-6">
          <Field data-invalid={erros.caixas ? true : undefined}>
            <FieldLabel htmlFor={idCaixas} className="text-base">
              Caixas na hora
            </FieldLabel>
            {/* O id vai no NumberField (e não no input): o base-ui liga o − e o + ao input por esse id (aria-controls). */}
            <NumberField
              id={idCaixas}
              size="lg"
              value={caixas}
              min={0}
              max={MAX_CAIXAS}
              step={PASSO_CAIXAS}
              locale="pt-BR"
              format={{ maximumFractionDigits: 0 }}
              onValueChange={(v) =>
                mudar({ caixas: v === null ? null : Math.round(v), erros: { ...erros, caixas: undefined } })
              }
            >
              {/* Um toque, um passo de 10 caixas: o base-ui repetiria o passo enquanto a luva segura o botão (mesma
                  solução do centerline do checklist). Digitar continua sendo o caminho principal. */}
              <NumberFieldGroup
                ref={caixasRef}
                className="h-14 toque:h-16 text-2xl"
                aria-invalid={erros.caixas ? true : undefined}
                onPointerDownCapture={(event) => {
                  if (event.button !== 0) return;
                  const botao = (event.target as HTMLElement).closest<HTMLElement>(SELETOR_PASSO);
                  if (!botao || botao.matches(":disabled")) return;
                  event.preventDefault();
                  event.stopPropagation();
                  const sentido = botao.dataset.slot === "number-field-increment" ? 1 : -1;
                  const base = caixas ?? metaCaixas;
                  const novo = caixas === null ? base : base + sentido * PASSO_CAIXAS;
                  mudar({ caixas: Math.min(MAX_CAIXAS, Math.max(0, novo)), erros: { ...erros, caixas: undefined } });
                }}
              >
                <NumberFieldDecrement className="toque:w-16 px-4" aria-label="Menos 10 caixas" />
                <NumberFieldInput
                  className="font-semibold tabular-nums"
                  placeholder={inteiro(metaCaixas)}
                  inputMode="numeric"
                  aria-describedby={erros.caixas ? `${idErroCaixas} ${idPrevia}` : idPrevia}
                />
                <NumberFieldIncrement className="toque:w-16 px-4" aria-label="Mais 10 caixas" />
              </NumberFieldGroup>
            </NumberField>
            {erros.caixas && <FieldError id={idErroCaixas}>{erros.caixas}</FieldError>}
          </Field>

          {/* Prévia ao vivo: o farol responde enquanto a pessoa digita. Região viva educada, sem anunciar a cada dígito
              além do resultado. */}
          <div id={idPrevia} aria-live="polite" className="flex flex-col gap-2 rounded-xl bg-muted/60 px-4 py-3">
            {ton === null ? (
              <p className="text-muted-foreground tabular-nums">
                Meta da hora: {inteiro(metaCaixas)} caixas, {tonHora(metaHoraTon)}.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-xl tabular-nums">
                    {tonHora(ton)}
                    <span className="font-normal text-base text-muted-foreground"> · GE {pct(geHora ?? 0)}</span>
                  </p>
                  <FarolStatus farol={farol(ton, metaHoraTon)} />
                </div>
                <p className="text-muted-foreground text-sm tabular-nums">
                  Meta da hora: {inteiro(metaCaixas)} caixas, {tonHora(metaHoraTon)}.
                </p>
              </>
            )}
          </div>

          {abaixo && (
            <FieldSet className="gap-3" data-invalid={erros.motivo ? true : undefined}>
              <FieldLegend id={idMotivos} variant="label" className="text-base">
                Por que ficou abaixo da meta?
              </FieldLegend>
              {falhasNaHora > 0 && (
                <FieldDescription className="flex items-center gap-1.5">
                  <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
                  {falhasNaHora === 1 ? "1 falha apontada" : `${falhasNaHora} falhas apontadas`} nesta hora no MTBF.
                </FieldDescription>
              )}
              <ToggleGroup
                ref={motivosRef}
                type="single"
                variant="outline"
                spacing={3}
                value={motivo}
                onValueChange={(v) => mudar({ motivo: v, erros: { ...erros, motivo: undefined, detalhe: undefined } })}
                aria-labelledby={idMotivos}
                aria-invalid={erros.motivo ? true : undefined}
                aria-describedby={erros.motivo ? idErroMotivo : undefined}
                className="w-full flex-wrap"
              >
                {MOTIVOS_HORA.map((m) => (
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
          )}

          {(abaixo || detalhe) && (
            <Field data-invalid={erros.detalhe ? true : undefined}>
              <FieldLabel htmlFor={idDetalhe} className="text-base">
                {motivo === "Outro" ? "Qual foi o motivo?" : "Detalhe (opcional)"}
              </FieldLabel>
              <Input
                ref={detalheRef}
                id={idDetalhe}
                value={detalhe}
                maxLength={LIMITES.justificativa}
                placeholder="Ex.: enrosco na Loeschpack 4"
                onChange={(e) => mudar({ detalhe: e.target.value, erros: { ...erros, detalhe: undefined } })}
                aria-invalid={erros.detalhe ? true : undefined}
                aria-describedby={erros.detalhe ? idErroDetalhe : undefined}
                className="h-11 toque:h-14"
              />
              {erros.detalhe && <FieldError id={idErroDetalhe}>{erros.detalhe}</FieldError>}
            </Field>
          )}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 border-t">
          <Button type="submit" size="lg" className={cn("h-11 toque:h-16 w-full text-base", PRESSAO)}>
            {corrigindo ? "Salvar correção" : `Apontar ${hora}`}
          </Button>
          {corrigindo && (
            <Button type="button" variant="ghost" className="h-11 toque:h-14" onClick={onCancelarCorrecao}>
              Cancelar correção
            </Button>
          )}
          <p className="text-muted-foreground text-sm">
            {sku ? `${sku.descricao} · ${inteiro(sku.pesoCaixaKg * 1000)} g por caixa` : "SKU do dia não encontrado."}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function TudoApontado({ proxima }: { readonly proxima: HoraDoTurno | undefined }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>Apontar a hora</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
          <CircleCheck className="size-6 text-green-600" aria-hidden />
          Tudo apontado
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {proxima
          ? `A hora das ${proxima.rotulo} abre às ${formatarHora(new Date(proxima.bloco))}.`
          : "Todas as horas do turno estão apontadas."}{" "}
        Para mudar uma hora, toque em Corrigir na lista.
      </CardContent>
    </Card>
  );
}

/** Gerência e Especialista leem o Hora x Hora; quem aponta é a Operação (e a Supervisão, se precisar). */
function SoLeitura({ alvo }: { readonly alvo: HoraDoTurno }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Lock className="size-3.5" aria-hidden />
          Só leitura
        </CardDescription>
        <CardTitle className="text-2xl tracking-tight">
          Hora das {alvo.rotulo} {alvo.estado === "pendente" ? "pendente" : "aberta"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-muted-foreground">
        <p>Quem aponta as caixas é a Operação do posto, ou a Supervisão da linha. O seu perfil acompanha os números.</p>
        <Button asChild variant="outline" className="w-fit">
          <Link prefetch href="/dashboard/mtbf">
            Ver falhas no MTBF
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
