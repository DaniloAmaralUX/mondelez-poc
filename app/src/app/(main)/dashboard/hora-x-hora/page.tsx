import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { HoraXHora } from "./_components/hora-x-hora";

export const metadata: Metadata = {
  title: "Hora x Hora · Rotinas Operacionais",
};

/** Hora x Hora (RM-10): apontar as caixas da hora e acompanhar a meta. Operação e Supervisão apontam; os demais leem. */
export default function Page() {
  return (
    <SoComPermissao recurso="apontamentos">
      <HoraXHora />
    </SoComPermissao>
  );
}
