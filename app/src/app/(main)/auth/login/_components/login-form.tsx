"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { Check } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PinPad, useEsperaDoPin } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { primeiroNome } from "@/lib/format";
import { useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

const PLANTA_ID = "chocolate";
const TAMANHO_MATRICULA = 6;
const TAMANHO_PIN = 4;

const formSchema = z.object({
  matricula: z.string().regex(/^\d{6}$/, { message: "A matrícula tem 6 números." }),
  pin: z.string().regex(/^\d{4}$/, { message: "O PIN tem 4 números." }),
  linhaId: z.string().min(1, { message: "Escolha a linha." }),
  postoId: z.string().min(1, { message: "Escolha o posto." }),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Escolha grande para luva (docs/12 §3.4), no lugar do Select de 32 px: 56 px no toque pela camada de densidade, 12 px
 * entre as opções (spacing 3), quebra em linhas quando não cabe. A escolhida se lê de longe: borda e fundo da cor
 * primária e um ✓ (não só a cor), no mesmo padrão das respostas C/NC do checklist.
 */
const OPCAO =
  "min-w-0 flex-1 basis-16 toque:text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary";

function apenasDigitos(texto: string, tamanho: number) {
  return texto.replace(/\D/g, "").slice(0, tamanho);
}

export function LoginForm() {
  const router = useRouter();
  const hidratado = useSessionHydrated();
  const contexto = useSessionStore((s) => s.contexto);
  const entrar = useSessionStore((s) => s.entrar);
  const pinPadRef = useRef<HTMLFieldSetElement | null>(null);
  const [entrando, setEntrando] = useState(false);

  const posto = { linhaId: contexto?.linhaId ?? "", postoId: contexto?.postoId ?? "" };
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { matricula: "", pin: "", ...posto },
    // O posto lembrado pelo tablet vem do IndexedDB, depois da hidratação (antes vale o padrão do store, igual ao HTML
    // do servidor). Ao chegar, preenche Linha e Posto; o que a pessoa já digitou ou escolheu fica (keepDirtyValues).
    values: hidratado ? { matricula: "", pin: "", ...posto } : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const linhaId = form.watch("linhaId");
  const postoId = form.watch("postoId");
  const matricula = form.watch("matricula");
  // Muitos PINs errados para esta matrícula: o PIN pad espera, com a hora de liberar à vista (V03-SEC-02).
  const pessoaDaMatricula =
    matricula.length === TAMANHO_MATRICULA ? localRepository.usuarioPorMatricula(matricula) : undefined;
  const espera = useEsperaDoPin(pessoaDaMatricula?.id);
  // Ao liberar, o foco volta ao PIN: o fieldset desabilitado tinha tirado o foco dele.
  const esperando = espera !== null;
  const esperavaAntes = useRef(esperando);
  useEffect(() => {
    if (esperavaAntes.current && !esperando) pinPadRef.current?.focus();
    esperavaAntes.current = esperando;
  }, [esperando]);
  const postos = linhaId ? localRepository.postos(linhaId) : [];
  // Linha e Posto vêm antes da matrícula (onde, depois quem): o PIN entra sozinho no último número, então nada que se
  // escolhe fica depois dele. Com o teclado de 64 px, em paisagem Linha e Posto podem sair da vista quando o PIN
  // recebe o foco: o posto escolhido aparece junto do PIN, para ninguém entrar no posto errado sem ver.
  const linhaNome = localRepository.linhas(PLANTA_ID).find((l) => l.id === linhaId)?.nome;
  const postoNome = postos.find((p) => p.id === postoId)?.nome;
  const postoEscolhido = linhaNome && postoNome ? `Entrando em ${linhaNome} · ${postoNome}.` : undefined;

  /** Troca de linha mantém o mesmo tipo de posto (Embalagem → Embalagem), se existir na linha nova. */
  function escolherLinha(novaLinhaId: string) {
    const postoAtual = localRepository.posto(form.getValues("postoId"));
    const equivalente = localRepository.postos(novaLinhaId).find((p) => p.nome === postoAtual?.nome);
    form.setValue("postoId", equivalente?.id ?? "", { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  }

  function onSubmit(data: FormValues) {
    const resultado = entrar(data.matricula, data.pin, {
      plantaId: PLANTA_ID,
      linhaId: data.linhaId,
      postoId: data.postoId,
    });

    if (!resultado.ok) {
      // Errou a matrícula ou o PIN: o PIN é digitado de novo (aparelho compartilhado, ninguém herda um PIN pela metade).
      form.setValue("pin", "");
      // Bloqueado por tentativas: a mensagem vem de useEsperaDoPin e some sozinha quando libera; um erro no campo
      // ficaria na tela depois disso.
      if (resultado.campo === "pin" && resultado.bloqueadoAte) {
        form.clearErrors("pin");
        return;
      }
      form.setError(resultado.campo, { message: resultado.erro }, { shouldFocus: true });
      return;
    }

    setEntrando(true);
    toast(`Bom turno, ${primeiroNome(resultado.usuario.nome)}`, { description: resultado.usuario.cargo });
    router.replace("/dashboard/rotina");
  }

  // PIN completo com outro campo inválido (ex.: matrícula curta): limpa o PIN e o foco vai ao primeiro erro.
  const enviar = form.handleSubmit(onSubmit, (erros) => {
    if (!erros.pin) form.setValue("pin", "");
  });

  return (
    // v0.4 (docs/14): com o card largo (notebook, iPad em paisagem) o formulário vira duas colunas, quem e onde à
    // esquerda e o PIN com o Entrar à direita, e cabe na altura da tela sem rolar. A ordem do DOM não muda.
    <form noValidate onSubmit={enviar} className="grid gap-4 @[32rem]/login:grid-cols-2 @[32rem]/login:gap-x-10">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="linhaId"
          render={({ field, fieldState }) => (
            <FieldSet className="gap-1.5">
              <FieldLegend variant="label" className="mb-0">
                Linha
              </FieldLegend>
              <ToggleGroup
                ref={field.ref}
                type="single"
                variant="outline"
                spacing={3}
                value={field.value}
                // Sem desmarcar no segundo toque: com luva, um toque repetido não pode apagar a escolha.
                onValueChange={(valor) => {
                  if (!valor) return;
                  field.onChange(valor);
                  escolherLinha(valor);
                }}
                aria-describedby={fieldState.invalid ? "login-linha-erro" : undefined}
                // Na coluna estreita do formulário em duas colunas, 2 × 2 em vez de 3 + 1.
                className="w-full flex-wrap @[32rem]/login:grid @[32rem]/login:grid-cols-2"
              >
                {localRepository.linhas(PLANTA_ID).map((linha) => (
                  <ToggleGroupItem key={linha.id} value={linha.id} className={OPCAO}>
                    <Check aria-hidden="true" className="hidden group-data-[state=on]/toggle:block" />
                    {linha.nome}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {fieldState.invalid && <FieldError id="login-linha-erro" errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />

        <Controller
          control={form.control}
          name="postoId"
          render={({ field, fieldState }) => (
            <FieldSet className="gap-1.5">
              <FieldLegend variant="label" className="mb-0">
                Posto
              </FieldLegend>
              {postos.length > 0 ? (
                <ToggleGroup
                  ref={field.ref}
                  type="single"
                  variant="outline"
                  spacing={3}
                  value={field.value}
                  onValueChange={(valor) => {
                    if (valor) field.onChange(valor);
                  }}
                  aria-describedby={fieldState.invalid ? "login-posto-erro" : undefined}
                  className="w-full flex-wrap"
                >
                  {postos.map((p) => (
                    <ToggleGroupItem key={p.id} value={p.id} className={OPCAO}>
                      <Check aria-hidden="true" className="hidden group-data-[state=on]/toggle:block" />
                      {p.nome}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : (
                <p className={cn("text-muted-foreground text-sm", fieldState.invalid && "sr-only")}>
                  Escolha a linha para ver os postos.
                </p>
              )}
              {fieldState.invalid && <FieldError id="login-posto-erro" errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />

        <Controller
          control={form.control}
          name="matricula"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-matricula">Matrícula</FieldLabel>
              <Input
                {...field}
                id="login-matricula"
                // Aparelho compartilhado: sem sugestão de matrícula de outra pessoa (docs/pesquisa auditoria §5.2).
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="numeric"
                enterKeyHint="next"
                placeholder="6 números do crachá"
                maxLength={TAMANHO_MATRICULA}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? "login-matricula-erro" : undefined}
                onChange={(evento) => {
                  const matricula = apenasDigitos(evento.target.value, TAMANHO_MATRICULA);
                  const completou = matricula.length === TAMANHO_MATRICULA && field.value.length < TAMANHO_MATRICULA;
                  field.onChange(matricula);
                  // 6 números: o foco vai para o PIN e o teclado do sistema fecha (o PIN é digitado na tela).
                  if (completou) pinPadRef.current?.focus();
                }}
                onKeyDown={(evento) => {
                  // "Próximo" do teclado leva ao PIN em vez de enviar o formulário pela metade.
                  if (evento.key !== "Enter") return;
                  evento.preventDefault();
                  pinPadRef.current?.focus();
                }}
              />
              {fieldState.invalid && <FieldError id="login-matricula-erro" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="pin"
          render={({ field, fieldState }) => (
            <PinPad
              ref={(elemento) => {
                field.ref(elemento);
                pinPadRef.current = elemento;
              }}
              rotulo="PIN"
              descricao={postoEscolhido}
              valor={field.value}
              onValorChange={(pin) => {
                field.onChange(pin);
                if (fieldState.error) form.clearErrors("pin");
              }}
              tamanho={TAMANHO_PIN}
              // PIN completo envia sozinho: menos um toque no tablet compartilhado.
              onComplete={() => void enviar()}
              erro={espera ?? fieldState.error?.message}
              desabilitado={entrando || esperando}
            />
          )}
        />
        {/* Ação primária do login: 64 px no toque, como Registrar e Resolver (docs/12 §5 item 1); 44 px no notebook. */}
        <Button className="h-11 toque:h-16 w-full toque:text-base" type="submit" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
