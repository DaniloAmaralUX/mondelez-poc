import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte de verificação de tela (docs/18). Segue a recomendação do Next.js e do Playwright: testa o build de produção
 * (`next build` + `next start`), não o servidor de desenvolvimento, que fica lento e instável com várias pessoas e
 * agentes compilando ao mesmo tempo. Porta própria (3200), para não disputar com o `next dev` da 3100.
 *
 * - `npm run build` antes (o webServer só sobe o `next start`); `reuseExistingServer` reaproveita um que já esteja de pé.
 * - Projeto `setup` entra uma vez por persona e guarda o estado com IndexedDB (`storageState({ indexedDB: true })`):
 *   a sessão do app vive no IndexedDB (stores/session/persistencia.ts), não só no cookie.
 * - Os três tamanhos do projeto (docs/14): notebook, iPad paisagem e iPad retrato com toque; mais o motor do Safari
 *   (WebKit) no iPad, que é o navegador do tablet de referência.
 */
const PORTA = Number(process.env.PORTA_E2E ?? 3200);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORTA}`;

const ipadPaisagem = { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
const ipadRetrato = { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.resultados",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/.relatorio" }]],
  use: {
    baseURL: BASE_URL,
    locale: "pt-BR",
    timezoneId: "America/Recife",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "notebook",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "ipad-paisagem",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], ...ipadPaisagem },
    },
    {
      name: "ipad-retrato",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], ...ipadRetrato },
    },
    {
      name: "ipad-webkit",
      dependencies: ["setup"],
      use: { ...devices["iPad Pro 11 landscape"] },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORTA}`,
    url: `${BASE_URL}/auth/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
