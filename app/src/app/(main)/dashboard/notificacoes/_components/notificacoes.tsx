"use client";

import * as React from "react";

import { cn } from "cn";
import { ArrowLeft, Inbox, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CanalNotificacao, Notificacao } from "@/domain/types";
import { useNotificacoes } from "@/hooks/use-producao";
import { formatarHora } from "@/lib/format";

import { TituloGrande } from "../../relatorio-turno/_components/titulo-grande";
import { CartaoTeams, descreverPara, EmailSimulado, ICONE_DO_CANAL, NOME_DO_CANAL } from "./mensagem";

type Filtro = "todos" | CanalNotificacao;

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todas" },
  { valor: "teams", rotulo: "Teams" },
  { valor: "email", rotulo: "E-mail" },
];

const ORIGEM: Record<Notificacao["origem"]["tipo"], string> = {
  alerta: "Alerta",
  relatorio: "Relatório",
  ajuda: "Pedido de ajuda",
  recado: "Recado",
};

/** O painel gera caixa na tela? (`display: none` não gera.) */
function naTela(elemento: HTMLElement | null) {
  return elemento !== null && elemento.getClientRects().length > 0;
}

/**
 * Notificações (job da gerência: "ser avisado de desvio crítico no canal que já uso"), no padrão Mail, como Alertas:
 * caixa de saída simulada com o que o piloto mandaria pelo Teams e pelo e-mail, e o detalhe renderizado como o cartão
 * do Teams ou o e-mail. Lado a lado a partir de 56 rem de área útil (notebook); abaixo disso (iPad), lista ou detalhe em
 * pilha, com "Voltar". O arranjo é do CSS (container query); o JS só guarda qual painel a pilha mostra.
 */
