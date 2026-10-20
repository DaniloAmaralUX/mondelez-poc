"use client";

import * as React from "react";

import { cn } from "cn";
import { CircleAlert, FileSpreadsheet, FileUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { planoVigente } from "@/lib/sessao/indicadores";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { JANELA_DESFAZER_MS, useSessionStore } from "@/stores/session/session-store";

import { ArquivoInvalido, COLUNAS, type Leitura, lerArquivo, montarLeitura } from "./importacao";
import { agruparPlano, deChave, diasDaSemana, origemDoPlano, rotuloDaSemana } from "./semana";
import { TabelaDaSemana } from "./tabela-da-semana";

/**
 * Importar o plano (job da Assistência: "quando chega a planilha do plano, quero importar e publicar em um passo").
 * Sheet à direita, como os outros formulários do app: escolher o arquivo, ver a prévia com a validação linha a linha e
 * publicar. O arquivo é lido no navegador (CSV ou XLSX); nada sai do tablet antes de publicar.
 *
 * Linhas com erro não travam o plano inteiro: o botão diz quantas ficam de fora ("Publicar sem as 2 linhas com
 * erro"), em vez de ficar desabilitado sem explicação (docs/13 §2). A publicação substitui o plano da semana e tem
 * "Desfazer" por 10 s, que publica de volta o plano anterior.
 *
 * Quem monta passa `key={usuarioId}` (app/CONVENCOES.md): a próxima pessoa do tablet não herda a planilha de quem saiu.
 */
export function ImportarPlanilha({
  aberto,
  onAbertoChange,
  semanaPadrao,
  aoPublicar,
}: {
  readonly aberto: boolean;
  readonly onAbertoChange: (aberto: boolean) => void;
  /** Semana usada quando a planilha não tem nenhuma data válida. */
  readonly semanaPadrao: string;
  readonly aoPublicar: (semana: string) => void;
}) {
  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:xl:max-w-4xl"
      >
        <Formulario semanaPadrao={semanaPadrao} fechar={() => onAbertoChange(false)} aoPublicar={aoPublicar} />
      </SheetContent>
    </Sheet>
  );
}

/** "Publicar plano", "Publicar sem a linha com erro" ou "Publicar sem as 3 linhas com erro". */
function rotuloDePublicar(comErro: number, prontas: number): string {
  if (comErro === 0 || prontas === 0) return "Publicar plano";
  return comErro === 1 ? "Publicar sem a linha com erro" : `Publicar sem as ${comErro} linhas com erro`;
}

