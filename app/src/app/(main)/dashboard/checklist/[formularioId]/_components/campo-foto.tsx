"use client";

import { useId, useRef, useState } from "react";

import { cn } from "cn";
import { Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apagarFoto, salvarFoto, useFoto } from "@/lib/fotos";

/** Até quantas fotos por item: evidência, não galeria. */
const MAX_FOTOS = 3;

/**
 * Foto de evidência (v0.5, RM-08): a câmera traseira do tablet (`capture="environment"`), sem sair do app. A foto é
 * reduzida e guardada no IndexedDB de fotos (lib/fotos.ts); a resposta do item leva só os ids. Item de foto: ao menos
 * uma é obrigatória (validação do domínio). Item não conforme: opcional, junto da justificativa.
 */
export function CampoFoto({
  fotos,
  onChange,
  rotulo,
  opcional = false,
  invalido = false,
  descritoPor,
}: {
  readonly fotos: readonly string[];
  readonly onChange: (fotos: string[]) => void;
  readonly rotulo: string;
  readonly opcional?: boolean;
  readonly invalido?: boolean;
  readonly descritoPor?: string;
}) {
  const entradaId = useId();
  const entradaRef = useRef<HTMLInputElement>(null);
  const [salvando, setSalvando] = useState(false);
  const cheio = fotos.length >= MAX_FOTOS;

  async function aoEscolher(arquivos: FileList | null) {
    const arquivo = arquivos?.[0];
    if (!arquivo) return;
    setSalvando(true);
    try {
      const id = await salvarFoto(arquivo);
      onChange([...fotos, id]);
    } catch {
      toast.error("Não deu para guardar a foto", { description: "Tente de novo. A foto fica só neste tablet." });
    } finally {
      setSalvando(false);
      if (entradaRef.current) entradaRef.current.value = "";
    }
  }

  function remover(id: string) {
    onChange(fotos.filter((f) => f !== id));
    void apagarFoto(id);
  }

  return (
    <div className="flex flex-col gap-3">
      {fotos.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label={`Fotos: ${rotulo}`}>
          {fotos.map((id, indice) => (
            <Miniatura key={id} id={id} indice={indice} onRemover={() => remover(id)} />
          ))}
        </ul>
      )}
      {!cheio && (
        <>
          <input
            ref={entradaRef}
            id={entradaId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void aoEscolher(e.target.files)}
          />
          <Button
            type="button"
            variant={opcional ? "outline" : "secondary"}
            className={cn("h-11 toque:h-16 w-full @2xl/itens:w-64", invalido && "ring-2 ring-destructive/40")}
            aria-label={`${fotos.length > 0 ? "Outra foto" : "Tirar foto"}: ${rotulo}`}
            aria-describedby={descritoPor}
            disabled={salvando}
            onClick={() => entradaRef.current?.click()}
          >
            {salvando ? (
              <Spinner data-icon="inline-start" />
            ) : fotos.length > 0 ? (
              <ImagePlus data-icon="inline-start" />
            ) : (
              <Camera data-icon="inline-start" />
            )}
            {salvando
              ? "Guardando…"
              : fotos.length > 0
                ? "Outra foto"
                : opcional
                  ? "Anexar foto (opcional)"
                  : "Tirar foto"}
          </Button>
        </>
      )}
    </div>
  );
}

function Miniatura({
  id,
  indice,
  onRemover,
}: {
  readonly id: string;
  readonly indice: number;
  readonly onRemover: () => void;
}) {
  const url = useFoto(id);
  return (
    <li className="relative">
      <div className="grid size-24 toque:size-28 place-items-center overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        {url ? (
          // biome-ignore lint/performance/noImgElement: foto local (blob: do IndexedDB), sem otimização do Next.
          <img src={url} alt={`Foto ${indice + 1}`} className="size-full object-cover" />
        ) : (
          <Camera className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="-top-2 -right-2 absolute size-8 toque:size-11 rounded-full shadow-sm"
        aria-label={`Remover foto ${indice + 1}`}
        onClick={onRemover}
      >
        <X />
      </Button>
    </li>
  );
}
