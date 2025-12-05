// @ts-check

import { renderTopLanguages } from "../src/cards/top-languages.js";
import { guardAccess } from "../src/common/access.js";
import {
  createValidatedColorOptions,
  handleApiError,
  sendValidationError,
  setSvgContentType,
  parseNumericParam,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import { isLocaleAvailable } from "../src/translations.js";

/** @type {readonly string[]} */
const VALID_LAYOUTS = ["compact", "normal", "donut", "donut-vertical", "pie"];

/** @type {readonly string[]} */
const VALID_STATS_FORMATS = ["bytes", "percentages"];

// @ts-ignore
export default async (req, res) => {
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

  // Only allow supported locales - validate and sanitize to prevent XSS
  const locale =
    typeof rawLocale === "string" && isLocaleAvailable(rawLocale)
      ? rawLocale.toLowerCase()
      : undefined;

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
    (typeof layout !== "string" || !VALID_LAYOUTS.includes(layout))
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
    (typeof stats_format !== "string" ||
      !VALID_STATS_FORMATS.includes(stats_format))
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
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.TOP_LANGS_CARD.DEFAULT,
      min: CACHE_TTL.TOP_LANGS_CARD.MIN,
      max: CACHE_TTL.TOP_LANGS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderTopLanguages(topLangs, {
        custom_title,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide: parseArray(hide),
        title_color: colorOptions.title_color,
        text_color: colorOptions.text_color,
        bg_color: colorOptions.bg_color,
        // @ts-ignore - validateTheme returns a validated theme name
        theme: colorOptions.theme,
        layout,
        langs_count,
        border_radius: parseNumericParam(border_radius, undefined, 0, 50),
        border_color: colorOptions.border_color,
        locale,
        disable_animations: parseBoolean(disable_animations),
        hide_progress: parseBoolean(hide_progress),
        stats_format,
      }),
    );
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
};
