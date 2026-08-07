// @ts-check

import { renderWakatimeCard } from "../src/cards/wakatime.js";
import { guardAccess } from "../src/common/access.js";
import {
  createValidatedColorOptions,
  handleApiError,
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
import { fetchWakatimeStats } from "../src/fetchers/wakatime.js";

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function wakatimeCardHandler(req, res) {
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

  const locale = resolveRequestLocale(rawLocale);

  setSvgContentType(res);

  const colorOptions = createValidatedColorOptions({
    title_color,
    icon_color,
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
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.WAKATIME_CARD.DEFAULT,
      min: CACHE_TTL.WAKATIME_CARD.MIN,
      max: CACHE_TTL.WAKATIME_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    const renderOptions = {
      custom_title: typeof custom_title === "string" ? custom_title : undefined,
      hide_title: parseBoolean(hide_title),
      hide_border: parseBoolean(hide_border),
      card_width: Number.parseInt(card_width, 10),
      hide: parseArray(hide),
      line_height,
      title_color: colorOptions.title_color,
      icon_color: colorOptions.icon_color,
      text_color: colorOptions.text_color,
      bg_color: colorOptions.bg_color,
      // @ts-ignore - validateTheme ensures theme is valid ThemeNames
      theme: colorOptions.theme,
      hide_progress,
      border_color: colorOptions.border_color,
      locale,
      layout,
      langs_count,
      display_format,
      disable_animations: parseBoolean(disable_animations),
    };
    applyOptionalBorderRadius(renderOptions, border_radius, 20, 4.5);

    return res.send(renderWakatimeCard(stats, renderOptions));
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
}
