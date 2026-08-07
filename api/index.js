// @ts-check

import { renderStatsCard } from "../src/cards/stats.js";
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
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { fetchStats } from "../src/fetchers/stats.js";

// @ts-ignore
/**
 * Vercel/Express request handler.
 *
 * @param {any} req Request object.
 * @param {any} res Response object.
 * @returns {Promise<any>} Handler result.
 */
export default async function statsCardHandler(req, res) {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    hide_rank,
    show_icons,
    include_all_commits,
    commits_year,
    line_height,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold,
    bg_color,
    theme,
    cache_seconds,
    exclude_repo,
    custom_title,
    locale: rawLocale,
    disable_animations,
    border_radius,
    number_format,
    number_precision,
    border_color,
    rank_icon,
    show,
  } = req.query;

  const locale = resolveRequestLocale(rawLocale);
  const access = prepareUsernameSvgAccess({
    res,
    username,
    colorParams: {
      title_color,
      ring_color,
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
    const showStats = parseArray(show);
    const stats = await fetchStats(
      safeUsername,
      parseBoolean(include_all_commits),
      parseArray(exclude_repo),
      showStats.includes("prs_merged") ||
        showStats.includes("prs_merged_percentage"),
      showStats.includes("discussions_started"),
      showStats.includes("discussions_answered"),
      Number.parseInt(commits_year, 10),
    );
    const cacheSeconds = resolveCacheSeconds({
      requested: Number.parseInt(cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    const renderOptions = {
      hide: parseArray(hide),
      show_icons: parseBoolean(show_icons),
      hide_title: parseBoolean(hide_title),
      hide_border: parseBoolean(hide_border),
      card_width: Number.parseInt(card_width, 10),
      hide_rank: parseBoolean(hide_rank),
      include_all_commits: parseBoolean(include_all_commits),
      commits_year: Number.parseInt(commits_year, 10),
      line_height,
      title_color: colorOptions.title_color,
      ring_color: colorOptions.ring_color,
      icon_color: colorOptions.icon_color,
      text_color: colorOptions.text_color,
      text_bold: parseBoolean(text_bold),
      bg_color: colorOptions.bg_color,
      theme: colorOptions.theme,
      custom_title: typeof custom_title === "string" ? custom_title : undefined,
      border_color: colorOptions.border_color,
      number_format,
      number_precision: Number.parseInt(number_precision, 10),
      locale,
      disable_animations: parseBoolean(disable_animations),
      rank_icon,
      show: showStats,
    };
    applyOptionalBorderRadius(renderOptions, border_radius);

    return res.send(renderStatsCard(stats, renderOptions));
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
}
