"use client";

import { localRepository } from "@/data/repository";
import { pode } from "@/domain/permissoes";
import { turnoAtual } from "@/domain/turno";
import { useFalhasDoTurno } from "@/hooks/use-producao";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { SoComPermissao } from "../../_components/so-com-permissao";
import { GradeDeFalhas } from "./grade-de-falhas";
import { IndicadoresDoTurno } from "./indicadores-do-turno";
import { LinhaDoTempo } from "./linha-do-tempo";
import { ParetoDeFalhas } from "./pareto-de-falhas";
import { useEquipamentoDaTela } from "./use-equipamento";

/**
 * MTBF (RM-05, RN-06, RN-07), sobre a tela Infrastructure do template: cabeçalho com título e contexto, e cards com os
 * grupos de dados. Job do operador: "Quando a máquina falha, quero apontar o tipo de falha num toque, para o MTBF sair
 * certo sem eu calcular nem anotar depois."
 *
 * Composição por largura útil (@container/content), com a ordem do DOM igual à visual:
 * - notebook (60 rem ou mais): grade de falhas (8/12) e indicadores (4/12) lado a lado; linha do tempo e Pareto
 *   embaixo, lado a lado;
 * - iPad em paisagem (52–60 rem, sidebar aberta): a grade grande primeiro, em 4 por linha; indicadores numa faixa de 4;
 *   linha do tempo e Pareto lado a lado;
 * - iPad em retrato (abaixo de 52 rem): tudo em coluna, grade em 3 por linha (2 no Split View).
 */
export function Mtbf() {
  return (
    <SoComPermissao recurso="apontamentos">
      <TelaMtbf />
    </SoComPermissao>
  );
}

function TelaMtbf() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const falhas = useFalhasDoTurno();
  const equipamentos = contexto ? localRepository.equipamentos(contexto.postoId) : [];
  const [equipamento, escolherEquipamento] = useEquipamentoDaTela(equipamentos, falhas);
  const aponta = pode(usuario?.perfil, "apontamentos", "escrever");
  const turno = turnoAtual(agora);
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <header className="flex flex-col gap-1.5 pouca-altura:gap-1">
        <p className="font-semibold text-muted-foreground text-sm toque:text-base">
          {turno.numero}º turno, {formatarHora(turno.inicio)}–{formatarHora(turno.fim)}
          {linha && posto ? ` · ${linha.nome} · ${posto.nome}` : ""}
        </p>
        <h1 className="@min-[60rem]/content:text-[2.125rem] pouca-altura:text-2xl text-[2rem] text-foreground leading-[1.1]">
          MTBF
        </h1>
        <p className="text-pretty pouca-altura:text-base text-lg text-muted-foreground leading-snug">
          {aponta
            ? "Toque no tipo quando a máquina parar e de novo quando ela voltar. O tempo entre falhas sai sozinho."
            : "Falhas apontadas pelo posto neste turno. Quem aponta é a operação e a supervisão."}
        </p>
      </header>

      <div className="grid @min-[60rem]/content:grid-cols-12 gap-6">
        <div className="@min-[60rem]/content:col-span-8 min-w-0">
          <GradeDeFalhas
            equipamentos={equipamentos}
            equipamento={equipamento}
            onEquipamentoChange={escolherEquipamento}
            falhas={falhas}
            aponta={aponta}
          />
        </div>
        <div className="@min-[60rem]/content:col-span-4 min-w-0">
          <IndicadoresDoTurno falhas={falhas} />
        </div>
      </div>

      <div className="grid @min-[52rem]/content:grid-cols-2 @min-[60rem]/content:grid-cols-12 gap-6">
        <div className="@min-[60rem]/content:col-span-7 min-w-0">
          <LinhaDoTempo falhas={falhas} />
        </div>
        <div className="@min-[60rem]/content:col-span-5 min-w-0">
          <ParetoDeFalhas falhas={falhas} />
        </div>
      </div>
    </div>
  );
}
