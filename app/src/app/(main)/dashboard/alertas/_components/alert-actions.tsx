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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LIMITES } from "@/domain/limites";
import type { AcaoAlerta, Alerta } from "@/domain/types";
import { PRESSAO } from "@/lib/pressao";
import { JANELA_DESFAZER_MS, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

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

/**
 * Teclado físico e ponteiro fino (notebook da liderança): o cursor já pode ir para o campo ao abrir o diálogo. No
 * tablet, não: o teclado virtual subiria junto e cobriria metade da tela antes de a pessoa ler o que vai registrar.
 * Lido na hora do toque, nunca no render (sem divergência de hidratação).
 */
function abreComTecladoFisico() {
  if (document.documentElement.dataset.density === "touch") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * Ações de tratamento sempre visíveis no rodapé do detalhe (auditoria de UX: estavam a dois toques).
 * Assumir é um toque; registrar ação e resolver pedem o texto que vai para o histórico. Nenhuma pede confirmação:
 * todas mostram "Desfazer" por 10 s (docs/12 §2 item 5).
 */
export function AlertActions({ alerta }: { readonly alerta: Alerta }) {
  const usuario = useUsuarioAtual();
  const tratarAlerta = useSessionStore((s) => s.tratarAlerta);
  const desfazerTratamento = useSessionStore((s) => s.desfazerTratamento);
  const [dialogo, setDialogo] = React.useState<Acao | null>(null);
  const [texto, setTexto] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(null);
  const tituloRef = React.useRef<HTMLHeadingElement>(null);
  const campoRef = React.useRef<HTMLTextAreaElement>(null);
  const campoId = React.useId();
  const ajudaId = React.useId();
  const erroId = React.useId();
  const podeTratar = usuario !== undefined && usuario.perfil !== "operacao";

  if (alerta.estado === "resolvido") {
    return <p className="text-muted-foreground text-sm">Alerta resolvido. O histórico fica guardado para auditoria.</p>;
  }

  if (!podeTratar) {
    return (
      <p className="text-muted-foreground text-sm">O tratamento é feito pela supervisão, gerência ou especialista.</p>
    );
  }

  /**
   * Registra e oferece "Desfazer". O desfazer tira só a ação que este aviso anunciou (pelo instante dela, `em`) e só se
   * ela ainda for a última do histórico: se outra ação veio depois (ex.: assumiu e já registrou uma ação, ou outra pessoa
   * agiu), o store recusa e o aviso explica, em vez de apagar a errada. Passados os 10 s, a mesma ação se desfaz pelo
   * histórico do alerta (alert-details.tsx).
   */
  function registrar(tipo: AcaoAlerta["tipo"], textoDaAcao: string, aviso: string) {
    const acao = tratarAlerta(alerta.id, tipo, textoDaAcao);
    if (!acao) return;
    toast.success(aviso, {
      description: alerta.titulo,
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          if (!desfazerTratamento(alerta.id, acao.em)) {
            toast.warning("Não deu para desfazer", { description: "Outra ação foi registrada depois desta." });
          }
        },
      },
    });
  }

  function abrir(acao: Acao) {
    setTexto("");
    setErro(null);
    setDialogo(acao);
  }

  // Valida no envio (docs/12 §2 item 12): o botão nunca fica desabilitado; sem texto, o erro aparece junto do campo e o
  // foco vai para ele.
  function confirmar() {
    if (!dialogo) return;
    const valor = texto.trim();
    if (!valor) {
      setErro("Escreva o que foi feito antes de continuar.");
      campoRef.current?.focus();
      return;
    }
    registrar(dialogo, valor, DIALOGO[dialogo].sucesso);
    setTexto("");
    setErro(null);
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
            onClick={() => registrar("assumir", "Assumiu o tratamento.", "Você assumiu o alerta")}
          >
            <Hand data-icon="inline-start" />
            Assumir
          </Button>
        )}
        <Button variant="outline" className={`h-11 ${PRESSAO}`} onClick={() => abrir("acao")}>
          <MessageSquareText data-icon="inline-start" />
          Registrar ação
        </Button>
        <Button
          className={`h-11 toque:h-16 px-5 toque:px-6 toque:text-base ${PRESSAO}`}
          onClick={() => abrir("resolver")}
        >
          <CheckCircle2 data-icon="inline-start" />
          Resolver
        </Button>
      </div>

      <Dialog open={dialogo !== null} onOpenChange={(aberto) => !aberto && setDialogo(null)}>
        {/* Sem o X do canto: o do template tem rótulo "Close" (em inglês, fixo em ui/dialog.tsx) e ficaria colado ao
            título. Cancelar (56 px no toque), Esc e o toque fora fecham o diálogo.
            No toque o diálogo fica ancorado no topo (8 %), e não no centro: com o teclado virtual aberto (metade de
            baixo da tela, ainda mais em paisagem) o campo e os botões continuam visíveis. É o Dialog do template
            reposicionado, em vez de um Sheet inferior, porque um Sheet de baixo é empurrado ou coberto pelo teclado no
            iPad (o iOS não redimensiona a página). Mais largo no toque para a luva (sm:max-w-sm → sm:max-w-lg). */}
        <DialogContent
          showCloseButton={false}
          className="toque:top-[8%] toque:translate-y-0 toque:sm:max-w-lg"
          onOpenAutoFocus={(event) => {
            if (abreComTecladoFisico()) return;
            // Foco no título: o leitor de tela anuncia o diálogo e o teclado virtual só sobe quando a pessoa tocar no
            // campo.
            event.preventDefault();
            tituloRef.current?.focus();
          }}
        >
          {dialogo && (
            <>
              <DialogHeader>
                <DialogTitle ref={tituloRef} tabIndex={-1} className="outline-none">
                  {DIALOGO[dialogo].titulo}
                </DialogTitle>
                <DialogDescription>{alerta.titulo}</DialogDescription>
              </DialogHeader>
              <Field className="gap-1.5" data-invalid={erro ? true : undefined}>
                <FieldLabel htmlFor={campoId}>Ação tomada</FieldLabel>
                {/* Limite e quebra em qualquer ponto: um texto colado sem espaços fazia o campo (field-sizing) crescer
                    na horizontal e empurrava Cancelar e a ação para fora da tela. */}
                <Textarea
                  ref={campoRef}
                  id={campoId}
                  rows={3}
                  maxLength={LIMITES.acaoDoAlerta}
                  className="wrap-anywhere"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    if (erro) setErro(null);
                  }}
                  placeholder="Ex.: mordente limpo e temperatura conferida com o operador."
                  autoComplete="off"
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? `${ajudaId} ${erroId}` : ajudaId}
                />
                <FieldDescription id={ajudaId}>{DIALOGO[dialogo].descricao}</FieldDescription>
                {erro && <FieldError id={erroId}>{erro}</FieldError>}
              </Field>
              {/* Cancelar × Resolver são ações opostas: 16 px entre elas (docs/12 §2, item 2). A ação primária do
                  diálogo tem 64 px no toque, como Resolver no rodapé do detalhe (docs/12 §5 item 1). */}
              <DialogFooter className="gap-4 sm:items-center">
                <Button variant="outline" onClick={() => setDialogo(null)}>
                  Cancelar
                </Button>
                <Button className="toque:h-16 toque:px-6 toque:text-base" onClick={confirmar}>
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
