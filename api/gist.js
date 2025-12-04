// @ts-check

import { renderError } from "../src/common/render.js";
import { isLocaleAvailable } from "../src/translations.js";
import { renderGistCard } from "../src/cards/gist.js";
import { fetchGist } from "../src/fetchers/gist.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import { guardAccess } from "../src/common/access.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseBoolean } from "../src/common/ops.js";
import { validateColor, validateTheme } from "../src/common/color.js";

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

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");

  const access = guardAccess({
    res,
    id,
    type: "gist",
    colors: {
      title_color: validateColor(title_color),
      text_color: validateColor(text_color),
      bg_color: validateColor(bg_color),
      border_color: validateColor(border_color),
      theme: validateTheme(theme),
    },
  });
  if (!access.isPassed) {
    return access.result;
  }

  // Locale is already validated above - invalid locales default to undefined
  // No need to check again or reflect user input in error messages

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
    setErrorCacheHeaders(res);
    if (err instanceof Error) {
      // Validate colors before passing to renderError (renderError will also sanitize)
      return res.send(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            title_color: validateColor(title_color),
            text_color: validateColor(text_color),
            bg_color: validateColor(bg_color),
            border_color: validateColor(border_color),
            theme: validateTheme(theme),
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
      );
    }
    // Validate colors before passing to renderError (renderError will also sanitize)
    return res.send(
      renderError({
        message: "An unknown error occurred",
        renderOptions: {
          title_color: validateColor(title_color),
          text_color: validateColor(text_color),
          bg_color: validateColor(bg_color),
          border_color: validateColor(border_color),
          theme: validateTheme(theme),
        },
      }),
    );
  }
};
