"use client";

import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { TituloGrande } from "../../relatorio-turno/_components/titulo-grande";
import { PassagemDoPosto } from "./passagem-do-posto";
import { VisaoDaLinha } from "./visao-da-linha";

/**
 * Troca de turno (RM-13, RN-10). A operação passa o posto do tablet; a liderança vê a linha inteira (a supervisão
 * confere e recebe na ausência, gerência e especialista leem).
 */
export function TrocaDeTurno() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};
  const operacao = usuario?.perfil === "operacao";
  const onde = operacao ? [linha?.nome, posto?.nome] : [linha?.nome, "todos os postos"];

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <TituloGrande
        titulo={operacao ? "Passar o turno" : "Troca de turno"}
        subtitulo={`${turno.numero}º turno, das ${formatarHora(turno.inicio)} às ${formatarHora(turno.fim)} · ${onde.filter(Boolean).join(" · ")}`}
      />
      {operacao ? <PassagemDoPosto /> : <VisaoDaLinha />}
    </div>
  );
}
