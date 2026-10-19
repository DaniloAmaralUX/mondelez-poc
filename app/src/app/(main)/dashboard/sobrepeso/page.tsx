import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Sobrepeso } from "./_components/sobrepeso";

export const metadata: Metadata = {
  title: "Sobrepeso, refugo e reprocesso · Rotinas Operacionais",
};

/** Sobrepeso, refugo e reprocesso (RM-03): perdas da linha a cada bloco de 2 horas. */
export default function Page() {
  return (
    <SoComPermissao recurso="apontamentos">
      <Sobrepeso />
    </SoComPermissao>
  );
}
