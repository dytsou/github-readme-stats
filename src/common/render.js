// @ts-check

import escapeHtml from "escape-html";
import { SECONDARY_ERROR_MESSAGES, TRY_AGAIN_LATER } from "./error.js";
import { getCardColors } from "./color.js";
import { escapeCSSValue } from "./html.js";
import { clampValue } from "./ops.js";

/**
 * Auto layout utility, allows us to layout things vertically or horizontally with
 * proper gaping.
 *
 * @param {object} props Function properties.
 * @param {string[]} props.items Array of items to layout.
 * @param {number} props.gap Gap between items.
 * @param {"column" | "row"=} props.direction Direction to layout items.
 * @param {number[]=} props.sizes Array of sizes for each item.
 * @returns {string[]} Array of items with proper layout.
 */
const flexLayout = ({ items, gap, direction, sizes = [] }) => {
  let lastSize = 0;
  // filter() for filtering out empty strings
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") {
      transform = `translate(0, ${lastSize})`;
    }
    lastSize += size + gap;
    return `<g transform="${transform}">${item}</g>`;
  });
};

/**
 * Creates a node to display the primary programming language of the repository/gist.
 *
 * **Security Note:** This function safely handles untrusted input by HTML-encoding
 * the `langName` parameter and CSS-escaping the `langColor` parameter.
 * Data from external APIs (like GitHub) is sanitized before being inserted into the SVG.
 *
 * @param {string} langName Language name (will be HTML-encoded).
 * @param {string} langColor Language color (will be CSS-escaped).
 * @returns {string} Language display SVG object.
 */
const createLanguageNode = (langName, langColor) => {
  const safeLangColor = escapeCSSValue(langColor);
  return `
    <g data-testid="primary-lang">
      <circle data-testid="lang-color" cx="0" cy="-5" r="6" fill="${safeLangColor}" />
      <text data-testid="lang-name" class="gray" x="15">${escapeHtml(langName)}</text>
    </g>
    `;
};

/**
 * Create a node to indicate progress in percentage along a horizontal line.
 *
 * @param {Object} params Object that contains the createProgressNode parameters.
 * @param {number} params.x X-axis position.
 * @param {number} params.y Y-axis position.
 * @param {number} params.width Width of progress bar.
 * @param {string} params.color Progress color.
 * @param {number} params.progress Progress value.
 * @param {string} params.progressBarBackgroundColor Progress bar bg color.
 * @param {number} params.delay Delay before animation starts.
 * @returns {string} Progress node.
 */
const createProgressNode = ({
  x,
  y,
  width,
  color,
  progress,
  progressBarBackgroundColor,
  delay,
}) => {
  const progressPercentage = clampValue(progress, 2, 100);

  return `
    <svg width="${width}" x="${x}" y="${y}">
      <rect rx="5" ry="5" x="0" y="0" width="${width}" height="8" fill="${progressBarBackgroundColor}"></rect>
      <svg data-testid="lang-progress" width="${progressPercentage}%">
        <rect
            height="8"
            fill="${color}"
            rx="5" ry="5" x="0" y="0"
            class="lang-progress"
            style="animation-delay: ${delay}ms;"
        />
      </svg>
    </svg>
  `;
};

/**
 * Creates an icon with label to display repository/gist stats like forks, stars, etc.
 *
 * @param {string} icon The icon to display.
 * @param {number|string} label The label to display.
 * @param {string} testid The testid to assign to the label.
 * @param {number} iconSize The size of the icon.
 * @returns {string} Icon with label SVG object.
 */
const iconWithLabel = (icon, label, testid, iconSize) => {
  if (typeof label === "number" && label <= 0) {
    return "";
  }
  const iconSvg = `
      <svg
        class="icon"
        y="-12"
        viewBox="0 0 16 16"
        version="1.1"
        width="${iconSize}"
        height="${iconSize}"
      >
        ${icon}
      </svg>
    `;
  const text = `<text data-testid="${testid}" class="gray">${label}</text>`;
  return flexLayout({ items: [iconSvg, text], gap: 20 }).join("");
};

// Script parameters.
const ERROR_CARD_LENGTH = 576.5;

const UPSTREAM_API_ERRORS = [
  TRY_AGAIN_LATER,
  SECONDARY_ERROR_MESSAGES.MAX_RETRY,
];

