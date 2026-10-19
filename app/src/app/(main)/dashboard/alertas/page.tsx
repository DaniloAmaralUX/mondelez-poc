import { Suspense } from "react";

import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Alertas } from "./_components/alertas";

export const metadata: Metadata = {
  title: "Alertas · Rotinas Operacionais",
};

export default function Page() {
  return (
    // RN-14: o painel de alertas é da liderança; a operação acompanha os próprios pedidos no card de ajuda.
    <SoComPermissao recurso="alertas">
      <Suspense>
        <Alertas />
      </Suspense>
    </SoComPermissao>
  );
}
