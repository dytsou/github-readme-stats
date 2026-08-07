// @ts-check

/**
 * @typedef {{ date: string, count: number }} ContributionDay
 * @typedef {{ total: number, current: number, longest: number }} StreakStats
 * @typedef {{ mode?: "daily" | "weekly", todayISO?: string, startingYear?: number }} StreakOptions
 */

/**
 * Flattens GitHub contribution calendar weeks into sorted days.
 *
 * @param {{ weeks: { contributionDays: { date: string, contributionCount: number }[] }[] }} calendar GitHub contribution calendar payload.
 * @returns {ContributionDay[]} Days sorted ascending by date.
 */
const flattenCalendarDays = (calendar) => {
  const days = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    })),
  );
  return days.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * @param {string} dateStr YYYY-MM-DD date string.
 * @returns {string} Sunday (week start) for GitHub calendar rows.
 */
const getWeekStart = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
};

/**
 * @param {string} weekStart YYYY-MM-DD (Sunday).
 * @returns {string} Previous week start date.
 */
const prevWeekStart = (weekStart) => {
  const d = new Date(`${weekStart}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
};

/**
 * @param {ContributionDay[]} days Contribution days.
 * @returns {Map<string, number>} Week start to total count.
 */
const groupWeekTotals = (days) => {
  /** @type {Map<string, number>} */
  const weeks = new Map();
  for (const day of days) {
    const wk = getWeekStart(day.date);
    weeks.set(wk, (weeks.get(wk) ?? 0) + day.count);
  }
  return weeks;
};

/**
 * @param {string} a Earlier week start YYYY-MM-DD.
 * @param {string} b Later week start YYYY-MM-DD.
 * @returns {boolean} True when b is exactly one week after a.
 */
const isNextWeek = (a, b) => {
  const d = new Date(`${a}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10) === b;
};

/**
 * @param {Map<string, number>} weeks Week totals map.
 * @param {string} weekStart Week start YYYY-MM-DD.
 * @returns {boolean} True when the week has at least one contribution.
 */
const isActiveWeek = (weeks, weekStart) => (weeks.get(weekStart) ?? 0) > 0;

/**
 * @param {ContributionDay[]} days Contribution days.
 * @param {string} today Today YYYY-MM-DD.
 * @returns {StreakStats} Daily streak metrics.
 */
const computeDailyStreakStats = (days, today) => {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  if (days.length === 0) {
    return { total: 0, current: 0, longest: 0 };
  }

  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const byDate = new Map(days.map((d) => [d.date, d.count]));
  let current = 0;
  let cursor = new Date(`${today}T12:00:00Z`);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const count = byDate.get(key) ?? 0;
    if (count <= 0) {
      break;
    }
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { total, current, longest };
};

/**
 * @param {ContributionDay[]} days Contribution days.
 * @param {string} today Today YYYY-MM-DD.
 * @returns {StreakStats} Weekly streak metrics.
 */
const computeWeeklyStreakStats = (days, today) => {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const weeks = groupWeekTotals(days);
  if (weeks.size === 0) {
    return { total: 0, current: 0, longest: 0 };
  }

  const sorted = [...weeks.keys()].sort();
  let longest = 0;
  let run = 0;
  /** @type {string | null} */
  let prev = null;
  for (const wk of sorted) {
    if (!isActiveWeek(weeks, wk)) {
      run = 0;
      prev = wk;
      continue;
    }
    if (prev && isNextWeek(prev, wk)) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = wk;
  }

  let current = 0;
  let cursor = getWeekStart(today);
  while (isActiveWeek(weeks, cursor)) {
    current += 1;
    cursor = prevWeekStart(cursor);
  }

  return { total, current, longest };
};

/**
 * @param {ContributionDay[]} days Contribution days.
 * @param {number | undefined} startingYear Year filter.
 * @returns {ContributionDay[]} Days on or after Jan 1 of startingYear.
 */
const filterDaysFromYear = (days, startingYear) => {
  if (!startingYear || !Number.isFinite(startingYear)) {
    return days;
  }
  const from = `${startingYear}-01-01`;
  return days.filter((d) => d.date >= from);
};

