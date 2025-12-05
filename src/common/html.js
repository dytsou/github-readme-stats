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
 * Escape CSS/attribute value to prevent XSS in SVG attributes.
 * This function ensures that color values and other CSS values
 * are safe to use in SVG attribute contexts.
 *
 * @param {string|string[]} value The CSS/attribute value to escape.
 * @returns {string} Escaped value safe for use in SVG attributes.
 */
const escapeCSSValue = (value) => {
  // Convert non-string values (e.g., arrays for gradients) to string first
  const strValue = typeof value === "string" ? value : String(value);

  // Escape quotes and special characters that could break out of attribute context
  return strValue
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/\n/g, "\\A ") // Escape newlines
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\f/g, "") // Remove form feeds
    .replace(/</g, "\\3C ") // Escape less-than
    .replace(/>/g, "\\3E "); // Escape greater-than
};

export { encodeHTML, escapeCSSValue };
