import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Rotinas Operacionais",
  version: packageJson.version,
  copyright: `© ${currentYear}, Rotinas Operacionais.`,
  meta: {
    title: "Rotinas Operacionais · Protótipo",
    description: "Protótipo funcional de gestão de rotinas operacionais de manufatura.",
  },
};
