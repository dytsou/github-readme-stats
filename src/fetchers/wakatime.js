// @ts-check

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";

/**
 * Allowed WakaTime API domains whitelist.
 * Only these domains are permitted to prevent SSRF attacks.
 */
const ALLOWED_WAKATIME_DOMAINS = ["wakatime.com", "api.wakatime.com"];

/**
 * Validates that the provided domain is in the allowed whitelist.
 *
 * @param {string} domain The domain to validate.
 * @returns {boolean} True if domain is allowed, false otherwise.
 */
const isValidWakatimeDomain = (domain) => {
  if (!domain) {
    return true; // Default to wakatime.com if not provided
  }

  // Remove trailing slashes and normalize
  const normalizedDomain = domain.replace(/\/$/gi, "").toLowerCase();

  // Check against whitelist
  return ALLOWED_WAKATIME_DOMAINS.includes(normalizedDomain);
};

/**
 * WakaTime data fetcher.
 *
 * @param {{username: string, api_domain: string }} props Fetcher props.
 * @returns {Promise<import("./types").WakaTimeData>} WakaTime data response.
 */
const fetchWakatimeStats = async ({ username, api_domain }) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  // Validate api_domain against whitelist to prevent SSRF
  if (api_domain && !isValidWakatimeDomain(api_domain)) {
    throw new CustomError(
      "Invalid API domain. Only whitelisted WakaTime domains are allowed.",
      "WAKATIME_ERROR",
    );
  }

  // Normalize and sanitize domain
  const domain = api_domain
    ? api_domain.replace(/\/$/gi, "").toLowerCase()
    : "wakatime.com";

  // URL-encode username to prevent path injection
  const encodedUsername = encodeURIComponent(username);

  try {
    const { data } = await axios.get(
      `https://${domain}/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
    );

    return data.data;
  } catch (err) {
    if (err.response?.status < 200 || err.response?.status > 299) {
      throw new CustomError(
        `Could not resolve to a User with the login of '${username}'`,
        "WAKATIME_USER_NOT_FOUND",
      );
    }
    throw err;
  }
};

export { fetchWakatimeStats };
export default fetchWakatimeStats;
