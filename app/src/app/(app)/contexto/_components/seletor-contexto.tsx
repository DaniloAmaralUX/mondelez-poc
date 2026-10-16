"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { rotinaTemplates } from "@/data/seed";
import { toque } from "@/lib/touch";
import { useSessionStore } from "@/stores/session/session-store";

function temRotinas(postoId: string) {
  return rotinaTemplates.some((t) => t.postoIds.includes(postoId));
}

export function SeletorContexto() {
  const router = useRouter();
  const atual = useSessionStore((s) => s.contexto);
  const definirContexto = useSessionStore((s) => s.definirContexto);

  const plantas = localRepository.plantas();
  const [plantaId, setPlantaId] = useState(atual?.plantaId ?? plantas[0]?.id ?? "");
  const [linhaId, setLinhaId] = useState(atual?.linhaId ?? "");
  const [postoId, setPostoId] = useState(atual?.postoId ?? "");

  const linhas = localRepository.linhas(plantaId);
  const postos = linhaId ? localRepository.postos(linhaId) : [];
  const pronto = Boolean(plantaId && linhaId && postoId);

  return (
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend className="text-lg">Fábrica</FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={plantaId}
          onValueChange={(v) => {
            if (!v) return;
            setPlantaId(v);
            setLinhaId("");
            setPostoId("");
          }}
          className="flex-wrap"
        >
          {plantas.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className={toque.botao}>
              {p.nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="text-lg">Linha</FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={linhaId}
          onValueChange={(v) => {
            if (!v) return;
            setLinhaId(v);
            setPostoId("");
          }}
          className="flex-wrap"
        >
          {linhas.map((l) => (
            <ToggleGroupItem key={l.id} value={l.id} className={toque.botao}>
              {l.nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <FieldSet disabled={!linhaId}>
        <FieldLegend className="text-lg">Posto</FieldLegend>
        {!linhaId && <FieldDescription>Escolha a linha primeiro.</FieldDescription>}
        {linhaId && (
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={postoId}
            onValueChange={(v) => v && setPostoId(v)}
            className="flex-wrap"
          >
            {postos.map((p) => (
              <ToggleGroupItem key={p.id} value={p.id} className={toque.botao}>
                {p.nome}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {postoId && !temRotinas(postoId) && (
          <FieldDescription>
            Este posto ainda não tem rotinas configuradas na demonstração. Use Bis 2 · Embalagem.
          </FieldDescription>
        )}
      </FieldSet>

      <Button
        disabled={!pronto}
        className={toque.botao}
        onClick={() => {
          definirContexto({ plantaId, linhaId, postoId });
          router.replace("/rotina");
        }}
      >
        <Check data-icon="inline-start" />
        Usar este posto
      </Button>
    </FieldGroup>
  );
}
