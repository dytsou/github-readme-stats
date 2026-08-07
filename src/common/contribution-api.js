// @ts-check

import {
  applyOptionalBorderRadius,
  handleApiError,
  prepareUsernameSvgAccess,
  resolveRequestLocale,
} from "./api-utils.js";
import { CACHE_TTL, resolveCacheSeconds, setCacheHeaders } from "./cache.js";
import { parseBoolean } from "./ops.js";
import { fetchContributions } from "../fetchers/contributions.js";

/**
 * Builds render options from validated colors and query params.
 *
 * @param {object} colorOptions Validated theme and color overrides.
 * @param {object} query Request query parameters.
 * @returns {Record<string, unknown>} Options passed to card renderers.
 */
const buildContributionRenderOptions = (colorOptions, query) => {
  const {
    hide_title,
    hide_border,
    custom_title,
    locale: rawLocale,
    disable_animations,
    border_radius,
    card_width,
    card_height,
    days,
    heatmap_colors,
    hide_total,
    hide_current,
    hide_longest,
    mode,
  } = query;

  const locale = resolveRequestLocale(rawLocale);
  /** @type {Record<string, unknown>} */
  const renderOptions = {
    hide_title: parseBoolean(hide_title),
    hide_border: parseBoolean(hide_border),
    custom_title: typeof custom_title === "string" ? custom_title : undefined,
    title_color: colorOptions.title_color,
    text_color: colorOptions.text_color,
    bg_color: colorOptions.bg_color,
    theme: colorOptions.theme,
    border_color: colorOptions.border_color,
    locale,
    disable_animations: parseBoolean(disable_animations),
    card_width,
    card_height,
    days,
    heatmap_colors,
    hide_total: parseBoolean(hide_total),
    hide_current: parseBoolean(hide_current),
    hide_longest: parseBoolean(hide_longest),
    mode: mode === "weekly" ? "weekly" : "daily",
  };
  applyOptionalBorderRadius(renderOptions, border_radius);
  return renderOptions;
};

/**
 * @param {object} query Request query parameters.
 * @returns {import("../fetchers/contributions.js").FetchContributionsOptions} Streak-specific fetch options.
 */
const streakFetchOptions = (query) => ({
  mode: query.mode === "weekly" ? "weekly" : "daily",
});

/**
 * Creates an Express handler for contribution calendar cards.
 *
 * @param {object} config Handler configuration.
 * @param {string} config.cacheKey Cache TTL key from CACHE_TTL.
 * @param {(data: import("../fetchers/contributions.js").ContributionsData, options: object) => string} config.render Card renderer.
 * @param {(query: object) => import("../fetchers/contributions.js").FetchContributionsOptions} [config.getFetchOptions] Optional fetch option mapper.
 * @returns {(req: any, res: any) => Promise<any>} Express request handler.
 */
const createContributionHandler =
  ({ cacheKey, render, getFetchOptions }) =>
  async (req, res) => {
    const { username, cache_seconds, starting_year, ...rest } = req.query;
    const access = prepareUsernameSvgAccess({
      res,
      username,
      colorParams: {
        title_color: rest.title_color,
        text_color: rest.text_color,
        bg_color: rest.bg_color,
        border_color: rest.border_color,
        theme: rest.theme,
      },
    });
    if (!access.ok) {
      return access.result;
    }

    try {
      const startingYear = Number.parseInt(starting_year, 10);
      const fetchOptions = getFetchOptions?.(req.query) ?? {};
      if (Number.isFinite(startingYear)) {
        fetchOptions.startingYear = startingYear;
      }
      const data = await fetchContributions(
        access.safeUsername,
        Number.isFinite(startingYear) ? startingYear : undefined,
        fetchOptions,
      );
      const ttl = CACHE_TTL[cacheKey];
      const cacheSeconds = resolveCacheSeconds({
        requested: Number.parseInt(cache_seconds, 10),
        def: ttl.DEFAULT,
        min: ttl.MIN,
        max: ttl.MAX,
      });
      setCacheHeaders(res, cacheSeconds);

      const options = buildContributionRenderOptions(access.colorOptions, rest);
      return res.send(render(data, options));
    } catch (err) {
      return handleApiError({
        res,
        error: err,
        colorOptions: access.colorOptions,
      });
    }
  };

export {
  createContributionHandler,
  buildContributionRenderOptions,
  streakFetchOptions,
};
