"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Clock, Lock, LogOut, UserRound, Users } from "lucide-react";
import { createPortal, flushSync } from "react-dom";
import { toast } from "sonner";

import { PinPad, useEsperaDoPin } from "@/components/pin-pad";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import type { Usuario } from "@/domain/types";
import { INATIVIDADE_MS, OCULTO_MS, useBloqueioAutomatico } from "@/hooks/use-bloqueio";
import { primeiroNome } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { type MotivoBloqueio, useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

const TAMANHO_MATRICULA = 6;
const TAMANHO_PIN = 4;
/** Raiz do teclado do PIN: recebe o foco quando a tela abre (sem abrir o teclado do sistema). */
const ID_DO_PIN = "bloqueio-pin";

/**
 * Cartão de escolha do template (FieldLabel + Field + RadioGroupItem): o cartão inteiro é o alvo, com 72 px de altura
 * (avatar de 40 + 16 em cima e embaixo) e 12 px entre um e outro (gap-3 do RadioGroup).
 */
const CARTAO = "*:data-[slot=field]:gap-3 *:data-[slot=field]:p-4";

type Modo = "sugerida" | "outra";

function minutos(ms: number) {
  return Math.round(ms / 60_000);
}

function textoDoMotivo(
  motivo: MotivoBloqueio | null,
  numeroDoTurno: number,
  pessoaAtual: Usuario | undefined,
  candidato: Usuario | undefined,
) {
  switch (motivo) {
    case "inatividade":
      return {
        Icone: Lock,
        titulo: "Tablet bloqueado por inatividade",
        detalhe: `Ninguém tocou na tela por ${minutos(INATIVIDADE_MS)} minutos.`,
      };
    case "oculto":
      return {
        Icone: Lock,
        titulo: "Tablet bloqueado ao voltar",
        detalhe: `A tela ficou apagada ou em outro app por mais de ${minutos(OCULTO_MS)} minutos.`,
      };
    case "turno":
      return {
        Icone: Clock,
        titulo: `Começou o ${numeroDoTurno}º turno`,
        detalhe: "Quem vai usar o tablet entra de novo com o PIN.",
      };
    case "troca":
      return candidato
        ? { Icone: Users, titulo: "Trocar de pessoa", detalhe: `Digite o PIN de ${primeiroNome(candidato.nome)}.` }
        : {
            Icone: Lock,
            titulo: "Tablet bloqueado",
            detalhe: pessoaAtual ? `${primeiroNome(pessoaAtual.nome)} bloqueou o tablet.` : "",
          };
    default:
      return { Icone: Lock, titulo: "Tablet bloqueado", detalhe: "" };
  }
}

function apenasDigitos(texto: string, tamanho: number) {
  return texto.replace(/\D/g, "").slice(0, tamanho);
}

function focarPin(raiz: ParentNode) {
  raiz.querySelector<HTMLElement>(`#${ID_DO_PIN}`)?.focus();
}

/**
 * Bloqueio automático do tablet (inatividade, segundo plano, virada de turno; regras em `useBloqueioAutomatico`).
 * Componente à parte e sem interface: o relógio o redesenha a cada minuto sem redesenhar o resto do layout.
 */
export function BloqueioAutomatico() {
  useBloqueioAutomatico();
  return null;
}

/**
 * "Quem está no posto?" (docs/12 §3.4, fase E). Cobre o dashboard enquanto o tablet está bloqueado; a rota e o
 * conteúdo continuam montados por baixo (SessionGate os deixa inertes), então o checklist pela metade e a rolagem
 * ficam como estavam. Montado uma vez no layout do dashboard.
 */
export function LockScreen() {
  const hidratado = useSessionHydrated();
  const bloqueado = useSessionStore((s) => s.bloqueado && s.usuarioId !== null);

  if (!hidratado || !bloqueado) return null;
  return <DialogoDeBloqueio />;
}

/**
 * `<dialog>` nativo aberto com showModal(): fica na camada superior do navegador, acima dos toasts e de menus ou
 * diálogos do Radix que estivessem abertos, e o navegador deixa todo o resto inerte (foco preso, leitor de tela só
 * aqui). O visual é o pedido: tela cheia, fundo do tema, sem transparência.
 *
 * Bloqueio com um Sheet/Dialog/Select do Radix aberto por baixo (Registrar desvio, Registrar ação, Ver documento):
 * - portal no `body`: o Radix já pôs aria-hidden nos irmãos do overlay quando ele abriu, e um nó criado depois fica
 *   fora disso; dentro da árvore do app o leitor de tela não chegaria a "Quem está no posto?";
 * - o toque e o Esc aqui não chegam ao `document`, onde o Radix decide fechar o overlay "por fora": o Sheet continua
 *   aberto por baixo. A atividade (use-bloqueio.ts) segue contando, porque é ouvida na janela, na captura.
 * - o overlay só volta como estava se a mesma pessoa desbloquear. Os que guardam texto livre têm `key` pelo usuarioId
 *   (Registrar desvio em checklist.tsx; Registrar ação e Resolver em alert-details.tsx): com outra pessoa eles
 *   remontam fechados e vazios, e o texto de quem saiu não é enviado em nome de quem entrou (RNF-06). A busca do header
 *   não envia nada e fica como está.
 */
function DialogoDeBloqueio() {
  const router = useRouter();
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idMotivo = useId();
  const motivo = useSessionStore((s) => s.motivoBloqueio);
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const ultimoUsuarioId = useSessionStore((s) => s.ultimoUsuarioId);
  const candidatoId = useSessionStore((s) => s.candidatoId);
  const contexto = useSessionStore((s) => s.contexto);
  const cancelarTroca = useSessionStore((s) => s.cancelarTroca);
  const sair = useSessionStore((s) => s.sair);
  const agora = useAgora();

  const pessoaAtual = usuarioId ? localRepository.usuario(usuarioId) : undefined;
  const ultimo = localRepository.usuario(ultimoUsuarioId ?? usuarioId ?? "");
  const candidato = motivo === "troca" && candidatoId ? localRepository.usuario(candidatoId) : undefined;
  // Na troca, a pessoa escolhida no menu; nos outros casos, quem estava usando o tablet.
  const sugerida = candidato ?? ultimo;
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};
  const { Icone, titulo, detalhe } = textoDoMotivo(motivo, turnoAtual(agora).numero, pessoaAtual, candidato);

  useLayoutEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    // Os avisos com "Desfazer" da pessoa anterior já saíram no bloqueio (useAvisosSoDaPessoaAtual, plataforma.tsx).
    // Antes da pintura: o conteúdo de baixo não aparece nem por um quadro.
    if (!dialogo.open) dialogo.showModal();
    focarPin(dialogo);
    // Um menu que fecha junto (ex.: "Trocar pessoa") devolve o foco ao gatilho depois deste efeito. O gatilho está
    // inerte, mas se o foco escapar mesmo assim, ele volta para o PIN.
    const timer = window.setTimeout(() => {
      if (!dialogo.contains(document.activeElement)) focarPin(dialogo);
    }, 0);
    // Esc não fecha (cancel impedido abaixo), mas o Chrome fecha no segundo Esc seguido sem outro toque: enquanto o
    // tablet estiver bloqueado, a tela reabre na hora.
    const reabrir = () => {
      if (!dialogo.open) dialogo.showModal();
      focarPin(dialogo);
    };
    // Nada dentro da tela usa onPointerDown do React (que também escuta no document): só onClick e teclado.
    const pararNoDialogo = (evento: PointerEvent) => evento.stopPropagation();
    // O Radix só fecha no Esc se o evento não chegou já tratado (defaultPrevented); a janela, na captura, vem antes.
    const segurarEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") evento.preventDefault();
    };
    dialogo.addEventListener("close", reabrir);
    dialogo.addEventListener("pointerdown", pararNoDialogo);
    window.addEventListener("keydown", segurarEsc, true);
    return () => {
      window.clearTimeout(timer);
      dialogo.removeEventListener("close", reabrir);
      dialogo.removeEventListener("pointerdown", pararNoDialogo);
      window.removeEventListener("keydown", segurarEsc, true);
      if (dialogo.open) dialogo.close();
    };
  }, []);

  // Os avisos saem com a pessoa (plataforma.tsx), antes de o login abrir.
  const sairDoPosto = () => {
    sair();
    router.replace("/auth/login");
  };

  // Só existe no navegador (LockScreen espera a sessão carregar), então o document já está lá.
  return createPortal(
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      aria-describedby={idMotivo}
      aria-modal="true"
      onCancel={(evento) => evento.preventDefault()}
      // pointer-events-auto: um Dialog/Sheet do Radix aberto por baixo deixa o body com pointer-events: none.
      className="pointer-events-auto fixed inset-0 z-50 m-0 size-full max-h-none max-w-none overflow-y-auto overscroll-contain border-0 bg-background p-0 text-foreground backdrop:bg-background"
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-8 px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10">
        <header className="flex flex-col items-center gap-2 text-center">
          {linha && posto && (
            <p className="text-muted-foreground text-sm toque:text-base">
              {linha.nome} · {posto.nome}
            </p>
          )}
          <h1 id={idTitulo} className="font-medium text-3xl">
            Quem está no posto?
          </h1>
          <div id={idMotivo} className="flex flex-col items-center gap-1">
            <p className="flex items-center gap-2 font-medium text-base">
              <Icone aria-hidden="true" className="size-4 text-muted-foreground" />
              {titulo}
            </p>
            {detalhe && <p className="text-muted-foreground text-sm toque:text-base">{detalhe}</p>}
          </div>
        </header>

        {/* key: se o motivo ou a pessoa sugerida mudar com a tela aberta (ex.: a troca virou inatividade), o PIN pela
            metade e os erros recomeçam. */}
        <Identificacao
          key={`${motivo ?? ""}:${sugerida?.id ?? ""}`}
          sugerida={sugerida}
          candidato={candidato}
          pessoaAtualId={usuarioId}
        />

        <footer className="mt-auto flex flex-wrap items-center justify-center gap-3">
          {/* Só na troca pedida pelo menu, com outra pessoa escolhida: quem pediu volta sem PIN. No bloqueio explícito
              ("Bloquear tablet") e nos automáticos, nunca: aí o PIN é obrigatório. */}
          {candidato && pessoaAtual && (
            <Button variant="outline" onClick={cancelarTroca}>
              Voltar para {primeiroNome(pessoaAtual.nome)}
            </Button>
          )}
          <Button variant="ghost" onClick={sairDoPosto}>
            <LogOut aria-hidden="true" />
            Sair do posto
          </Button>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}

