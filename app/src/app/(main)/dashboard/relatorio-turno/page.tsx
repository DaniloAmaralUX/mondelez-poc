import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { RelatorioDoTurno } from "./_components/relatorio-do-turno";

export const metadata: Metadata = {
  title: "Relatório do turno · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="relatorio">
      <RelatorioDoTurno />
    </SoComPermissao>
  );
}
