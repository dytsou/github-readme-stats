import { describe, expect, it } from "vitest";
import {
  buildLanguageEntries,
  toProfileJson,
  toProfileProse,
} from "../src/text/profile-context.js";

const statsFixture = {
  name: "Anurag Hazra",
  totalPRs: 400,
  totalPRsMerged: 320,
  mergedPRsPercentage: 80,
  totalReviews: 50,
  totalCommits: 200,
  totalIssues: 300,
  totalStars: 100,
  totalDiscussionsStarted: 0,
  totalDiscussionsAnswered: 0,
  contributedTo: 50,
  rank: { level: "A+", percentile: 98 },
};

const languagesFixture = {
  JavaScript: { name: "JavaScript", color: "#f1e05a", size: 750 },
  TypeScript: { name: "TypeScript", color: "#3178c6", size: 250 },
};

describe("profile-context serializers", () => {
  it("builds language entries with percents that sum to 100", () => {
    const entries = buildLanguageEntries(languagesFixture);

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("JavaScript");
    expect(entries[0].percent).toBe(75);
    expect(entries[1].percent).toBe(25);
    expect(entries.reduce((sum, entry) => sum + entry.percent, 0)).toBe(100);
  });

  it("returns empty language list prose when no languages exist", () => {
    const prose = toProfileProse({
      username: "octocat",
      stats: statsFixture,
      languages: [],
    });

    expect(prose).toContain("no language data found");
    expect(prose).not.toContain("<svg");
  });

  it("omits optional stats fields when fetch flags are false", () => {
    const payload = toProfileJson({
      username: "octocat",
      stats: statsFixture,
      languages: languagesFixture,
      fetchOptions: {
        includeMerged: false,
        includeDiscussions: false,
        includeDiscussionsAnswers: false,
      },
    });

    expect(payload.stats.totalStars).toBe(100);
    expect(payload.stats.totalPRsMerged).toBeUndefined();
    expect(payload.stats.totalDiscussionsStarted).toBeUndefined();
  });

  it("includes summary when format=both semantics are requested", () => {
    const payload = toProfileJson({
      username: "octocat",
      stats: statsFixture,
      languages: languagesFixture,
      includeSummary: true,
      fetchOptions: {
        includeMerged: true,
        includeDiscussions: false,
        includeDiscussionsAnswers: false,
      },
    });

    expect(payload.summary).toContain("GitHub profile context");
    expect(payload.summary).toContain("JavaScript");
  });
});
