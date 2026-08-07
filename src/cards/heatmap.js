// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors, validateColor } from "../common/color.js";
import { parseArray } from "../common/ops.js";

/** @typedef {import("../fetchers/contributions.js").ContributionsData} ContributionsData */

const CELL = 11;
const GAP = 3;
const COLS = 53;
const ROWS = 7;

/** GitHub-like green ramp (hex without #). */
const DEFAULT_LEVELS = ["161b22", "0e4429", "006d32", "26a641", "39d353"];

/**
 * @param {number} count Daily contribution count for the cell.
 * @param {string[]} levels Colors with # prefix.
 * @returns {string} Fill color for the heatmap cell.
 */
const levelColor = (count, levels) => {
  if (count <= 0) {
    return levels[0];
  }
  if (count <= 2) {
    return levels[1];
  }
  if (count <= 5) {
    return levels[2];
  }
  if (count <= 9) {
    return levels[3];
  }
  return levels[4];
};

/**
 * @param {string | string[] | undefined} heatmapColors Comma-separated or array of hex colors.
 * @returns {string[]} Five colors with # prefix.
 */
const resolveHeatmapLevels = (heatmapColors) => {
  const parsed = Array.isArray(heatmapColors)
    ? heatmapColors
    : parseArray(heatmapColors);
  const levels = [...DEFAULT_LEVELS];
  if (parsed) {
    parsed.slice(0, 5).forEach((color, index) => {
      const validated = validateColor(color);
      if (validated) {
        levels[index] = validated;
      }
    });
  }
  return levels.map((hex) => `#${hex}`);
};

/**
 * Renders a GitHub-style contribution heatmap card.
 *
 * @param {ContributionsData} data Contribution calendar payload.
 * @param {object} options Card styling and color options.
 * @returns {string} SVG markup.
 */
const renderHeatmapCard = (data, options = {}) => {
  const weeks = data.calendar.weeks.slice(-COLS);
  const width = COLS * (CELL + GAP) + 30;
  const height = ROWS * (CELL + GAP) + 60;
  const levels = resolveHeatmapLevels(options.heatmap_colors);

  const {
    title_color,
    text_color,
    bg_color,
    theme,
    border_radius,
    border_color,
    hide_border = false,
    hide_title = false,
    custom_title,
  } = options;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const card = new Card({
    defaultTitle: "Contribution Heatmap",
    customTitle: custom_title,
    width,
    height,
    border_radius,
    colors: { titleColor, textColor, bgColor, borderColor },
  });
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);

  const cells = weeks
    .flatMap((week, wi) =>
      week.contributionDays.map((day, di) => {
        const x = wi * (CELL + GAP);
        const y = di * (CELL + GAP);
        const fill = levelColor(day.contributionCount, levels);
        return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`;
      }),
    )
    .join("");

  return card.render(
    `<g data-testid="heatmap-grid" transform="translate(15, 5)">${cells}</g>`,
  );
};

export { renderHeatmapCard, levelColor, resolveHeatmapLevels, DEFAULT_LEVELS };
export default renderHeatmapCard;
