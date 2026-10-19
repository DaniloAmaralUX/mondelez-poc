import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Notificacoes } from "./_components/notificacoes";

export const metadata: Metadata = {
  title: "Notificações · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="notificacoes">
      <Notificacoes />
    </SoComPermissao>
  );
}
