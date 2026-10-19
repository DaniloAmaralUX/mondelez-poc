import { expect, test as setup } from "@playwright/test";

import { estadoDe, PERSONAS, type Persona, PIN_DEMO } from "./personas";

/**
 * Entra uma vez com cada persona e guarda o estado (Playwright, "auth setup project"). `indexedDB: true` porque a
 * sessão, o relógio da demo e os registros ficam no IndexedDB do tablet; só o cookie não bastaria.
 */
for (const persona of Object.keys(PERSONAS) as Persona[]) {
  setup(`entrar como ${persona}`, async ({ page }) => {
    await page.goto("/auth/login");
    const matricula = page.locator("#login-matricula");
    await matricula.fill(PERSONAS[persona].matricula);
    // Seis números levam o foco ao teclado do PIN, que aceita o teclado físico.
    await page.keyboard.type(PIN_DEMO, { delay: 30 });
    await page.waitForURL(/\/dashboard\//);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.context().storageState({ path: estadoDe(persona), indexedDB: true });
  });
}
