// @ts-check

import { renderGistCard } from "../src/cards/gist.js";
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
import { fetchGist } from "../src/fetchers/gist.js";
import { isLocaleAvailable } from "../src/translations.js";

// @ts-ignore
export default async (req, res) => {
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
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.GIST_CARD.DEFAULT,
      min: CACHE_TTL.GIST_CARD.MIN,
      max: CACHE_TTL.GIST_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderGistCard(gistData, {
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        border_radius,
        border_color,
        locale,
        show_owner: parseBoolean(show_owner),
        hide_border: parseBoolean(hide_border),
      }),
    );
  } catch (err) {
    return handleApiError({ res, error: err, colorOptions });
  }
};
