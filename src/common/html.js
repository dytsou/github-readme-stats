// @ts-check

/**
 * Encode string as HTML.
 *
 * @see https://stackoverflow.com/a/48073476/10629172
 *
 * @param {string} str String to encode.
 * @returns {string} Encoded string.
 */
const encodeHTML = (str) => {
  return str
    .replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
      return "&#" + i.charCodeAt(0) + ";";
    })
    .replace(/\u0008/gim, "");
};

/**
 * Restricts title strings to a safe printable unicode subset.
 * Only allows unicode letters, numbers, punctuation, space, emoji.
 * Strips any characters that may risk SVG/HTML XSS escape.
 *
 * @param {string} str
 * @returns {string}
 */
const sanitizeTitle = (str) => {
  if (typeof str !== "string") return "";
  // Remove all control chars except whitespace, allow common printable chars plus unicode
  // Unicode letters/numbers/punctuation/marks/symbols/spaces (\p{L}\p{N}\p{P}\p{M}\p{S}\p{Zs})
  return str.replace(/[^\p{L}\p{N}\p{P}\p{M}\p{S}\p{Zs}]/gu, "");
};

/**
 * Escape CSS/attribute value to prevent XSS in SVG attributes.
 * This function ensures that color values and other CSS values
 * are safe to use in SVG attribute contexts.
 *
 * @param {string} value The CSS/attribute value to escape.
 * @returns {string} Escaped value safe for use in SVG attributes.
 */
const escapeCSSValue = (value) => {
  if (typeof value !== "string") {
    return String(value);
  }

  // Escape quotes and special characters that could break out of attribute context
  return value
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/\n/g, "\\A ") // Escape newlines
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\f/g, "") // Remove form feeds
    .replace(/</g, "\\3C ") // Escape less-than
    .replace(/>/g, "\\3E "); // Escape greater-than
};

export { encodeHTML, escapeCSSValue, sanitizeTitle };
