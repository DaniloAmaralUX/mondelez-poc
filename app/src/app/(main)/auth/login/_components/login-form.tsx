"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localRepository } from "@/data/repository";
import { primeiroNome } from "@/lib/format";
import { useSessionStore } from "@/stores/session/session-store";

const PLANTA_ID = "chocolate";
const TAMANHO_PIN = 4;
const SLOTS_PIN = Array.from({ length: TAMANHO_PIN }, (_, i) => i);

const formSchema = z.object({
  matricula: z.string().regex(/^\d{6}$/, { message: "A matrícula tem 6 números." }),
  pin: z.string().regex(/^\d{4}$/, { message: "O PIN tem 4 números." }),
  linhaId: z.string().min(1, { message: "Escolha a linha." }),
  postoId: z.string().min(1, { message: "Escolha o posto." }),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const contextoDoTablet = useSessionStore((s) => s.contexto);
  const entrar = useSessionStore((s) => s.entrar);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: "",
      pin: "",
      linhaId: contextoDoTablet?.linhaId ?? "",
      postoId: contextoDoTablet?.postoId ?? "",
    },
  });

  const linhaId = form.watch("linhaId");
  const postos = linhaId ? localRepository.postos(linhaId) : [];

  function onSubmit(data: FormValues) {
    const resultado = entrar(data.matricula, data.pin, {
      plantaId: PLANTA_ID,
      linhaId: data.linhaId,
      postoId: data.postoId,
    });

    if (!resultado.ok) {
      form.setError(resultado.campo, { message: resultado.erro }, { shouldFocus: true });
      if (resultado.campo === "pin") form.setValue("pin", "");
      return;
    }

    toast(`Bom turno, ${primeiroNome(resultado.usuario.nome)}`, { description: resultado.usuario.cargo });
    router.replace("/dashboard/rotina");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="matricula"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-matricula">Matrícula</FieldLabel>
              <Input
                {...field}
                id="login-matricula"
                inputMode="numeric"
                autoComplete="username"
                placeholder="104233"
                maxLength={6}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="pin"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-pin">PIN</FieldLabel>
              <InputOTP
                id="login-pin"
                ref={field.ref}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={TAMANHO_PIN}
                inputMode="numeric"
                pattern={REGEXP_ONLY_DIGITS}
                autoComplete="current-password"
                // PIN completo envia sozinho: menos um toque no tablet compartilhado.
                onComplete={() => form.handleSubmit(onSubmit)()}
                aria-invalid={fieldState.invalid}
                containerClassName="w-full"
              >
                <InputOTPGroup className="w-full">
                  {SLOTS_PIN.map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      aria-invalid={fieldState.invalid}
                      className="h-11 flex-1 text-lg [-webkit-text-security:disc]"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="linhaId"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-linha">Linha</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("postoId", "");
                  }}
                >
                  <SelectTrigger id="login-linha" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Linha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {localRepository.linhas(PLANTA_ID).map((linha) => (
                        <SelectItem key={linha.id} value={linha.id}>
                          {linha.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="postoId"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-posto">Posto</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!linhaId}>
                  <SelectTrigger id="login-posto" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Posto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {postos.map((posto) => (
                        <SelectItem key={posto.id} value={posto.id}>
                          {posto.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
      <Button className="w-full" type="submit">
        Entrar
      </Button>
    </form>
  );
}
