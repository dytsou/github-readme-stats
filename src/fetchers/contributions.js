// @ts-check

import githubUsernameRegex from "github-username-regex";
import { CustomError, MissingParamError } from "../common/error.js";
import { throwIfGraphQLErrors } from "../common/graphql.js";
import { request } from "../common/http.js";
import { retryer } from "../common/retryer.js";
import {
  computeStreakStats,
  filterDaysFromYear,
  flattenCalendarDays,
} from "./contribution-math.js";

const GRAPHQL_CONTRIBUTIONS_QUERY = `
  query contributionCalendar($login: String!, $from: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

/**
 * @typedef {import("./contribution-math.js").ContributionDay} ContributionDay
 * @typedef {import("./contribution-math.js").StreakStats} StreakStats
 * @typedef {{
 *   name: string,
 *   days: ContributionDay[],
 *   streak: StreakStats,
 *   calendar: { totalContributions: number, weeks: { contributionDays: { contributionCount: number, date: string }[] }[] },
 * }} ContributionsData
 * @typedef {{ mode?: "daily" | "weekly", startingYear?: number }} FetchContributionsOptions
 */

/**
 * GraphQL fetcher for contribution calendar data.
 *
 * @param {object} variables GraphQL variables.
 * @param {string} token GitHub PAT.
 * @returns {Promise<import('axios').AxiosResponse>} GraphQL response.
 */
const fetcher = (variables, token) =>
  request(
    { query: GRAPHQL_CONTRIBUTIONS_QUERY, variables },
    { Authorization: `bearer ${token}` },
  );

/**
 * Fetches contribution calendar and derived streak metrics.
 *
 * @param {string} username GitHub username.
 * @param {number} [startingYear] Optional year filter (from Jan 1 UTC).
 * @param {FetchContributionsOptions} [options] Streak mode and year overrides.
 * @returns {Promise<ContributionsData>} Contribution calendar and streak stats.
 */
const fetchContributions = async (username, startingYear, options = {}) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }
  if (!githubUsernameRegex.test(username)) {
    throw new CustomError("Invalid username", "INVALID_USERNAME");
  }

  const year =
    startingYear && Number.isFinite(startingYear)
      ? startingYear
      : options.startingYear;
  const mode = options.mode === "weekly" ? "weekly" : "daily";

  /** @type {string | null} */
  let from = null;
  if (year && Number.isFinite(year)) {
    from = `${year}-01-01T00:00:00Z`;
  }

  const res = await retryer(fetcher, { login: username, from });
  throwIfGraphQLErrors(res);
  const user = res.data.data.user;
  if (!user) {
    throw new CustomError("User not found", "USER_NOT_FOUND");
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const allDays = flattenCalendarDays(calendar);
  const days = filterDaysFromYear(allDays, year);
  const streak = computeStreakStats(days, { mode, startingYear: year });

  return {
    name: username,
    days,
    streak: {
      total: calendar.totalContributions,
      current: streak.current,
      longest: streak.longest,
    },
    calendar,
  };
};

export { fetchContributions };
