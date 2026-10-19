import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { TrocaDeTurno } from "./_components/troca-de-turno";

export const metadata: Metadata = {
  title: "Troca de turno · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="troca-de-turno">
      <TrocaDeTurno />
    </SoComPermissao>
  );
}
