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
      for (const name of [
        "stats-sample.svg",
        "top-langs-sample.svg",
        "wakatime-sample.svg",
      ]) {
        expect(files[name]).toContain(".stagger { opacity: 1 !important; }");
      }
      expect(files["stats-sample.svg"]).toContain("Total Stars Earned:");
      expect(files["top-langs-sample.svg"]).toContain("TypeScript");
      expect(files["wakatime-sample.svg"]).toContain(
        "TypeScript - 14 hrs 20 mins",
      );
      expect(files["streak-sample.svg"]).toContain('width="300"');
      expect(files["streak-sample.svg"]).toContain('height="165"');
      expect(files["streak-sample.svg"]).toContain("Current streak");
      expect(files["streak-sample.svg"]).toContain("12");
      expect(files["sparkline-sample.svg"]).toContain('width="300"');
      expect(files["sparkline-sample.svg"]).toContain('height="165"');
      expect(files["sparkline-sample.svg"]).toContain('class="spark"');
      expect(files["sparkline-sample.svg"]).toContain('text-anchor="middle"');
      expect(files["sparkline-sample.svg"]).toContain(
        'data-testid="sparkline-total"',
      );
      expect(files["sparkline-sample.svg"]).toContain("commits");
      expect(files["sparkline-sample.svg"]).toContain("30d");
      expect(files["heatmap-sample.svg"]).toContain(
        'data-testid="heatmap-grid"',
      );
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
