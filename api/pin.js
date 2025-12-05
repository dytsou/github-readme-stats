// @ts-check

import { renderRepoCard } from "../src/cards/repo.js";
import { guardAccess } from "../src/common/access.js";
import {
  createValidatedColorOptions,
  handleApiError,
  setSvgContentType,
} from "../src/common/api-utils.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
} from "../src/common/cache.js";
import { parseBoolean } from "../src/common/ops.js";
import { fetchRepo } from "../src/fetchers/repo.js";
import { isLocaleAvailable } from "../src/translations.js";

// @ts-ignore
export default async (req, res) => {
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
    type: "username",
    colors: colorOptions,
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const repoData = await fetchRepo(username, repo);
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.PIN_CARD.DEFAULT,
      min: CACHE_TTL.PIN_CARD.MIN,
      max: CACHE_TTL.PIN_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderRepoCard(repoData, {
        hide_border: parseBoolean(hide_border),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        border_radius,
        border_color,
        show_owner: parseBoolean(show_owner),
        locale,
        description_lines_count,
      }),
    );
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
};
