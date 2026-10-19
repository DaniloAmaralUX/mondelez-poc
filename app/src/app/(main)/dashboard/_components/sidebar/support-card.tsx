"use client";

import * as React from "react";

import Link from "next/link";

import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { MOTIVO_AJUDA } from "@/domain/alertas-indicadores";
import { pode } from "@/domain/permissoes";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { useAgora, useSessionHydrated, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { PedirAjuda } from "../ajuda/pedir-ajuda";
import { usePedidosAbertos, useSituacaoDoPedido, useUltimoPedido } from "../ajuda/use-ajuda";

const CARD = "overflow-hidden shadow-none group-data-[collapsible=icon]:hidden";

/**
 * Ponto do pedido de ajuda (RF-14, doc 10: SupportCard da sidebar). Para a Operação, "Pedir ajuda" abre o Sheet e,
 * depois do envio, o card mostra a situação do último pedido: enviado, visto (por quem e quando) ou atendido, com a
 * resposta. É o "saber que alguém viu" do job do operador. Para a liderança, quantos pedidos estão abertos na linha,
 * com o caminho para Alertas, onde o pedido aparece com o contexto (A-AJUDA). Os outros perfis veem o texto de antes.
 */
export function SupportCard() {
  const usuario = useUsuarioAtual();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  if (usuario?.perfil === "operacao") return <AjudaDaOperacao key={usuarioId} />;
  if (pode(usuario?.perfil, "alertas", "tratar")) return <AjudaDaLideranca />;
  return <AjudaSemPedido />;
}

function AjudaSemPedido() {
  const contexto = useSessionStore((s) => s.contexto);
  const hydrated = useSessionHydrated();
  const agora = useAgora();
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    <Card size="sm" className={CARD}>
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm">Precisa de ajuda?</CardTitle>
        <CardDescription className="line-clamp-3">
          Chame a supervisão {hydrated ? `do ${turnoAtual(agora).numero}º turno` : "do turno"}
          {linha && posto ? ` na ${linha.nome} · ${posto.nome}` : ""} ou use o pedido de ajuda no Teams.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

const VARIANTE = { enviado: "info", visto: "warning", atendido: "success" } as const;

function AjudaDaOperacao() {
  const [aberto, setAberto] = React.useState(false);
  const agora = useAgora();
  const pedido = useUltimoPedido();
  const situacao = useSituacaoDoPedido(pedido);

  return (
    <Card size="sm" className={CARD}>
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm toque:text-base">
          {pedido ? `Pedido de ajuda · ${MOTIVO_AJUDA[pedido.motivo]}` : "Precisa de ajuda?"}
        </CardTitle>
        <CardDescription className="wrap-anywhere line-clamp-2 toque:text-sm">
          {pedido
            ? `${formatarHora(new Date(pedido.em))} · ${pedido.texto}`
            : `A supervisão do ${turnoAtual(agora).numero}º turno recebe na hora, com o posto e a tela.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3 px-4">
        {/* Região viva: quando a liderança vê ou atende, o leitor de tela anuncia sem a pessoa procurar. */}
        <div aria-live="polite" className="empty:hidden">
          {situacao && (
            <div className="flex flex-col gap-1.5">
              <Status variant={VARIANTE[situacao.situacao]} className={`${STATUS_LEGIVEL} h-auto py-1`}>
                <StatusIndicator />
                <StatusLabel className="whitespace-normal">{situacao.titulo}</StatusLabel>
              </Status>
              {situacao.resposta && <p className="wrap-anywhere line-clamp-3 text-sm">“{situacao.resposta}”</p>}
            </div>
          )}
        </div>
        <PedirAjuda aberto={aberto} onAbertoChange={setAberto}>
          <Button variant="outline" className="h-9 toque:h-14 w-full">
            <LifeBuoy data-icon="inline-start" />
            {pedido ? "Pedir ajuda de novo" : "Pedir ajuda"}
          </Button>
        </PedirAjuda>
      </CardContent>
    </Card>
  );
}

function AjudaDaLideranca() {
  const contexto = useSessionStore((s) => s.contexto);
  const abertos = usePedidosAbertos();
  const { setOpenMobile } = useSidebar();
  const linha = contexto ? localRepository.descreverContexto(contexto).linha : undefined;
  const unico = abertos.length === 1 ? abertos[0] : undefined;
  const href = unico ? `/dashboard/alertas?alerta=${encodeURIComponent(unico.id)}` : "/dashboard/alertas";

  return (
    <Card size="sm" className={CARD}>
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm">Pedidos de ajuda</CardTitle>
        <CardDescription className="line-clamp-2" aria-live="polite">
          {abertos.length === 0
            ? `Nenhum aberto${linha ? ` na ${linha.nome}` : ""}.`
            : `${abertos.length} ${abertos.length === 1 ? "aberto" : "abertos"}${linha ? ` na ${linha.nome}` : ""}, com o contexto de quem pediu.`}
        </CardDescription>
      </CardHeader>
      {abertos.length > 0 && (
        <CardContent className="px-4">
          <Button asChild variant="outline" className="h-9 toque:h-14 w-full">
            <Link href={href} onClick={() => setOpenMobile(false)}>
              <LifeBuoy data-icon="inline-start" />
              {unico ? "Ver o pedido" : "Ver nos alertas"}
            </Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