function Identificacao({
  sugerida,
  candidato,
  pessoaAtualId,
}: {
  readonly sugerida: Usuario | undefined;
  readonly candidato: Usuario | undefined;
  readonly pessoaAtualId: string | null;
}) {
  const entrarComPin = useSessionStore((s) => s.entrarComPin);
  const idSugerida = useId();
  const idOutra = useId();
  const idMatricula = useId();
  const idErroMatricula = useId();
  const pinPadRef = useRef<HTMLFieldSetElement>(null);
  const matriculaRef = useRef<HTMLInputElement>(null);
  const [modo, setModo] = useState<Modo>(sugerida ? "sugerida" : "outra");
  const [matricula, setMatricula] = useState("");
  const [pin, setPin] = useState("");
  const [erroMatricula, setErroMatricula] = useState<string>();
  const [erroPin, setErroPin] = useState<string>();

  const outra = modo === "outra";
  const matriculaCompleta = matricula.length === TAMANHO_MATRICULA;
  // Muitos PINs errados para a pessoa escolhida: o PIN pad espera, com a hora de liberar à vista (V03-SEC-02).
  let pessoaDoPin = sugerida;
  if (outra) pessoaDoPin = matriculaCompleta ? localRepository.usuarioPorMatricula(matricula) : undefined;
  const espera = useEsperaDoPin(pessoaDoPin?.id);
  const esperando = espera !== null;
  const esperavaAntes = useRef(esperando);
  // Ao liberar, o foco volta ao PIN: o fieldset desabilitado tinha tirado o foco dele.
  useEffect(() => {
    if (esperavaAntes.current && !esperando) pinPadRef.current?.focus();
    esperavaAntes.current = esperando;
  }, [esperando]);

  // Ao montar de novo com a tela já aberta (key mudou), o foco volta ao PIN. Na primeira montagem quem foca é o
  // diálogo (este efeito roda depois do showModal, então também funciona).
  useEffect(() => {
    pinPadRef.current?.focus();
  }, []);

  function escolherModo(valor: string) {
    if (valor !== "sugerida" && valor !== "outra") return;
    // "Outra pessoa": o próximo passo obrigatório é a matrícula. flushSync monta o campo ainda dentro do toque, e o
    // foco nele no mesmo gesto deixa o iPad abrir o teclado (fora do gesto do usuário o iOS não abre).
    flushSync(() => {
      setModo(valor);
      setPin("");
      setErroPin(undefined);
      setErroMatricula(undefined);
    });
    if (valor === "outra") matriculaRef.current?.focus();
  }

  function errarMatricula(mensagem: string) {
    setPin("");
    setErroMatricula(mensagem);
    matriculaRef.current?.focus();
  }

  function aoCompletarPin(pinDigitado: string) {
    let pessoa = sugerida;
    if (outra) {
      if (!matriculaCompleta) {
        errarMatricula("Digite os 6 números da matrícula.");
        return;
      }
      pessoa = localRepository.usuarioPorMatricula(matricula);
      if (!pessoa) {
        errarMatricula("Matrícula não encontrada. Confira o crachá.");
        return;
      }
    }
    if (!pessoa) return;

    const resultado = entrarComPin(pessoa.id, pinDigitado);
    if (!resultado.ok) {
      if (resultado.campo === "pin") {
        setPin("");
        // Bloqueado por tentativas: a mensagem vem de useEsperaDoPin e some sozinha quando libera.
        setErroPin(resultado.bloqueadoAte ? undefined : resultado.erro);
      } else {
        errarMatricula(resultado.erro);
      }
      return;
    }
    // Desbloqueou: a tela sai sozinha (bloqueado = false). Aviso só quando a pessoa mudou.
    if (resultado.usuario.id !== pessoaAtualId) {
      toast(`Agora com ${primeiroNome(resultado.usuario.nome)}`, { description: resultado.usuario.cargo });
    }
  }

  return (
    <div className="grid flex-1 content-center items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 lg:mx-0 lg:max-w-none">
        <RadioGroup value={modo} onValueChange={escolherModo} aria-label="Quem vai usar o tablet" className="gap-3">
          {sugerida && (
            <FieldLabel htmlFor={idSugerida} className={CARTAO}>
              <Field orientation="horizontal">
                <Avatar className="size-10">
                  <AvatarFallback>{getInitials(sugerida.nome)}</AvatarFallback>
                </Avatar>
                <FieldContent>
                  <FieldTitle className="toque:text-base">
                    {candidato ? `Entrar como ${sugerida.nome}` : `Continuar como ${sugerida.nome}`}
                  </FieldTitle>
                  <FieldDescription>{sugerida.cargo} · só o PIN</FieldDescription>
                </FieldContent>
                <RadioGroupItem value="sugerida" id={idSugerida} />
              </Field>
            </FieldLabel>
          )}
          <FieldLabel htmlFor={idOutra} className={CARTAO}>
            <Field orientation="horizontal">
              <Avatar className="size-10">
                <AvatarFallback>
                  <UserRound aria-hidden="true" className="size-5" />
                </AvatarFallback>
              </Avatar>
              <FieldContent>
                <FieldTitle className="toque:text-base">Outra pessoa</FieldTitle>
                <FieldDescription>Matrícula do crachá e PIN</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="outra" id={idOutra} />
            </Field>
          </FieldLabel>
        </RadioGroup>

        {outra && (
          <Field className="gap-1.5" data-invalid={Boolean(erroMatricula)}>
            <FieldLabel htmlFor={idMatricula}>Matrícula</FieldLabel>
            <Input
              ref={matriculaRef}
              id={idMatricula}
              value={matricula}
              // Aparelho compartilhado: sem sugestões de outra pessoa.
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="numeric"
              enterKeyHint="next"
              placeholder="6 números do crachá"
              maxLength={TAMANHO_MATRICULA}
              aria-invalid={Boolean(erroMatricula)}
              aria-describedby={erroMatricula ? idErroMatricula : undefined}
              onChange={(evento) => {
                const proxima = apenasDigitos(evento.target.value, TAMANHO_MATRICULA);
                const completou = proxima.length === TAMANHO_MATRICULA && matricula.length < TAMANHO_MATRICULA;
                setMatricula(proxima);
                setErroMatricula(undefined);
                // 6 números: o foco vai para o PIN e o teclado do sistema fecha.
                if (completou) pinPadRef.current?.focus();
              }}
              onKeyDown={(evento) => {
                if (evento.key !== "Enter") return;
                evento.preventDefault();
                pinPadRef.current?.focus();
              }}
            />
            {erroMatricula && <FieldError id={idErroMatricula}>{erroMatricula}</FieldError>}
          </Field>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm lg:mx-0">
        <PinPad
          ref={pinPadRef}
          id={ID_DO_PIN}
          rotulo={!outra && sugerida ? `PIN de ${primeiroNome(sugerida.nome)}` : "PIN"}
          valor={pin}
          onValorChange={(valor) => {
            setPin(valor);
            setErroPin(undefined);
          }}
          onComplete={aoCompletarPin}
          tamanho={TAMANHO_PIN}
          erro={espera ?? erroPin}
          desabilitado={esperando}
          // Teclado físico (notebook da liderança): os números vão para o PIN, salvo enquanto se digita a matrícula.
          capturarTeclado={!outra || matriculaCompleta}
        />
      </div>
    </div>
  );
}
