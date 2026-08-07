// @ts-check

import { renderGistCard } from "../src/cards/gist.js";
import { guardAccess } from "../src/common/access.js";
import {
  applyOptionalBorderRadius,
  createValidatedColorOptions,
  handleApiError,
  resolveRequestLocale,
  setSvgContentType,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseBoolean } from "../src/common/ops.js";
import { fetchGist } from "../src/fetchers/gist.js";

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function gistCardHandler(req, res) {
  const {
    id,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    locale: rawLocale,
    border_radius,
    border_color,
    show_owner,
    hide_border,
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
    id,
    type: "gist",
    colors: colorOptions,
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const gistData = await fetchGist(id);
    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.GIST_CARD.DEFAULT,
      min: CACHE_TTL.GIST_CARD.MIN,
      max: CACHE_TTL.GIST_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    const renderOptions = {
      title_color: colorOptions.title_color,
      icon_color: colorOptions.icon_color,
      text_color: colorOptions.text_color,
      bg_color: colorOptions.bg_color,
      theme: colorOptions.theme,
      border_color: colorOptions.border_color,
      locale,
      show_owner: parseBoolean(show_owner),
      hide_border: parseBoolean(hide_border),
    };
    applyOptionalBorderRadius(renderOptions, border_radius);

    return res.send(renderGistCard(gistData, renderOptions));
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
}