export function Notificacoes() {
  const todas = useNotificacoes();
  const [filtro, setFiltro] = React.useState<Filtro>("todos");
  // As abas filtram a lista abaixo: aria-controls aponta para ela (o padrão do Radix aponta para um TabsContent que esta tela não usa).
  const listaId = React.useId();
  const [selecionadaId, setSelecionadaId] = React.useState<string | null>(null);
  const [vista, setVista] = React.useState<"lista" | "detalhe">("lista");
  const listaRef = React.useRef<HTMLDivElement>(null);
  const detalheRef = React.useRef<HTMLDivElement>(null);
  const tituloId = React.useId();
  const rolagemDaLista = React.useRef(0);

  const visiveis = filtro === "todos" ? todas : todas.filter((n) => n.canal === filtro);
  const selecionada = visiveis.find((n) => n.id === selecionadaId);
  const exibida = selecionada ?? visiveis[0];
  const vistaNaPilha = vista === "detalhe" && selecionada ? "detalhe" : "lista";
  const contagem = (f: Filtro) => (f === "todos" ? todas.length : todas.filter((n) => n.canal === f).length);

  // Na pilha, trocar de painel é como trocar de tela: topo e foco no título do detalhe; na volta, a lista onde estava.
  const vistaAtual = React.useRef(vistaNaPilha);
  React.useLayoutEffect(() => {
    if (vistaAtual.current === vistaNaPilha) return;
    vistaAtual.current = vistaNaPilha;
    if (naTela(listaRef.current) && naTela(detalheRef.current)) return;
    if (vistaNaPilha === "detalhe") {
      window.scrollTo({ top: 0 });
      document.getElementById(tituloId)?.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: rolagemDaLista.current });
      listaRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus({ preventScroll: true });
    }
  }, [vistaNaPilha, tituloId]);

  function selecionar(id: string) {
    if (vistaNaPilha === "lista") rolagemDaLista.current = window.scrollY;
    setSelecionadaId(id);
    setVista("detalhe");
  }

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <div className={cn(vistaNaPilha === "detalhe" && "@4xl/content:block hidden")}>
        <TituloGrande
          titulo="Notificações"
          subtitulo="O que o piloto enviaria pelo Teams e pelo e-mail: alertas, relatórios e pedidos de ajuda."
        />
      </div>

      <div className="grid @4xl/content:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start gap-6">
        <div ref={listaRef} className={cn("@4xl/content:block min-w-0", vistaNaPilha === "detalhe" && "hidden")}>
          <Card className="@container/lista">
            <CardHeader>
              <CardTitle>Caixa de saída</CardTitle>
              <CardDescription>
                {todas.length === 0
                  ? "Nada enviado neste turno ainda."
                  : `${todas.length} ${todas.length === 1 ? "mensagem" : "mensagens"} no turno, a mais recente primeiro.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                <TabsList className="grid w-full grid-cols-3 toque:gap-3 group-data-horizontal/tabs:h-auto">
                  {FILTROS.map((f) => (
                    <TabsTrigger
                      key={f.valor}
                      value={f.valor}
                      className="toque:text-sm tabular-nums"
                      aria-controls={listaId}
                    >
                      {f.rotulo} ({contagem(f.valor)})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {visiveis.length === 0 ? (
                <Empty id={listaId} className="min-h-48 p-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma mensagem aqui</EmptyTitle>
                    <EmptyDescription>
                      Alertas críticos, relatórios enviados e pedidos de ajuda aparecem assim que acontecem.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                // Lado a lado (notebook), a lista rola sozinha e o detalhe fica parado ao lado, como no Mail; na pilha do
                // iPad, a página rola. Focável e nomeada para o teclado rolar (WCAG 2.1.1).
                <ul
                  id={listaId}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: região com rolagem precisa de foco para o teclado rolar (WCAG 2.1.1).
                  tabIndex={0}
                  aria-label="Mensagens"
                  className="-mx-1 flex @4xl/content:max-h-[calc(100dvh-var(--dashboard-header-height)-17rem)] flex-col gap-2 @4xl/content:overflow-y-auto rounded-lg px-1 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {visiveis.map((n) => (
                    <li key={n.id}>
                      <ItemDaLista
                        notificacao={n}
                        ativa={n.id === exibida?.id}
                        explicita={Boolean(selecionada)}
                        aoEscolher={() => selecionar(n.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          ref={detalheRef}
          className={cn(
            "@4xl/content:sticky @4xl/content:top-[calc(var(--dashboard-header-height)+1.5rem)] @4xl/content:block flex min-w-0 flex-col gap-4",
            vistaNaPilha === "lista" && "hidden",
          )}
        >
          <div className="@4xl/content:hidden">
            <Button variant="outline" className="h-11" onClick={() => setVista("lista")}>
              <ArrowLeft data-icon="inline-start" />
              Voltar
            </Button>
          </div>
          <Detalhe notificacao={exibida} tituloId={tituloId} />
        </div>
      </div>
    </div>
  );
}

function ItemDaLista({
  notificacao,
  ativa,
  explicita,
  aoEscolher,
}: {
  notificacao: Notificacao;
  ativa: boolean;
  explicita: boolean;
  aoEscolher: () => void;
}) {
  const Icone = ICONE_DO_CANAL[notificacao.canal];
  const em = new Date(notificacao.em);
  return (
    <button
      type="button"
      aria-current={ativa && explicita ? "true" : undefined}
      onClick={aoEscolher}
      className={cn(
        "flex w-full gap-3 rounded-xl p-3 text-left ring-1 ring-foreground/5 transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/70",
        ativa &&
          (explicita
            ? "bg-primary/[0.06] ring-2 ring-primary/50"
            : "@4xl/content:bg-primary/[0.06] @4xl/content:ring-2 @4xl/content:ring-primary/50"),
      )}
    >
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
        <Icone className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold text-[0.9375rem] leading-snug">{notificacao.assunto}</span>
          <time dateTime={notificacao.em} className="shrink-0 text-muted-foreground text-xs toque:text-sm tabular-nums">
            {formatarHora(em)}
          </time>
        </span>
        <span className="truncate text-muted-foreground text-sm">
          {ORIGEM[notificacao.origem.tipo]} · {NOME_DO_CANAL[notificacao.canal]} · para{" "}
          {descreverPara(notificacao.para)}
        </span>
      </span>
    </button>
  );
}

function Detalhe({ notificacao, tituloId }: { notificacao: Notificacao | undefined; tituloId: string }) {
  if (!notificacao) {
    return (
      <Card>
        <CardContent>
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>Nenhuma mensagem aberta</EmptyTitle>
              <EmptyDescription>Escolha uma mensagem na lista para ver como ela chega.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }
  const em = new Date(notificacao.em);
  const props = { assunto: notificacao.assunto, corpo: notificacao.corpo, para: notificacao.para, em };
  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {NOME_DO_CANAL[notificacao.canal]} · {ORIGEM[notificacao.origem.tipo]} · {formatarHora(em)}
        </CardDescription>
        <CardTitle className="text-xl">
          <h2 id={tituloId} tabIndex={-1} className="wrap-anywhere text-balance outline-none">
            {notificacao.assunto}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert>
          <Info />
          <AlertTitle>Envio simulado</AlertTitle>
          <AlertDescription>
            No protótipo nada sai do tablet. No piloto, esta mensagem vai pelo{" "}
            {notificacao.canal === "teams" ? "canal da linha no Teams" : "e-mail corporativo"}.
          </AlertDescription>
        </Alert>
        <div className="rounded-xl bg-muted/60 p-4">
          {notificacao.canal === "teams" ? <CartaoTeams {...props} /> : <EmailSimulado {...props} />}
        </div>
      </CardContent>
    </Card>
  );
}
