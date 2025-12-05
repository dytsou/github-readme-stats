// @ts-check

/**
 * @file Contains a simple cloud function that can be used to check if the PATs are still
 * functional.
 *
 * @description This function is currently rate limited to 1 request per 5 minutes.
 */

import { request } from "../../src/common/http.js";
import retryer from "../../src/common/retryer.js";
import { logger } from "../../src/common/log.js";
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
          }
        }
        `,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    },
  );
};

/**
 * @typedef {Object} ShieldsResponse
 * @property {number} schemaVersion - Shields.io schema version.
 * @property {string} label - Badge label.
 * @property {"up" | "down"} message - Status message.
 * @property {"brightgreen" | "red"} color - Badge color.
 * @property {boolean} isError - Whether this is an error state.
 */

/**
 * Creates JSON response for shields.io dynamic card generation.
 *
 * @param {boolean} up Whether the PATs are up or not.
 * @returns {ShieldsResponse} Dynamic shields.io JSON response object.
 * @see https://shields.io/endpoint
 */
const shieldsUptimeBadge = (up) => ({
  schemaVersion: 1,
  label: "Public Instance",
  message: up ? "up" : "down",
  color: up ? "brightgreen" : "red",
  isError: true,
});

/**
 * Validates and normalizes the response type parameter.
 *
 * @param {string|undefined} type - The type parameter from query.
 * @returns {"shields" | "json" | "boolean"} Normalized type value.
 */
const normalizeResponseType = (type) => {
  const normalized = typeof type === "string" ? type.toLowerCase() : "boolean";
  if (normalized === "shields" || normalized === "json") {
    return normalized;
  }
  return "boolean";
};

/**
 * Cloud function that returns whether the PATs are still functional.
 *
 * @param {import('express').Request} req The request.
 * @param {import('express').Response} res The response.
 * @returns {Promise<void>} Nothing.
 */
export default async (req, res) => {
  const responseType = normalizeResponseType(req.query.type);

  setJsonContentType(res);

  try {
    let PATsValid = true;
    try {
      await retryer(uptimeFetcher, {});
    } catch {
      // PAT validation failed - mark as invalid
      PATsValid = false;
    }

    if (PATsValid) {
      res.setHeader(
        "Cache-Control",
        `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`,
      );
    } else {
      res.setHeader("Cache-Control", "no-store");
    }

    switch (responseType) {
      case "shields":
        res.send(shieldsUptimeBadge(PATsValid));
        break;
      case "json":
        res.send({ up: PATsValid });
        break;
      default:
        res.send(PATsValid);
        break;
    }
  } catch (err) {
    logger.error(err);
    res.setHeader("Cache-Control", "no-store");
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const safeMessage = encodeHTML(errorMessage);
    res.send("Something went wrong: " + safeMessage);
  }
};
