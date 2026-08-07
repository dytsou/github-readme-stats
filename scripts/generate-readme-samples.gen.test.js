import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { generateReadmeSamples } from "./generate-readme-samples.js";

// ponytail: vitest resolves JSON imports; plain node does not in this repo.
test("write readme preview SVGs to docs/assets/readme", () => {
  const files = generateReadmeSamples();
  expect(Object.keys(files).length).toBeGreaterThan(0);
  for (const [name, svg] of Object.entries(files)) {
    expect(svg).toContain("<svg");
    expect(readFileSync(`docs/assets/readme/${name}`, "utf8")).toBe(svg);
  }
});
