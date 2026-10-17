"use client";

import * as React from "react";

import { cn } from "cn";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Send } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { descreverResposta, resumirRespostas, situacaoItem, validarRespostas } from "@/domain/formulario-engine";
import type { Formulario, Registro, Resposta, TarefaInstancia } from "@/domain/types";
import { useDeslocamentoDoTeclado } from "@/hooks/use-visual-viewport";
import { PRESSAO } from "@/lib/pressao";
import { JANELA_DESFAZER_MS } from "@/stores/session/session-store";

import { ChecklistItems } from "./checklist-items";
import { ChecklistNotes } from "./checklist-notes";
import { ChecklistPreview } from "./checklist-preview";
import { type ChecklistFormValues, rolagem } from "./data";
import { useAvisosDaTela } from "./use-avisos-da-tela";

export const ETAPA_REVISAR = "revisar";

export interface Etapa {
  value: string;
  titulo: string;
  itens: Formulario["itens"];
}

function slug(grupo: string) {
  return grupo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function etapasDoFormulario(formulario: Formulario): Etapa[] {
  const grupos = [...new Set(formulario.itens.map((item) => item.grupo))];
  return grupos.map((grupo) => ({
    value: slug(grupo),
    titulo: grupo,
    itens: formulario.itens.filter((item) => item.grupo === grupo),
  }));
}

/** Etapas do formulário mais a revisão no fim, na ordem do stepper. */
export function etapasComRevisao(formulario: Formulario): Etapa[] {
  return [...etapasDoFormulario(formulario), { value: ETAPA_REVISAR, titulo: "Revisar", itens: formulario.itens }];
}

// [tabindex="0"]: o grupo C/NC/NA sem resposta (foco itinerante do Radix), que repassa o foco ao primeiro botão.
const CONTROLE_FOCAVEL =
  'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), [tabindex="0"]';

/**
 * Leva a pessoa ao item com pendência: rola até ele (acima da barra fixa, pelo scroll-margin do cartão) e põe o foco no
 * campo com erro, ou no primeiro controle (docs/12 §2 item 12). Chamar depois do render que mostra o erro.
 */
export function irParaItem(itemId: string) {
  const item = document.getElementById(`item-${itemId}`);
  if (!item) return;
  const campo =
    item.querySelector<HTMLElement>('input[aria-invalid="true"]:not(:disabled)') ??
    item.querySelector<HTMLElement>(CONTROLE_FOCAVEL);
  campo?.focus({ preventScroll: true });
  item.scrollIntoView({ behavior: rolagem(), block: "center" });
}

/**
 * Checklist em etapas (padrão de steppers do UI Audit): um grupo por vez, revisão no fim e uma barra fixa com a próxima
 * ação sempre ao alcance do polegar (modo foco, docs/12 §3.2 e §3.4).
 *
 * Lista de etapas só com 720 px ou mais de área útil (container `foco`) e altura de 600 px ou mais (pouca-altura:,
 * paisagem com o teclado do Android aberto); fora disso ela some e quem indica a etapa é o cabeçalho ("Etapa X de Y ·
 * Nome"), em vez de uma lista que rolava escondida e só se alcançava por arrasto. As etapas continuam no DOM para os
 * painéis manterem o nome acessível (aria-labelledby).
 */
export function ChecklistStepper({
  formulario,
  tarefa,
  registro,
  somenteLeitura,
  etapa,
  onEtapaChange,
  tentadas,
  onTentar,
}: {
  formulario: Formulario;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  somenteLeitura: boolean;
  etapa: string;
  onEtapaChange: (etapa: string) => void;
  /** Etapas em que a pessoa já tentou avançar: os erros aparecem junto dos itens. */
  tentadas: ReadonlySet<string>;
  onTentar: (etapa: string) => void;
}) {
  const { getValues, setValue } = useFormContext<ChecklistFormValues>();
  const valores = useWatch<ChecklistFormValues>() as ChecklistFormValues;
  const respostas = valores.respostas ?? {};
  const { avisar, dispensar } = useAvisosDaTela();
  const raizRef = React.useRef<HTMLDivElement>(null);
  const etapas = etapasDoFormulario(formulario);
  const todas = etapasComRevisao(formulario);
  const numeros = Object.fromEntries(formulario.itens.map((item, index) => [item.id, index + 1]));
  const resumo = resumirRespostas(formulario, respostas);
  const atual = etapas.find((e) => e.value === etapa);
  const indice = todas.findIndex((e) => e.value === etapa);
  const anterior = todas[indice - 1];
  const proxima = todas[indice + 1];

  const errosDa = (itens: Formulario["itens"]) => validarRespostas({ ...formulario, itens }, respostas);

  const onValidate: NonNullable<StepperProps["onValidate"]> = (_value, direction) => {
    if (somenteLeitura || direction === "prev" || !atual) return true;
    const pendentes = Object.keys(errosDa(atual.itens));
    if (pendentes.length === 0) return true;
    onTentar(atual.value);
    toast.info(pendentes.length === 1 ? "Falta 1 item nesta etapa" : `Faltam ${pendentes.length} itens nesta etapa`);
    const primeiro = pendentes[0];
    if (primeiro) requestAnimationFrame(() => irParaItem(primeiro));
    return false;
  };

  /** Toda troca de etapa (barra ou lista de etapas) tira os avisos desta tela: ver `useAvisosDaTela`. */
  function trocarEtapa(valor: string) {
    dispensar();
    onEtapaChange(valor);
  }

  /** Troca de etapa pela barra: a etapa nova começa do primeiro item, então volta ao topo se ele saiu da tela. */
  function irPara(valor: string | undefined) {
    if (!valor) return;
    trocarEtapa(valor);
    requestAnimationFrame(() => {
      const raiz = raizRef.current;
      // 96 px: abaixo do header do dashboard, que pode ser fixo (64 px no toque).
      if (raiz && raiz.getBoundingClientRect().top < 96) raiz.scrollIntoView({ behavior: rolagem(), block: "start" });
    });
  }

  // Só em etapa com itens C/NC: numa etapa só de centerline ou de lote o botão ficaria sempre desabilitado.
  const temItensCnc = (atual?.itens ?? []).some((item) => item.tipo === "cnc");
  const restantes = (atual?.itens ?? []).filter(
    (item) => item.tipo === "cnc" && situacaoItem(item, respostas[item.id]) === "pendente",
  );

  /** C nos itens sem resposta da etapa, com "Desfazer" (10 s) no lugar de um diálogo de confirmação. */
  function marcarRestantesConformes() {
    const ids = restantes.map((item) => item.id);
    if (ids.length === 0) return;
    const antes = getValues("respostas") ?? {};
    const anteriores = new Map<string, Resposta | undefined>(ids.map((id) => [id, structuredClone(antes[id])]));
    const depois = { ...antes };
    for (const id of ids) depois[id] = { ...antes[id], valor: "C" };
    setValue("respostas", depois, { shouldDirty: true });

    avisar(
      toast.success(ids.length === 1 ? "1 item marcado como conforme" : `${ids.length} itens marcados como conformes`, {
        description: atual?.titulo,
        duration: JANELA_DESFAZER_MS,
        action: {
          label: "Desfazer",
          onClick: () => {
            const agora = { ...(getValues("respostas") ?? {}) };
            for (const [id, resposta] of anteriores) {
              // Só volta o que ainda está como a ação deixou: um item que a pessoa mudou depois fica como ela deixou.
              if (agora[id]?.valor !== "C") continue;
              if (resposta === undefined) delete agora[id];
              else agora[id] = resposta;
            }
            setValue("respostas", agora, { shouldDirty: true });
          },
        },
      }),
    );
  }

  return (
    <Stepper
      ref={raizRef}
      value={etapa}
      onValueChange={trocarEtapa}
      onValidate={onValidate}
      // flex-1: com etapa curta, a barra de ações (mt-auto) desce até o rodapé em vez de ficar no meio da tela.
      className="flex flex-1 scroll-mt-24 flex-col gap-5 pouca-altura:gap-3"
    >
      <StepperList className="@max-[45rem]/foco:hidden pouca-altura:hidden">
        {todas.map((e, posicao) => {
          const ehRevisar = e.value === ETAPA_REVISAR;
          const respondidos = e.itens.filter((item) => situacaoItem(item, respostas[item.id]) !== "pendente").length;
          const completa = !ehRevisar && Object.keys(errosDa(e.itens)).length === 0;
          return (
            // Sem `completed`: o StepperItem do template remove e recoloca o passo no fim da lista interna quando esse
            // valor muda, e as etapas depois da ativa passavam a aparecer como concluídas (0/2 com ✓). O ✓ e a cor
            // vêm de `completa`; o data-state "completed" que o template dá às etapas antes da ativa fica neutro
            // quando a etapa não está completa.
            <StepperItem key={e.value} value={e.value} className="min-w-0">
              {/* 44 px no notebook (v0.2); 56 px no toque. A camada de densidade não cobre o stepper-trigger, então o
                  piso vem daqui (toque:, que acompanha o override data-density). */}
              <StepperTrigger className="min-h-11 toque:min-h-14 min-w-0">
                <StepperIndicator
                  className={
                    completa
                      ? "border-primary bg-primary text-primary-foreground"
                      : "data-[state=completed]:border-muted data-[state=completed]:bg-background data-[state=completed]:text-muted-foreground"
                  }
                >
                  {completa ? <Check className="size-3.5" aria-hidden /> : posicao + 1}
                </StepperIndicator>
                <div className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                  {/* max-w-full: no flex-col items-start o título teria a largura do texto e escreveria por cima da
                      etapa ao lado; o nome inteiro está no cabeçalho ("Etapa X de Y · Nome"). */}
                  <StepperTitle className="max-w-full truncate">{e.titulo}</StepperTitle>
                  <StepperDescription className="text-sm tabular-nums">
                    {ehRevisar ? `${resumo.respondidos}/${resumo.total} itens` : `${respondidos}/${e.itens.length}`}
                  </StepperDescription>
                </div>
              </StepperTrigger>
              {posicao < todas.length - 1 && <StepperSeparator className="mx-3 min-w-6" />}
            </StepperItem>
          );
        })}
      </StepperList>

      <fieldset disabled={somenteLeitura} className="min-w-0">
        {etapas.map((e) => (
          <StepperContent key={e.value} value={e.value}>
            <ChecklistItems itens={e.itens} numeros={numeros} erros={tentadas.has(e.value) ? errosDa(e.itens) : {}} />
          </StepperContent>
        ))}
      </fieldset>
      <StepperContent value={ETAPA_REVISAR} className="flex flex-col gap-5">
        <ResumoDaRevisao formulario={formulario} valores={valores} somenteLeitura={somenteLeitura} />
        {/* Consulta sem registro (sem tarefa, tarefa concluída antes do registro detalhado, liderança): não há
            observação a escrever nem documento a mostrar. */}
        {(!somenteLeitura || registro) && (
          <>
            <fieldset disabled={somenteLeitura} className="min-w-0">
              <ChecklistNotes />
            </fieldset>
            <ChecklistPreview
              formulario={formulario}
              valores={valores}
              tarefa={tarefa}
              registro={registro}
              aoAbrir={dispensar}
            />
          </>
        )}
      </StepperContent>

      <BarraDeAcoes>
        {/* "Anterior" (e não "Voltar"): "Voltar" é sair do checklist, no cabeçalho. Abaixo de 544 px de área útil, só a
            seta, com o nome mantido para leitor de tela. */}
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-14 @max-[34rem]/foco:px-0"
          disabled={!anterior}
          onClick={() => irPara(anterior?.value)}
        >
          <ArrowLeft data-icon="inline-start" />
          <span className="@max-[34rem]/foco:sr-only">Anterior</span>
        </Button>
        <p className="@min-[45rem]/foco:block hidden min-w-0 flex-1 truncate text-muted-foreground text-sm tabular-nums">
          {resumo.respondidos} de {resumo.total} respondidos
          {resumo.naoConformes > 0 && ` · ${resumo.naoConformes} não conforme${resumo.naoConformes > 1 ? "s" : ""}`}
        </p>
        <div className="ml-auto flex items-center gap-3">
          {!somenteLeitura && etapa !== ETAPA_REVISAR && temItensCnc && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={marcarRestantesConformes}
              disabled={restantes.length === 0}
            >
              <CheckCheck data-icon="inline-start" />
              Restantes conformes
            </Button>
          )}
          {/* key própria em cada botão: Registrar (submit) e Próximo (button) ocupam o mesmo lugar na árvore. Sem a
              key o React reaproveita o mesmo <button> e troca o type para submit dentro do clique em Próximo, e o
              navegador termina esse clique enviando o formulário: Centerline → Próximo registrava sem passar pela
              revisão. */}
          {etapa === ETAPA_REVISAR ? (
            !somenteLeitura && (
              <Button
                key="registrar"
                type="submit"
                className={cn("h-11 toque:h-16 px-5 toque:px-6 toque:text-base", PRESSAO)}
              >
                <Send data-icon="inline-start" />
                Registrar
              </Button>
            )
          ) : (
            <Button
              key="proximo"
              type="button"
              className={cn("h-11 toque:h-16 px-5 toque:px-6 toque:text-base", PRESSAO)}
              onClick={(event) => {
                // Reforço: este clique nunca envia o formulário, mesmo que o elemento mude no meio dele.
                event.preventDefault();
                if (onValidate(etapa, "next") === true) irPara(proxima?.value);
              }}
            >
              Próximo
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </BarraDeAcoes>
    </Stepper>
  );
}

/**
 * Barra fixa do checklist: progresso e próxima ação sempre à vista (UI Audit, prioridade 1).
 *
 * - Opaca e sem blur no toque (data-touch-bar, src/styles/tablet.css).
 * - Acima do indicador de início do iPad no app instalado (safe area, com viewport-fit=cover).
 * - Acima do teclado: no Android o viewport encolhe sozinho (interactive-widget=resizes-content); no iPad a barra sobe o
 *   que o teclado cobre (`useDeslocamentoDoTeclado`, visualViewport). Quando o teclado abre, ou o foco muda com ele
 *   aberto, o campo em foco que ficou sob a barra rola para cima dela.
 * - Alturas: 44 px no notebook (v0.2); no toque a camada leva Anterior e Restantes conformes a 56 px e a ação primária
 *   vai a 64 px por toque:h-16 (docs/12 §2 item 1). 12 px entre os botões (gap-3).
 */
function BarraDeAcoes({ children }: { children: React.ReactNode }) {
  const teclado = useDeslocamentoDoTeclado();
  const tecladoAberto = teclado > 0;
  const barraRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const barra = barraRef.current;
    const area = barra?.closest<HTMLElement>("[data-checklist-foco]");
    if (!tecladoAberto || !barra || !area) return;
    let quadro = 0;
    const manterCampoVisivel = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const campo = document.activeElement;
        // Só campos de digitação, os que abrem o teclado; um botão tocado durante a animação do teclado não rola nada.
        if (!(campo instanceof HTMLElement) || !campo.matches("input, textarea")) return;
        if (!area.contains(campo) || barra.contains(campo)) return;
        const sobra = campo.getBoundingClientRect().bottom - (barra.getBoundingClientRect().top - 12);
        if (sobra > 0) window.scrollBy({ top: sobra });
      });
    };
    manterCampoVisivel();
    area.addEventListener("focusin", manterCampoVisivel);
    return () => {
      cancelAnimationFrame(quadro);
      area.removeEventListener("focusin", manterCampoVisivel);
    };
  }, [tecladoAberto]);

  // Foco por Tab (WCAG 2.4.11): o navegador rola o controle focado para dentro da área visível descontando o
  // scroll-padding da janela. Com ele do tamanho da barra (mais os 12 px da borda e 12 de respiro, e o teclado no iPad),
  // nenhum controle recebe foco escondido sob a barra fixa. O scroll-mb dos cartões vale só para a rolagem até eles.
  React.useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return;
    const raiz = document.documentElement;
    const aplicar = () => {
      raiz.style.scrollPaddingBottom = `${barra.offsetHeight + 24 + teclado}px`;
    };
    aplicar();
    const observador = new ResizeObserver(aplicar);
    observador.observe(barra);
    return () => {
      observador.disconnect();
      raiz.style.scrollPaddingBottom = "";
    };
  }, [teclado]);

  return (
    <div
      ref={barraRef}
      data-touch-bar="true"
      style={{ "--teclado": `${teclado}px` } as React.CSSProperties}
      // mt-auto: com etapa curta, a barra fica no rodapé da área do modo foco (que ocupa a altura da tela).
      className="sticky bottom-[calc(var(--teclado,0px)+max(--spacing(3),env(safe-area-inset-bottom)))] z-10 mt-auto flex items-center gap-3 rounded-2xl bg-card/85 p-3 shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl backdrop-saturate-150 pointer-coarse:bg-card"
    >
      {children}
    </div>
  );
}

