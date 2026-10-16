"use client";

import * as React from "react";

import { CheckCircle2, Hand, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Alerta } from "@/domain/types";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

type Acao = "acao" | "resolver";

const DIALOGO: Record<Acao, { titulo: string; descricao: string; botao: string; sucesso: string }> = {
  acao: {
    titulo: "Registrar ação",
    descricao: "O que foi feito no posto? Fica no histórico com seu nome e horário.",
    botao: "Registrar ação",
    sucesso: "Ação registrada",
  },
  resolver: {
    titulo: "Resolver alerta",
    descricao: "Descreva a ação que tratou o desvio. O alerta sai da lista de abertos.",
    botao: "Resolver",
    sucesso: "Alerta resolvido",
  },
};

const PRESSAO = "transition-transform duration-150 ease-out active:scale-[0.97]";

/**
 * Ações de tratamento sempre visíveis no rodapé do detalhe (UI Audit: estavam a dois toques).
 * Assumir é um toque; registrar ação e resolver pedem o texto que vai para o histórico.
 */
export function AlertActions({ alerta }: { readonly alerta: Alerta }) {
  const usuario = useUsuarioAtual();
  const tratarAlerta = useSessionStore((s) => s.tratarAlerta);
  const [dialogo, setDialogo] = React.useState<Acao | null>(null);
  const [texto, setTexto] = React.useState("");
  const podeTratar = usuario !== undefined && usuario.perfil !== "operacao";

  if (alerta.estado === "resolvido") {
    return <p className="text-muted-foreground text-sm">Alerta resolvido. O histórico fica guardado para auditoria.</p>;
  }

  if (!podeTratar) {
    return (
      <p className="text-muted-foreground text-sm">O tratamento é feito pela supervisão, gerência ou especialista.</p>
    );
  }

  function confirmar() {
    if (!dialogo || !texto.trim()) return;
    tratarAlerta(alerta.id, dialogo, texto.trim());
    toast.success(DIALOGO[dialogo].sucesso, { description: alerta.titulo });
    setTexto("");
    setDialogo(null);
  }

  // Alturas do notebook iguais às da v0.2 (44 px); no toque a camada (src/styles/tablet.css) leva Assumir e Registrar
  // ação a 56 px e Resolver, a ação primária do alerta, vai a 64 px (docs/12 §5 item 1).
  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {alerta.estado === "aberto" && (
          <Button
            variant="outline"
            className={`h-11 ${PRESSAO}`}
            onClick={() => {
              tratarAlerta(alerta.id, "assumir", "Assumiu o tratamento.");
              toast.success("Alerta assumido", { description: alerta.titulo });
            }}
          >
            <Hand data-icon="inline-start" />
            Assumir
          </Button>
        )}
        <Button variant="outline" className={`h-11 ${PRESSAO}`} onClick={() => setDialogo("acao")}>
          <MessageSquareText data-icon="inline-start" />
          Registrar ação
        </Button>
        <Button
          className={`h-11 toque:h-16 px-5 toque:px-6 toque:text-base ${PRESSAO}`}
          onClick={() => setDialogo("resolver")}
        >
          <CheckCircle2 data-icon="inline-start" />
          Resolver
        </Button>
      </div>

      <Dialog open={dialogo !== null} onOpenChange={(aberto) => !aberto && setDialogo(null)}>
        {/* Sem o X do canto: o do template tem rótulo "Close" (em inglês, fixo em ui/dialog.tsx) e ficaria colado ao
            título. Cancelar (56 px no toque), Esc e o toque fora fecham o diálogo. */}
        <DialogContent showCloseButton={false}>
          {dialogo && (
            <>
              <DialogHeader>
                <DialogTitle>{DIALOGO[dialogo].titulo}</DialogTitle>
                <DialogDescription>{alerta.titulo}</DialogDescription>
              </DialogHeader>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="texto-acao">Ação tomada</FieldLabel>
                <Textarea
                  id="texto-acao"
                  rows={3}
                  autoFocus
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ex.: mordente limpo e temperatura conferida com o operador."
                />
                <FieldDescription>{DIALOGO[dialogo].descricao}</FieldDescription>
              </Field>
              {/* Cancelar × Resolver são ações opostas: 16 px entre elas (docs/12 §2, item 2). */}
              <DialogFooter className="gap-4">
                <Button variant="outline" onClick={() => setDialogo(null)}>
                  Cancelar
                </Button>
                <Button onClick={confirmar} disabled={!texto.trim()}>
                  {DIALOGO[dialogo].botao}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
