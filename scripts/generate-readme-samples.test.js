import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderGistCard } from "../src/cards/gist.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderWakatimeCard } from "../src/cards/wakatime.js";

const OUT = "docs/assets/readme";

describe("generate readme sample SVGs", () => {
  it("writes static card previews", () => {
    const stats = {
      name: "Example User",
      totalStars: 128,
      totalCommits: 420,
      totalIssues: 12,
      totalPRs: 34,
      totalPRsMerged: 28,
      mergedPRsPercentage: 82,
      totalReviews: 9,
      totalDiscussionsStarted: 2,
      totalDiscussionsAnswered: 5,
      contributedTo: 18,
      rank: { level: "B+", percentile: 55 },
    };
    const langs = {
      TypeScript: { color: "#3178c6", name: "TypeScript", size: 45000 },
      JavaScript: { color: "#f1e05a", name: "JavaScript", size: 32000 },
      CSS: { color: "#563d7c", name: "CSS", size: 12000 },
      Shell: { color: "#89e051", name: "Shell", size: 8000 },
      Go: { color: "#00add8", name: "Go", size: 5000 },
    };
    const repo = {
      name: "github-readme-stats",
      nameWithOwner: "Example User/github-readme-stats",
      description: "Dynamically generated stats cards for your README.",
      primaryLanguage: { color: "#f1e05a", name: "JavaScript" },
      isArchived: false,
      isTemplate: false,
      starCount: 62000,
      forkCount: 18000,
    };
    const gist = {
      name: "example.md",
      nameWithOwner: "Example User/example.md",
      description: "Sample gist for readme preview.",
      language: "Markdown",
      starsCount: 42,
      forksCount: 3,
    };
    const wakatime = {
      human_readable_total: "22 hrs 21 mins",
      is_coding_activity_visible: true,
      is_other_usage_visible: true,
      range: "last_7_days",
      status: "ok",
      username: "example",
      languages: [
        {
          name: "TypeScript",
          hours: 12,
          minutes: 30,
          percent: 56,
          text: "12 hrs 30 mins",
        },
        {
          name: "JavaScript",
          hours: 6,
          minutes: 15,
          percent: 28,
          text: "6 hrs 15 mins",
        },
        {
          name: "CSS",
          hours: 2,
          minutes: 36,
          percent: 12,
          text: "2 hrs 36 mins",
        },
        { name: "Other", hours: 1, minutes: 0, percent: 4, text: "1 hr" },
      ],
    };

    const files = {
      "stats-sample.svg": renderStatsCard(stats, {
        theme: "radical",
        show_icons: true,
      }),
      "top-langs-sample.svg": renderTopLanguages(langs, {
        layout: "compact",
        theme: "radical",
      }),
      "pin-sample.svg": renderRepoCard(repo, {
        theme: "radical",
        show_owner: true,
      }),
      "gist-sample.svg": renderGistCard(gist, {
        theme: "radical",
        show_owner: true,
      }),
      "wakatime-sample.svg": renderWakatimeCard(wakatime, {
        theme: "radical",
        layout: "compact",
      }),
    };

    for (const [name, svg] of Object.entries(files)) {
      writeFileSync(`${OUT}/${name}`, svg);
      expect(svg.includes("<svg")).toBe(true);
    }
  });
});
