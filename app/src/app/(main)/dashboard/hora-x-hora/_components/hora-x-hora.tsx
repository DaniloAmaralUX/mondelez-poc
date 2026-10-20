"use client";

import { useRef, useState } from "react";

import { localRepository } from "@/data/repository";
import { falhasNaHora } from "@/domain/falhas";
import { pode } from "@/domain/permissoes";
import { caixasPara, type HoraDoTurno, resumoDaSerie } from "@/domain/producao";
import { turnoAtual } from "@/domain/turno";
import { useFalhasDoTurno, useMetaDaLinha, useSerieDoTurno } from "@/hooks/use-producao";
import { useMinhasTarefas, useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { ApontarHora, type RascunhoHora } from "./apontar-hora";
import { CabecalhoDaProducao } from "./cabecalho-da-producao";
import { inteiro, separarMotivo, tonHora } from "./formato";
import { GraficoHoraAHora } from "./grafico-hora-a-hora";
import { HorasDoTurno } from "./horas-do-turno";
import { IndicadoresDoTurno } from "./indicadores-do-turno";

/**
 * Tarefas do Hora x Hora do posto. O template da tarefa é da Operação; a Supervisão, que também aponta (doc 05 §4),
 * não tem a tarefa na própria rotina e conclui a do operador do posto.
 */
function useTarefasDaHora() {
  const minhas = useMinhasTarefas();
  const postoId = useSessionStore((s) => s.contexto?.postoId);
  const daOperacao = useTarefas(postoId, "operacao");
  const doHoraXHora = (t: { templateId: string }) => t.templateId === "hora-x-hora";
  return (minhas.some(doHoraXHora) ? minhas : daOperacao).filter(doHoraXHora);
}

/** O rascunho é de quem está no posto: trocou a pessoa, o card começa vazio (regras do código, sessão compartilhada). */
export function HoraXHora() {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  return <Conteudo key={usuarioId ?? "ninguem"} />;
}

/**
 * Hora x Hora (RM-10, RN-03 a RN-05) na composição do Analytics: título, faixa de indicadores, gráfico com o card de
 * apontar ao lado (8/4) e a tabela das horas. Por largura útil (@container/content, docs/14 §3), com a ordem do DOM
 * igual à visual:
 *
 * - Notebook (≥ 60 rem úteis): indicadores em linha; gráfico (8) e card de apontar (4) lado a lado; tabela.
 * - iPad em paisagem e em retrato (< 60 rem): o card de apontar primeiro, para quem opera; indicadores 2 × 2; gráfico;
 *   lista das horas no lugar da tabela.
 *
 * O card muda de lugar entre os arranjos, e `order-*` faria a ordem de leitura divergir da visual: ele é renderizado
 * nos dois lugares e o CSS mostra um (o padrão de tabela × lista da v0.3). O rascunho fica aqui, compartilhado.
 */
function Conteudo() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const serie = useSerieDoTurno();
  const meta = useMetaDaLinha();
  const falhas = useFalhasDoTurno();
  const tarefas = useTarefasDaHora();
  const [escolhida, setEscolhida] = useState<string>();
  const [rascunho, setRascunho] = useState<RascunhoHora>();
  const slotTopo = useRef<HTMLDivElement>(null);
  const slotLado = useRef<HTMLDivElement>(null);

  const podeEscrever = pode(usuario?.perfil, "apontamentos", "escrever");
  const turno = turnoAtual(agora);
  const sku = meta ? localRepository.sku(meta.skuId) : undefined;
  const metaHoraTon = meta?.metaHoraTon ?? 0;
  const metaCaixas = sku ? caixasPara(metaHoraTon, sku) : 0;
  const resumo = resumoDaSerie(serie);

  // A hora do card: a escolhida na lista (correção), senão a pendente mais antiga, senão a aberta.
  const escolhidaNaSerie = escolhida ? serie.find((h) => h.bloco === escolhida && h.estado !== "futura") : undefined;
  const alvo =
    escolhidaNaSerie ?? serie.find((h) => h.estado === "pendente") ?? serie.find((h) => h.estado === "aberta");
  const corrigindo = alvo?.estado === "apontada";
  const tarefa = alvo ? tarefas.find((t) => t.abre.getTime() === new Date(alvo.bloco).getTime()) : undefined;
  const proximaHora = serie.find((h) => h.estado === "futura");
  const linhas = serie.map((hora) => ({ hora, falhas: falhasNaHora(falhas, hora.bloco).length }));

  function escolher(h: HoraDoTurno) {
    setEscolhida(h.bloco);
    if (h.apontamento) {
      setRascunho({ bloco: h.bloco, caixas: h.apontamento.caixas, ...separarMotivo(h.apontamento.motivo), erros: {} });
    }
    // O card visível (em cima no iPad, ao lado no notebook) entra na tela com o campo de caixas focado.
    const slot = [slotTopo.current, slotLado.current].find((s) => s && s.offsetParent !== null);
    requestAnimationFrame(() => {
      slot?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
      slot?.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.focus({ preventScroll: true });
    });
  }

  function limpar() {
    setEscolhida(undefined);
    setRascunho(undefined);
  }

  const card = (
    <ApontarHora
      alvo={alvo}
      tarefa={tarefa}
      corrigindo={corrigindo}
      podeEscrever={podeEscrever}
      sku={sku}
      metaHoraTon={metaHoraTon}
      metaCaixas={metaCaixas}
      falhasNaHora={alvo ? falhasNaHora(falhas, alvo.bloco).length : 0}
      proximaHora={proximaHora}
      rascunho={rascunho}
      onRascunho={setRascunho}
      onCancelarCorrecao={limpar}
      onGravado={limpar}
    />
  );

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <CabecalhoDaProducao titulo="Hora x Hora">
        {sku
          ? `${sku.descricao} · meta de ${tonHora(metaHoraTon)} por hora, ${inteiro(metaCaixas)} caixas`
          : "Sem SKU no plano do dia"}
        {` · ${turno.numero}º turno, das ${formatarHora(turno.inicio)} às ${formatarHora(turno.fim)}`}
      </CabecalhoDaProducao>

      {/* iPad: o card de apontar primeiro, para quem opera. Quem só lê vê os números primeiro. */}
      {podeEscrever && (
        <div ref={slotTopo} className="@min-[60rem]/content:hidden scroll-mt-(--dashboard-header-height)">
          {card}
        </div>
      )}

      <IndicadoresDoTurno resumo={resumo} caixasTurno={sku ? caixasPara(resumo.metaTurno, sku) : 0} />

      <div className="grid @min-[60rem]/content:grid-cols-12 items-stretch gap-6">
        <div className="@min-[60rem]/content:col-span-8 min-w-0">
          <GraficoHoraAHora serie={serie} metaHoraTon={metaHoraTon} />
        </div>
        <div
          ref={slotLado}
          className="@min-[60rem]/content:col-span-4 @min-[60rem]/content:block hidden min-w-0 scroll-mt-(--dashboard-header-height)"
        >
          {card}
        </div>
      </div>

      <HorasDoTurno linhas={linhas} podeEscrever={podeEscrever} selecionada={alvo?.bloco} onEscolher={escolher} />
    </div>
  );
}
