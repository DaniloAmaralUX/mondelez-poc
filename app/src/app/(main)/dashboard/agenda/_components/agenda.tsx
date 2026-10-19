"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dataLocal } from "@/domain/producao";
import type { Recado, Usuario } from "@/domain/types";

import { CalendarioDoMes } from "./calendario-do-mes";
import { ItemDeRecado } from "./item-de-recado";
import { rotuloDoDia } from "./recados";

/**
 * Agenda da fábrica (RM-16): o mês no calendário do template e, ao lado (notebook) ou embaixo (iPad), o dia escolhido
 * com os próximos compromissos e os recados. Tocar num dia do calendário mostra o que tem nele e, para quem publica,
 * oferece "Publicar neste dia" com o dia já preenchido.
 */
export function Agenda({
  recados,
  agora,
  usuario,
  podePublicar,
  selecionado,
  onSelecionar,
  onPublicar,
}: {
  readonly recados: readonly Recado[];
  readonly agora: Date;
  readonly usuario?: Usuario;
  readonly podePublicar: boolean;
  readonly selecionado: string;
  readonly onSelecionar: (data: string) => void;
  readonly onPublicar: (data: string) => void;
}) {
  const hoje = dataLocal(agora);
  const podeRetirar = (r: Recado) => podePublicar && (r.autorId === usuario?.id || usuario?.perfil === "gerencia");
  const doDia = recados.filter((r) => r.data === selecionado);
  const proximos = recados
    .filter((r) => r.data && r.data >= hoje && r.data !== selecionado)
    .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""))
    .slice(0, 5);
  const avisos = recados.filter((r) => !r.data);

  return (
    <div className="grid @min-[60rem]/content:grid-cols-12 items-start gap-6">
      <Card className="@min-[60rem]/content:col-span-8 min-w-0 gap-0 pb-0">
        <CalendarioDoMes recados={recados} agora={agora} selecionado={selecionado} onSelecionar={onSelecionar} />
      </Card>

      <div className="grid @min-[60rem]/content:col-span-4 @2xl/content:grid-cols-2 @min-[60rem]/content:grid-cols-1 items-start gap-6">
        <Card>
          {/* O dia muda pelo toque no calendário: o título e a contagem são anunciados. */}
          <CardHeader aria-live="polite">
            <CardTitle className="text-lg">{rotuloDoDia(selecionado, hoje)}</CardTitle>
            <CardDescription className="toque:text-base">
              {doDia.length === 0
                ? "Nada marcado neste dia."
                : `${doDia.length} ${doDia.length === 1 ? "compromisso" : "compromissos"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {doDia.length > 0 && (
              <ul className="-my-3 divide-y divide-border/60">
                {doDia.map((r) => (
                  <li key={r.id}>
                    <ItemDeRecado recado={r} agora={agora} podeRetirar={podeRetirar(r)} mostrarData={false} />
                  </li>
                ))}
              </ul>
            )}
            {podePublicar && selecionado >= hoje && (
              <Button variant="outline" className="toque:h-14 self-start" onClick={() => onPublicar(selecionado)}>
                <CalendarPlus data-icon="inline-start" />
                Publicar neste dia
              </Button>
            )}
            <div className="flex flex-col gap-1 border-t pt-4">
              <h3 className="font-semibold text-muted-foreground text-sm toque:text-base">Próximos</h3>
              {proximos.length === 0 ? (
                <p className="py-2 text-muted-foreground text-sm toque:text-base">Nenhum outro compromisso marcado.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {proximos.map((r) => (
                    <li key={r.id}>
                      <ItemDeRecado recado={r} agora={agora} podeRetirar={podeRetirar(r)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recados</CardTitle>
            <CardDescription className="toque:text-base">Avisos sem data, os mais novos primeiro.</CardDescription>
          </CardHeader>
          <CardContent>
            {avisos.length === 0 ? (
              <p className="text-muted-foreground text-sm toque:text-base">Sem recados.</p>
            ) : (
              <ul className="-my-3 divide-y divide-border/60">
                {avisos.map((r) => (
                  <li key={r.id}>
                    <ItemDeRecado recado={r} agora={agora} podeRetirar={podeRetirar(r)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