/**
 * Computes streak metrics from contribution days.
 *
 * @param {ContributionDay[]} days Sorted ascending by date.
 * @param {StreakOptions | string} [options] Options or todayISO override for tests.
 * @returns {StreakStats} Current, longest, and summed contribution counts.
 */
const computeStreakStats = (days, options = {}) => {
  const opts = typeof options === "string" ? { todayISO: options } : options;
  const { mode = "daily", todayISO, startingYear } = opts;
  const filtered = filterDaysFromYear(days, startingYear);
  const today = todayISO ?? new Date().toISOString().slice(0, 10);
  return mode === "weekly"
    ? computeWeeklyStreakStats(filtered, today)
    : computeDailyStreakStats(filtered, today);
};

/**
 * Returns the last N daily counts ending at today (or last calendar day).
 *
 * @param {ContributionDay[]} days Sorted ascending.
 * @param {number} n Number of days.
 * @returns {number[]} Daily contribution counts.
 */
const lastNDailyCounts = (days, n) => {
  const slice = days.slice(-n);
  return slice.map((d) => d.count);
};

/**
 * Absolute cumulative totals for sparkline (repo commits; not delta-from-zero).
 * Window: baseline = contrib before the last N days, then absolute running totals.
 * When the calendar is shorter than N days, plots all available days as prefix sums.
 *
 * @param {ContributionDay[]} days Sorted ascending.
 * @param {number | undefined} windowDays Last N days (required at call site; default 30 in card).
 * @returns {{ values: number[], windowAdded: number, baseline: number }} Cumulative series and window gain.
 */
const buildSparklineCumulativeSeries = (days, windowDays) => {
  if (days.length === 0) {
    return { values: [], windowAdded: 0, baseline: 0 };
  }

  const n =
    windowDays != null && Number.isFinite(windowDays) ? windowDays : null;

  if (n == null || n >= days.length) {
    let sum = 0;
    const values = days.map((d) => {
      sum += d.count;
      return sum;
    });
    return {
      values,
      windowAdded: values.at(-1) ?? 0,
      baseline: 0,
    };
  }

  const before = days.slice(0, days.length - n);
  const window = days.slice(-n);
  const baseline = before.reduce((s, d) => s + d.count, 0);
  let sum = baseline;
  /** @type {number[]} */
  const values = [baseline];
  for (const d of window) {
    sum += d.count;
    values.push(sum);
  }
  return { values, windowAdded: sum - baseline, baseline };
};

// ponytail: assert-based self-check — run with node src/fetchers/contribution-math.js
import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sample = [
    { date: "2026-08-01", count: 3 },
    { date: "2026-08-02", count: 1 },
    { date: "2026-08-03", count: 0 },
    { date: "2026-08-04", count: 2 },
    { date: "2026-08-05", count: 4 },
    { date: "2026-08-06", count: 1 },
    { date: "2026-08-07", count: 2 },
  ];
  const stats = computeStreakStats(sample, { todayISO: "2026-08-07" });
  console.assert(
    stats.current === 4,
    `expected current 4, got ${stats.current}`,
  );
  console.assert(
    stats.longest === 4,
    `expected longest 4, got ${stats.longest}`,
  );
  console.assert(stats.total === 13, `expected total 13, got ${stats.total}`);
  console.assert(
    lastNDailyCounts(sample, 3).join(",") === "4,1,2",
    "lastNDailyCounts mismatch",
  );
  console.assert(
    buildSparklineCumulativeSeries(sample, undefined).values.join(",") ===
      "3,4,4,6,10,11,13",
    "buildSparklineCumulativeSeries full mismatch",
  );
  console.assert(
    buildSparklineCumulativeSeries(sample, 3).values.join(",") === "6,10,11,13",
    "buildSparklineCumulativeSeries window mismatch",
  );
  const zeroToday = computeStreakStats(sample, { todayISO: "2026-08-03" });
  console.assert(
    zeroToday.current === 0,
    "today with zero breaks daily current",
  );
  console.log("contribution-math self-check ok");
}

export {
  flattenCalendarDays,
  computeStreakStats,
  lastNDailyCounts,
  buildSparklineCumulativeSeries,
  filterDaysFromYear,
  getWeekStart,
};
