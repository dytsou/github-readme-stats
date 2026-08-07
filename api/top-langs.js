// @ts-check

import { renderTopLanguages } from "../src/cards/top-languages.js";
import { guardAccess } from "../src/common/access.js";
import {
  createValidatedColorOptions,
  handleApiError,
  sendValidationError,
  setSvgContentType,
  applyOptionalBorderRadius,
  resolveRequestLocale,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";

const VALID_LAYOUTS = new Set([
  "compact",
  "normal",
  "donut",
  "donut-vertical",
  "pie",
]);
const VALID_STATS_FORMATS = new Set(["bytes", "percentages"]);

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function topLangsCardHandler(req, res) {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    layout,
    langs_count,
    exclude_repo,
    size_weight,
    count_weight,
    custom_title,
    locale: rawLocale,
    border_radius,
    border_color,
    disable_animations,
    hide_progress,
    stats_format,
  } = req.query;

  const locale = resolveRequestLocale(rawLocale);

  // Create validated color options once for reuse
  const colorOptions = createValidatedColorOptions({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  // Validate username is provided
  if (!username) {
    return sendValidationError({
      res,
      message: "Missing username parameter",
      secondaryMessage: "Please provide a username",
      colorOptions,
    });
  }

  // Set Content-Type early for Camo CDN compatibility
  setSvgContentType(res);

  const access = guardAccess({
    res,
    id: username,
    type: "username",
    colors: colorOptions,
  });
  if (!access.isPassed) {
    return access.result;
  }

  // Validate layout parameter
  if (
    layout !== undefined &&
    (typeof layout !== "string" || !VALID_LAYOUTS.has(layout))
  ) {
    return sendValidationError({
      res,
      message: "Something went wrong",
      secondaryMessage: "Incorrect layout input",
      colorOptions,
    });
  }

  // Validate stats_format parameter
  if (
    stats_format !== undefined &&
    (typeof stats_format !== "string" || !VALID_STATS_FORMATS.has(stats_format))
  ) {
    return sendValidationError({
      res,
      message: "Something went wrong",
      secondaryMessage: "Incorrect stats_format input",
      colorOptions,
    });
  }

  try {
    const topLangs = await fetchTopLanguages(
      username,
      parseArray(exclude_repo),
      size_weight,
      count_weight,
    );
    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.TOP_LANGS_CARD.DEFAULT,
      min: CACHE_TTL.TOP_LANGS_CARD.MIN,
      max: CACHE_TTL.TOP_LANGS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    const renderOptions = {
      custom_title: typeof custom_title === "string" ? custom_title : undefined,
      hide_title: parseBoolean(hide_title),
      hide_border: parseBoolean(hide_border),
      card_width: Number.parseInt(card_width, 10),
      hide: parseArray(hide),
      title_color: colorOptions.title_color,
      text_color: colorOptions.text_color,
      bg_color: colorOptions.bg_color,
      // @ts-ignore - validateTheme returns a validated theme name
      theme: colorOptions.theme,
      layout,
      langs_count,
      border_color: colorOptions.border_color,
      locale,
      disable_animations: parseBoolean(disable_animations),
      hide_progress: parseBoolean(hide_progress),
      stats_format,
    };
    applyOptionalBorderRadius(renderOptions, border_radius);

    return res.send(renderTopLanguages(topLangs, renderOptions));
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
}
