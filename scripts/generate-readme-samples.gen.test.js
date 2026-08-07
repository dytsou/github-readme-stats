import { test } from "vitest";
import { generateReadmeSamples } from "./generate-readme-samples.js";

// ponytail: vitest resolves JSON imports; plain node does not in this repo.
test("write readme preview SVGs to docs/assets/readme", () => {
  generateReadmeSamples();
});
