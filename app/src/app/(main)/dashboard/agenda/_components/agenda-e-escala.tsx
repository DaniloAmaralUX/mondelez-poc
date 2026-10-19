"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pode } from "@/domain/permissoes";
import { dataLocal } from "@/domain/producao";
import type { Recado } from "@/domain/types";
import { formatarDia } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { SoComPermissao } from "../../_components/so-com-permissao";
import { Agenda } from "./agenda";
import { AjustarEscala, type AlvoDoAjuste } from "./ajustar-escala";
import { Escala } from "./escala";
import { PublicarRecado } from "./publicar-recado";
import { pessoasDoPosto } from "./turnos";

type Aba = "agenda" | "escala";

/**
 * Recados até o minuto atual. Como `useRecados()`, mas com 1 min de folga: o relógio do hook vira no minuto e a
 * publicação grava com segundos, então o recado recém-publicado só aparecia no minuto seguinte.
 */
function useRecadosPublicados(agora: Date): Recado[] {
  const recados = useSessionStore((s) => s.recados);
  return React.useMemo(() => {
    const limite = agora.getTime() + 60_000;
    return Object.values(recados)
      .filter((r) => new Date(r.em).getTime() < limite)
      .sort((x, y) => y.em.localeCompare(x.em));
  }, [recados, agora]);
}

/** Agenda e escala (RM-06, RM-16). */
export function AgendaEEscala() {
  return (
    <SoComPermissao recurso="agenda">
      <Conteudo />
    </SoComPermissao>
  );
}

/**
 * Duas consultas do tablet numa tela, em abas do template (o segmentado padrão): a agenda da fábrica e a escala. A aba
 * fica em `?aba=escala` (com `history.replaceState`, sem servidor), para um link levar direto à escala. O título grande
 * leva a ação principal do perfil: "Publicar na agenda" para Gerência e Assistência (o único roxo da tela).
 */
function Conteudo() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const contexto = useSessionStore((s) => s.contexto);
  const ajustes = useSessionStore((s) => s.ajustesEscala);
  const recados = useRecadosPublicados(agora);
  const params = useSearchParams();
  const aba: Aba = params.get("aba") === "escala" ? "escala" : "agenda";
  const hoje = dataLocal(agora);
  const [selecionado, setSelecionado] = React.useState(hoje);
  const [publicando, setPublicando] = React.useState<string | null>(null);
  const [ajustando, setAjustando] = React.useState<AlvoDoAjuste | null>(null);
  const podePublicar = pode(usuario?.perfil, "agenda", "administrar");
  const podeAjustar = pode(usuario?.perfil, "escala", "administrar");

  function trocarAba(nova: string) {
    const p = new URLSearchParams(window.location.search);
    if (nova === "escala") p.set("aba", "escala");
    else p.delete("aba");
    const q = p.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  }

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <header className="flex @3xl/content:flex-row flex-col @3xl/content:items-end @3xl/content:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-muted-foreground text-sm toque:text-base first-letter:uppercase">
            {formatarDia(agora)}
          </p>
          <h1 className="@min-[60rem]/content:text-[2.125rem] text-[2rem] text-foreground leading-[1.1]">
            Agenda e escala
          </h1>
          <p className="text-pretty text-lg text-muted-foreground leading-snug">
            Paradas, visitas e avisos da fábrica, e quem trabalha em cada turno.
          </p>
        </div>
        {podePublicar && (
          <Button
            className="h-11 toque:h-14 self-start @3xl/content:self-auto px-4 text-base"
            onClick={() => setPublicando(selecionado >= hoje ? selecionado : hoje)}
          >
            <CalendarPlus data-icon="inline-start" />
            Publicar na agenda
          </Button>
        )}
      </header>

      <Tabs value={aba} onValueChange={trocarAba} className="gap-6">
        <TabsList className="toque:h-auto self-start toque:p-1">
          <TabsTrigger value="agenda" className="px-4 toque:px-6 toque:text-base">
            Agenda
          </TabsTrigger>
          <TabsTrigger value="escala" className="px-4 toque:px-6 toque:text-base">
            Escala
          </TabsTrigger>
        </TabsList>
        <TabsContent value="agenda">
          <Agenda
            recados={recados}
            agora={agora}
            usuario={usuario}
            podePublicar={podePublicar}
            selecionado={selecionado}
            onSelecionar={setSelecionado}
            onPublicar={setPublicando}
          />
        </TabsContent>
        <TabsContent value="escala">
          <Escala
            usuario={usuario}
            agora={agora}
            ajustes={ajustes}
            postoId={contexto?.postoId}
            podeAjustar={podeAjustar}
            onAjustar={setAjustando}
          />
        </TabsContent>
      </Tabs>

      {podePublicar && (
        <PublicarRecado
          key={`publicar|${usuario?.id ?? ""}`}
          aberto={publicando !== null}
          onAbertoChange={(aberto) => !aberto && setPublicando(null)}
          dataInicial={publicando ?? hoje}
          hoje={hoje}
        />
      )}
      {podeAjustar && (
        <AjustarEscala
          key={`ajuste|${usuario?.id ?? ""}`}
          alvo={ajustando}
          pessoas={pessoasDoPosto(contexto?.postoId)}
          hoje={hoje}
          onFechar={() => setAjustando(null)}
        />
      )}
    </div>
  );
}
