import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { localRepository } from "@/data/repository";

import { Checklist } from "./_components/checklist";

export async function generateMetadata({ params }: PageProps<"/dashboard/checklist/[formularioId]">): Promise<Metadata> {
  const { formularioId } = await params;
  return { title: `${localRepository.formulario(formularioId)?.titulo ?? "Checklist"} · Rotinas Operacionais` };
}

export default async function Page({ params }: PageProps<"/dashboard/checklist/[formularioId]">) {
  const { formularioId } = await params;
  const formulario = localRepository.formulario(formularioId);
  if (!formulario) notFound();

  return <Checklist formularioId={formulario.id} />;
}