/**
 * Renders error message on the card.
 *
 * **Security Note:** This function safely handles untrusted input by HTML-encoding
 * the `message` and `secondaryMessage` parameters using the escape-html library.
 * All user-provided or external data is sanitized before being inserted into the SVG.
 *
 * @param {object} args Function arguments.
 * @param {string} args.message Main error message (will be HTML-encoded).
 * @param {string} [args.secondaryMessage=""] The secondary error message (will be HTML-encoded).
 * @param {object} [args.renderOptions={}] Render options.
 * @param {string=} args.renderOptions.title_color Card title color.
 * @param {string=} args.renderOptions.text_color Card text color.
 * @param {string=} args.renderOptions.bg_color Card background color.
 * @param {string=} args.renderOptions.border_color Card border color.
 * @param {Parameters<typeof getCardColors>[0]["theme"]=} args.renderOptions.theme Card theme.
 * @param {boolean=} args.renderOptions.show_repo_link Whether to show repo link or not.
 * @returns {string} The SVG markup.
 */
const renderError = ({
  message,
  secondaryMessage = "",
  renderOptions = {},
}) => {
  const {
    title_color,
    text_color,
    bg_color,
    border_color,
    theme = "default",
    show_repo_link = true,
  } = renderOptions;

  // returns theme based colors with proper overrides and defaults
  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    icon_color: "",
    bg_color,
    border_color,
    ring_color: "",
    theme,
  });

  // Sanitize color values to prevent XSS in SVG attributes
  const safeTitleColor = escapeCSSValue(titleColor);
  const safeTextColor = escapeCSSValue(textColor);
  // Handle both string colors and gradient arrays (for gradients, use first color as fallback)
  const safeBgColor =
    typeof bgColor === "string"
      ? escapeCSSValue(bgColor)
      : Array.isArray(bgColor) && bgColor.length > 0
        ? escapeCSSValue(`#${bgColor[0]}`)
        : "#1f2328"; // Default fallback color
  const safeBorderColor = escapeCSSValue(borderColor);

  return `
    <svg width="${ERROR_CARD_LENGTH}"  height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="${safeBgColor}" xmlns="http://www.w3.org/2000/svg">
    <style>
    .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeTitleColor} }
    .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeTextColor} }
    .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${
      ERROR_CARD_LENGTH - 1
    }" height="99%" rx="4.5" fill="${safeBgColor}" stroke="${safeBorderColor}"/>
    <text x="25" y="45" class="text">Something went wrong!${
      UPSTREAM_API_ERRORS.includes(secondaryMessage) || !show_repo_link
        ? ""
        : " file an issue at https://tiny.one/readme-stats"
    }</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${escapeHtml(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${escapeHtml(secondaryMessage)}</tspan>
    </text>
    </svg>
  `;
};

/**
 * Retrieve text length.
 *
 * @see https://stackoverflow.com/a/48172630/10629172
 * @param {string} str String to measure.
 * @param {number} fontSize Font size.
 * @returns {number} Text length.
 */
const measureText = (str, fontSize = 10) => {
  // prettier-ignore
  const widths = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0.2796875, 0.2765625,
    0.3546875, 0.5546875, 0.5546875, 0.8890625, 0.665625, 0.190625,
    0.3328125, 0.3328125, 0.3890625, 0.5828125, 0.2765625, 0.3328125,
    0.2765625, 0.3015625, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
    0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
    0.2765625, 0.2765625, 0.584375, 0.5828125, 0.584375, 0.5546875,
    1.0140625, 0.665625, 0.665625, 0.721875, 0.721875, 0.665625,
    0.609375, 0.7765625, 0.721875, 0.2765625, 0.5, 0.665625,
    0.5546875, 0.8328125, 0.721875, 0.7765625, 0.665625, 0.7765625,
    0.721875, 0.665625, 0.609375, 0.721875, 0.665625, 0.94375,
    0.665625, 0.665625, 0.609375, 0.2765625, 0.3546875, 0.2765625,
    0.4765625, 0.5546875, 0.3328125, 0.5546875, 0.5546875, 0.5,
    0.5546875, 0.5546875, 0.2765625, 0.5546875, 0.5546875, 0.221875,
    0.240625, 0.5, 0.221875, 0.8328125, 0.5546875, 0.5546875,
    0.5546875, 0.5546875, 0.3328125, 0.5, 0.2765625, 0.5546875,
    0.5, 0.721875, 0.5, 0.5, 0.5, 0.3546875, 0.259375, 0.353125, 0.5890625,
  ];

  const avg = 0.5279276315789471;
  return (
    str
      .split("")
      .map((c) =>
        c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg,
      )
      .reduce((cur, acc) => acc + cur) * fontSize
  );
};

export {
  ERROR_CARD_LENGTH,
  renderError,
  createLanguageNode,
  createProgressNode,
  iconWithLabel,
  flexLayout,
  measureText,
};
