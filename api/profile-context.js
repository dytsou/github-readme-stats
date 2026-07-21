// @ts-check

import { guardAccessJson } from "../src/common/access.js";
import {
  handleJsonApiError,
  sendJsonValidationError,
  setJsonContentType,
  setTextContentType,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { fetchStats } from "../src/fetchers/stats.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import {
  buildLanguageEntries,
  toProfileJson,
  toProfileProse,
} from "../src/text/profile-context.js";

/** @type {readonly string[]} */
const VALID_FORMATS = ["json", "prose", "both"];

/**
 * Normalizes the response format query parameter.
 *
 * @param {string|undefined} format Raw format query value.
 * @returns {"json"|"prose"|"both"|undefined} Normalized format or undefined when invalid.
 */
const normalizeFormat = (format) => {
  if (typeof format !== "string") {
    return "json";
  }

  const normalized = format.toLowerCase();
  if (VALID_FORMATS.includes(normalized)) {
    return /** @type {"json"|"prose"|"both"} */ (normalized);
  }

  return undefined;
};

// @ts-ignore
const profileContextHandler = async (req, res) => {
  const {
    username,
    format: rawFormat,
    include_all_commits,
    commits_year,
    exclude_repo,
    show,
    size_weight,
    count_weight,
    cache_seconds,
  } = req.query;

  const format = normalizeFormat(rawFormat);
  if (!format) {
    return sendJsonValidationError({
      res,
      code: "INVALID_FORMAT",
      message: `Invalid format. Expected one of: ${VALID_FORMATS.join(", ")}`,
    });
  }

  if (!username || typeof username !== "string") {
    return sendJsonValidationError({
      res,
      code: "MISSING_PARAM",
      message: 'Missing required query parameter "username".',
    });
  }

  const access = guardAccessJson({
    res,
    id: username,
    type: "username",
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const showStats = parseArray(show);
    const excludeRepos = parseArray(exclude_repo);
    const includeMerged =
      showStats.includes("prs_merged") ||
      showStats.includes("prs_merged_percentage");
    const includeDiscussions = showStats.includes("discussions_started");
    const includeDiscussionsAnswers = showStats.includes(
      "discussions_answered",
    );
    const fetchOptions = {
      includeMerged,
      includeDiscussions,
      includeDiscussionsAnswers,
    };

    const [stats, languages] = await Promise.all([
      fetchStats(
        username,
        parseBoolean(include_all_commits),
        excludeRepos,
        includeMerged,
        includeDiscussions,
        includeDiscussionsAnswers,
        Number.parseInt(commits_year, 10),
      ),
      fetchTopLanguages(
        username,
        excludeRepos,
        Number.parseFloat(size_weight) || 1,
        Number.parseFloat(count_weight) || 0,
      ),
    ]);

    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.PROFILE_CONTEXT.DEFAULT,
      min: CACHE_TTL.PROFILE_CONTEXT.MIN,
      max: CACHE_TTL.PROFILE_CONTEXT.MAX,
    });
    setCacheHeaders(res, cacheSeconds);

    if (format === "prose") {
      const languageEntries = buildLanguageEntries(languages);
      setTextContentType(res);
      return res.send(
        toProfileProse({
          username,
          stats,
          languages: languageEntries,
        }),
      );
    }

    setJsonContentType(res);
    return res.send(
      toProfileJson({
        username,
        stats,
        languages,
        includeSummary: format === "both",
        fetchOptions,
      }),
    );
  } catch (err) {
    return handleJsonApiError({ res, error: err });
  }
};

export default profileContextHandler;
