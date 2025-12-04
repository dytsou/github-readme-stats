// @ts-check

import { renderRepoCard } from "../src/cards/repo.js";
import { guardAccess } from "../src/common/access.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { isValidHexColor } from "../src/common/color.js";
import { parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchRepo } from "../src/fetchers/repo.js";
import { isLocaleAvailable } from "../src/translations.js";

/**
 * Validates and sanitizes color parameters to prevent XSS.
 * Returns undefined for invalid colors, allowing renderError to use safe defaults.
 *
 * @param {string|undefined} color The color value to validate.
 * @returns {string|undefined} Validated color or undefined.
 */
const validateColor = (color) => {
  if (!color || typeof color !== "string") {
    return undefined;
  }
  // Remove leading # if present for validation
  const hexColor = color.replace(/^#/, "");
  // Validate hex color format
  return isValidHexColor(hexColor) ? color : undefined;
};

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
    locale,
    border_radius,
    border_color,
    description_lines_count,
  } = req.query;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");

  const access = guardAccess({
    res,
    id: username,
    type: "username",
    colors: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.isPassed) {
    return access.result;
  }

  if (locale && !isLocaleAvailable(locale)) {
    // Validate colors before passing to renderError (renderError will also sanitize)
    return res.send(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
        renderOptions: {
          title_color: validateColor(title_color),
          text_color: validateColor(text_color),
          bg_color: validateColor(bg_color),
          border_color: validateColor(border_color),
          theme,
        },
      }),
    );
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
        locale: locale ? locale.toLowerCase() : null,
        description_lines_count,
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
            theme,
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
          theme,
        },
      }),
    );
  }
};
