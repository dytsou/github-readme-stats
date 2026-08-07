// @ts-check

import { CustomError, MissingParamError } from "../common/error.js";
import { throwIfGraphQLErrors } from "../common/graphql.js";
import { request } from "../common/http.js";
import { clampValue } from "../common/ops.js";
import { retryer } from "../common/retryer.js";

/** @typedef {import("./contribution-math.js").ContributionDay} ContributionDay */

const DEFAULT_WINDOW_DAYS = 30;
const COMMITS_PAGE_SIZE = 100;
const MAX_COMMIT_PAGES = 10;
const urlExample = "/api/sparkline?username=OWNER&amp;repo=REPO_NAME";

const GRAPHQL_REPO_COMMIT_HISTORY = `
  query repoCommitHistory(
    $owner: String!
    $name: String!
    $since: GitTimestamp!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      isPrivate
      defaultBranchRef {
        target {
          ... on Commit {
            history {
              totalCount
            }
            recentCommits: history(first: ${COMMITS_PAGE_SIZE}, since: $since, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                committedDate
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * @param {unknown} rawDays Query `days` parameter.
 * @returns {number} Clamped window length in days (1–90).
 */
const parseWindowDays = (rawDays) => {
  if (rawDays === undefined || rawDays === null || rawDays === "") {
    return DEFAULT_WINDOW_DAYS;
  }
  if (typeof rawDays !== "string" && typeof rawDays !== "number") {
    return DEFAULT_WINDOW_DAYS;
  }
  const n = Number.parseInt(String(rawDays), 10);
  if (!Number.isFinite(n)) {
    return DEFAULT_WINDOW_DAYS;
  }
  return clampValue(n, 1, 90);
};

/**
 * @param {string[]} committedDates ISO commit timestamps from default-branch history.
 * @returns {Map<string, number>} UTC date (YYYY-MM-DD) to commit count.
 */
const aggregateCommitDatesByDay = (committedDates) => {
  /** @type {Map<string, number>} */
  const byDay = new Map();
  for (const iso of committedDates) {
    const day = iso.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return byDay;
};

/**
 * @param {Map<string, number>} byDay Daily commit counts.
 * @param {string} fromDate Start date YYYY-MM-DD (inclusive).
 * @param {string} toDate End date YYYY-MM-DD (inclusive).
 * @returns {ContributionDay[]} Sorted daily commit series with zero-filled gaps.
 */
const fillDailyCommitSeries = (byDay, fromDate, toDate) => {
  /** @type {ContributionDay[]} */
  const days = [];
  let cursorMs = new Date(`${fromDate}T12:00:00Z`).getTime();
  const endMs = new Date(`${toDate}T12:00:00Z`).getTime();
  const dayMs = 86_400_000;
  while (cursorMs <= endMs) {
    const dateStr = new Date(cursorMs).toISOString().slice(0, 10);
    days.push({ date: dateStr, count: byDay.get(dateStr) ?? 0 });
    cursorMs += dayMs;
  }
  return days;
};

/**
 * @param {number} windowDays Sparkline window length.
 * @param {number | undefined} startingYear Optional year filter.
 * @returns {string} History `since` date YYYY-MM-DD.
 */
const computeFetchFromDate = (windowDays, startingYear) => {
  if (startingYear && Number.isFinite(startingYear)) {
    return `${startingYear}-01-01`;
  }
  // ponytail: 2× window lookback for baseline headroom; upgrade: raise commit page cap
  const lookback = Math.min(Math.max(windowDays * 2, 60), 365);
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - lookback);
  return from.toISOString().slice(0, 10);
};

/**
 * @typedef {{
 *   name: string,
 *   days: ContributionDay[],
 *   totalCommits: number,
 * }} CommitSparklineData
 * @typedef {{ startingYear?: number, days?: number | string }} FetchRepoCommitHistoryOptions
 */

/**
 * GraphQL fetcher for a single repository's commit history page.
 *
 * @param {object} variables GraphQL variables.
 * @param {string} token GitHub PAT.
 * @returns {Promise<import('axios').AxiosResponse>} GraphQL response.
 */
const historyFetcher = (variables, token) =>
  request(
    { query: GRAPHQL_REPO_COMMIT_HISTORY, variables },
    { Authorization: `bearer ${token}` },
  );

/**
 * @param {object | null | undefined} repository GraphQL repository payload.
 * @param {number} page Zero-based pagination index.
 * @returns {{
 *   nameWithOwner?: string,
 *   totalCommits?: number,
 *   dates: string[],
 *   nextCursor: string | null,
 *   stop: boolean,
 * }}
 */
const readCommitHistoryPage = (repository, page) => {
  if (!repository) {
    throw new CustomError("Repository not found", "USER_NOT_FOUND");
  }
  if (repository.isPrivate) {
    throw new Error("Repository Not found");
  }

  const commit = repository.defaultBranchRef?.target;
  if (!commit) {
    return { dates: [], nextCursor: null, stop: true };
  }

  const recent = commit.recentCommits;
  const totalCommits =
    page === 0 ? (commit.history?.totalCount ?? 0) : undefined;
  if (!recent?.nodes?.length) {
    return {
      nameWithOwner: repository.nameWithOwner,
      totalCommits,
      dates: [],
      nextCursor: null,
      stop: true,
    };
  }

  return {
    nameWithOwner: repository.nameWithOwner,
    totalCommits,
    dates: recent.nodes.map((node) => node.committedDate),
    nextCursor: recent.pageInfo?.hasNextPage ? recent.pageInfo.endCursor : null,
    stop: !recent.pageInfo?.hasNextPage,
  };
};

/**
 * Fetches daily commit counts for one repository's default branch (star-history style).
 *
 * @param {string} owner Repository owner (user or org login).
 * @param {string} repo Repository name.
 * @param {FetchRepoCommitHistoryOptions} [options] Window and year filters.
 * @returns {Promise<CommitSparklineData>} Daily commit history for sparkline rendering.
 */
const fetchRepoCommitHistory = async (owner, repo, options = {}) => {
  if (!owner && !repo) {
    throw new MissingParamError(["username", "repo"], urlExample);
  }
  if (!owner) {
    throw new MissingParamError(["username"], urlExample);
  }
  if (!repo) {
    throw new MissingParamError(["repo"], urlExample);
  }

  const windowDays = parseWindowDays(options.days);
  const startingYear = options.startingYear;
  const fromDate = computeFetchFromDate(windowDays, startingYear);
  const toDate = new Date().toISOString().slice(0, 10);
  const sinceISO = `${fromDate}T00:00:00Z`;

  /** @type {string[]} */
  const committedDates = [];
  /** @type {string | null} */
  let after = null;
  let nameWithOwner = `${owner}/${repo}`;
  let totalCommits = 0;

  for (let page = 0; page < MAX_COMMIT_PAGES; page++) {
    const res = await retryer(historyFetcher, {
      owner,
      name: repo,
      since: sinceISO,
      after,
    });
    throwIfGraphQLErrors(res);

    const pageData = readCommitHistoryPage(res.data.data.repository, page);
    if (pageData.nameWithOwner) {
      nameWithOwner = pageData.nameWithOwner;
    }
    if (pageData.totalCommits !== undefined) {
      totalCommits = pageData.totalCommits;
    }
    committedDates.push(...pageData.dates);
    if (pageData.stop) {
      break;
    }
    after = pageData.nextCursor;
  }

  const byDay = aggregateCommitDatesByDay(committedDates);
  const days = fillDailyCommitSeries(byDay, fromDate, toDate);

  return {
    name: nameWithOwner,
    days,
    totalCommits,
  };
};

// ponytail: assert-based self-check — run with node src/fetchers/commit-history.js
import { fileURLToPath } from "node:url";
if (
  import.meta.url &&
  typeof process !== "undefined" &&
  process.argv?.[1] === fileURLToPath(import.meta.url)
) {
  const byDay = aggregateCommitDatesByDay([
    "2026-08-05T10:00:00Z",
    "2026-08-05T18:00:00Z",
    "2026-08-06T09:00:00Z",
  ]);
  console.assert(byDay.get("2026-08-05") === 2, "same-day commits should sum");
  const series = fillDailyCommitSeries(byDay, "2026-08-05", "2026-08-07");
  console.assert(
    series.map((d) => d.count).join(",") === "2,1,0",
    "fillDailyCommitSeries mismatch",
  );
  console.log("commit-history self-check ok");
}

export {
  fetchRepoCommitHistory,
  aggregateCommitDatesByDay,
  fillDailyCommitSeries,
  parseWindowDays,
};
