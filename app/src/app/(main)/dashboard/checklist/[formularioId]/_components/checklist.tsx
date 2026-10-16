"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import { CircleCheck, Clock, Hash, Info, TriangleAlert, Wrench } from "lucide-react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { equipamentos } from "@/data/seed";
import { validarRespostas } from "@/domain/formulario-engine";
import type { Equipamento, Formulario, Registro, SyncStatus, TarefaInstancia } from "@/domain/types";
import { useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import {
  gravarSessaoAgora,
  JANELA_DESFAZER_MS,
  type RascunhoSalvo,
  useSessionStore,
  useUsuarioAtual,
} from "@/stores/session/session-store";

import { AvisoDeRascunho } from "./aviso-de-rascunho";
import { CabecalhoDoFoco } from "./cabecalho-do-foco";
import { ChecklistStepper, ETAPA_REVISAR, etapasComRevisao, irParaItem } from "./checklist-form";
import { type ChecklistFormValues, RASCUNHO_VAZIO } from "./data";
import { RegistrarDesvio } from "./registrar-desvio";
import { useModoFoco } from "./use-modo-foco";

export type ModoChecklist = "preencher" | "registrado" | "consulta";

/** Espera depois da última mudança para gravar o rascunho (docs/12 §3.6): uma gravação por pausa, não por tecla. */
const ESPERA_RASCUNHO_MS = 400;

/** Toggle até 4 equipamentos (escolha grande, à vista); acima disso, a lista do Select. */
const MAX_EQUIPAMENTOS_NO_TOGGLE = 4;

/** Badges de metadados no texto de 14 px das telas do operador (o Badge do template é text-xs). */
const META = "h-auto gap-1 py-1 font-normal text-sm";

export function Checklist({ formularioId }: { formularioId: string }) {
  const formulario = localRepository.formulario(formularioId);
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const tarefas = useTarefas(contexto?.postoId, "operacao");
  const doFormulario = tarefas.filter((t) => t.formularioId === formularioId);
  const tarefa = doFormulario.find((t) => !t.futura) ?? doFormulario[0];
  const registros = useSessionStore((s) => s.registros);
  const registro = tarefa ? Object.values(registros).find((r) => r.tarefaId === tarefa.id) : undefined;
  // Descartar o rascunho (e desfazer o descarte) recomeça o formulário com o que estiver no tablet.
  const [geracao, setGeracao] = React.useState(0);

  let modo: ModoChecklist = "consulta";
  if (registro) modo = "registrado";
  // Tarefa já concluída (mesmo sem registro detalhado) não reabre para preencher.
  else if (tarefa && !tarefa.futura && !tarefa.concluidaEm && usuario?.perfil === "operacao") modo = "preencher";

  // Aqui, e não no editor: recomeçar o formulário não abre e fecha a sidebar.
  useModoFoco(modo === "preencher");

  if (!formulario) return null;

  return (
    <ChecklistEditor
      // Recria o formulário quando a tarefa ou o registro mudam (troca de turno, relógio da demo, registro desfeito).
      key={`${tarefa?.id ?? "sem-tarefa"}:${registro?.id ?? "aberto"}:${geracao}`}
      formulario={formulario}
      tarefa={tarefa}
      registro={registro}
      modo={modo}
      recomecar={() => setGeracao((g) => g + 1)}
    />
  );
}

function valoresIniciais(
  registro: Registro | undefined,
  rascunho: RascunhoSalvo | undefined,
  tarefa: TarefaInstancia | undefined,
): ChecklistFormValues {
  if (registro) {
    return {
      respostas: registro.respostas,
      equipamentoId: registro.equipamentoId,
      observacao: registro.observacao ?? "",
    };
  }
  if (rascunho) {
    return { respostas: rascunho.respostas, equipamentoId: rascunho.equipamentoId, observacao: rascunho.observacao };
  }
  return { ...RASCUNHO_VAZIO, equipamentoId: tarefa?.equipamentoId };
}

/** Desfazer do "Descartar": o rascunho volta como estava, com quem começou e quando. */
function restaurarRascunho(tarefaId: string, rascunho: RascunhoSalvo) {
  useSessionStore.setState((s) => ({ rascunhos: { ...s.rascunhos, [tarefaId]: rascunho } }));
}

function ChecklistEditor({
  formulario,
  tarefa,
  registro,
  modo,
  recomecar,
}: {
  formulario: Formulario;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  modo: ModoChecklist;
  recomecar: () => void;
}) {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const salvarRascunho = useSessionStore((s) => s.salvarRascunho);
  const descartarRascunho = useSessionStore((s) => s.descartarRascunho);
  const assumirRascunho = useSessionStore((s) => s.assumirRascunho);
  const registrarChecklist = useSessionStore((s) => s.registrarChecklist);
  const desfazerRegistro = useSessionStore((s) => s.desfazerRegistro);
  const tarefaId = tarefa?.id;
  const rascunho = useSessionStore((s) => (tarefaId ? s.rascunhos[tarefaId] : undefined));
  const preencher = modo === "preencher";
  const etapas = etapasComRevisao(formulario);
  const [etapa, setEtapa] = React.useState(preencher ? (etapas[0]?.value ?? ETAPA_REVISAR) : ETAPA_REVISAR);
  const [tentadas, setTentadas] = React.useState<ReadonlySet<string>>(() => new Set());
  const doPosto = equipamentos.filter((e) => e.postoId === contexto?.postoId);
  const equipamento = registro?.equipamentoId ? localRepository.equipamento(registro.equipamentoId) : undefined;

  const form = useForm<ChecklistFormValues>({ defaultValues: valoresIniciais(registro, rascunho, tarefa) });

  // Rascunho salvo no tablet (RF-07) com espera de 400 ms: grava quando a pessoa para de mexer, ao sair da tela, ao
  // ocultar o app e antes de registrar. Nada se perde se a pessoa sair ou o tablet bloquear.
  const gravacao = React.useRef<{ gravarAgora: () => void; cancelar: () => void }>({
    gravarAgora: () => undefined,
    cancelar: () => undefined,
  });
  React.useEffect(() => {
    if (!preencher || !tarefaId) return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const cancelar = () => {
      clearTimeout(espera);
      espera = undefined;
    };
    const gravarAgora = () => {
      if (espera === undefined) return;
      cancelar();
      // Cópia: o react-hook-form altera os objetos do formulário no lugar; o store precisa de valores próprios.
      salvarRascunho(tarefaId, structuredClone(form.getValues()));
    };
    const aoOcultar = () => {
      if (document.visibilityState !== "hidden") return;
      gravarAgora();
      void gravarSessaoAgora();
    };
    gravacao.current = { gravarAgora, cancelar };
    const { unsubscribe } = form.watch(() => {
      clearTimeout(espera);
      espera = setTimeout(gravarAgora, ESPERA_RASCUNHO_MS);
    });
    document.addEventListener("visibilitychange", aoOcultar);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", aoOcultar);
      gravarAgora();
    };
  }, [form, preencher, tarefaId, salvarRascunho]);

  function enviar(values: ChecklistFormValues) {
    if (!preencher || !tarefa) return;

    const erros = validarRespostas(formulario, values.respostas);
    const pendentes = Object.keys(erros);
    if (pendentes.length > 0) {
      // Volta para a primeira etapa com pendência, com os erros à vista em todas as etapas incompletas.
      const comErro = etapas.filter((e) => e.value !== ETAPA_REVISAR && e.itens.some((item) => item.id in erros));
      setTentadas((antes) => new Set([...antes, ...comErro.map((e) => e.value)]));
      const primeira = comErro[0];
      if (primeira) setEtapa(primeira.value);
      toast.error(pendentes.length === 1 ? "Falta 1 item" : `Faltam ${pendentes.length} itens`, {
        description: "Complete as etapas marcadas antes de registrar.",
      });
      const primeiroItem = primeira?.itens.find((item) => item.id in erros)?.id;
      if (primeiroItem) requestAnimationFrame(() => irParaItem(primeiroItem));
      return;
    }

    gravacao.current.gravarAgora();
    const novo = registrarChecklist({ tarefa, formulario, rascunho: values });
    if (!novo) {
      toast.error("Não foi possível registrar", {
        description: "Confira se o tablet está desbloqueado e registre de novo. As respostas continuam salvas.",
      });
      return;
    }

    // Registro entra na fila só depois de 10 s: até lá, "Desfazer" devolve o checklist com as respostas.
    const formularioId = formulario.id;
    const opcoes = {
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          if (desfazerRegistro(novo.id)) {
            router.push(`/dashboard/checklist/${formularioId}`);
            toast.info("Registro desfeito", { description: "As respostas voltaram para o checklist." });
          } else {
            toast.info("Não dá mais para desfazer", { description: "O registro já entrou na fila de envio." });
          }
        },
      },
    };
    if (novo.naoConformes > 0) {
      toast.warning(
        `Registrado com ${novo.naoConformes} ${novo.naoConformes === 1 ? "não conformidade" : "não conformidades"}`,
        { description: "Alerta enviado à supervisão e à especialista.", ...opcoes },
      );
    } else {
      toast.success("Checklist registrado", { description: formulario.titulo, ...opcoes });
    }
    router.push("/dashboard/rotina");
  }

  function descartar() {
    if (!tarefaId || !rascunho) return;
    const anterior = rascunho;
    gravacao.current.cancelar();
    descartarRascunho(tarefaId);
    recomecar();
    toast("Rascunho descartado", {
      description: "O checklist recomeça do zero.",
      duration: JANELA_DESFAZER_MS,
      action: {
        label: "Desfazer",
        onClick: () => {
          restaurarRascunho(tarefaId, anterior);
          recomecar();
        },
      },
    });
  }

  const rascunhoDeOutraPessoa = preencher && rascunho && usuario && rascunho.iniciadoPor !== usuario.id;

  return (
    <FormProvider {...form}>
      {/* @container/foco: o modo foco se ajusta à área útil (sidebar aberta ou não, retrato, Split View). */}
      <div data-checklist-foco className="@container/foco flex flex-col gap-5">
        <CabecalhoDoFoco
          formulario={formulario}
          etapa={etapa}
          acao={preencher ? <RegistrarDesvio formulario={formulario} /> : undefined}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={META}>
                <Hash />
                {formulario.id} · versão {formulario.versao}
              </Badge>
              {tarefa && (
                <Badge variant="outline" className={cn(META, "tabular-nums")}>
                  <Clock />
                  {formatarHora(tarefa.abre)}–{formatarHora(tarefa.prazo)}
                </Badge>
              )}
              {!preencher && equipamento && (
                <Badge variant="outline" className={META}>
                  <Wrench />
                  {equipamento.nome}
                </Badge>
              )}
              {preencher && rascunho && (
                <Status variant="success" className="toque:text-sm">
                  <StatusIndicator className="before:hidden" />
                  <StatusLabel>Rascunho salvo no tablet</StatusLabel>
                </Status>
              )}
            </div>
          }
        />

        {rascunhoDeOutraPessoa && (
          <AvisoDeRascunho
            autor={localRepository.usuario(rascunho.iniciadoPor)?.nome ?? "outra pessoa"}
            iniciadoEm={rascunho.iniciadoEm}
            onContinuar={() => {
              if (tarefaId) assumirRascunho(tarefaId);
            }}
            onDescartar={descartar}
          />
        )}

        <AvisoDoModo modo={modo} tarefa={tarefa} registro={registro} perfilOperacao={usuario?.perfil === "operacao"} />

        {preencher && <CampoEquipamento opcoes={doPosto} />}

        <form id="checklist-form" noValidate onSubmit={form.handleSubmit(enviar)}>
          <ChecklistStepper
            formulario={formulario}
            tarefa={tarefa}
            registro={registro}
            somenteLeitura={!preencher}
            etapa={etapa}
            onEtapaChange={setEtapa}
            tentadas={tentadas}
            onTentar={(valor) => setTentadas((antes) => new Set(antes).add(valor))}
          />
        </form>
      </div>
    </FormProvider>
  );
}

