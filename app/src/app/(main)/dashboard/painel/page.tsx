import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { PainelDasLinhas } from "./_components/painel-das-linhas";

export const metadata: Metadata = {
  title: "Painel das linhas · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="painel">
      <PainelDasLinhas />
    </SoComPermissao>
  );
}
