"use client";

import { LogoMondelezAssinatura } from "@/components/marca/logo-mondelez-assinatura";
import { MarcaDoApp } from "@/components/marca-do-app";
import BlurText from "@/components/react-bits/BlurText";
import LightRays from "@/components/react-bits/LightRays";
import RotatingText from "@/components/react-bits/RotatingText";
import { APP_CONFIG } from "@/config/app-config";

/** Fim da frase que gira, na voz da marca (simples, autêntica, calorosa). A primeira conversa com "Snacking Made Right". */
const FINAIS = ["feita do jeito certo.", "sem papel na linha.", "mesmo sem rede.", "na hora de cada tarefa."];

/**
 * Painel da marca no login (v0.7, docs/20b): o campo roxo da sinalização da Mondelēz, vivo.
 *
 * - Luz (LightRays, React Bits): raios num lilás claro da rampa MDLZ World nascendo do canto de cima à direita, longe do
 *   logo (brand book: nada de fundo agitado atrás do logo), sobre o roxo #4F2170. Seguem
 *   o ponteiro de leve e pulsam no toque: o painel responde a quem chega no tablet. WebGL puro, sem dependência; pausa
 *   fora da tela e com a aba escondida, e com "reduzir movimento" anda a 35 % e não pulsa.
 * - Título (BlurText): entra uma vez, palavra por palavra, do desfoque para o nítido. O fim da frase (RotatingText)
 *   alterna as promessas do app a cada 3,2 s. Os dois deixam o texto inteiro para o leitor de tela (sr-only) e respeitam
 *   "reduzir movimento" (MotionConfig reducedMotion="user").
 * - O logo não anima nem recebe efeito (brand book: nada de sombra, brilho ou distorção no logo).
 * - Legibilidade: os raios ficam na metade de cima; embaixo, um degradê do roxo escuro da marca (#36174D) sob o texto
 *   mantém o branco acima de 4,5:1 mesmo onde a luz passa.
 */
export function PainelDaMarca() {
  return (
    <aside
      aria-label="Mondelēz International"
      className="relative hidden h-full flex-col justify-between overflow-hidden rounded-[1.5rem] bg-primary p-12 text-primary-foreground xl:flex"
    >
      <LightRays
        className="absolute! inset-0"
        raysOrigin="top-right"
        raysColor="#e5d8ef"
        raysSpeed={0.55}
        lightSpread={1}
        rayLength={2.2}
        rayDensity={0.9}
        raySharpness={0.3}
        glow={0.7}
        haze={0.35}
        atmosphere={0.25}
        saturation={0.7}
        intensity={1.15}
        fadeDistance={0.9}
        followMouse
        mouseInfluence={0.12}
        cursorShadow
        clickPulse
        opacity={0.95}
        maxDevicePixelRatio={1.5}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-[#36174d] via-[#36174d]/70 to-transparent"
      />

      {/* Área de proteção do logo (brand book): pelo menos a largura do "o" em volta; o p-12 do painel garante. */}
      <LogoMondelezAssinatura cor="branco" className="relative w-[17rem]" />

      <div className="relative flex max-w-md flex-col gap-4">
        {/* div e não h2: o BlurText renderiza um <p>, que não pode ficar dentro de um título. O título da página é o
            "Entrar no posto"; a frase do painel é parte da marca, lida inteira pelo leitor de tela (sr-only). */}
        <div className="font-semibold text-[2.5rem] leading-[1.08] tracking-[-0.01em]">
          <BlurText
            text="A rotina do turno,"
            animateBy="words"
            direction="bottom"
            delay={90}
            stepDuration={0.32}
            trigger="load"
            className="flex-wrap"
          />
          <RotatingText
            texts={FINAIS}
            rotationInterval={3200}
            staggerDuration={0.018}
            staggerFrom="first"
            mainClassName="text-[#e5d8ef]"
            splitLevelClassName="overflow-hidden pb-[0.08em]"
          />
        </div>
        <p className="text-pretty text-base text-white/75">
          Checklists, apontamentos e alertas da linha num só lugar, com a próxima tarefa sempre na frente.
        </p>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-white/15 border-t pt-6 text-sm">
        <span className="flex items-center gap-2.5 font-semibold text-base">
          <MarcaDoApp tamanho="sm" className="bg-white text-primary" />
          {APP_CONFIG.name}
        </span>
        <span className="text-white/70">Funciona sem rede</span>
      </div>
    </aside>
  );
}
