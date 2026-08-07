import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateReadmeSamples } from "./generate-readme-samples.js";

describe("generate readme sample SVGs", () => {
  it("writes static card previews", () => {
    const outDir = mkdtempSync(join(tmpdir(), "readme-samples-"));
    try {
      const files = generateReadmeSamples(outDir);
      for (const [name, svg] of Object.entries(files)) {
        expect(svg.includes("<svg")).toBe(true);
        expect(readFileSync(`${outDir}/${name}`, "utf8")).toBe(svg);
      }
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
