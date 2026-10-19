import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Padroes } from "./_components/padroes";

export const metadata: Metadata = {
  title: "Padrões · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="padroes">
      <Padroes />
    </SoComPermissao>
  );
}
