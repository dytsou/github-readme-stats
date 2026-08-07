import { describe, expect, it } from "vitest";
import {
  computeStreakStats,
  flattenCalendarDays,
  getWeekStart,
  lastNDailyCounts,
  buildSparklineCumulativeSeries,
} from "../src/fetchers/contribution-math.js";

describe("contribution-math", () => {
  it("flattens calendar weeks", () => {
    const days = flattenCalendarDays({
      weeks: [
        {
          contributionDays: [
            { date: "2026-08-01", contributionCount: 2 },
            { date: "2026-08-02", contributionCount: 0 },
          ],
        },
        {
          contributionDays: [{ date: "2026-08-03", contributionCount: 5 }],
        },
      ],
    });
    expect(days.map((d) => d.date)).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
  });

  it("computes daily streak stats", () => {
    const days = [
      { date: "2026-08-05", count: 1 },
      { date: "2026-08-06", count: 2 },
      { date: "2026-08-07", count: 3 },
    ];
    const stats = computeStreakStats(days, { todayISO: "2026-08-07" });
    expect(stats.current).toBe(3);
    expect(stats.longest).toBe(3);
    expect(stats.total).toBe(6);
  });

  it("returns current 0 when today has no contributions", () => {
    const days = [
      { date: "2026-08-05", count: 1 },
      { date: "2026-08-06", count: 2 },
      { date: "2026-08-07", count: 0 },
    ];
    const stats = computeStreakStats(days, { todayISO: "2026-08-07" });
    expect(stats.current).toBe(0);
    expect(stats.longest).toBe(2);
  });

  it("computes weekly streak stats", () => {
    const days = [
      { date: "2026-07-28", count: 2 },
      { date: "2026-08-05", count: 1 },
      { date: "2026-08-07", count: 1 },
    ];
    const stats = computeStreakStats(days, {
      mode: "weekly",
      todayISO: "2026-08-07",
    });
    expect(getWeekStart("2026-08-07")).toBe("2026-08-02");
    expect(stats.current).toBe(2);
    expect(stats.longest).toBe(2);
  });

  it("filters days with starting_year", () => {
    const days = [
      { date: "2025-12-31", count: 5 },
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 2 },
    ];
    const stats = computeStreakStats(days, {
      todayISO: "2026-01-02",
      startingYear: 2026,
    });
    expect(stats.total).toBe(3);
    expect(stats.current).toBe(2);
  });

  it("returns last N daily counts", () => {
    const days = [
      { date: "2026-08-01", count: 1 },
      { date: "2026-08-02", count: 2 },
      { date: "2026-08-03", count: 3 },
    ];
    expect(lastNDailyCounts(days, 2)).toEqual([2, 3]);
  });

  it("builds absolute cumulative series", () => {
    const days = [
      { date: "2026-08-01", count: 1 },
      { date: "2026-08-02", count: 2 },
      { date: "2026-08-03", count: 3 },
      { date: "2026-08-04", count: 4 },
      { date: "2026-08-05", count: 5 },
    ];
    expect(buildSparklineCumulativeSeries(days, undefined).values).toEqual([
      1, 3, 6, 10, 15,
    ]);
    expect(buildSparklineCumulativeSeries(days, 2)).toEqual({
      values: [6, 10, 15],
      windowAdded: 9,
      baseline: 6,
    });
  });
});
