import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function NotFound() {
  return (
    <Empty className="h-dvh">
      <EmptyHeader>
        <EmptyTitle className="text-2xl">Página não encontrada</EmptyTitle>
        <EmptyDescription className="text-base">O endereço não existe neste protótipo.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild className="h-touch px-6 text-base">
          <Link replace href="/rotina">
            Voltar para Minha Rotina
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