function Formulario({
  semanaPadrao,
  fechar,
  aoPublicar,
}: {
  readonly semanaPadrao: string;
  readonly fechar: () => void;
  readonly aoPublicar: (semana: string) => void;
}) {
  const planos = useSessionStore((s) => s.planos);
  const [leitura, setLeitura] = React.useState<Leitura | null>(null);
  const [lendo, setLendo] = React.useState(false);
  const [erroArquivo, setErroArquivo] = React.useState<string | null>(null);
  const [erroPublicar, setErroPublicar] = React.useState<string | null>(null);
  const entrada = React.useRef<HTMLInputElement>(null);
  const ids = React.useId();

  async function escolher(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    // Limpa o campo: escolher o mesmo arquivo de novo (depois de corrigir no Excel) volta a disparar o change.
    event.target.value = "";
    if (!arquivo) return;
    setLendo(true);
    setErroArquivo(null);
    setErroPublicar(null);
    try {
      const tabela = await lerArquivo(arquivo);
      const lida = montarLeitura(tabela, arquivo.name, semanaPadrao);
      if (lida.erroGeral) {
        setLeitura(null);
        setErroArquivo(lida.erroGeral);
      } else if (lida.linhas.length === 0) {
        setLeitura(null);
        setErroArquivo("A planilha não tem nenhuma linha abaixo do cabeçalho.");
      } else setLeitura(lida);
    } catch (erro) {
      setLeitura(null);
      setErroArquivo(erro instanceof ArquivoInvalido ? erro.message : "Não deu para ler o arquivo. Tente de novo.");
    } finally {
      setLendo(false);
    }
  }

  const itens = React.useMemo(() => leitura?.linhas.flatMap((l) => (l.item ? [l.item] : [])) ?? [], [leitura]);
  const comErro = leitura?.linhas.filter((l) => l.erros.length > 0) ?? [];
  const dias = React.useMemo(() => (leitura ? diasDaSemana(leitura.semana) : []), [leitura]);
  const grupos = React.useMemo(() => agruparPlano(itens, dias), [itens, dias]);
  const atual = leitura ? planoVigente(planos, deChave(leitura.semana)) : undefined;

  function publicar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!leitura) {
      setErroPublicar("Escolha a planilha do plano antes de publicar.");
      entrada.current?.focus();
      return;
    }
    if (itens.length === 0) {
      setErroPublicar("Nenhuma linha da planilha está pronta. Corrija os erros no arquivo e importe de novo.");
      return;
    }
    const anterior = planoVigente(useSessionStore.getState().planos, deChave(leitura.semana));
    const { publicarPlano } = useSessionStore.getState();
    const publicado = publicarPlano({ semana: leitura.semana, itens, arquivo: leitura.arquivo });
    if (!publicado) {
      setErroPublicar("Não foi possível publicar. Confira se o tablet está desbloqueado e tente de novo.");
      return;
    }
    aoPublicar(publicado.semana);
    fechar();
    toast.success("Plano publicado", {
      description: `Semana de ${rotuloDaSemana(publicado.semana)}, ${itens.length} itens. A meta por hora das linhas já segue o plano novo.`,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          const voltou = useSessionStore.getState().publicarPlano({
            semana: anterior.semana,
            itens: anterior.itens,
            arquivo: anterior.arquivo,
            origem: anterior.origem,
          });
          if (!voltou) toast.info("Não dá para desfazer", { description: "Desbloqueie o tablet e tente de novo." });
        },
      },
    });
  }

  return (
    <form noValidate onSubmit={publicar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b pt-[max(--spacing(4),env(safe-area-inset-top))]">
        <SheetTitle className="text-lg">Importar plano de produção</SheetTitle>
        <SheetDescription className="toque:text-base">
          Planilha do SAP em .xlsx ou o modelo em .csv, com as colunas {COLUNAS.join(", ")}. Uma linha por SKU por dia.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <input
          ref={entrada}
          id={`${ids}-arquivo`}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={escolher}
        />

        {!leitura ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileUp className="size-6" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-base">Escolha a planilha do plano</p>
              <p className="text-muted-foreground text-sm toque:text-base">
                A prévia aparece aqui antes de publicar, com cada linha conferida.
              </p>
            </div>
            <Button
              type="button"
              className="h-11 toque:h-16 px-6 text-base"
              onClick={() => entrada.current?.click()}
              disabled={lendo}
            >
              {lendo ? <Spinner data-icon="inline-start" /> : <FileSpreadsheet data-icon="inline-start" />}
              {lendo ? "Lendo a planilha…" : "Escolher arquivo"}
            </Button>
            {erroArquivo && (
              <p role="alert" className="flex items-start gap-2 text-left text-destructive text-sm toque:text-base">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {erroArquivo}
              </p>
            )}
          </div>
        ) : (
          <>
            <section aria-label="Arquivo lido" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <FileSpreadsheet className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="wrap-anywhere font-medium">{leitura.arquivo}</p>
                    <p className="text-muted-foreground text-sm toque:text-base">
                      Semana de {rotuloDaSemana(leitura.semana)} · {leitura.linhas.length} linhas lidas
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="toque:h-14"
                  onClick={() => entrada.current?.click()}
                  disabled={lendo}
                >
                  {lendo ? <Spinner data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
                  Trocar arquivo
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Status variant="success" className={cn("toque:text-sm", STATUS_LEGIVEL)}>
                  <StatusIndicator className="before:hidden" />
                  <StatusLabel className="tabular-nums">
                    {itens.length} {itens.length === 1 ? "linha pronta" : "linhas prontas"}
                  </StatusLabel>
                </Status>
                {comErro.length > 0 && (
                  <Status variant="error" className={cn("toque:text-sm", STATUS_LEGIVEL)}>
                    <StatusIndicator className="before:hidden" />
                    <StatusLabel className="tabular-nums">{comErro.length} com erro</StatusLabel>
                  </Status>
                )}
              </div>
              {atual && (
                <p className="text-muted-foreground text-sm toque:text-base">
                  Substitui o plano publicado para essa semana: {origemDoPlano(atual)}
                </p>
              )}
              {erroArquivo && (
                <p role="alert" className="flex items-start gap-2 text-destructive text-sm toque:text-base">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {erroArquivo}
                </p>
              )}
            </section>

            {comErro.length > 0 && (
              <section aria-labelledby={`${ids}-erros`} className="flex flex-col gap-3">
                <h3 id={`${ids}-erros`} className="font-semibold text-base">
                  Linhas com erro, que ficam de fora
                </h3>
                <ul className="flex flex-col divide-y divide-destructive/15 overflow-hidden rounded-xl bg-destructive/5 ring-1 ring-destructive/20">
                  {comErro.map((linha) => (
                    <li key={linha.numero} className="flex flex-col gap-1 px-4 py-3">
                      <p className="font-medium text-sm toque:text-base">
                        Linha {linha.numero} da planilha
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          {COLUNAS.map((c) => linha.original[c] || "(vazio)").join(" · ")}
                        </span>
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {linha.erros.map((erro) => (
                          <li
                            key={erro}
                            className="flex items-start gap-2 text-red-700 text-sm toque:text-base dark:text-red-400"
                          >
                            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                            {erro}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby={`${ids}-previa`} className="flex flex-col gap-3">
              <h3 id={`${ids}-previa`} className="font-semibold text-base">
                Como o plano vai ficar
              </h3>
              {itens.length > 0 ? (
                <div className="@container/semana overflow-hidden rounded-xl ring-1 ring-foreground/10">
                  <TabelaDaSemana grupos={grupos} dias={dias} hoje="" />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm toque:text-base">Nenhuma linha pronta para publicar.</p>
              )}
            </section>
          </>
        )}
      </div>

      <SheetFooter className="flex-row flex-wrap items-center justify-end gap-3 border-t pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        {erroPublicar && (
          <p
            role="alert"
            className="mr-auto flex basis-full items-start gap-2 text-destructive text-sm toque:text-base"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {erroPublicar}
          </p>
        )}
        <Button type="button" variant="outline" className="h-11 toque:h-16 px-5" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 toque:h-16 px-5 text-base">
          {rotuloDePublicar(comErro.length, itens.length)}
        </Button>
      </SheetFooter>
    </form>
  );
}
