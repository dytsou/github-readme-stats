// @ts-check

import { renderSparklineCard } from "../src/cards/sparkline.js";
import {
  applyOptionalBorderRadius,
  handleApiError,
  prepareUsernameSvgAccess,
  resolveRequestLocale,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseBoolean } from "../src/common/ops.js";
import { fetchRepoCommitHistory } from "../src/fetchers/commit-history.js";

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function sparklineCardHandler(req, res) {
  const {
    username,
    repo,
    cache_seconds,
    starting_year,
    days,
    hide_title,
    hide_border,
    custom_title,
    locale: rawLocale,
    disable_animations,
    border_radius,
    card_width,
    card_height,
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  } = req.query;

  const access = prepareUsernameSvgAccess({
    res,
    username,
    colorParams: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.ok) {
    return access.result;
  }

  try {
    const startingYear = Number.parseInt(starting_year, 10);
    const data = await fetchRepoCommitHistory(access.safeUsername, repo, {
      startingYear: Number.isFinite(startingYear) ? startingYear : undefined,
      days,
    });
    const ttl = CACHE_TTL.PIN_CARD;
    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: ttl.DEFAULT,
      min: ttl.MIN,
      max: ttl.MAX,
    });
    setCacheHeaders(res, cacheSeconds);

    const locale = resolveRequestLocale(rawLocale);
    /** @type {Record<string, unknown>} */
    const renderOptions = {
      hide_title: parseBoolean(hide_title),
      hide_border: parseBoolean(hide_border),
      custom_title: typeof custom_title === "string" ? custom_title : undefined,
      title_color: access.colorOptions.title_color,
      text_color: access.colorOptions.text_color,
      bg_color: access.colorOptions.bg_color,
      theme: access.colorOptions.theme,
      border_color: access.colorOptions.border_color,
      locale,
      disable_animations: parseBoolean(disable_animations),
      card_width,
      card_height,
      days,
    };
    applyOptionalBorderRadius(renderOptions, border_radius);

    return res.send(renderSparklineCard(data, renderOptions));
  } catch (err) {
    return handleApiError({
      res,
      error: err,
      colorOptions: access.colorOptions,
    });
  }
}
