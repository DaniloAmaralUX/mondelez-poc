"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { cn } from "cn";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAlertas } from "@/hooks/use-turno";

import { AlertDetails } from "./alert-details";
import { AlertList } from "./alert-list";

type Vista = "lista" | "detalhe";

/** O painel gera caixa na tela? (`display: none` não gera.) */
function naTela(elemento: HTMLElement | null) {
  return elemento !== null && elemento.getClientRects().length > 0;
}

/**
 * Lista e detalhe de alertas (tela Logistics do template).
 *
 * - Com 896 px ou mais de área útil (`@4xl/content`: tablet em paisagem com a sidebar aberta, notebook), lista de
 *   360 px e detalhe lado a lado, cada um com rolagem própria.
 * - Abaixo disso (tablet em retrato, Split View), lista OU detalhe em pilha, com a página rolando normalmente e
 *   "Voltar" no topo do detalhe. Sem Sheet sobre a lista (docs/12 §3.4), como a pilha lista/conversa da tela Chat.
 *
 * O arranjo é decidido pelo CSS (container query, a mesma régua do grid): ao girar o tablet ou abrir e fechar a
 * sidebar não há estado em JS para divergir, e o HTML do servidor já sai igual ao do cliente. O JS só guarda qual
 * painel a pilha mostra. A seleção segue `?alerta=` a qualquer momento: o "Ver" do aviso de alerta novo muda a URL
 * com a tela já aberta.
 */
export function Alertas() {
  const alertas = useAlertas();
  const alertaDaUrl = useSearchParams().get("alerta");
  const [selecionadoId, setSelecionadoId] = React.useState(alertaDaUrl);
  const [vista, setVista] = React.useState<Vista>(alertaDaUrl ? "detalhe" : "lista");
  const tituloId = React.useId();
  const listaRef = React.useRef<HTMLDivElement>(null);
  const detalheRef = React.useRef<HTMLDivElement>(null);
  const rolagemDaLista = React.useRef(0);

  const selecionado = alertas.find((alerta) => alerta.id === selecionadoId);
  // Lado a lado, sem escolha explícita, o detalhe mostra o primeiro da lista (como no template).
  const exibido = selecionado ?? alertas[0] ?? null;
  // Na pilha, o detalhe só aparece para um alerta escolhido que ainda existe; senão, a lista.
  const vistaNaPilha: Vista = vista === "detalhe" && selecionado ? "detalhe" : "lista";
  const vistaAtual = React.useRef(vistaNaPilha);

  const abrirDetalhe = React.useCallback(() => {
    // Guarda onde a lista estava para o "Voltar" devolver ao mesmo ponto.
    if (vistaAtual.current === "lista") rolagemDaLista.current = window.scrollY;
    setVista("detalhe");
  }, []);

  React.useEffect(() => {
    setSelecionadoId(alertaDaUrl);
    if (alertaDaUrl) abrirDetalhe();
    else setVista("lista");
  }, [alertaDaUrl, abrirDetalhe]);

  // Na pilha, trocar de painel é como trocar de tela: rolagem no topo e foco no título do detalhe; na volta, a lista
  // reaparece onde estava, com foco no alerta que estava aberto. Lado a lado, foco e rolagem não mudam.
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

  function selecionar(alertaId: string) {
    setSelecionadoId(alertaId);
    abrirDetalhe();
    if (alertaId === alertaDaUrl) return;
    // Deep link sem ida ao servidor (funciona sem rede): o History API do navegador é integrado ao router do Next,
    // e `useSearchParams` acompanha a troca.
    const params = new URLSearchParams(window.location.search);
    params.set("alerta", alertaId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  // Fechar o detalhe também tira ?alerta= da URL (a seleção deriva dela): recarregar não reabre o que a pessoa fechou,
  // e um novo "Ver" do aviso para o mesmo alerta volta a abrir o detalhe, porque a URL muda de novo.
  function voltarParaLista() {
    setVista("lista");
    const params = new URLSearchParams(window.location.search);
    if (!params.has("alerta")) return;
    params.delete("alerta");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  return (
    <div
      data-content-padding="false"
      className="grid @4xl/content:h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 @4xl/content:grid-cols-[360px_minmax(0,1fr)] @4xl/content:divide-x @4xl/content:overflow-hidden"
    >
      <div
        ref={listaRef}
        className={cn(
          "@4xl/content:block @4xl/content:h-full min-w-0 @4xl/content:overflow-hidden",
          vistaNaPilha === "detalhe" && "hidden",
        )}
      >
        <AlertList
          alertas={alertas}
          selectedAlertId={exibido?.id ?? null}
          selecaoExplicita={Boolean(selecionado)}
          onSelectAlert={selecionar}
        />
      </div>

      <div
        ref={detalheRef}
        className={cn(
          "@4xl/content:block @4xl/content:h-full min-w-0 @4xl/content:overflow-hidden",
          vistaNaPilha === "lista" && "hidden",
        )}
      >
        {/* Só na pilha: o app instalado não tem o botão voltar do navegador. Fica grudado sob o header (ou no topo, com
            o header que rola), para sair do detalhe sem voltar ao início de um histórico longo. Opaco: o conteúdo passa
            por baixo. No toque a camada leva o botão a 56 px. */}
        <div className="sticky top-0 z-20 @4xl/content:hidden border-b bg-background px-4 py-2 [html[data-navbar-style=sticky]_&]:top-(--dashboard-header-height)">
          <Button variant="outline" className="h-11" onClick={voltarParaLista}>
            <ArrowLeft data-icon="inline-start" />
            Voltar
          </Button>
        </div>
        <AlertDetails alerta={exibido} tituloId={tituloId} />
      </div>
    </div>
  );
}
