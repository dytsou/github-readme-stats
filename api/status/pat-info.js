// @ts-check

/**
 * @file Contains a simple cloud function that can be used to check which PATs are no
 * longer working. It returns a list of valid PATs, expired PATs and PATs with errors.
 *
 * @description This function is currently rate limited to 1 request per 5 minutes.
 */

import { request } from "../../src/common/http.js";
import { logger } from "../../src/common/log.js";
import { dateDiff } from "../../src/common/ops.js";
import { encodeHTML } from "../../src/common/html.js";
import { setJsonContentType } from "../../src/common/api-utils.js";

export const RATE_LIMIT_SECONDS = 60 * 5; // 1 request per 5 minutes

/**
 * Simple uptime check fetcher for the PATs.
 *
 * @param {Record<string, unknown>} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('axios').AxiosResponse>} The response.
 */
const uptimeFetcher = (variables, token) => {
  return request(
    {
      query: `
        query {
          rateLimit {
            remaining
            resetAt
          },
        }`,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    },
  );
};

/**
 * Retrieves all PAT environment variable keys.
 *
 * @returns {string[]} Array of PAT environment variable names.
 */
const getAllPATs = () => {
  return Object.keys(process.env).filter((key) => /PAT_\d*$/.exec(key));
};

/**
 * @typedef {(variables: Record<string, unknown>, token: string) => Promise<import('axios').AxiosResponse>} Fetcher
 */

/**
 * @typedef {Object} PATDetails
 * @property {string} status - The PAT status.
 * @property {number} [remaining] - Remaining API calls.
 * @property {string} [resetIn] - Time until rate limit reset.
 * @property {{ type: string, message: string }} [error] - Error details.
 */

/**
 * @typedef {Object} PATInfo
 * @property {string[]} validPATs - List of valid PATs.
 * @property {string[]} expiredPATs - List of expired PATs.
 * @property {string[]} exhaustedPATs - List of rate-limited PATs.
 * @property {string[]} suspendedPATs - List of suspended PATs.
 * @property {string[]} errorPATs - List of PATs with errors.
 * @property {Record<string, PATDetails>} details - Detailed status of each PAT.
 */

/**
 * Check whether any of the PATs is expired.
 *
 * @param {Fetcher} fetcher The fetcher function.
 * @param {Record<string, unknown>} variables Fetcher variables.
 * @returns {Promise<PATInfo>} The response.
 */
const getPATInfo = async (fetcher, variables) => {
  /** @type {Record<string, PATDetails>} */
  const details = {};
  const PATs = getAllPATs();

  for (const pat of PATs) {
    try {
      const token = process.env[pat];
      if (!token) {
        continue;
      }

      const response = await fetcher(variables, token);
      const errors = response.data.errors;
      const hasErrors = Boolean(errors);
      const errorType = errors?.[0]?.type;
      const isRateLimited =
        (hasErrors && errorType === "RATE_LIMITED") ||
        response.data.data?.rateLimit?.remaining === 0;

      // Store PATs with errors
      if (hasErrors && errorType !== "RATE_LIMITED") {
        details[pat] = {
          status: "error",
          error: {
            type: errors[0].type,
            message: errors[0].message,
          },
        };
        continue;
      }

      if (isRateLimited) {
        const now = new Date();
        const resetAt = new Date(response.data?.data?.rateLimit?.resetAt);
        details[pat] = {
          status: "exhausted",
          remaining: 0,
          resetIn: dateDiff(resetAt, now) + " minutes",
        };
      } else {
        details[pat] = {
          status: "valid",
          remaining: response.data.data.rateLimit.remaining,
        };
      }
    } catch (err) {
      // Handle known error responses
      const errorMessage = err?.response?.data?.message?.toLowerCase();
      if (errorMessage === "bad credentials") {
        details[pat] = { status: "expired" };
      } else if (errorMessage === "sorry. your account was suspended.") {
        details[pat] = { status: "suspended" };
      } else {
        throw err;
      }
    }
  }

  /**
   * Filters PATs by status.
   * @param {string} status - The status to filter by.
   * @returns {string[]} PATs with the specified status.
   */
  const filterPATsByStatus = (status) => {
    return Object.keys(details).filter((pat) => details[pat].status === status);
  };

  // Sort details by key for consistent output
  const sortedDetails = Object.keys(details)
    .sort()
    .reduce((obj, key) => {
      obj[key] = details[key];
      return obj;
    }, /** @type {Record<string, PATDetails>} */ ({}));

  return {
    validPATs: filterPATsByStatus("valid"),
    expiredPATs: filterPATsByStatus("expired"),
    exhaustedPATs: filterPATsByStatus("exhausted"),
    suspendedPATs: filterPATsByStatus("suspended"),
    errorPATs: filterPATsByStatus("error"),
    details: sortedDetails,
  };
};

/**
 * Cloud function that returns information about the used PATs.
 *
 * @param {unknown} _req The request (unused).
 * @param {import('express').Response} res The response.
 * @returns {Promise<void>} The response.
 */
export default async (_req, res) => {
  setJsonContentType(res);

  try {
    const PATsInfo = await getPATInfo(uptimeFetcher, {});
    if (PATsInfo) {
      res.setHeader(
        "Cache-Control",
        `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`,
      );
    }
    res.send(JSON.stringify(PATsInfo, null, 2));
  } catch (err) {
    logger.error(err);
    res.setHeader("Cache-Control", "no-store");
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const safeMessage = encodeHTML(errorMessage);
    res.send("Something went wrong: " + safeMessage);
  }
};
