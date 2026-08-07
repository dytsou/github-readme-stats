import { mkdirSync, writeFileSync } from "node:fs";
import { renderGistCard } from "../src/cards/gist.js";
import { renderHeatmapCard } from "../src/cards/heatmap.js";
import { renderSparklineCard } from "../src/cards/sparkline.js";
import { renderStreakCard } from "../src/cards/streak.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderWakatimeCard } from "../src/cards/wakatime.js";

const OUT = "docs/assets/readme";

/**
 * Illustrative contribution calendar for readme previews (not live API data).
 * @returns {import("../src/fetchers/contributions.js").ContributionsData} Mock contributions payload.
 */
const buildMockContributions = () => {
  /** @type {{ date: string, count: number }[]} */
  const days = [];
  /** @type {{ contributionDays: { date: string, contributionCount: number }[] }[]} */
  const weeks = [];
  const start = new Date("2025-08-10T12:00:00Z");

  for (let w = 0; w < 53; w++) {
    const contributionDays = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      const count =
        (w + d) % 11 === 0 ? 0 : Math.min(12, ((w * 3 + d * 5) % 10) + 1);
      contributionDays.push({ date: dateStr, contributionCount: count });
      days.push({ date: dateStr, count });
    }
    weeks.push({ contributionDays });
  }

  const totalContributions = days.reduce((sum, day) => sum + day.count, 0);

  return {
    name: "Alex Chen",
    days,
    streak: {
      total: totalContributions,
      current: 12,
      longest: 34,
    },
    calendar: { totalContributions, weeks },
  };
};

/** Illustrative fixtures for readme preview SVGs (not live API data). */
const readmeSampleMock = {
  stats: {
    name: "Alex Chen",
    totalStars: 3847,
    totalCommits: 1240,
    totalIssues: 89,
    totalPRs: 156,
    totalPRsMerged: 142,
    mergedPRsPercentage: 91,
    totalReviews: 203,
    totalDiscussionsStarted: 12,
    totalDiscussionsAnswered: 47,
    contributedTo: 64,
    rank: { level: "A+", percentile: 92 },
  },
  langs: {
    TypeScript: { color: "#3178c6", name: "TypeScript", size: 512000 },
    JavaScript: { color: "#f1e05a", name: "JavaScript", size: 248000 },
    Python: { color: "#3572A5", name: "Python", size: 156000 },
    Go: { color: "#00ADD8", name: "Go", size: 98000 },
    Shell: { color: "#89e051", name: "Shell", size: 42000 },
    CSS: { color: "#563d7c", name: "CSS", size: 28000 },
  },
  repo: {
    name: "awesome-workers",
    nameWithOwner: "alex-chen/awesome-workers",
    description:
      "Curated Cloudflare Workers patterns, templates, and edge-native tooling.",
    primaryLanguage: { color: "#3178c6", name: "TypeScript" },
    isArchived: false,
    isTemplate: false,
    starCount: 2847,
    forkCount: 312,
  },
  gist: {
    name: "edge-cache-snippet.js",
    nameWithOwner: "alex-chen/edge-cache-snippet.js",
    description: "Cache API helper with stale-while-revalidate for Workers.",
    language: "JavaScript",
    starsCount: 128,
    forksCount: 19,
  },
  wakatime: {
    human_readable_total: "32 hrs 20 mins",
    is_coding_activity_visible: true,
    is_other_usage_visible: true,
    range: "last_7_days",
    status: "ok",
    username: "alex-chen",
    languages: [
      {
        name: "TypeScript",
        hours: 14,
        minutes: 20,
        percent: 44,
        text: "14 hrs 20 mins",
      },
      {
        name: "JavaScript",
        hours: 6,
        minutes: 45,
        percent: 21,
        text: "6 hrs 45 mins",
      },
      {
        name: "Go",
        hours: 4,
        minutes: 10,
        percent: 13,
        text: "4 hrs 10 mins",
      },
      {
        name: "Rust",
        hours: 3,
        minutes: 30,
        percent: 11,
        text: "3 hrs 30 mins",
      },
      {
        name: "YAML",
        hours: 2,
        minutes: 15,
        percent: 7,
        text: "2 hrs 15 mins",
      },
      {
        name: "Other",
        hours: 1,
        minutes: 20,
        percent: 4,
        text: "1 hr 20 mins",
      },
    ],
  },
};

/**
 * Write static readme preview SVGs.
 * @param {string} [outDir] Output directory (default: docs/assets/readme).
 * @returns {Record<string, string>} Map of filename to SVG markup.
 */
export function generateReadmeSamples(outDir = OUT) {
  mkdirSync(outDir, { recursive: true });

  const { stats, langs, repo, gist, wakatime } = readmeSampleMock;
  const contributions = buildMockContributions();
  const commitSparkline = {
    name: readmeSampleMock.repo.nameWithOwner,
    days: contributions.days,
    totalCommits: 842,
  };
  const preview = { theme: "radical", disable_animations: true };

  const files = {
    "stats-sample.svg": renderStatsCard(stats, {
      ...preview,
      show_icons: true,
    }),
    "top-langs-sample.svg": renderTopLanguages(langs, {
      ...preview,
      layout: "compact",
    }),
    "pin-sample.svg": renderRepoCard(repo, {
      ...preview,
      show_owner: true,
    }),
    "gist-sample.svg": renderGistCard(gist, {
      ...preview,
      show_owner: true,
    }),
    "wakatime-sample.svg": renderWakatimeCard(wakatime, {
      ...preview,
      layout: "compact",
    }),
    "streak-sample.svg": renderStreakCard(contributions, preview),
    "sparkline-sample.svg": renderSparklineCard(commitSparkline, {
      ...preview,
      days: 30,
    }),
    "heatmap-sample.svg": renderHeatmapCard(contributions, preview),
  };

  for (const [name, svg] of Object.entries(files)) {
    writeFileSync(`${outDir}/${name}`, svg);
  }

  return files;
}
