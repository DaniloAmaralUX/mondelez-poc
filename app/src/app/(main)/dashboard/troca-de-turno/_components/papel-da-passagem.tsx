"use client";

import { cn } from "cn";

import { localRepository } from "@/data/repository";
import type { KpisTurno, TrocaDeTurno, Turno } from "@/domain/types";
import { formatarDia, formatarHora } from "@/lib/format";

import { formatarGe, formatarMinutos, formatarToneladas } from "../../relatorio-turno/_components/indicadores";

export interface RespostasDaPassagem {
  etiquetasAbertas: string;
  ondeEtiquetas: string;
  paradas: string;
  pendencias: string;
  pedidosAjuda: string;
  comentario: string;
}

/**
 * Documento "Relatório de troca de turno", no papel do checklist (checklist-paper.tsx): fonte mono, fundo de folha,
 * seções em caixa alta. Diferente do checklist, a folha é fluida (largura do contêiner, sem escala): no notebook ela fica
 * ao lado do formulário com texto de 14 px, e no iPad abre em tela cheia em "Ver documento".
 */
export function PapelDaPassagem({
  postoId,
  turno,
  operadorId,
  kpis,
  respostas,
  troca,
  className,
}: {
  postoId: string;
  turno: Turno;
  /** Quem entrega (ou vai entregar). */
  operadorId: string | undefined;
  kpis: KpisTurno | undefined;
  respostas: RespostasDaPassagem;
  troca: TrocaDeTurno | undefined;
  className?: string;
}) {
  const posto = localRepository.posto(postoId);
  const linha = posto ? localRepository.linha(posto.linhaId) : undefined;
  const operador = operadorId ? localRepository.usuario(operadorId) : undefined;
  const recebeu = troca?.aceitePor ? localRepository.usuario(troca.aceitePor) : undefined;
  const etiquetas = Number.parseInt(respostas.etiquetasAbertas, 10);

  let situacao = "Rascunho · ainda não entregue";
  if (troca?.aceitePor) situacao = "Recebido · passagem concluída";
  else if (troca) situacao = "Entregue · aguardando aceite";

  return (
    <article
      className={cn(
        "flex flex-col gap-6 bg-neutral-50 px-6 py-7 font-mono text-neutral-950 text-sm leading-relaxed sm:px-8",
        className,
      )}
    >
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-balance text-xl uppercase tracking-widest">Relatório de troca de turno</h2>
          <svg className="size-9 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
        </div>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <p className="first-letter:uppercase">{formatarDia(turno.inicio)}</p>
          <p>
            {turno.numero}º turno · {formatarHora(turno.inicio)}–{formatarHora(turno.fim)}
          </p>
          <p>
            {linha?.nome} · {posto?.nome}
          </p>
          <p>{situacao}</p>
        </div>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase">Entrega</p>
            <p>{operador?.nome ?? "—"}</p>
            <p>
              {operador ? `Matrícula ${operador.matricula}` : ""}
              {troca ? ` · ${formatarHora(new Date(troca.entregueEm))}` : ""}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase">Recebe</p>
            <p>{recebeu?.nome ?? "—"}</p>
            <p>
              {recebeu && troca?.aceiteEm
                ? `${recebeu.perfil === "supervisao" ? "Supervisão" : `Matrícula ${recebeu.matricula}`} · ${formatarHora(new Date(troca.aceiteEm))}`
                : "Aceite com PIN de quem recebe"}
            </p>
          </div>
        </div>
      </header>

      {kpis && (
        <section>
          <p className="bg-stone-200 px-3 py-2 font-semibold uppercase">Indicadores do turno</p>
          <Linha rotulo="GE" valor={formatarGe(kpis.ge)} />
          <Linha
            rotulo="Toneladas"
            valor={
              kpis.metaTurno > 0
                ? `${formatarToneladas(kpis.toneladas)} de ${formatarToneladas(kpis.metaToneladas)}`
                : "—"
            }
          />
          <Linha rotulo="MTBF" valor={formatarMinutos(kpis.mtbfMin)} />
          <Linha
            rotulo="Maior parada"
            valor={kpis.maiorParada ? `${kpis.maiorParada.nome} · ${kpis.maiorParada.minutos} min` : "—"}
          />
          <Linha rotulo="Falhas" valor={`${kpis.falhas} · ${kpis.minutosParados} min parados`} />
          <Linha rotulo="Não conformidades" valor={String(kpis.naoConformes)} />
          <Linha rotulo="Alertas" valor={`${kpis.alertasAbertos} abertos · ${kpis.alertasTratados} tratados`} />
          <Linha rotulo="Pedidos de ajuda" valor={String(kpis.pedidosAjuda)} />
          <Linha
            rotulo="Tarefas"
            valor={`${kpis.tarefasFeitas} de ${kpis.tarefasTotal} · ${kpis.tarefasAtrasadas} atrasadas`}
          />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <Bloco
          titulo="Etiquetas abertas"
          texto={
            Number.isFinite(etiquetas)
              ? `${etiquetas}${etiquetas > 0 && respostas.ondeEtiquetas.trim() ? ` · ${respostas.ondeEtiquetas.trim()}` : ""}`
              : ""
          }
        />
        <Bloco titulo="Paradas" texto={respostas.paradas} />
        <Bloco titulo="Pendências" texto={respostas.pendencias} />
        <Bloco titulo="Pedidos de ajuda" texto={respostas.pedidosAjuda} />
        <Bloco titulo="Comentário" texto={respostas.comentario} vazio="Sem comentário." />
      </section>

      <footer className="mt-auto grid gap-x-8 gap-y-1 border-current border-t-2 pt-3 text-neutral-500 sm:grid-cols-2">
        <p>Números preenchidos pelo app no momento da entrega.</p>
        <p>Concluída só com o aceite de quem recebe (RN-10).</p>
      </footer>
    </article>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-[oklch(0.86_0_0)] border-b px-3 py-1.5">
      <span>{rotulo}</span>
      <span className="wrap-anywhere text-right">{valor}</span>
    </div>
  );
}

function Bloco({ titulo, texto, vazio = "—" }: { titulo: string; texto: string; vazio?: string }) {
  return (
    <div>
      <p className="font-semibold uppercase">{titulo}</p>
      <p className="wrap-anywhere whitespace-pre-line">{texto.trim() || vazio}</p>
    </div>
  );
}
