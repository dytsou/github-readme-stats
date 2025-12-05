// @ts-check

/**
 * @file Shared API utilities for request handling, validation, and error responses.
 * Centralizes common patterns to reduce code duplication and improve maintainability.
 */

import { renderError } from "./render.js";
import { validateColor, validateTheme } from "./color.js";
import { MissingParamError, retrieveSecondaryMessage } from "./error.js";
import { setErrorCacheHeaders } from "./cache.js";

/**
 * @typedef {Object} ColorOptions
 * @property {string|undefined} title_color
 * @property {string|undefined} text_color
 * @property {string|undefined} bg_color
 * @property {string|undefined} border_color
 * @property {string|undefined} theme
 */

/**
 * @typedef {Object} RawColorParams
 * @property {string} [title_color]
 * @property {string} [text_color]
 * @property {string} [bg_color]
 * @property {string} [border_color]
 * @property {string} [theme]
 */

/**
 * Creates validated color options from raw query parameters.
 * All color values are validated and sanitized to prevent XSS attacks.
 *
 * @param {RawColorParams} params - Raw color parameters from query string.
 * @returns {ColorOptions} Validated and sanitized color options.
 */
const createValidatedColorOptions = ({
  title_color,
  text_color,
  bg_color,
  border_color,
  theme,
}) => ({
  title_color: validateColor(title_color),
  text_color: validateColor(text_color),
  bg_color: validateColor(bg_color),
  border_color: validateColor(border_color),
  theme: validateTheme(theme),
});

/**
 * @typedef {Object} ErrorResponseOptions
 * @property {any} res - Express response object.
 * @property {Error|unknown} error - The error that occurred.
 * @property {ColorOptions} colorOptions - Validated color options for error card styling.
 */

/**
 * Patterns that indicate error messages containing user-controlled data.
 * These patterns are replaced with safe generic alternatives to prevent XSS.
 * @type {ReadonlyArray<{pattern: RegExp, replacement: string}>}
 */
const UNSAFE_MESSAGE_PATTERNS = [
  {
    pattern: /translation not found for/i,
    replacement: "Invalid locale specified",
  },
  {
    pattern: /Could not resolve to a User with the login of/i,
    replacement: "User not found",
  },
];

/**
 * Sanitizes error messages to prevent XSS by filtering out messages that
 * contain user-controlled data (like usernames or locales embedded in errors).
 * Other error messages in this codebase are hardcoded and safe.
 * Note: renderError also applies HTML encoding as an additional safety layer.
 *
 * @param {string} message - The error message to sanitize.
 * @returns {string} A safe error message.
 */
const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== "string") {
    return "An error occurred";
  }

  // Replace messages containing user-controlled data with safe alternatives
  for (const { pattern, replacement } of UNSAFE_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return replacement;
    }
  }

  // Other error messages in this codebase are hardcoded strings (safe)
  // renderError will HTML-encode the output as an additional safety layer
  return message;
};

/**
 * Handles API errors by setting cache headers and sending a rendered error response.
 * Centralizes error handling logic to ensure consistent behavior across all API endpoints.
 *
 * @param {ErrorResponseOptions} options - Error handling options.
 * @returns {any} The response result.
 */
const handleApiError = ({ res, error, colorOptions }) => {
  setErrorCacheHeaders(res);

  if (error instanceof Error) {
    // Sanitize error message to prevent XSS from user-controlled data in exceptions
    const safeMessage = sanitizeErrorMessage(error.message);
    const rawSecondary = retrieveSecondaryMessage(error);
    const safeSecondary = rawSecondary
      ? sanitizeErrorMessage(rawSecondary)
      : undefined;

    return res.send(
      renderError({
        message: safeMessage,
        secondaryMessage: safeSecondary,
        renderOptions: {
          ...colorOptions,
          show_repo_link: !(error instanceof MissingParamError),
        },
      }),
    );
  }

  return res.send(
    renderError({
      message: "An unknown error occurred",
      renderOptions: colorOptions,
    }),
  );
};

/**
 * @typedef {Object} ValidationErrorOptions
 * @property {any} res - Express response object.
 * @property {string} message - Primary error message.
 * @property {string} [secondaryMessage] - Secondary error message.
 * @property {ColorOptions} colorOptions - Validated color options for error card styling.
 */

/**
 * Sends a validation error response with consistent styling.
 * Used for parameter validation failures before main processing.
 *
 * @param {ValidationErrorOptions} options - Validation error options.
 * @returns {any} The response result.
 */
const sendValidationError = ({
  res,
  message,
  secondaryMessage = "",
  colorOptions,
}) => {
  return res.send(
    renderError({
      message,
      secondaryMessage,
      renderOptions: colorOptions,
    }),
  );
};

/**
 * Sets the standard SVG content type header.
 *
 * @param {any} res - Express response object.
 */
const setSvgContentType = (res) => {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
};

/**
 * Sets the standard JSON content type header.
 *
 * @param {any} res - Express response object.
 */
const setJsonContentType = (res) => {
  res.setHeader("Content-Type", "application/json");
};

/**
 * Parses and validates a numeric parameter with bounds checking.
 *
 * @param {string|undefined} value - The value to parse.
 * @param {number|undefined} defaultValue - Default value if parsing fails.
 * @param {number} [min] - Minimum allowed value.
 * @param {number} [max] - Maximum allowed value.
 * @returns {number|undefined} The parsed and clamped value.
 */
const parseNumericParam = (value, defaultValue, min, max) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  let result = parsed;
  if (min !== undefined) {
    result = Math.max(min, result);
  }
  if (max !== undefined) {
    result = Math.min(max, result);
  }
  return result;
};

export {
  createValidatedColorOptions,
  handleApiError,
  sendValidationError,
  setSvgContentType,
  setJsonContentType,
  parseNumericParam,
};
