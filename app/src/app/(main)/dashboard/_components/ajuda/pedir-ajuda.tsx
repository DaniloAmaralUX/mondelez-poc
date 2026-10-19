"use client";

import * as React from "react";

import { LifeBuoy, MapPin, Monitor, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { MOTIVO_AJUDA } from "@/domain/alertas-indicadores";
import { LIMITES } from "@/domain/limites";
import type { MotivoAjuda } from "@/domain/types";
import { useDeslocamentoDoTeclado } from "@/hooks/use-visual-viewport";
import { useSessionStore } from "@/stores/session/session-store";

import { useContextoDaAjuda } from "./use-ajuda";

const MOTIVOS = Object.entries(MOTIVO_AJUDA) as [MotivoAjuda, string][];

interface Erros {
  motivo?: string;
  texto?: string;
}

/**
 * Pedido de ajuda (RF-14) num Sheet à direita, como o "Registrar desvio" do checklist: campos no topo (um Sheet inferior
 * ficaria sob o teclado do iPad) e o Sheet encolhe acima do teclado. Motivo em chips grandes, texto curto obrigatório e
 * o contexto automático à vista (posto, tela e equipamento), para quem pede saber o que a liderança vai receber.
 *
 * O Sheet tem texto digitado: quem monta o componente passa `key={usuarioId}` (regras do código), para a próxima pessoa do
 * tablet não herdar o rascunho de quem saiu.
 */
export function PedirAjuda({
  aberto,
  onAbertoChange,
  children,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Gatilho (`SheetTrigger asChild`), opcional quando o Sheet é aberto por fora. */
  children?: React.ReactNode;
}) {
  const teclado = useDeslocamentoDoTeclado();
  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        // Sem o X do canto (28 px, rótulo "Close"): Cancelar fica no rodapé, junto da ação. Esc e o toque fora fecham.
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        style={teclado > 0 ? { bottom: teclado, height: "auto" } : undefined}
      >
        <FormularioDeAjuda fechar={() => onAbertoChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function FormularioDeAjuda({ fechar }: { fechar: () => void }) {
  const contexto = useContextoDaAjuda();
  const doTablet = useSessionStore((s) => s.contexto);
  const [motivo, setMotivo] = React.useState<MotivoAjuda | "">("");
  const [texto, setTexto] = React.useState("");
  const [erros, setErros] = React.useState<Erros>({});
  const ids = React.useId();
  const motivosRef = React.useRef<HTMLDivElement>(null);
  const textoRef = React.useRef<HTMLTextAreaElement>(null);
  const { linha, posto } = doTablet ? localRepository.descreverContexto(doTablet) : {};
  const equipamento = contexto.equipamentoId ? localRepository.equipamento(contexto.equipamentoId) : undefined;

  const idMotivos = `${ids}-motivos`;
  const idErroMotivo = `${ids}-erro-motivo`;
  const idTexto = `${ids}-texto`;
  const idAjudaTexto = `${ids}-ajuda`;
  const idErroTexto = `${ids}-erro-texto`;

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Eventos de portal sobem pela árvore do React: o submit não pode chegar a um formulário da tela por baixo.
    event.stopPropagation();

    const novos: Erros = {};
    if (!motivo) novos.motivo = "Escolha o motivo.";
    if (!texto.trim()) novos.texto = "Diga em poucas palavras o que está acontecendo.";
    if (novos.motivo || novos.texto) {
      setErros(novos);
      // Foco no primeiro erro (docs/12 §2 item 12).
      if (novos.motivo) motivosRef.current?.querySelector<HTMLElement>("button")?.focus();
      else textoRef.current?.focus();
      return;
    }
    if (!motivo) return;

    const pedido = useSessionStore.getState().pedirAjuda({
      motivo,
      texto,
      origem: contexto.origem,
      equipamentoId: contexto.equipamentoId,
      tarefaId: contexto.tarefaId,
    });
    if (!pedido) {
      // Erro fica até a pessoa fechar (WCAG 2.2.1): no toque não há hover para pausar o aviso.
      toast.error("Não foi possível pedir ajuda", {
        description: "Confira se o tablet está desbloqueado e peça de novo.",
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }
    fechar();
    const semRede = useSessionStore.getState().rede === "offline";
    toast.success("Pedido de ajuda enviado", {
      description: semRede
        ? "Salvo no tablet. A supervisão recebe quando a rede voltar; a situação aparece no menu."
        : "A supervisão recebeu agora. Quando alguém vir, o menu mostra quem e a que horas.",
    });
  }

  return (
    <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="border-b pt-[max(--spacing(4),env(safe-area-inset-top))]">
        <SheetTitle className="text-lg">Pedir ajuda</SheetTitle>
        <SheetDescription>A supervisão e a especialista recebem na hora, no app e no Teams.</SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
        <FieldSet className="gap-3">
          <FieldLegend id={idMotivos} variant="label" className="text-base">
            Motivo
          </FieldLegend>
          <ToggleGroup
            ref={motivosRef}
            type="single"
            variant="outline"
            spacing={3}
            value={motivo}
            onValueChange={(valor) => {
              if (!valor) return;
              setMotivo(valor as MotivoAjuda);
              setErros((atual) => ({ ...atual, motivo: undefined }));
            }}
            aria-labelledby={idMotivos}
            aria-invalid={erros.motivo ? true : undefined}
            aria-describedby={erros.motivo ? idErroMotivo : undefined}
            className="grid w-full grid-cols-2 gap-3"
          >
            {MOTIVOS.map(([valor, rotulo]) => (
              <ToggleGroupItem
                key={valor}
                value={valor}
                className="h-11 toque:h-16 w-full text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/5 dark:data-[state=on]:bg-primary/10"
              >
                {rotulo}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {erros.motivo && <FieldError id={idErroMotivo}>{erros.motivo}</FieldError>}
        </FieldSet>

        <Field data-invalid={erros.texto ? true : undefined}>
          <FieldLabel htmlFor={idTexto} className="text-base">
            O que está acontecendo?
          </FieldLabel>
          <Textarea
            ref={textoRef}
            id={idTexto}
            rows={3}
            value={texto}
            onChange={(event) => {
              setTexto(event.target.value);
              if (erros.texto) setErros((atual) => ({ ...atual, texto: undefined }));
            }}
            placeholder="Ex.: mordente travando de novo, já ajustei duas vezes"
            autoComplete="off"
            maxLength={LIMITES.justificativa}
            className="wrap-anywhere min-h-24"
            aria-invalid={erros.texto ? true : undefined}
            aria-describedby={[idAjudaTexto, erros.texto ? idErroTexto : undefined].filter(Boolean).join(" ")}
          />
          <FieldDescription id={idAjudaTexto}>Uma frase basta. Quem vier já chega sabendo.</FieldDescription>
          {erros.texto && <FieldError id={idErroTexto}>{erros.texto}</FieldError>}
        </Field>

        <section aria-label="Vai junto com o pedido" className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
          <p className="font-medium text-muted-foreground text-sm">Vai junto com o pedido</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{linha && posto ? `${linha.nome} · ${posto.nome}` : "Posto do tablet"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Monitor aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>Tela {contexto.origem}</span>
            </li>
            {equipamento && (
              <li className="flex items-start gap-2">
                <Wrench aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{equipamento.nome}</span>
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* Cancelar × Pedir ajuda são ações opostas: 16 px entre elas (docs/12 §2 item 2). Primária de 64 px no toque. */}
      <SheetFooter className="mt-0 flex-row justify-end gap-4 border-t pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" className="h-11" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11 toque:h-16 px-5 toque:px-6 toque:text-base">
          <LifeBuoy data-icon="inline-start" />
          Pedir ajuda
        </Button>
      </SheetFooter>
    </form>
  );
}
