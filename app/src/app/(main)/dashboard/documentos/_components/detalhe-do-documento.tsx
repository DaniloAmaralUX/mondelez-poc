"use client";

import type * as React from "react";

import { cn } from "cn";
import { CircleCheck, CircleX, Eye, ImageOff, TriangleAlert, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import type { DocumentoTecnico } from "@/domain/types";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";

import { dataLonga, ICONE_DO_TIPO, NOME_DO_TIPO } from "./tipos";

/** Códigos de outros documentos citados no texto (ex.: "Siga a IT-EMB-021") viram atalho para abrir o documento. */
function TextoComCodigos({ texto, abrir }: { readonly texto: string; readonly abrir: (id: string) => void }) {
  const documentos = localRepository.documentos();
  const partes = texto.split(/([A-Z]{2,4}-[A-Z]{3}-\d{3})/g);
  return (
    <>
      {partes.map((parte, i) => {
        const citado = documentos.find((d) => d.codigo === parte);
        if (!citado) return parte;
        return (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: as partes do texto não mudam de ordem
            key={i}
            type="button"
            onClick={() => abrir(citado.id)}
            className="rounded-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 toque:-my-2.5 toque:inline-block toque:py-2.5"
          >
            {parte}
          </button>
        );
      })}
    </>
  );
}

/** Moldura do book: não há fotos no protótipo, então um quadro com o ícone do resultado e o texto do padrão. */
function Moldura({
  tipo,
  titulo,
  texto,
}: {
  readonly tipo: "padrao" | "fora";
  readonly titulo: string;
  readonly texto: React.ReactNode;
}) {
  const padrao = tipo === "padrao";
  const Icone = padrao ? CircleCheck : CircleX;
  return (
    <figure
      className={cn(
        "flex flex-col overflow-hidden rounded-xl ring-2",
        padrao ? "ring-green-600/45 dark:ring-green-400/45" : "ring-red-600/45 dark:ring-red-400/45",
      )}
    >
      <div
        className={cn(
          "grid aspect-[16/9] place-items-center",
          padrao ? "bg-green-500/8 text-green-700 dark:text-green-400" : "bg-red-500/8 text-red-700 dark:text-red-400",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Icone className="size-14" strokeWidth={1.5} aria-hidden />
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <ImageOff className="size-4" aria-hidden />
            Foto entra no piloto
          </span>
        </div>
      </div>
      <figcaption className="flex flex-col gap-1.5 border-t bg-card p-4">
        <span
          className={cn(
            "flex items-center gap-2 font-semibold text-base",
            padrao ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400",
          )}
        >
          <Icone className="size-5 shrink-0" aria-hidden />
          {titulo}
        </span>
        <span className="text-base text-foreground leading-relaxed">{texto}</span>
      </figcaption>
    </figure>
  );
}

function normal(t: string) {
  return t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * Documento aberto (RM-04, RM-14), legível a um braço de distância: texto em 16–18 px, passos numerados e os de
 * atenção num bloco âmbar com ícone e a palavra "Atenção" (não só a cor). LPP de certo e errado e book de defeitos em
 * duas molduras lado a lado (empilhadas no detalhe estreito): verde com ✓ para o padrão, vermelho com ✕ para o fora
 * do padrão, cada uma com o rótulo escrito.
 */
export function DetalheDoDocumento({
  documento,
  abrir,
}: {
  readonly documento: DocumentoTecnico;
  readonly abrir: (id: string) => void;
}) {
  const Icone = ICONE_DO_TIPO[documento.tipo];
  const equipamentos = documento.equipamentoIds
    .map((id) => localRepository.equipamento(id)?.nome)
    .filter((n) => n !== undefined);
  const passos = documento.passos ?? [];
  const certo = passos.find((p) => normal(p.titulo) === "certo");
  const errado = passos.find((p) => normal(p.titulo) === "errado");
  const comparacao = certo && errado && passos.length === 2;

  return (
    <Card className="@container/detalhe">
      <CardHeader className="gap-3 border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 toque:h-7 toque:text-sm">
            <Icone aria-hidden />
            {NOME_DO_TIPO[documento.tipo]}
          </Badge>
          <Status variant="success" className={cn("toque:text-sm", STATUS_LEGIVEL)}>
            <StatusIndicator className="before:hidden" />
            <StatusLabel>Versão {documento.versao} vigente</StatusLabel>
          </Status>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-muted-foreground text-sm tabular-nums toque:text-base">{documento.codigo}</p>
          <h2 className="text-balance font-semibold @xl/detalhe:text-[1.75rem] text-2xl leading-tight">
            {documento.titulo}
          </h2>
        </div>
        <p className="text-pretty text-lg leading-snug">{documento.resumo}</p>
        <CardDescription className="text-sm toque:text-base">
          Atualizada em {dataLonga(documento.atualizadoEm)} · {equipamentos.join(", ")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-2">
        {documento.defeito && (
          <>
            <p className="text-muted-foreground text-sm toque:text-base">
              {documento.defeito.categoria} · Modo de falha:{" "}
              <span className="font-medium text-foreground">{documento.defeito.modo}</span>
            </p>
            <div className="grid @xl/detalhe:grid-cols-2 gap-4">
              <Moldura tipo="padrao" titulo="Padrão" texto={documento.defeito.padrao} />
              <Moldura tipo="fora" titulo="Fora do padrão" texto={documento.defeito.foraDoPadrao} />
            </div>
            <dl className="grid @xl/detalhe:grid-cols-2 gap-4">
              <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                <Eye className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex flex-col gap-1">
                  <dt className="font-semibold text-base">O que monitorar</dt>
                  <dd className="text-base leading-relaxed">
                    <TextoComCodigos texto={documento.defeito.oQueMonitorar} abrir={abrir} />
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                <Wrench className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex flex-col gap-1">
                  <dt className="font-semibold text-base">O que fazer</dt>
                  <dd className="text-base leading-relaxed">
                    <TextoComCodigos texto={documento.defeito.acao} abrir={abrir} />
                  </dd>
                </div>
              </div>
            </dl>
          </>
        )}

        {comparacao && (
          <div className="grid @xl/detalhe:grid-cols-2 gap-4">
            <Moldura tipo="padrao" titulo="Certo" texto={certo.detalhe} />
            <Moldura tipo="fora" titulo="Errado" texto={errado.detalhe} />
          </div>
        )}

        {!comparacao && passos.length > 0 && (
          <ol className="flex flex-col gap-3" aria-label="Passos">
            {passos.map((passo, i) => (
              <li
                key={passo.titulo}
                className={cn(
                  "flex gap-4 rounded-xl p-4",
                  passo.atencao ? "bg-amber-500/10 ring-1 ring-amber-600/30 dark:ring-amber-400/30" : "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full font-semibold text-base tabular-nums",
                    passo.atencao
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      : "bg-background text-foreground",
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-lg leading-snug">
                    <span className="sr-only">Passo {i + 1}: </span>
                    {passo.titulo}
                    {passo.atencao && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-800 text-sm dark:text-amber-300">
                        <TriangleAlert className="size-4" aria-hidden />
                        Atenção
                      </span>
                    )}
                  </p>
                  <p className="text-base leading-relaxed">
                    <TextoComCodigos texto={passo.detalhe} abrir={abrir} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
