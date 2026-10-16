"use client";

import type * as React from "react";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { resumirRespostas } from "@/domain/formulario-engine";
import type { Formulario } from "@/domain/types";

import { etapasComRevisao } from "./checklist-form";
import type { ChecklistFormValues } from "./data";

/**
 * Cabeçalho do modo foco (docs/12 §3.2): onde estou, quanto falta e como saio, sem depender do menu nem do botão
 * voltar do navegador (o app instalado não tem). Fica no topo da página, abaixo do header do dashboard.
 *
 * - "Voltar" de 56 px no toque, para a Minha Rotina. O rascunho já está salvo; sair não perde nada. Com prefetch
 *   completo (lib/rotas.ts): a Minha Rotina fica no aparelho e o Voltar, e o retorno depois de Registrar, funcionam
 *   sem rede. Com o prefetch padrão a rota dinâmica sem loading.js não era buscada.
 * - "Etapa X de Y · Nome" é o indicador da etapa em qualquer largura; abaixo de 720 px de área útil ele substitui a
 *   lista de etapas (que rolava escondida). Anunciado ao mudar (aria-live).
 * - Progress dos itens respondidos, com nome e valor acessíveis (o Progress do template não repassa `value` ao Radix,
 *   então o aria-valuenow vai explícito).
 */
export function CabecalhoDoFoco({
  formulario,
  etapa,
  meta,
  acao,
}: {
  formulario: Formulario;
  etapa: string;
  /** Linha de metadados abaixo do título (formulário, janela, equipamento, rascunho). */
  meta?: React.ReactNode;
  /** Ação secundária à direita (Registrar desvio). */
  acao?: React.ReactNode;
}) {
  const respostas = useWatch<ChecklistFormValues, "respostas">({ name: "respostas" }) ?? {};
  const resumo = resumirRespostas(formulario, respostas);
  const etapas = etapasComRevisao(formulario);
  const indice = Math.max(
    0,
    etapas.findIndex((e) => e.value === etapa),
  );
  const atual = etapas[indice];
  const percentual = resumo.total > 0 ? Math.round((resumo.respondidos / resumo.total) * 100) : 0;
  const respondidos = `${resumo.respondidos} de ${resumo.total} respondidos`;
  const naoConformes =
    resumo.naoConformes > 0 ? ` · ${resumo.naoConformes} não conforme${resumo.naoConformes > 1 ? "s" : ""}` : "";

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <Button asChild variant="outline" className="h-11 shrink-0">
          <Link prefetch href="/dashboard/rotina">
            <ArrowLeft data-icon="inline-start" />
            Voltar
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2 self-center">
          <h1 className="text-balance font-medium @3xl/foco:text-3xl text-2xl leading-tight tracking-tight">
            {formulario.titulo}
          </h1>
          {meta}
        </div>
        {acao}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium text-base" aria-live="polite">
            Etapa {indice + 1} de {etapas.length} · {atual?.titulo}
          </p>
          <p className="text-muted-foreground text-sm tabular-nums">
            {respondidos}
            {naoConformes}
          </p>
        </div>
        <Progress
          value={percentual}
          aria-label="Itens respondidos"
          aria-valuenow={percentual}
          aria-valuetext={`${respondidos}${naoConformes}`}
          className="h-1.5"
        />
      </div>
    </header>
  );
}
