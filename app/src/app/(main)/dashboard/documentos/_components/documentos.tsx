"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { cn } from "cn";
import { ChevronLeft, ChevronRight, Cog, Factory, FileSearch, FolderOpen, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import type { DocumentoTecnico, TipoDocumento } from "@/domain/types";
import { useSessionStore } from "@/stores/session/session-store";

import { SoComPermissao } from "../../_components/so-com-permissao";
import { DetalheDoDocumento } from "./detalhe-do-documento";
import { confere, dataCurta, ICONE_DO_TIPO, ordenar, SIGLA, TIPOS } from "./tipos";

/** Filtro de equipamento: o posto do tablet (padrão), a fábrica toda ou um equipamento. */
type Equipamento = "posto" | "todos" | (string & {});
type FiltroTipo = "todos" | TipoDocumento;

/** IT, LPP e book de defeitos (RM-04, RM-14). */
export function Documentos() {
  return (
    <SoComPermissao recurso="documentos">
      <Conteudo />
    </SoComPermissao>
  );
}

/** Troca a query sem passar pelo servidor (funciona sem rede); o `useSearchParams` acompanha, como em Alertas. */
function trocarQuery(muda: (p: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  muda(params);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

/**
 * Composição do File Manager do template: título, pastas (aqui, os equipamentos do posto), barra de busca e filtro,
 * e a lista de arquivos; o documento abre ao lado (notebook, ≥ 60 rem de área útil) ou no lugar da lista (iPad, com
 * "Voltar para a lista"). O arranjo é escolhido pelo CSS (@container/content), sem medir em JS; a ordem do DOM é a
 * visual em todos os arranjos.
 *
 * Link direto: `?doc=<id>&equipamento=<id>` abre o documento com o filtro do equipamento, para Checklist, MTBF ou
 * Alertas levarem o operador direto à instrução certa.
 */
function Conteudo() {
  const params = useSearchParams();
  const docId = params.get("doc");
  const equipamento: Equipamento = params.get("equipamento") ?? "posto";
  const contexto = useSessionStore((s) => s.contexto);
  const [tipo, setTipo] = React.useState<FiltroTipo>("todos");
  const [busca, setBusca] = React.useState("");
  const detalhe = React.useRef<HTMLElement>(null);

  const posto = contexto ? localRepository.posto(contexto.postoId) : undefined;
  const doPosto = posto ? localRepository.equipamentos(posto.id) : [];
  const idsDoPosto = new Set(doPosto.map((e) => e.id));
  const todos = [...localRepository.documentos()].sort(ordenar);
  // O equipamento do link pode ser de outro posto: entra como pasta própria.
  const deFora = equipamento !== "posto" && equipamento !== "todos" && !idsDoPosto.has(equipamento);
  const pastas = deFora
    ? [...doPosto, ...[localRepository.equipamento(equipamento)].filter((e) => e !== undefined)]
    : doPosto;

  const doEquipamento = (doc: DocumentoTecnico, eq: Equipamento) => {
    if (eq === "todos") return true;
    if (eq === "posto") return doc.equipamentoIds.some((id) => idsDoPosto.has(id));
    return doc.equipamentoIds.includes(eq);
  };
  const noEquipamento = todos.filter((d) => doEquipamento(d, equipamento));
  const termo = busca.trim();
  const visiveis = noEquipamento.filter((d) => (tipo === "todos" || d.tipo === tipo) && confere(d, termo));
  const aberto = docId ? localRepository.documento(docId) : undefined;

  // Documento aberto com o topo acima da tela (no iPad ele toma o lugar da lista; no notebook, atalho de outro
  // documento citado no texto): rola até o título para começar a ler do começo.
  React.useEffect(() => {
    if (!aberto) return;
    const el = detalhe.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  }, [aberto]);

  function abrir(id: string) {
    trocarQuery((p) => p.set("doc", id));
  }
  function fechar() {
    trocarQuery((p) => p.delete("doc"));
  }
  function filtrarEquipamento(eq: Equipamento) {
    trocarQuery((p) => {
      if (eq === "posto") p.delete("equipamento");
      else p.set("equipamento", eq);
    });
  }

  // Abaixo de 60 rem, documento aberto esconde pastas, filtros e lista (o detalhe fica no lugar).
  const someNoIpad = aberto ? "hidden @min-[60rem]/content:flex" : "flex";

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="font-semibold text-muted-foreground text-sm toque:text-base">
          {posto ? `${localRepository.linha(posto.linhaId)?.nome} · ${posto.nome}` : "Fábrica"}
        </p>
        <h1 className="@min-[60rem]/content:text-[2.125rem] text-[2rem] text-foreground leading-[1.1]">Documentos</h1>
        <p className="text-pretty text-lg text-muted-foreground leading-snug">
          Instruções de trabalho, lições ponto a ponto e book de defeitos, na versão vigente do EQCMS (simulado).
        </p>
      </header>

      <section aria-labelledby="pastas" className={cn(someNoIpad, "flex-col gap-3")}>
        <h2 id="pastas" className="font-semibold text-lg">
          Equipamentos
        </h2>
        <div className="grid @min-[60rem]/content:grid-cols-5 @2xl/content:grid-cols-3 grid-cols-2 gap-3">
          <Pasta
            icone={FolderOpen}
            nome="Todo o posto"
            quantidade={todos.filter((d) => doEquipamento(d, "posto")).length}
            ativo={equipamento === "posto"}
            onClick={() => filtrarEquipamento("posto")}
          />
          {pastas.map((e) => (
            <Pasta
              key={e.id}
              icone={Cog}
              nome={e.nome}
              quantidade={todos.filter((d) => d.equipamentoIds.includes(e.id)).length}
              ativo={equipamento === e.id}
              onClick={() => filtrarEquipamento(e.id)}
            />
          ))}
          <Pasta
            icone={Factory}
            nome="Fábrica toda"
            quantidade={todos.length}
            ativo={equipamento === "todos"}
            onClick={() => filtrarEquipamento("todos")}
          />
        </div>
      </section>

      <div className="grid @min-[60rem]/content:grid-cols-12 items-start gap-6">
        <section
          aria-labelledby="lista-de-documentos"
          className={cn(someNoIpad, "@min-[60rem]/content:col-span-5 min-w-0 flex-col gap-3")}
        >
          <h2 id="lista-de-documentos" className="sr-only">
            Documentos do filtro
          </h2>
          <InputGroup className="toque:h-14">
            <InputGroupInput
              aria-label="Buscar documentos"
              placeholder="Buscar por título ou código…"
              enterKeyHint="search"
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={tipo}
            onValueChange={(v) => v && setTipo(v as FiltroTipo)}
            aria-label="Tipo de documento"
            className="grid w-full grid-cols-4"
          >
            {(["todos", ...TIPOS] as const).map((t) => (
              <ToggleGroupItem key={t} value={t} className="w-full tabular-nums toque:text-base">
                {t === "todos" ? "Todos" : SIGLA[t]} (
                {t === "todos" ? noEquipamento.length : noEquipamento.filter((d) => d.tipo === t).length})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Card className="gap-0 py-0">
            {visiveis.length === 0 ? (
              <Empty className="min-h-48 p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileSearch />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum documento</EmptyTitle>
                  <EmptyDescription>
                    {termo
                      ? "Nada com esse termo neste filtro. Tente outra palavra ou a fábrica toda."
                      : "Este equipamento ainda não tem documento desse tipo."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y divide-border/60">
                {visiveis.map((doc) => (
                  <li key={doc.id}>
                    <LinhaDoDocumento documento={doc} ativo={doc.id === aberto?.id} onClick={() => abrir(doc.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section
          ref={detalhe}
          aria-label="Documento aberto"
          className={cn(
            aberto ? "flex" : "hidden @min-[60rem]/content:flex",
            "@min-[60rem]/content:col-span-7 min-w-0 scroll-mt-[calc(var(--dashboard-header-height)+1rem)] flex-col gap-3",
          )}
        >
          {aberto && (
            <Button
              variant="ghost"
              className="@min-[60rem]/content:hidden -ml-2 h-11 toque:h-14 self-start text-base"
              onClick={fechar}
            >
              <ChevronLeft data-icon="inline-start" />
              Voltar para a lista
            </Button>
          )}
          {aberto ? (
            <DetalheDoDocumento key={aberto.id} documento={aberto} abrir={abrir} />
          ) : (
            <Card>
              <Empty className="min-h-80">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileSearch />
                  </EmptyMedia>
                  <EmptyTitle>Escolha um documento</EmptyTitle>
                  <EmptyDescription>A instrução ou o book abre aqui, ao lado da lista.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function Pasta({
  icone: Icone,
  nome,
  quantidade,
  ativo,
  onClick,
}: {
  readonly icone: typeof Cog;
  readonly nome: string;
  readonly quantidade: number;
  readonly ativo: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-xl bg-card p-3 text-left shadow-sm outline-none ring-1 ring-foreground/5 transition-colors",
        "hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted",
        ativo && "bg-primary/5 ring-2 ring-primary/50 hover:bg-primary/5",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
          ativo && "bg-primary/10 text-primary",
        )}
      >
        <Icone className="size-4.5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-sm toque:text-base">{nome}</span>
        <span className="text-muted-foreground text-sm tabular-nums">
          {quantidade} {quantidade === 1 ? "documento" : "documentos"}
        </span>
      </span>
    </button>
  );
}

/** Linha da lista (FileListView do template, em linha tocável de 64 px): ícone do tipo, título, código, versão e data. */
function LinhaDoDocumento({
  documento,
  ativo,
  onClick,
}: {
  readonly documento: DocumentoTecnico;
  readonly ativo: boolean;
  readonly onClick: () => void;
}) {
  const Icone = ICONE_DO_TIPO[documento.tipo];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "true" : undefined}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors",
        "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted",
        ativo && "bg-muted/70 hover:bg-muted/70",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
        <Icone className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 font-medium text-base leading-snug">{documento.titulo}</span>
        <span className="text-muted-foreground text-sm tabular-nums">
          {SIGLA[documento.tipo]} · {documento.codigo} · v{documento.versao} · {dataCurta(documento.atualizadoEm)}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
