"use client";

import { type KeyboardEvent, type ReactNode, type Ref, useEffect, useEffectEvent, useId, useState } from "react";

import { cn } from "cn";
import { Delete } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * Teclas de 64 px nos dois ponteiros (docs/12 §2 item 1: teclado numérico é alvo primário) e 12 px entre elas (gap-3).
 * `h-16` e não `min-h-16`: a camada de toque (src/styles/tablet.css) dá o piso de 56 px por min-height, e um min-h-*
 * aqui perderia para ela. Pressão com escala só sem "reduzir movimento".
 */
const TECLA = "h-16 w-full text-2xl font-medium tabular-nums motion-safe:active:scale-[0.97]";

/** Tremida curta no erro. Só transform: com "reduzir movimento" o MotionProvider (reducedMotion="user") a desliga. */
const TREMIDA = { x: [0, -10, 10, -6, 6, 0] };
const TRANSICAO_DA_TREMIDA = { duration: 0.36, ease: "easeOut" } as const;

type TeclaFisica = Pick<KeyboardEvent, "key" | "repeat" | "ctrlKey" | "metaKey" | "altKey">;

function emCampoDeTexto(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof HTMLElement)) return false;
  return alvo.isContentEditable || alvo.closest("input, textarea, select") !== null;
}

export interface PinPadProps {
  /** Rótulo visível e nome acessível do teclado (ex.: "PIN", "PIN de Alberto"). */
  rotulo: string;
  /** Apoio abaixo do rótulo, ligado por aria-describedby. */
  descricao?: string;
  valor: string;
  onValorChange: (valor: string) => void;
  /** Chamado ao digitar o último número (o PIN completo envia sozinho). */
  onComplete?: (pin: string) => void;
  tamanho?: number;
  /** Mensagem de erro (ex.: "PIN incorreto."). Quem usa limpa `valor` junto: os números somem e o PIN é digitado de novo. */
  erro?: string;
  desabilitado?: boolean;
  /**
   * Teclado físico na janela inteira, fora de campos de texto. Para telas em que o PIN é o que se digita (bloqueio).
   * Sem isto, o teclado físico funciona com o foco no teclado numérico (ou numa das teclas).
   */
  capturarTeclado?: boolean;
  /** 12ª tecla (canto inferior direito). Sem ela, o espaço fica vazio. */
  teclaDeAcao?: ReactNode;
  /** Raiz focável (tabIndex -1): quem usa leva o foco para cá, ex.: ao completar a matrícula. */
  ref?: Ref<HTMLFieldSetElement>;
  id?: string;
  className?: string;
}

/**
 * Teclado numérico na tela para o PIN (docs/12 §3.4): o iPad não tem teclado numérico, e com luva o teclado do sistema
 * é pequeno. Não há `<input>`, então o teclado do sistema não abre no tablet. Os números digitados não aparecem: só
 * os indicadores preenchidos, e o leitor de tela ouve a contagem ("2 de 4 números"), nunca os dígitos.
 */