/**
 * Equipamento como escolha grande (docs/12 §2 item 11): até 4, botões lado a lado de 56 px no toque, à vista, um toque
 * para trocar; o segundo toque não desmarca. Mais que isso, o Select do template em tamanho normal (56 px pela camada).
 * O selecionado usa os tokens do cartão de escolha do template (borda e fundo primary suaves).
 */
function CampoEquipamento({ opcoes }: { opcoes: Equipamento[] }) {
  const { control } = useFormContext<ChecklistFormValues>();
  const rotuloId = React.useId();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span id={rotuloId} className="font-medium text-sm">
        Equipamento
      </span>
      {opcoes.length === 0 ? (
        <span className="text-muted-foreground text-sm">Posto sem equipamentos cadastrados</span>
      ) : (
        <Controller
          control={control}
          name="equipamentoId"
          render={({ field }) =>
            opcoes.length <= MAX_EQUIPAMENTOS_NO_TOGGLE ? (
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={3}
                value={field.value ?? ""}
                onValueChange={(valor) => {
                  if (valor) field.onChange(valor);
                }}
                aria-labelledby={rotuloId}
                className="flex-wrap"
              >
                {opcoes.map((opcao) => (
                  <ToggleGroupItem
                    key={opcao.id}
                    value={opcao.id}
                    className="h-11 px-4 text-base data-[state=on]:border-primary/40 data-[state=on]:bg-primary/5 dark:data-[state=on]:bg-primary/10"
                  >
                    {opcao.nome}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 min-w-56 text-base" aria-labelledby={rotuloId}>
                  <SelectValue placeholder="Escolha o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {opcoes.map((opcao) => (
                      <SelectItem key={opcao.id} value={opcao.id}>
                        {opcao.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )
          }
        />
      )}
    </div>
  );
}

const ENVIO: Record<SyncStatus, string> = {
  pendente: "Salvo no tablet. Entra na fila de envio em alguns segundos.",
  local: "Salvo no tablet. Será enviado assim que houver rede.",
  enviando: "Salvo no tablet. Enviando ao servidor.",
  sincronizado: "Enviado ao servidor. O registro não pode ser editado; correções geram uma nova versão.",
  erro: "Salvo no tablet. O envio falhou; o tablet tenta de novo sozinho.",
};

function AvisoDoModo({
  modo,
  tarefa,
  registro,
  perfilOperacao,
}: {
  modo: ModoChecklist;
  tarefa: TarefaInstancia | undefined;
  registro: Registro | undefined;
  perfilOperacao: boolean;
}) {
  if (modo === "registrado" && registro) {
    const autor = localRepository.usuario(registro.usuarioId);
    return (
      <Alert>
        {registro.naoConformes > 0 ? <TriangleAlert /> : <CircleCheck />}
        <AlertTitle>
          Registrado às {formatarHora(new Date(registro.criadoEm))} por {autor?.nome}
          {registro.naoConformes > 0 &&
            ` · ${registro.naoConformes} não conforme${registro.naoConformes > 1 ? "s" : ""}`}
        </AlertTitle>
        <AlertDescription>{ENVIO[registro.syncStatus]}</AlertDescription>
      </Alert>
    );
  }

  if (modo === "consulta") {
    let texto = "Este checklist não tem tarefa no turno atual deste posto.";
    if (tarefa?.concluidaEm)
      texto = `Tarefa concluída às ${formatarHora(tarefa.concluidaEm)}, antes do registro detalhado.`;
    else if (tarefa?.futura) texto = `A janela deste checklist abre às ${formatarHora(tarefa.abre)}.`;
    else if (tarefa && !perfilOperacao) texto = "Visualização da liderança: o registro é feito pela operação do posto.";
    return (
      <Alert>
        <Info />
        <AlertTitle>Somente consulta</AlertTitle>
        <AlertDescription>{texto}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
