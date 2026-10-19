import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { estadoDe, type Persona } from "./personas";

/**
 * Cada tela, em cada tamanho (projetos do playwright.config.ts), com a persona que a usa. Critérios dos docs 12–14 e
 * 16a §4: título da tela, sem rolagem horizontal, sem erro de console, sem violação séria ou crítica de acessibilidade
 * (axe) e, no toque, alvos de pelo menos 44 px e nenhum texto abaixo de 13 px. Cada tela anexa a captura inteira ao
 * relatório (`npx playwright show-report e2e/.relatorio`) para a revisão visual, que continua sendo de gente.
 */
const TELAS: Record<Persona, string[]> = {
  operador: [
    "/dashboard/rotina",
    "/dashboard/checklist/ppli-l4",
    "/dashboard/checklist/rastreabilidade-envoltorio",
    "/dashboard/hora-x-hora",
    "/dashboard/sobrepeso",
    "/dashboard/mtbf",
    "/dashboard/troca-de-turno",
    "/dashboard/documentos",
    "/dashboard/agenda",
    "/dashboard/plano",
    "/dashboard/historico",
  ],
  supervisora: [
    "/dashboard/rotina",
    "/dashboard/tarefas",
    "/dashboard/alertas",
    "/dashboard/relatorio-turno",
    "/dashboard/troca-de-turno",
    "/dashboard/painel",
  ],
  gerente: [
    "/dashboard/painel",
    "/dashboard/relatorio-turno",
    "/dashboard/tendencias",
    "/dashboard/notificacoes",
    "/dashboard/historico",
    "/dashboard/usuarios",
  ],
  especialista: ["/dashboard/padroes", "/dashboard/documentos", "/dashboard/tendencias"],
  assistente: ["/dashboard/plano", "/dashboard/agenda", "/dashboard/usuarios"],
};

/**
 * Avisos do navegador que não são erro do app. O WebKit (Safari do iPad) não conhece `interactive-widget` na meta
 * viewport e avisa no console; a chave fica porque é ela que faz o Chrome do Android (Galaxy Tab) encolher a tela com o
 * teclado aberto (docs/12 §3.1, src/styles/tablet.css).
 */
const AVISOS_CONHECIDOS = [/Viewport argument key "interactive-widget" not recognized/];

const TOQUE = new Set(["ipad-paisagem", "ipad-retrato", "ipad-webkit"]);

/** Alvos de toque abaixo de 44 px e textos abaixo de 13 px dentro do conteúdo (docs/12 §3.3). */
async function medirToque(page: Page) {
  return page.evaluate(() => {
    const visivel = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !e.closest("[aria-hidden=true],[inert]");
    };
    const conteudo = document.querySelector("[data-slot=sidebar-inset]") ?? document.body;
    const pequenos = [
      ...conteudo.querySelectorAll(
        "button, a[href], input:not([type=hidden]):not([type=file]), select, textarea, [role=button], [role=tab], [role=radio], [role=checkbox], [role=switch]",
      ),
    ]
      .filter(visivel)
      .map((e) => {
        const r = e.getBoundingClientRect();
        const texto = (e.getAttribute("aria-label") || (e as HTMLElement).innerText || "").trim().slice(0, 40);
        return { alvo: `${e.tagName.toLowerCase()} "${texto}"`, w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((a) => Math.min(a.w, a.h) < 44);
    const textosPequenos = [...conteudo.querySelectorAll("*")]
      .filter(
        (e) =>
          e.childElementCount === 0 &&
          (e as HTMLElement).innerText?.trim() &&
          visivel(e) &&
          !e.closest("svg, [data-print-root]") &&
          Number.parseFloat(getComputedStyle(e).fontSize) < 13,
      )
      .map((e) => (e as HTMLElement).innerText.trim().slice(0, 40));
    return { pequenos, textosPequenos };
  });
}

for (const [persona, rotas] of Object.entries(TELAS) as [Persona, string[]][]) {
  test.describe(`${persona}`, () => {
    test.use({ storageState: estadoDe(persona) });

    for (const rota of rotas) {
      test(`${rota}`, async ({ page }, testInfo) => {
        const erros: string[] = [];
        page.on("pageerror", (e) => erros.push(e.message));
        page.on("console", (m) => {
          if (m.type() === "error" && !AVISOS_CONHECIDOS.some((r) => r.test(m.text()))) erros.push(m.text());
        });

        await page.goto(rota);
        await expect(page.locator("main h1, [data-slot=sidebar-inset] h1").first()).toBeVisible();
        // Deixa o relógio único, o IndexedDB e as animações de entrada assentarem.
        await page.waitForTimeout(800);

        await testInfo.attach("tela", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

        const rolagem = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect.soft(rolagem, "sem rolagem horizontal").toBeLessThanOrEqual(0);
        expect.soft(erros, "sem erro de console").toEqual([]);

        const axe = await new AxeBuilder({ page }).include("[data-slot=sidebar-inset]").analyze();
        const graves = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        if (graves.length)
          await testInfo.attach("axe", { body: JSON.stringify(graves, null, 2), contentType: "application/json" });
        expect
          .soft(
            graves.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`),
            "acessibilidade (axe)",
          )
          .toEqual([]);

        if (TOQUE.has(testInfo.project.name)) {
          const { pequenos, textosPequenos } = await medirToque(page);
          expect.soft(pequenos, "alvos de toque ≥ 44 px").toEqual([]);
          expect.soft(textosPequenos, "texto ≥ 13 px no toque").toEqual([]);
        }
      });
    }
  });
}
