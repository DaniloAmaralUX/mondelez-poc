import { describe, expect, it } from "vitest";

import { getInitials } from "../utils";

describe("getInitials", () => {
  it("usa a primeira e a última palavra", () => {
    expect(getInitials("Alberto Forte")).toBe("AF");
    expect(getInitials("Maria Beatriz Gonçalves Almeida Castro Nunes")).toBe("MN");
  });

  it("ignora partículas", () => {
    expect(getInitials("Renata de Lins")).toBe("RL");
    expect(getInitials("Ana da Silva e Souza")).toBe("AS");
  });

  it("aceita uma palavra só e entradas vazias", () => {
    expect(getInitials("Marcos")).toBe("M");
    expect(getInitials("  ")).toBe("?");
    expect(getInitials("de")).toBe("D");
  });
});
