"use client";

import * as React from "react";

import { cn } from "cn";
import { Download, FileSpreadsheet, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { pode } from "@/domain/permissoes";
import { dataLocal, metaHora, planoDoDia } from "@/domain/producao";
import type { PlanoProducao } from "@/domain/types";
import { usePlanoVigente } from "@/hooks/use-producao";
import { planoVigente } from "@/lib/sessao/indicadores";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { SoComPermissao } from "../../_components/so-com-permissao";
import { modeloCsv } from "./importacao";
import { ImportarPlanilha } from "./importar-planilha";
import {
  agruparPlano,
  deChave,
  diasDaSemana,
  formatarTon,
  formatarTonHora,
  origemDoPlano,
  rotuloDaSemana,
} from "./semana";
import { TabelaDaSemana } from "./tabela-da-semana";

type Vista = "atual" | "proxima";

/** Plano de produção (RM-01, RN-05). */
export function PlanoDeProducao() {
  return (
    <SoComPermissao recurso="plano">
      <Conteudo />
    </SoComPermissao>
  );
}

function baixar(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Composição por largura útil (@container/content, docs/14 §3), com a ordem do DOM igual à visual:
 *
 * 1. Título grande; as ações da Assistência ao lado no notebook e no iPad deitado, embaixo no retrato.
 * 2. Meta de hoje: a linha do tablet em destaque (o número que o operador procura) e as outras três linhas ao lado a
 *    partir de 60 rem; abaixo, a linha do tablet em cima e as outras numa fileira de três.
 * 3. A semana: tabela no notebook e no iPad deitado, lista por linha no retrato (TabelaDaSemana).
 */
function Conteudo() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const planos = useSessionStore((s) => s.planos);
  const linhaDoTablet = useSessionStore((s) => s.contexto?.linhaId);
  const vigente = usePlanoVigente();
  const [vista, setVista] = React.useState<Vista>("atual");
  const [importando, setImportando] = React.useState(false);

  const proxima = React.useMemo(() => {
    const d = new Date(agora);
    d.setDate(d.getDate() + 7);
    return planoVigente(planos, d);
  }, [planos, agora]);
  const plano = vista === "atual" ? vigente : proxima;
  const dias = React.useMemo(() => diasDaSemana(plano.semana), [plano.semana]);
  const grupos = React.useMemo(() => agruparPlano(plano.itens, dias), [plano.itens, dias]);
  const hoje = dataLocal(agora);
  const podeImportar = pode(usuario?.perfil, "plano", "administrar");

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <header className="flex @3xl/content:flex-row flex-col @3xl/content:items-end @3xl/content:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-muted-foreground text-sm toque:text-base">
            Semana de {rotuloDaSemana(vigente.semana)}
          </p>
          <h1 className="@min-[60rem]/content:text-[2.125rem] text-[2rem] text-foreground leading-[1.1]">
            Plano de produção
          </h1>
          <p className="text-pretty text-lg text-muted-foreground leading-snug">
            Toneladas por linha, SKU e dia. A meta por hora de cada linha sai daqui.
          </p>
        </div>
        {podeImportar && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 toque:gap-3">
            <Button
              variant="outline"
              className="toque:h-14"
              onClick={() => baixar(`modelo-plano-${plano.semana}.csv`, modeloCsv(plano.itens))}
            >
              <Download data-icon="inline-start" />
              Baixar modelo
            </Button>
            <Button className="toque:h-14" onClick={() => setImportando(true)}>
              <Upload data-icon="inline-start" />
              Importar planilha
            </Button>
          </div>
        )}
      </header>

      <MetaDeHoje plano={vigente} hoje={hoje} linhaDoTablet={linhaDoTablet} />

      <Card className="@container/semana gap-0 pb-0">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Semana de {rotuloDaSemana(plano.semana)}</CardTitle>
          <CardDescription className="flex items-start gap-1.5 toque:text-base">
            <FileSpreadsheet className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="text-pretty">{origemDoPlano(plano)}</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={vista}
              onValueChange={(v) => v && setVista(v as Vista)}
              aria-label="Semana do plano"
            >
              <ToggleGroupItem value="atual" className="px-3 toque:text-sm">
                Esta semana
              </ToggleGroupItem>
              <ToggleGroupItem value="proxima" className="px-3 toque:text-sm">
                Próxima
              </ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <TabelaDaSemana grupos={grupos} dias={dias} hoje={hoje} />
        </CardContent>
      </Card>

      {podeImportar && (
        <ImportarPlanilha
          key={usuario?.id ?? ""}
          aberto={importando}
          onAbertoChange={setImportando}
          semanaPadrao={proxima.semana}
          aoPublicar={(semana) => setVista(semana === vigente.semana ? "atual" : "proxima")}
        />
      )}
    </div>
  );
}

