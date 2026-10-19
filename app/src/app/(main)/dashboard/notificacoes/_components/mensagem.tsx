"use client";

import { cn } from "cn";
import { ExternalLink, Mail, MessageSquare } from "lucide-react";

import { MarcaDoApp } from "@/components/marca-do-app";
import { localRepository } from "@/data/repository";
import { NOME_DO_PERFIL } from "@/domain/permissoes";
import type { CanalNotificacao, Perfil } from "@/domain/types";
import { formatarDia, formatarHora } from "@/lib/format";

/**
 * Como a mensagem chegaria no piloto: cartão do Teams (post do app no canal da linha) ou e-mail. Usado na caixa de saída
 * das Notificações e na prévia do "Enviar à liderança" do Relatório do turno. Só tokens do tema: a cor do Teams não
 * entra, para o acento da tela continuar um só.
 */

export const NOME_DO_CANAL: Record<CanalNotificacao, string> = { teams: "Teams", email: "E-mail" };
export const ICONE_DO_CANAL = { teams: MessageSquare, email: Mail } as const;

/** Pessoas da demonstração que recebem, pelos perfis da notificação. */
export function destinatarios(para: readonly Perfil[]) {
  return localRepository
    .usuarios()
    .filter((u) => para.includes(u.perfil) && u.perfil !== "operacao")
    .map((u) => ({ nome: u.nome, perfil: NOME_DO_PERFIL[u.perfil] }));
}

export function descreverPara(para: readonly Perfil[]): string {
  return para.map((p) => NOME_DO_PERFIL[p]).join(", ");
}

/** Linhas "Rótulo: valor" viram fatos (FactSet do cartão adaptável); as outras, parágrafos. */
function separar(corpo: string) {
  const linhas = corpo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fatos: { rotulo: string; valor: string }[] = [];
  const paragrafos: string[] = [];
  for (const linha of linhas) {
    const i = linha.indexOf(": ");
    if (i > 0 && i < 28) fatos.push({ rotulo: linha.slice(0, i), valor: linha.slice(i + 2) });
    else paragrafos.push(linha);
  }
  return { fatos, paragrafos };
}

export interface MensagemProps {
  assunto: string;
  corpo: string;
  para: readonly Perfil[];
  em: Date;
  className?: string;
}

export function CartaoTeams({ assunto, corpo, para, em, className }: MensagemProps) {
  const { fatos, paragrafos } = separar(corpo);
  return (
    <article className={cn("flex gap-3", className)} aria-label="Mensagem no Teams (simulada)">
      <MarcaDoApp tamanho="sm" className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold">Rotinas Operacionais</span>
          <span className="rounded bg-muted px-1.5 font-medium text-muted-foreground text-xs toque:text-sm">App</span>
          <time className="text-muted-foreground tabular-nums" dateTime={em.toISOString()}>
            {formatarHora(em)}
          </time>
        </p>
        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <p className="wrap-anywhere font-semibold text-base leading-snug">{assunto}</p>
          {paragrafos.map((p) => (
            <p key={p} className="wrap-anywhere text-sm">
              {p}
            </p>
          ))}
          {fatos.length > 0 && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              {fatos.map((f) => (
                <div key={`${f.rotulo}${f.valor}`} className="contents">
                  <dt className="text-muted-foreground">{f.rotulo}</dt>
                  <dd className="wrap-anywhere tabular-nums">{f.valor}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="flex items-center gap-1.5 border-t pt-3 font-medium text-primary text-sm">
            <ExternalLink className="size-4" aria-hidden />
            Abrir no app
          </p>
        </div>
        <p className="text-muted-foreground text-sm">Canal da linha · menciona {descreverPara(para)}</p>
      </div>
    </article>
  );
}

export function EmailSimulado({ assunto, corpo, para, em, className }: MensagemProps) {
  const pessoas = destinatarios(para);
  return (
    <article
      className={cn("flex flex-col rounded-lg bg-card shadow-xs ring-1 ring-foreground/10", className)}
      aria-label="E-mail (simulado)"
    >
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-b p-4 text-sm">
        <dt className="text-muted-foreground">De</dt>
        <dd>Rotinas Operacionais (envio automático)</dd>
        <dt className="text-muted-foreground">Para</dt>
        <dd className="wrap-anywhere">
          {pessoas.length > 0 ? pessoas.map((p) => `${p.nome} (${p.perfil})`).join(", ") : descreverPara(para)}
        </dd>
        <dt className="text-muted-foreground">Data</dt>
        <dd className="tabular-nums first-letter:uppercase">
          {formatarDia(em)}, {formatarHora(em)}
        </dd>
        <dt className="text-muted-foreground">Assunto</dt>
        <dd className="wrap-anywhere font-semibold">{assunto}</dd>
      </dl>
      <div className="flex flex-col gap-2 p-4 text-sm leading-relaxed">
        <p>Olá,</p>
        {corpo
          .split("\n")
          .filter((l) => l.trim())
          .map((linha) => (
            <p key={linha} className="wrap-anywhere">
              {linha}
            </p>
          ))}
        <p className="pt-2 text-muted-foreground">
          Mensagem automática do protótipo Rotinas Operacionais. No piloto, sai pelo e-mail corporativo.
        </p>
      </div>
    </article>
  );
}
