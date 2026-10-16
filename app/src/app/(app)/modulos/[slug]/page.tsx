import { Suspense } from "react";

import { notFound } from "next/navigation";

import { localRepository } from "@/data/repository";

import { ModuloEmConstrucao } from "../_components/modulo-em-construcao";

export default async function ModuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const modulo = localRepository.modulo(slug);
  if (!modulo) notFound();

  return (
    <Suspense>
      <ModuloEmConstrucao slug={modulo.slug} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return localRepository.modulos().map((m) => ({ slug: m.slug }));
}
