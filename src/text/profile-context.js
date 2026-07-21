// @ts-check

import { kFormatter } from "../common/fmt.js";

/**
 * @typedef {import("../fetchers/types").StatsData} StatsData
 * @typedef {import("../fetchers/types").TopLangData} TopLangData
 * @typedef {import("../fetchers/types").ProfileContextJson} ProfileContextJson
 * @typedef {import("../fetchers/types").LanguageEntry} LanguageEntry
 */

/**
 * Builds normalized language entries sorted by byte size descending.
 *
 * @param {TopLangData} topLangData Top languages data from fetcher.
 * @returns {LanguageEntry[]} Language entries with percent share.
 */
const buildLanguageEntries = (topLangData) => {
  const entries = Object.values(topLangData || {}).map((lang) => ({
    name: lang.name,
    color: lang.color,
    bytes: lang.size,
    percent: 0,
  }));

  const totalBytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  if (totalBytes === 0) {
    return entries.sort((a, b) => b.bytes - a.bytes);
  }

  return entries
    .map((entry) => ({
      ...entry,
      percent: Number(((entry.bytes / totalBytes) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.bytes - a.bytes);
};

/**
 * Picks stats fields for JSON output based on fetch options.
 *
 * @param {StatsData} stats Stats data from fetcher.
 * @param {{ includeMerged: boolean, includeDiscussions: boolean, includeDiscussionsAnswers: boolean }} options Fetch flags.
 * @returns {Record<string, unknown>} Stats payload.
 */
const pickStatsFields = (
  stats,
  { includeMerged, includeDiscussions, includeDiscussionsAnswers },
) => {
  /** @type {Record<string, unknown>} */
  const payload = {
    name: stats.name,
    totalPRs: stats.totalPRs,
    totalReviews: stats.totalReviews,
    totalCommits: stats.totalCommits,
    totalIssues: stats.totalIssues,
    totalStars: stats.totalStars,
    contributedTo: stats.contributedTo,
    rank: stats.rank,
  };

  if (includeMerged) {
    payload.totalPRsMerged = stats.totalPRsMerged;
    payload.mergedPRsPercentage = stats.mergedPRsPercentage;
  }

  if (includeDiscussions) {
    payload.totalDiscussionsStarted = stats.totalDiscussionsStarted;
  }

  if (includeDiscussionsAnswers) {
    payload.totalDiscussionsAnswered = stats.totalDiscussionsAnswered;
  }

  return payload;
};

/**
 * Builds deterministic prose suitable for LLM context injection.
 *
 * @param {Object} args Serializer inputs.
 * @param {string} args.username GitHub username.
 * @param {StatsData} args.stats Stats data.
 * @param {LanguageEntry[]} args.languages Normalized language entries.
 * @returns {string} Plain-text summary.
 */
const toProfileProse = ({ username, stats, languages }) => {
  const lines = [
    `GitHub profile context for ${stats.name} (@${username})`,
    "",
    `Rank: ${stats.rank.level} (percentile score ${stats.rank.percentile}; derived from activity, not a GitHub badge).`,
    `Total stars earned across counted repositories: ${kFormatter(stats.totalStars)}.`,
    `Contributed commits (collection window): ${kFormatter(stats.totalCommits)}.`,
    `Pull requests opened: ${kFormatter(stats.totalPRs)}.`,
    `Pull request reviews: ${kFormatter(stats.totalReviews)}.`,
    `Issues opened + closed: ${kFormatter(stats.totalIssues)}.`,
    `Contributed to repositories: ${kFormatter(stats.contributedTo)}.`,
  ];

  if (stats.totalPRsMerged) {
    lines.push(
      `Merged pull requests: ${kFormatter(stats.totalPRsMerged)} (${stats.mergedPRsPercentage.toFixed(1)}% merge rate).`,
    );
  }

  if (stats.totalDiscussionsStarted) {
    lines.push(
      `Discussions started: ${kFormatter(stats.totalDiscussionsStarted)}.`,
    );
  }

  if (stats.totalDiscussionsAnswered) {
    lines.push(
      `Discussion answers: ${kFormatter(stats.totalDiscussionsAnswered)}.`,
    );
  }

  lines.push("");
  if (languages.length === 0) {
    lines.push(
      "Top languages: no language data found for public repositories.",
    );
  } else {
    lines.push(
      "Top languages by byte share in public repositories (percent is share of tracked bytes, not repo count):",
    );
    languages.slice(0, 10).forEach((lang) => {
      lines.push(
        `- ${lang.name}: ${lang.percent}% (${kFormatter(lang.bytes)} bytes)`,
      );
    });
  }

  lines.push("");
  lines.push(
    "Source: github-readme-stats fetchers (GraphQL). Rank percentile and language percents are computed by this service.",
  );

  return lines.join("\n");
};

/**
 * Builds the JSON envelope for profile context responses.
 *
 * @param {Object} args Serializer inputs.
 * @param {string} args.username GitHub username.
 * @param {StatsData} args.stats Stats data.
 * @param {TopLangData} args.languages Top languages data.
 * @param {boolean} [args.includeSummary=false] Include prose summary field.
 * @param {{ includeMerged: boolean, includeDiscussions: boolean, includeDiscussionsAnswers: boolean }} args.fetchOptions Fetch flags.
 * @returns {ProfileContextJson} JSON envelope.
 */
const toProfileJson = ({
  username,
  stats,
  languages,
  includeSummary = false,
  fetchOptions,
}) => {
  const languageEntries = buildLanguageEntries(languages);
  /** @type {ProfileContextJson} */
  const payload = {
    username,
    fetchedAt: new Date().toISOString(),
    stats: pickStatsFields(stats, fetchOptions),
    languages: languageEntries,
  };

  if (includeSummary) {
    payload.summary = toProfileProse({
      username,
      stats,
      languages: languageEntries,
    });
  }

  return payload;
};

export { buildLanguageEntries, pickStatsFields, toProfileJson, toProfileProse };
