"use client";

import { useMemo, useState } from "react";

import { cn } from "cn";
import { ArrowLeft, ChevronRight, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { localRepository } from "@/data/repository";
import { LIMITES } from "@/domain/limites";
import { pode } from "@/domain/permissoes";
import type { Formulario, ItemFormulario } from "@/domain/types";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

/** Mudanças entre a versão vigente e o rascunho, para o resumo antes de publicar. */
function diferencas(vigente: Formulario, rascunho: ItemFormulario[]) {
  const antes = new Map(vigente.itens.map((i) => [i.id, i]));
  const depois = new Map(rascunho.map((i) => [i.id, i]));
  let alterados = 0;
  for (const [id, item] of depois) {
    const anterior = antes.get(id);
    if (anterior && JSON.stringify(anterior) !== JSON.stringify(item)) alterados++;
  }
  return {
    alterados,
    novos: [...depois.keys()].filter((id) => !antes.has(id)).length,
    removidos: [...antes.keys()].filter((id) => !depois.has(id)).length,
  };
}

/**
 * Padrões (RF-12, v0.5): a Especialista atualiza um checklist (texto, item crítico, faixa do centerline, itens novos) e
 * publica a nova versão; a vigente passa a ser só ela, e os registros antigos continuam com a versão com que foram
 * feitos (RF-06). Job: "quando atualizo um padrão, quero publicar e ter certeza de que a versão antiga sumiu do posto".
 * Template: Roles (lista + detalhe).
 */
export function Padroes() {
  const usuario = useUsuarioAtual();
  const publicados = useSessionStore((s) => s.formulariosPublicados);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const podeEditar = pode(usuario?.perfil, "padroes", "administrar");

  // biome-ignore lint/correctness/useExhaustiveDependencies: `publicados` muda o que o repositório devolve
  const formularios = useMemo(
    () => [...localRepository.formularios()].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")),
    [publicados],
  );
  const selecionado = formularios.find((f) => f.id === selecionadoId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[2rem] leading-[1.1]">Padrões</h1>
        <p className="text-lg text-muted-foreground">Checklists vigentes nos postos e a versão de cada um</p>
      </header>

      <div className="grid @min-[60rem]/content:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-6">
        <Card className={cn("gap-0 py-0", selecionado && "@min-[60rem]/content:flex hidden")}>
          <ul className="divide-y">
            {formularios.map((f) => {
              const Icone = ICONE_MODULO[f.moduloSlug] ?? ShieldCheck;
              const ativo = f.id === selecionadoId;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-current={ativo || undefined}
                    onClick={() => setSelecionadoId(f.id)}
                    className={cn(
                      "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted",
                      ativo && "bg-primary/[0.06]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
                    >
                      <Icone className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{f.titulo}</span>
                      <span className="block text-muted-foreground text-sm">
                        {f.itens.length} itens · {localRepository.modulo(f.moduloSlug)?.nome}
                      </span>
                    </span>
                    <Badge variant={publicados[f.id] ? "default" : "secondary"} className="toque:text-sm tabular-nums">
                      v{f.versao}
                    </Badge>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selecionado ? (
          <Editor
            key={`${selecionado.id}@${selecionado.versao}@${usuario?.id}`}
            formulario={selecionado}
            podeEditar={podeEditar}
            onVoltar={() => setSelecionadoId(null)}
          />
        ) : (
          <Card className="@min-[60rem]/content:flex hidden min-h-64 items-center justify-center text-center">
            <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-8" aria-hidden />
              Escolha um checklist para ver os itens e publicar uma nova versão.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Editor({
  formulario,
  podeEditar,
  onVoltar,
}: {
  formulario: Formulario;
  podeEditar: boolean;
  onVoltar: () => void;
}) {
  const publicarFormulario = useSessionStore((s) => s.publicarFormulario);
  const [itens, setItens] = useState<ItemFormulario[]>(formulario.itens);
  const grupos = [...new Set(itens.map((i) => i.grupo))];
  const mudancas = diferencas(formulario, itens);
  const mudou = mudancas.alterados + mudancas.novos + mudancas.removidos > 0;
  const invalido = itens.some(
    (i) =>
      !i.texto.trim() ||
      (i.faixa && (!Number.isFinite(i.faixa.min) || !Number.isFinite(i.faixa.max) || i.faixa.min >= i.faixa.max)),
  );

  const alterar = (id: string, mudanca: Partial<ItemFormulario>) =>
    setItens((lista) => lista.map((i) => (i.id === id ? { ...i, ...mudanca } : i)));

  function adicionar(grupo: string) {
    const id = `novo-${Date.now().toString(36)}`;
    setItens((lista) => {
      const ultimo = lista.map((i) => i.grupo).lastIndexOf(grupo);
      const copia = [...lista];
      copia.splice(ultimo + 1, 0, { id, grupo, texto: "", tipo: "cnc" });
      return copia;
    });
  }

  function publicar() {
    const publicado = publicarFormulario({ ...formulario, itens: itens.map((i) => ({ ...i, texto: i.texto.trim() })) });
    if (!publicado) {
      toast.error("Não deu para publicar", { description: "Confira os itens e tente de novo." });
      return;
    }
    toast.success(`Versão ${publicado.versao} publicada`, {
      description:
        "Os postos passam a usar só esta versão. Registros antigos continuam com a versão em que foram feitos.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 @min-[60rem]/content:hidden toque:h-11 w-fit"
          onClick={onVoltar}
        >
          <ArrowLeft data-icon="inline-start" />
          Checklists
        </Button>
        <CardDescription>
          Versão vigente {formulario.versao} · {localRepository.modulo(formulario.moduloSlug)?.nome}
        </CardDescription>
        <CardTitle className="text-xl">{formulario.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {grupos.map((grupo) => (
          <section key={grupo} className="flex flex-col gap-3" aria-label={grupo}>
            <h3 className="font-semibold text-muted-foreground text-sm">{grupo}</h3>
            <ul className="flex flex-col gap-3">
              {itens
                .filter((i) => i.grupo === grupo)
                .map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
                    <div className="flex items-start gap-2">
                      <Input
                        aria-label={`Texto do item: ${item.texto || "novo item"}`}
                        className="h-11 flex-1 bg-card"
                        value={item.texto}
                        maxLength={LIMITES.titulo}
                        readOnly={!podeEditar}
                        placeholder="O que conferir"
                        onChange={(e) => alterar(item.id, { texto: e.target.value })}
                      />
                      {podeEditar && itens.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 text-muted-foreground"
                          aria-label={`Remover item: ${item.texto}`}
                          onClick={() => setItens((lista) => lista.filter((i) => i.id !== item.id))}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`critico-${item.id}`}
                          checked={Boolean(item.critico)}
                          disabled={!podeEditar}
                          onCheckedChange={(v) => alterar(item.id, { critico: v })}
                        />
                        <Label htmlFor={`critico-${item.id}`}>Item crítico (NC vira alerta crítico)</Label>
                      </div>
                      {item.faixa && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Faixa</span>
                          <Input
                            aria-label="Mínimo"
                            type="number"
                            inputMode="decimal"
                            className="h-10 w-20 bg-card tabular-nums"
                            value={item.faixa.min}
                            readOnly={!podeEditar}
                            onChange={(e) =>
                              alterar(item.id, { faixa: { ...item.faixa!, min: Number(e.target.value) } })
                            }
                          />
                          <span aria-hidden>–</span>
                          <Input
                            aria-label="Máximo"
                            type="number"
                            inputMode="decimal"
                            className="h-10 w-20 bg-card tabular-nums"
                            value={item.faixa.max}
                            readOnly={!podeEditar}
                            onChange={(e) =>
                              alterar(item.id, { faixa: { ...item.faixa!, max: Number(e.target.value) } })
                            }
                          />
                          <span className="text-muted-foreground">{item.faixa.unidade}</span>
                        </div>
                      )}
                      <span className="text-muted-foreground text-sm">
                        {
                          {
                            cnc: "C, NC ou N/A",
                            numero: "Valor medido",
                            texto: "Texto (lote)",
                            foto: "Foto obrigatória",
                          }[item.tipo]
                        }
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
            {podeEditar && (
              <Button variant="secondary" className="h-10 toque:h-12 w-fit" onClick={() => adicionar(grupo)}>
                <Plus data-icon="inline-start" />
                Item em {grupo}
              </Button>
            )}
          </section>
        ))}
      </CardContent>
      {podeEditar && (
        <CardFooter className="flex-wrap justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {mudou
              ? [
                  mudancas.alterados && `${mudancas.alterados} alterado(s)`,
                  mudancas.novos && `${mudancas.novos} novo(s)`,
                  mudancas.removidos && `${mudancas.removidos} removido(s)`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Sem mudanças em relação à versão vigente."}
          </p>
          <Button className="h-11 toque:h-14" disabled={!mudou || invalido} onClick={publicar}>
            Publicar versão {formulario.versao + 1}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
