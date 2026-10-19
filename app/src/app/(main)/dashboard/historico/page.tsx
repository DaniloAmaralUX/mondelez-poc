import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Historico } from "./_components/historico";

export const metadata: Metadata = {
  title: "Histórico · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="historico">
      <Historico />
    </SoComPermissao>
  );
}
