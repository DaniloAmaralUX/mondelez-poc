"use client";

import { localRepository } from "@/data/repository";
import { descreverResposta, resumirRespostas, situacaoItem } from "@/domain/formulario-engine";
import { turnoAtual } from "@/domain/turno";
import { formatarDia, formatarHora } from "@/lib/format";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import type { ChecklistPaperProps } from "./checklist-preview";
import { PAPER_HEIGHT, PAPER_WIDTH } from "./data";

const SITUACAO = { pendente: "—", C: "C", NC: "NC", NA: "N/A" } as const;
const SYNC = { local: "Salvo no tablet", enviando: "Enviando", sincronizado: "Sincronizado" } as const;

/** Documento do registro: o que fica guardado, com a rastreabilidade exigida (doc 02 §5). */
export function ChecklistPaper({ formulario, valores, tarefa, registro }: ChecklistPaperProps) {
  const usuarioAtual = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const autor = registro ? localRepository.usuario(registro.usuarioId) : usuarioAtual;
  const { planta, linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};
  const equipamento = valores.equipamentoId ? localRepository.equipamento(valores.equipamentoId) : undefined;
  const respostas = valores.respostas;
  const resumo = resumirRespostas(formulario, respostas);
  const quando = registro ? new Date(registro.criadoEm) : undefined;
  const turno = tarefa ? turnoAtual(tarefa.abre) : undefined;

  let resultado = "Em aberto";
  if (resumo.respondidos === resumo.total) resultado = resumo.naoConformes > 0 ? "Com NC" : "Conforme";

  return (
    <article
      style={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }}
      data-print-paper
      className="relative flex flex-col gap-8 bg-neutral-50 px-12.25 py-11 font-mono text-neutral-950"
    >
      <header className="flex flex-col gap-6">
        <div className="grid grid-cols-2 items-start gap-14">
          <svg className="size-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
          <h2 className="text-4xl uppercase tracking-widest">Registro</h2>
        </div>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p>Registro: {registro?.id ?? "rascunho"}</p>
            <p>Data: {quando ? formatarDia(quando) : "—"}</p>
            <p>
              Horário: {quando ? formatarHora(quando) : "—"}
              {turno ? ` · ${turno.numero}º turno` : ""}
            </p>
          </div>
          <div>
            <p>Formulário {formulario.id}</p>
            <p>Versão {formulario.versao}</p>
            <p>{registro ? SYNC[registro.syncStatus] : "Não registrado"}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p className="mb-4 font-semibold uppercase">Posto</p>
            <p>
              {planta?.nome} · {linha?.nome}
            </p>
            <p>{posto?.nome}</p>
            <p>{equipamento?.nome ?? "Sem equipamento"}</p>
          </div>
          <div>
            <p className="mb-4 font-semibold uppercase">Responsável</p>
            <p>{autor?.nome}</p>
            <p>{autor?.cargo}</p>
            <p>Matrícula {autor?.matricula}</p>
          </div>
        </section>
      </header>

      <div className="flex flex-col gap-5">
        <section className="text-sm">
          <div className="grid grid-cols-[1fr_160px_128px_56px] gap-3 bg-stone-200 px-3 py-3 font-semibold uppercase">
            <span>Item</span>
            <span className="text-right">Padrão</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Sit.</span>
          </div>
          {formulario.itens.map((item) => {
            const resposta = respostas[item.id];
            const situacao = situacaoItem(item, resposta);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_160px_128px_56px] gap-3 border-[oklch(0.86_0_0)] border-b px-3 py-2"
              >
                <span>
                  {item.texto}
                  {situacao === "NC" && resposta?.justificativa && (
                    <span className="block text-neutral-500">{resposta.justificativa}</span>
                  )}
                </span>
                <span className="text-right">
                  {item.faixa
                    ? `${item.faixa.min.toLocaleString("pt-BR")}–${item.faixa.max.toLocaleString("pt-BR")} ${item.faixa.unidade}`
                    : "—"}
                </span>
                <span className="text-right">{descreverResposta(item, resposta)}</span>
                <span className="text-right font-semibold">{SITUACAO[situacao]}</span>
              </div>
            );
          })}
        </section>

        <div className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <section className="col-start-2 space-y-2">
            <div>
              <div className="flex justify-between gap-8">
                <span>Conformes</span>
                <span>{resumo.conformes}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Não conformes</span>
                <span>{resumo.naoConformes}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Não se aplica</span>
                <span>{resumo.naoAplicaveis}</span>
              </div>
            </div>
            <div className="border-current border-y-2 py-3">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">Resultado</span>
                <span className="font-semibold uppercase">{resultado}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="absolute right-12.25 bottom-11 left-12.25 grid grid-cols-2 gap-14 text-neutral-500 text-sm leading-relaxed">
        <div>
          <p>{valores.observacao.trim() || "Sem observações."}</p>
          <p>Dispositivo {registro?.dispositivoId ?? "tablet do posto"}</p>
        </div>
        <div>
          <p>Registro imutável. Correções geram nova versão.</p>
          <p>Emitido por {autor?.nome}</p>
        </div>
      </footer>
    </article>
  );
}
