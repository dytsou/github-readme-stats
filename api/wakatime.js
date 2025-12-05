// @ts-check

import { renderWakatimeCard } from "../src/cards/wakatime.js";
import { guardAccess } from "../src/common/access.js";
import {
  createValidatedColorOptions,
  handleApiError,
  setSvgContentType,
  parseNumericParam,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { validateColor } from "../src/common/color.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { fetchWakatimeStats } from "../src/fetchers/wakatime.js";
import { isLocaleAvailable } from "../src/translations.js";

/** @type {number} */
const DEFAULT_BORDER_RADIUS = 4.5;

/** @type {number} */
const MAX_BORDER_RADIUS = 20;

// @ts-ignore
export default async (req, res) => {
  const {
    username,
    title_color,
    icon_color,
    hide_border,
    card_width,
    line_height,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    hide_title,
    hide_progress,
    custom_title,
    locale: rawLocale,
    layout,
    langs_count,
    hide,
    api_domain,
    border_radius,
    border_color,
    display_format,
    disable_animations,
  } = req.query;

  // Only allow supported locales - validate and sanitize to prevent XSS
  const locale =
    typeof rawLocale === "string" && isLocaleAvailable(rawLocale)
      ? rawLocale.toLowerCase()
      : undefined;

  setSvgContentType(res);

  // Create validated color options once for reuse
  const colorOptions = createValidatedColorOptions({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const access = guardAccess({
    res,
    id: username,
    type: "wakatime",
    colors: colorOptions,
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const stats = await fetchWakatimeStats({ username, api_domain });
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.WAKATIME_CARD.DEFAULT,
      min: CACHE_TTL.WAKATIME_CARD.MIN,
      max: CACHE_TTL.WAKATIME_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderWakatimeCard(stats, {
        // Validate custom_title is a string (prevents array from duplicate query params)
        // Card.js handles HTML encoding internally
        custom_title:
          typeof custom_title === "string" ? custom_title : undefined,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide: parseArray(hide),
        line_height,
        title_color: colorOptions.title_color,
        icon_color: validateColor(icon_color),
        text_color: colorOptions.text_color,
        bg_color: colorOptions.bg_color,
        // @ts-ignore - validateTheme ensures theme is valid ThemeNames
        theme: colorOptions.theme,
        hide_progress,
        border_radius: parseNumericParam(
          border_radius,
          DEFAULT_BORDER_RADIUS,
          0,
          MAX_BORDER_RADIUS,
        ),
        border_color: colorOptions.border_color,
        locale,
        layout,
        langs_count,
        display_format,
        disable_animations: parseBoolean(disable_animations),
      }),
    );
  } catch (err) {
    // handleApiError sanitizes error messages via sanitizeErrorMessage()
    // which replaces unsafe patterns containing user data with safe alternatives
    return handleApiError({ res, error: err, colorOptions });
  }
};