function ResumoDaRevisao({
  formulario,
  valores,
  somenteLeitura,
}: {
  formulario: Formulario;
  valores: ChecklistFormValues;
  somenteLeitura: boolean;
}) {
  const respostas = valores.respostas ?? {};
  const resumo = resumirRespostas(formulario, respostas);
  const ncs = formulario.itens.filter((item) => situacaoItem(item, respostas[item.id]) === "NC");
  const faltam = resumo.total - resumo.respondidos;

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="font-medium tracking-tight">Resumo</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { rotulo: "Conformes", valor: resumo.conformes },
          { rotulo: "Não conformes", valor: resumo.naoConformes },
          { rotulo: "Não se aplica", valor: resumo.naoAplicaveis },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-lg bg-muted/50 p-3">
            <div className="text-2xl tabular-nums tracking-tight">{c.valor}</div>
            <div className="text-muted-foreground text-sm">{c.rotulo}</div>
          </div>
        ))}
      </div>
      {/* wrap-anywhere: uma justificativa colada sem espaços (código, lote) quebra dentro do cartão em vez de vazar. */}
      {ncs.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {ncs.map((item) => (
            <li key={item.id} className="wrap-anywhere text-destructive">
              {item.texto}
              {/* Centerline: o valor digitado e o padrão, para conferir um erro de digitação antes de registrar. */}
              {item.tipo === "numero" && item.faixa && (
                <span className="tabular-nums">
                  {" "}
                  · {descreverResposta(item, respostas[item.id])}, padrão {item.faixa.min.toLocaleString("pt-BR")}–
                  {item.faixa.max.toLocaleString("pt-BR")} {item.faixa.unidade}
                </span>
              )}
              {respostas[item.id]?.justificativa && (
                <span className="text-muted-foreground"> · {respostas[item.id]?.justificativa}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Só quem pode preencher volta às etapas; em consulta os campos estão desabilitados. */}
      {faltam > 0 && !somenteLeitura && (
        <p className="text-muted-foreground text-sm">
          {faltam === 1 ? "Falta 1 item." : `Faltam ${faltam} itens.`} Volte às etapas anteriores para completar.
        </p>
      )}
    </section>
  );
}