export function PinPad({
  rotulo,
  descricao,
  valor,
  onValorChange,
  onComplete,
  tamanho = 4,
  erro,
  desabilitado = false,
  capturarTeclado = false,
  teclaDeAcao,
  ref,
  id,
  className,
}: PinPadProps) {
  const idBase = useId();
  const idDescricao = `${idBase}-descricao`;
  const idErro = `${idBase}-erro`;
  // Cada PIN completo conta uma tentativa: o erro repetido ("PIN incorreto." duas vezes) treme e é anunciado de novo.
  const [tentativas, setTentativas] = useState(0);
  const posicoes = Array.from({ length: tamanho }, (_, posicao) => posicao);
  const temErro = Boolean(erro);

  const digitar = (digito: string) => {
    if (desabilitado || valor.length >= tamanho) return;
    const proximo = `${valor}${digito}`;
    onValorChange(proximo);
    if (proximo.length === tamanho) {
      setTentativas((n) => n + 1);
      onComplete?.(proximo);
    }
  };

  const apagar = () => {
    if (!desabilitado && valor.length > 0) onValorChange(valor.slice(0, -1));
  };

  /** Dígitos (sem repetição ao segurar) e Backspace/Delete. Devolve true quando a tecla foi usada. */
  const usarTecla = (tecla: TeclaFisica): boolean => {
    if (tecla.ctrlKey || tecla.metaKey || tecla.altKey) return false;
    if (/^\d$/.test(tecla.key)) {
      if (!tecla.repeat) digitar(tecla.key);
      return true;
    }
    if (tecla.key === "Backspace" || tecla.key === "Delete") {
      apagar();
      return true;
    }
    return false;
  };

  // O onKeyDown da raiz roda antes (o React escuta na raiz do app) e marca o evento: a janela não conta duas vezes.
  const aoTeclarNaJanela = useEffectEvent((evento: globalThis.KeyboardEvent) => {
    if (evento.defaultPrevented || emCampoDeTexto(evento.target)) return;
    if (usarTecla(evento)) evento.preventDefault();
  });

  useEffect(() => {
    if (!capturarTeclado) return;
    const ouvir = (evento: globalThis.KeyboardEvent) => aoTeclarNaJanela(evento);
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, [capturarTeclado]);

  const descritoPor = [descricao ? idDescricao : null, temErro ? idErro : null].filter(Boolean).join(" ") || undefined;

  return (
    // fieldset do template: grupo nativo, nomeado pela legenda; `disabled` desliga todas as teclas de uma vez.
    <FieldSet
      ref={ref}
      id={id}
      tabIndex={-1}
      disabled={desabilitado}
      aria-describedby={descritoPor}
      onKeyDown={(evento) => {
        if (usarTecla(evento)) evento.preventDefault();
      }}
      className={cn("group/pin-pad w-full min-w-0 outline-none", className)}
    >
      <FieldLegend variant="label">{rotulo}</FieldLegend>
      {descricao && <FieldDescription id={idDescricao}>{descricao}</FieldDescription>}

      {/* Foco por teclado na raiz (ex.: vindo da matrícula) aparece em volta dos indicadores. */}
      <motion.div
        key={temErro ? `erro-${tentativas}` : "digitos"}
        aria-hidden="true"
        animate={temErro ? TREMIDA : undefined}
        transition={TRANSICAO_DA_TREMIDA}
        className="flex justify-center gap-4 rounded-lg py-2 ring-ring/50 group-focus-visible/pin-pad:ring-3"
      >
        {posicoes.map((posicao) => (
          <span
            key={posicao}
            className={cn(
              "size-4 toque:size-5 rounded-full border-2 border-input transition-colors duration-150",
              posicao < valor.length && "border-primary bg-primary",
              temErro && "border-destructive",
            )}
          />
        ))}
      </motion.div>
      <span className="sr-only" aria-live="polite">
        {valor.length > 0 ? `${valor.length} de ${tamanho} números` : ""}
      </span>

      <div className="grid grid-cols-3 gap-3">
        {TECLAS.map((digito) => (
          <Button key={digito} type="button" variant="outline" onClick={() => digitar(digito)} className={TECLA}>
            {digito}
          </Button>
        ))}
        <Button type="button" variant="ghost" aria-label="Apagar o último número" onClick={apagar} className={TECLA}>
          <Delete aria-hidden="true" className="size-6" />
        </Button>
        <Button type="button" variant="outline" onClick={() => digitar("0")} className={TECLA}>
          0
        </Button>
        {teclaDeAcao ?? <span aria-hidden="true" />}
      </div>

      {temErro && (
        // key: um erro novo (mesmo com o mesmo texto) entra de novo no DOM e o role="alert" volta a ser anunciado.
        <FieldError key={tentativas} id={idErro} className="text-center">
          {erro}
        </FieldError>
      )}
    </FieldSet>
  );
}
