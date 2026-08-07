// @ts-check

import { renderRepoCard } from "../src/cards/repo.js";
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
import { fetchRepo } from "../src/fetchers/repo.js";

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function pinCardHandler(req, res) {
  const {
    username,
    repo,
    hide_border,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    show_owner,
    cache_seconds,
    locale: rawLocale,
    border_radius,
    border_color,
    description_lines_count,
  } = req.query;

  const locale = resolveRequestLocale(rawLocale);
  const access = prepareUsernameSvgAccess({
    res,
    username,
    colorParams: {
      title_color,
      icon_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.ok) {
    return access.result;
  }
  const { colorOptions, safeUsername } = access;

  try {
    const repoData = await fetchRepo(safeUsername, repo);
    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.PIN_CARD.DEFAULT,
      min: CACHE_TTL.PIN_CARD.MIN,
      max: CACHE_TTL.PIN_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    const renderOptions = {
      hide_border: parseBoolean(hide_border),
      title_color: colorOptions.title_color,
      icon_color: colorOptions.icon_color,
      text_color: colorOptions.text_color,
      bg_color: colorOptions.bg_color,
      theme: colorOptions.theme,
      border_color: colorOptions.border_color,
      show_owner: parseBoolean(show_owner),
      locale,
      description_lines_count,
    };
    applyOptionalBorderRadius(renderOptions, border_radius);

    return res.send(renderRepoCard(repoData, renderOptions));
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
}
