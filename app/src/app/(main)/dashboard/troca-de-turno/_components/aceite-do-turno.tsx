"use client";

import * as React from "react";

import { toast } from "sonner";

import { PinPad, useEsperaDoPin } from "@/components/pin-pad";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TrocaDeTurno, Usuario } from "@/domain/types";
import { primeiroNome } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

const TAMANHO_PIN = 4;

/** Cartão de escolha do template, como na tela "Quem está no posto?" (lock-screen.tsx): o cartão inteiro é o alvo. */
const CARTAO = "*:data-[slot=field]:gap-3 *:data-[slot=field]:p-4";

/**
 * Aceite de quem recebe o posto (RN-10): escolher a pessoa e digitar o PIN dela no teclado da tela (o mesmo do login e
 * do bloqueio). Não troca quem está logado no tablet. Com uma pessoa só (a supervisão recebendo na ausência), sem a
 * lista. Os PINs errados contam na mesma regra do login (5 erros, 60 s de espera), pelo store.
 */
export function AceiteDoTurno({
  troca,
  operadores,
  supervisao,
  turmaSeguinte,
  aoReceber,
}: {
  troca: TrocaDeTurno;
  operadores: Usuario[];
  supervisao: Usuario[];
  /** Turma do turno seguinte, marcada nos operadores dela. */
  turmaSeguinte?: string;
  aoReceber?: (quem: Usuario) => void;
}) {
  const aceitarTurno = useSessionStore((s) => s.aceitarTurno);
  const candidatos = [...operadores, ...supervisao];
  const [escolhidoId, setEscolhidoId] = React.useState(candidatos[0]?.id ?? "");
  const [pin, setPin] = React.useState("");
  const [erro, setErro] = React.useState<string>();
  const escolhido = candidatos.find((u) => u.id === escolhidoId);
  const espera = useEsperaDoPin(escolhido?.id);
  const grupoId = React.useId();

  function aoCompletar(digitado: string) {
    if (!escolhido) return;
    const resultado = aceitarTurno(troca.id, escolhido.id, digitado);
    setPin("");
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    toast.success(`Turno recebido por ${primeiroNome(escolhido.nome)}`, {
      description: "Passagem concluída. O documento ficou com quem entregou e quem recebeu.",
    });
    aoReceber?.(escolhido);
  }

  return (
    <div className="@container/aceite">
      <div className="grid @2xl/aceite:grid-cols-2 items-start gap-6">
        {candidatos.length > 1 ? (
          <div className="flex flex-col gap-2">
            <p id={grupoId} className="font-medium text-sm toque:text-base">
              Quem recebe o posto
            </p>
            <RadioGroup
              value={escolhidoId}
              onValueChange={(valor) => {
                setEscolhidoId(valor);
                setPin("");
                setErro(undefined);
              }}
              aria-labelledby={grupoId}
              className="gap-3"
            >
              {candidatos.map((u) => {
                const id = `${grupoId}-${u.id}`;
                const daSupervisao = u.perfil === "supervisao";
                return (
                  <FieldLabel key={u.id} htmlFor={id} className={CARTAO}>
                    <Field orientation="horizontal">
                      <Avatar className="size-10">
                        <AvatarFallback>{getInitials(u.nome)}</AvatarFallback>
                      </Avatar>
                      <FieldContent>
                        <FieldTitle className="toque:text-base">
                          {u.nome}
                          {!daSupervisao && turmaSeguinte && u.turma === turmaSeguinte && (
                            <Badge variant="secondary" className="toque:text-sm">
                              Próximo turno
                            </Badge>
                          )}
                        </FieldTitle>
                        <FieldDescription>
                          {daSupervisao ? `${u.cargo} · na ausência do operador` : `${u.cargo} · turma ${u.turma}`}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={u.id} id={id} />
                    </Field>
                  </FieldLabel>
                );
              })}
            </RadioGroup>
          </div>
        ) : (
          escolhido && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
              <Avatar className="size-10">
                <AvatarFallback>{getInitials(escolhido.nome)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{escolhido.nome}</span>
                <span className="text-muted-foreground text-sm">
                  {escolhido.perfil === "supervisao" ? "Recebe na ausência do operador" : escolhido.cargo}
                </span>
              </div>
            </div>
          )
        )}

        {escolhido && (
          <div className="mx-auto w-full max-w-sm">
            <PinPad
              key={escolhido.id}
              rotulo={`PIN de ${primeiroNome(escolhido.nome)}`}
              descricao="Quem recebe digita o próprio PIN."
              valor={pin}
              onValorChange={(valor) => {
                setPin(valor);
                setErro(undefined);
              }}
              onComplete={aoCompletar}
              tamanho={TAMANHO_PIN}
              erro={espera ?? erro}
              desabilitado={Boolean(espera)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
