import { describe, expect, it } from "vitest";
import {
  aggregateCommitDatesByDay,
  fillDailyCommitSeries,
  parseWindowDays,
} from "../src/fetchers/commit-history.js";

describe("commit-history", () => {
  it("aggregates same-day commits on default branch", () => {
    const byDay = aggregateCommitDatesByDay([
      "2026-08-05T08:00:00Z",
      "2026-08-05T20:00:00Z",
      "2026-08-06T12:00:00Z",
    ]);
    expect(byDay.get("2026-08-05")).toBe(2);
    expect(byDay.get("2026-08-06")).toBe(1);
  });

  it("fills missing days with zero counts", () => {
    const byDay = aggregateCommitDatesByDay(["2026-08-06T12:00:00Z"]);
    const days = fillDailyCommitSeries(byDay, "2026-08-05", "2026-08-07");
    expect(days).toEqual([
      { date: "2026-08-05", count: 0 },
      { date: "2026-08-06", count: 1 },
      { date: "2026-08-07", count: 0 },
    ]);
  });

  it("defaults sparkline window days to 30", () => {
    expect(parseWindowDays(undefined)).toBe(30);
    expect(parseWindowDays("999")).toBe(90);
  });
});
