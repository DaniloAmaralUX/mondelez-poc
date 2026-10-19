"use client";

import { chaveTurno, turnoAtual } from "@/domain/turno";
import { useRelatorioDasLinhas } from "@/hooks/use-producao";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { AlertasDaLinha } from "./alertas-da-linha";
import { CardDaLinha } from "./card-da-linha";
import { EnviarRelatorio, SituacaoDoEnvio } from "./envio-a-lideranca";
import { TituloGrande } from "./titulo-grande";

/**
 * Relatório do turno (RM-12, RN-11), na composição da tela Default do template: cards de métrica no topo (uma linha por
 * card, BIS 1–4, como no mockup da Mondelez) e o detalhe embaixo. Gerado sozinho a partir dos registros: sem digitação.
 *
 * Por largura útil: no notebook (≥ 66 rem) as quatro linhas lado a lado e o detalhe 8/4 (alertas da Bis 2 e envio); no
 * iPad (paisagem e retrato) as linhas em 2 × 2 e o detalhe em coluna. "Enviar à liderança" fica no título nos três.
 */
export function RelatorioDoTurno() {
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const turnoChave = chaveTurno(turno);
  const linhaDoTablet = useSessionStore((s) => s.contexto?.linhaId) ?? "bis-2";
  const linhas = useRelatorioDasLinhas();
  const daLinha = linhas.find((l) => l.linha.id === linhaDoTablet) ?? linhas.find((l) => !l.simulado);
  const outras = linhas.filter((l) => l !== daLinha);

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <TituloGrande
        titulo="Relatório do turno"
        subtitulo={`${turno.numero}º turno, das ${formatarHora(turno.inicio)} às ${formatarHora(turno.fim)} · gerado pelo app, atualizado às ${formatarHora(agora)}`}
        acao={daLinha ? <EnviarRelatorio linha={daLinha} outras={outras} turnoChave={turnoChave} /> : undefined}
      />

      <section aria-label="Linhas" className="grid @2xl/content:grid-cols-2 @min-[66rem]/content:grid-cols-4 gap-4">
        {linhas.map((item) => (
          <CardDaLinha key={item.linha.id} item={item} />
        ))}
      </section>

      {daLinha && (
        <div className="grid @min-[66rem]/content:grid-cols-12 items-start gap-6">
          <div className="@min-[66rem]/content:col-span-8 min-w-0">
            <AlertasDaLinha nomeDaLinha={daLinha.linha.nome} />
          </div>
          <div className="@min-[66rem]/content:col-span-4 min-w-0">
            <SituacaoDoEnvio linhaId={daLinha.linha.id} turnoChave={turnoChave} />
          </div>
        </div>
      )}
    </div>
  );
}
