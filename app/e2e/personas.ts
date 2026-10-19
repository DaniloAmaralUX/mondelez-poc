/** Personas da demonstração (data/seed.ts), todas com o PIN de demonstração. */
export const PERSONAS = {
  operador: { matricula: "104233", nome: "Alberto" },
  supervisora: { matricula: "201145", nome: "Renata" },
  gerente: { matricula: "300512", nome: "Marcos" },
  especialista: { matricula: "250078", nome: "Juliana" },
  assistente: { matricula: "220390", nome: "Carlos" },
} as const;

export type Persona = keyof typeof PERSONAS;

export const PIN_DEMO = "1234";

/** Estado salvo de cada persona (cookie + IndexedDB da sessão). */
export const estadoDe = (persona: Persona) => `e2e/.auth/${persona}.json`;
