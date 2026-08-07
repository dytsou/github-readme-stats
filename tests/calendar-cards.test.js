import { describe, expect, it } from "vitest";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { renderStreakCard } from "../src/cards/streak.js";
import {
  DEFAULT_LEVELS,
  levelColor,
  renderHeatmapCard,
  resolveHeatmapLevels,
} from "../src/cards/heatmap.js";
import {
  renderSparklineCard,
  buildSparklineGeometry,
} from "../src/cards/sparkline.js";

const streak = { total: 100, current: 12, longest: 30 };
const sparklineSample = {
  name: "octocat/hello-world",
  days: [
    { date: "2026-08-05", count: 2 },
    { date: "2026-08-06", count: 3 },
    { date: "2026-08-07", count: 1 },
  ],
  totalCommits: 100,
};
const sampleData = {
  name: "octocat",
  days: sparklineSample.days,
  streak,
  calendar: {
    totalContributions: 100,
    weeks: [
      {
        contributionDays: [
          { date: "2026-08-03", contributionCount: 0 },
          { date: "2026-08-04", contributionCount: 1 },
          { date: "2026-08-05", contributionCount: 2 },
          { date: "2026-08-06", contributionCount: 3 },
          { date: "2026-08-07", contributionCount: 1 },
          { date: "2026-08-08", contributionCount: 0 },
          { date: "2026-08-09", contributionCount: 0 },
        ],
      },
    ],
  },
};

describe("calendar cards", () => {
  it("renders total and longest stat values", () => {
    document.body.innerHTML = renderStreakCard(streak);
    const footer = queryByTestId(document.body, "streak-footer");
    expect(footer?.textContent).toContain("100");
    expect(footer?.textContent).toContain("30");
    expect(footer?.getAttribute("text-anchor")).toBe("middle");
  });

  it("centers hero current value", () => {
    document.body.innerHTML = renderStreakCard(streak);
    expect(
      queryByTestId(document.body, "streak-current")?.textContent,
    ).toContain("12");
    const label = document.querySelector(".hero-label");
    expect(label?.getAttribute("text-anchor")).toBe("middle");
  });

  it("hides longest streak line when hide_longest=true", () => {
    document.body.innerHTML = renderStreakCard(streak, { hide_longest: true });
    expect(
      queryByTestId(document.body, "streak-footer")?.textContent,
    ).not.toContain("Longest");
    expect(
      queryByTestId(document.body, "streak-footer")?.textContent,
    ).toContain("Total");
  });

  it("shows weeks suffix in weekly mode", () => {
    document.body.innerHTML = renderStreakCard(streak, { mode: "weekly" });
    expect(
      queryByTestId(document.body, "streak-current")?.textContent,
    ).toContain("weeks");
  });

  it("uses zh-tw locale strings", () => {
    document.body.innerHTML = renderStreakCard(streak, { locale: "zh-tw" });
    expect(document.body.innerHTML).toContain("Current streak");
  });

  it("resolves default heatmap levels", () => {
    const levels = resolveHeatmapLevels(undefined);
    expect(levels).toEqual(DEFAULT_LEVELS.map((c) => `#${c}`));
    expect(levelColor(0, levels)).toBe(`#${DEFAULT_LEVELS[0]}`);
    expect(levelColor(10, levels)).toBe(`#${DEFAULT_LEVELS[4]}`);
  });

  it("applies partial heatmap color override", () => {
    const levels = resolveHeatmapLevels("ff0000,00ff00");
    expect(levels[0]).toBe("#ff0000");
    expect(levels[1]).toBe("#00ff00");
    expect(levels[2]).toBe(`#${DEFAULT_LEVELS[2]}`);
  });

  it("renders heatmap grid", () => {
    document.body.innerHTML = renderHeatmapCard(sampleData);
    expect(queryByTestId(document.body, "heatmap-grid")).toBeInTheDocument();
  });

  it("renders sparkline window with baseline", () => {
    document.body.innerHTML = renderSparklineCard(sparklineSample, { days: 2 });
    expect(queryByTestId(document.body, "sparkline")).toBeInTheDocument();
    expect(queryByTestId(document.body, "sparkline-total")?.textContent).toBe(
      "100 commits",
    );
    expect(
      queryByTestId(document.body, "sparkline-total")?.getAttribute(
        "text-anchor",
      ),
    ).toBe("end");
    expect(
      queryByTestId(document.body, "sparkline-meta")?.textContent,
    ).toContain("+4 in 2d");
  });

  it("defaults sparkline window to 30 days", () => {
    document.body.innerHTML = renderSparklineCard(sparklineSample);
    expect(queryByTestId(document.body, "sparkline-total")?.textContent).toBe(
      "100 commits",
    );
    expect(
      queryByTestId(document.body, "sparkline-total")?.getAttribute(
        "text-anchor",
      ),
    ).toBe("end");
    expect(
      queryByTestId(document.body, "sparkline-meta")?.textContent,
    ).toContain(" in 30d");
  });

  it("fills area under sparkline with semi-transparent accent", () => {
    document.body.innerHTML = renderSparklineCard(sparklineSample, { days: 2 });
    const area = queryByTestId(document.body, "sparkline-area");
    expect(area).toBeInTheDocument();
    expect(area?.getAttribute("class")).toContain("spark-area");
    expect(document.body.innerHTML).toMatch(
      /L [\d.]+,[\d.]+ L [\d.]+,[\d.]+ Z/,
    );
  });

  it("does not pin non-zero baseline to chart bottom", () => {
    const geo = buildSparklineGeometry([1700, 1750, 1847], 420, 50);
    const firstY = Number(geo.linePoints.split(" ")[0].split(",")[1]);
    const chartBottom = 10 + (50 - 20);
    expect(firstY).toBeLessThan(chartBottom - 2);
  });

  it("plots monotonic cumulative trend", () => {
    document.body.innerHTML = renderSparklineCard(sparklineSample, { days: 2 });
    const points =
      queryByTestId(document.body, "sparkline")
        ?.getAttribute("points")
        ?.split(" ") ?? [];
    const ys = points.map((p) => Number(p.split(",")[1]));
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeLessThanOrEqual(ys[i - 1]);
    }
  });

  it("clamps sparkline days to 90", () => {
    const manyDays = {
      ...sparklineSample,
      days: Array.from({ length: 100 }, (_, i) => ({
        date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
        count: i % 5,
      })),
    };
    document.body.innerHTML = renderSparklineCard(manyDays, { days: 999 });
    const points = queryByTestId(document.body, "sparkline")?.getAttribute(
      "points",
    );
    expect(points?.split(" ").length).toBe(91);
  });
});
