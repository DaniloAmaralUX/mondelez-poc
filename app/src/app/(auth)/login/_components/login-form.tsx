"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { localRepository } from "@/data/repository";
import { PIN_DEMO } from "@/data/seed";
import { toque } from "@/lib/touch";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

const TAMANHO_PIN = 4;
const SLOTS_PIN = Array.from({ length: TAMANHO_PIN }, (_, i) => i);

export function LoginForm() {
  const router = useRouter();
  const entrar = useSessionStore((s) => s.entrar);
  const [matricula, setMatricula] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<{ campo: "matricula" | "pin"; mensagem: string } | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const erroMatricula = erro?.campo === "matricula";
  const erroPin = erro?.campo === "pin";

  function enviar(pinDigitado = pin) {
    if (!matricula.trim()) {
      setErro({ campo: "matricula", mensagem: "Digite sua matrícula." });
      return;
    }
    if (pinDigitado.length < TAMANHO_PIN) {
      setErro({ campo: "pin", mensagem: "Digite os 4 números do PIN." });
      return;
    }
    const resultado = entrar(matricula, pinDigitado);
    if (!resultado.ok) {
      setErro({ campo: resultado.campo, mensagem: resultado.erro });
      setPin("");
      pinRef.current?.focus();
      return;
    }
    const temContexto = useSessionStore.getState().contexto !== null;
    router.replace(temContexto ? "/rotina" : "/contexto");
  }

  function escolherPersona(m: string) {
    setMatricula(m);
    setErro(null);
    setPin("");
    pinRef.current?.focus();
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-strong text-2xl">Entrar no posto</h1>
        <p className="text-muted-foreground">Use a matrícula do crachá e o seu PIN.</p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <FieldGroup>
          <Field data-invalid={erroMatricula || undefined}>
            <FieldLabel htmlFor="matricula" className="text-lg">
              Matrícula
            </FieldLabel>
            <Input
              id="matricula"
              inputMode="numeric"
              autoComplete="username"
              placeholder="Ex.: 104233"
              value={matricula}
              onChange={(e) => {
                setMatricula(e.target.value.replace(/\D/g, ""));
                setErro(null);
              }}
              aria-invalid={erroMatricula || undefined}
              className={toque.campo}
            />
          </Field>
          <Field data-invalid={erroPin || undefined}>
            <FieldLabel htmlFor="pin" className="text-lg">
              PIN
            </FieldLabel>
            <InputOTP
              id="pin"
              ref={pinRef}
              maxLength={TAMANHO_PIN}
              inputMode="numeric"
              pattern="^[0-9]*$"
              value={pin}
              onChange={(valor) => {
                setPin(valor);
                setErro(null);
              }}
              onComplete={(valor: string) => enviar(valor)}
              aria-invalid={erroPin || undefined}
            >
              <InputOTPGroup>
                {SLOTS_PIN.map((i) => (
                  <InputOTPSlot key={i} index={i} className="size-touch text-xl" aria-invalid={erroPin || undefined} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>Demonstração: o PIN de todos é {PIN_DEMO}.</FieldDescription>
          </Field>
          {erro && <FieldError className="text-base">{erro.mensagem}</FieldError>}
          <Button type="submit" className={toque.botao}>
            Entrar
            <ArrowRight data-icon="inline-end" />
          </Button>
        </FieldGroup>
      </form>

      <Separator />

      <FieldSet>
        <FieldLegend className="text-lg">Pessoas da demonstração</FieldLegend>
        <FieldDescription>Toque em uma pessoa para preencher a matrícula.</FieldDescription>
        <ItemGroup className="gap-2">
          {localRepository.usuarios().map((u) => (
            <Item key={u.id} asChild variant="outline" className="min-h-touch">
              <button
                type="button"
                onClick={() => escolherPersona(u.matricula)}
                aria-pressed={matricula === u.matricula}
              >
                <ItemMedia>
                  <Avatar>
                    <AvatarFallback>{getInitials(u.nome)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-base">{u.nome}</ItemTitle>
                  <ItemDescription>
                    {u.cargo} · {u.matricula}
                  </ItemDescription>
                </ItemContent>
              </button>
            </Item>
          ))}
        </ItemGroup>
      </FieldSet>
    </div>
  );
}