/**
 * Meta do dia por linha (RN-05): toneladas planejadas para hoje e a meta por hora derivada (`metaHora`, 24 h
 * programadas). A linha do tablet fica em destaque, com o SKU do dia; as outras, em números menores.
 */
function MetaDeHoje({
  plano,
  hoje,
  linhaDoTablet,
}: {
  readonly plano: PlanoProducao;
  readonly hoje: string;
  readonly linhaDoTablet?: string;
}) {
  const linhas = localRepository.plantas().flatMap((p) => localRepository.linhas(p.id));
  const principal = linhas.find((l) => l.id === linhaDoTablet) ?? linhas[0];
  const outras = linhas.filter((l) => l.id !== principal?.id);
  const dia = deChave(hoje).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  if (!principal) return null;

  const resumo = (linhaId: string) => {
    const itens = planoDoDia(plano.itens, linhaId, hoje);
    return {
      toneladas: itens.reduce((s, i) => s + i.toneladas, 0),
      porHora: metaHora(plano.itens, linhaId, hoje),
      skus: itens.map((i) => localRepository.sku(i.skuId)).filter((s) => s !== undefined),
    };
  };
  const doTablet = resumo(principal.id);

  return (
    <section aria-labelledby="meta-de-hoje" className="grid @min-[60rem]/content:grid-cols-12 gap-6">
      <Card className="@min-[60rem]/content:col-span-5">
        <CardHeader>
          <CardTitle id="meta-de-hoje" className="text-lg">
            Meta de hoje · {principal.nome}
          </CardTitle>
          <CardDescription className="first-letter:uppercase toque:text-base">{dia}</CardDescription>
          {principal.id === linhaDoTablet && (
            <CardAction>
              <Badge variant="secondary" className="toque:h-6 toque:text-sm">
                Linha do tablet
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {doTablet.toneladas > 0 ? (
            <>
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3 tabular-nums">
                <div>
                  <div className="font-semibold text-4xl leading-none tracking-tight">
                    {formatarTon(doTablet.toneladas)}
                    <span className="ml-1 font-medium text-muted-foreground text-xl">t</span>
                  </div>
                  <div className="mt-1.5 text-muted-foreground text-sm toque:text-base">no dia</div>
                </div>
                <div>
                  <div className="font-semibold text-4xl leading-none tracking-tight">
                    {formatarTonHora(doTablet.porHora)}
                    <span className="ml-1 font-medium text-muted-foreground text-xl">t/h</span>
                  </div>
                  <div className="mt-1.5 text-muted-foreground text-sm toque:text-base">meta por hora (24 h)</div>
                </div>
              </div>
              <ul className="flex flex-col gap-1 border-t pt-3 text-sm toque:text-base">
                {doTablet.skus.map((sku) => (
                  <li key={sku.id} className="flex justify-between gap-3">
                    <span className="truncate">{sku.descricao}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatarTon(
                        planoDoDia(plano.itens, principal.id, hoje).find((i) => i.skuId === sku.id)?.toneladas ?? 0,
                      )}{" "}
                      t
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground text-sm toque:text-base">
              Sem produção planejada hoje nesta linha. A meta por hora fica em zero.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="@min-[60rem]/content:col-span-7">
        <CardHeader>
          <CardTitle className="text-lg">Outras linhas hoje</CardTitle>
          <CardDescription className="toque:text-base">Plano do dia e meta por hora.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid @lg/content:grid-cols-3 gap-3">
            {outras.map((linha) => {
              const r = resumo(linha.id);
              return (
                <li key={linha.id} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4 tabular-nums">
                  <span className="font-semibold">{linha.nome}</span>
                  <span
                    className={cn("font-semibold text-2xl leading-none", r.toneladas === 0 && "text-muted-foreground")}
                  >
                    {r.toneladas > 0 ? `${formatarTon(r.toneladas)} t` : "Sem plano"}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {r.toneladas > 0 ? `${formatarTonHora(r.porHora)} t/h` : "Meta zero"}
                    {r.skus[0] && ` · ${r.skus[0].descricao}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
