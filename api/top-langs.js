// @ts-check

import { renderTopLanguages } from "../src/cards/top-languages.js";
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
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
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
    locale,
    border_radius,
    border_color,
    disable_animations,
    hide_progress,
    stats_format,
  } = req.query;

  // Validate username is provided
  if (!username) {
    // Validate colors before passing to renderError (renderError will also sanitize)
    return res.send(
      renderError({
        message: "Missing username parameter",
        secondaryMessage: "Please provide a username",
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

  // Set Content-Type early for Camo CDN compatibility
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
        secondaryMessage: "Locale not found",
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

  if (
    layout !== undefined &&
    (typeof layout !== "string" ||
      !["compact", "normal", "donut", "donut-vertical", "pie"].includes(layout))
  ) {
    // Validate colors before passing to renderError (renderError will also sanitize)
    return res.send(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect layout input",
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

  if (
    stats_format !== undefined &&
    (typeof stats_format !== "string" ||
      !["bytes", "percentages"].includes(stats_format))
  ) {
    // Validate colors before passing to renderError (renderError will also sanitize)
    return res.send(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect stats_format input",
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
        title_color,
        text_color,
        bg_color,
        theme,
        layout,
        langs_count,
        border_radius,
        border_color,
        locale: locale ? locale.toLowerCase() : null,
        disable_animations: parseBoolean(disable_animations),
        hide_progress: parseBoolean(hide_progress),
        stats_format,
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
