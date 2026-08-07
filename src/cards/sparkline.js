// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { escapeCSSValue } from "../common/html.js";
import { clampValue } from "../common/ops.js";
import { buildSparklineCumulativeSeries } from "../fetchers/contribution-math.js";

/** @typedef {import("../fetchers/commit-history.js").CommitSparklineData} CommitSparklineData */

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 165;
const DEFAULT_SPARKLINE_DAYS = 30;

/**
 * @param {unknown} rawDays Query `days` parameter.
 * @returns {number} Clamped window length in days (1–90).
 */
const parseSparklineWindowDays = (rawDays) => {
  if (rawDays === undefined || rawDays === null || rawDays === "") {
    return DEFAULT_SPARKLINE_DAYS;
  }
  if (typeof rawDays !== "string" && typeof rawDays !== "number") {
    return DEFAULT_SPARKLINE_DAYS;
  }
  const n = Number.parseInt(String(rawDays), 10);
  if (!Number.isFinite(n)) {
    return DEFAULT_SPARKLINE_DAYS;
  }
  return clampValue(n, 1, 90);
};

/**
 * @param {number[]} values Cumulative contribution totals.
 * @param {number} width Plot width in pixels.
 * @param {number} height Plot height in pixels.
 * @returns {{ linePoints: string, areaPath: string, last: { x: number, y: number } | null, total: number, max: number }} Sparkline geometry.
 */
const buildSparklineGeometry = (values, width, height) => {
  if (values.length === 0) {
    return { linePoints: "", areaPath: "", last: null, total: 0, max: 0 };
  }

  const total = values.at(-1) ?? 0;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const padX = 14;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const chartBottom = padY + innerH;
  // ponytail: y-axis runs 0..maxVal so a non-zero window baseline is not pinned to the chart bottom

  const coords = values.map((v, i) => ({
    x: padX + (i / Math.max(values.length - 1, 1)) * innerW,
    y: padY + innerH - (v / maxVal) * innerH,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const first = coords[0];
  const last = coords.at(-1);
  const areaPath =
    `M ${first.x},${first.y} ` +
    coords
      .slice(1)
      .map((c) => `L ${c.x},${c.y}`)
      .join(" ") +
    ` L ${last.x},${chartBottom} L ${first.x},${chartBottom} Z`;

  return {
    linePoints,
    areaPath,
    last,
    total,
    max: maxVal,
    min: minVal,
  };
};

/**
 * Builds SVG polyline points for a sparkline.
 *
 * @param {number[]} values Cumulative contribution totals.
 * @param {number} width Plot width in pixels.
 * @param {number} height Plot height in pixels.
 * @returns {string} Space-separated SVG point pairs.
 */
const buildSparklinePoints = (values, width, height) =>
  buildSparklineGeometry(values, width, height).linePoints;

/**
 * Renders a cumulative repo commit sparkline card.
 *
 * @param {CommitSparklineData} data Daily repo commit history.
 * @param {object} options Card styling and window options.
 * @returns {string} SVG markup.
 */
const renderSparklineCard = (data, options = {}) => {
  const windowDays = parseSparklineWindowDays(options.days);
  const { values, windowAdded } = buildSparklineCumulativeSeries(
    data.days,
    windowDays,
  );
  const latestTotal = data.totalCommits ?? values.at(-1) ?? 0;
  const width = Number.parseInt(options.card_width, 10) || DEFAULT_WIDTH;
  const height = Number.parseInt(options.card_height, 10) || DEFAULT_HEIGHT;

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
    disable_animations = false,
  } = options;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const card = new Card({
    defaultTitle: data.name,
    customTitle: custom_title,
    width,
    height,
    border_radius,
    colors: { titleColor, textColor, bgColor, borderColor },
  });

  const safeAccent = escapeCSSValue(titleColor);
  const safeText = escapeCSSValue(textColor);
  card.setCSS(`.spark-end-label { font: 600 10px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeText}; opacity: 0.75 }
    .spark-meta { font: 600 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeText}; opacity: 0.75 }
    .spark-area { fill: ${safeAccent}; opacity: 0.22 }
    .spark { fill: none; stroke: ${safeAccent}; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round }
    .spark-grid { stroke: ${safeText}; stroke-width: 1; opacity: 0.1 }
    .spark-empty { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeText}; opacity: 0.8 }`);
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  if (disable_animations) {
    card.disableAnimations();
  }

  const hasActivity = values.length > 0 && latestTotal > 0;
  const chartPlotH = Math.max(
    (hide_title ? height - 35 : height - 55) - 12,
    32,
  );
  const geo = buildSparklineGeometry(values, width, chartPlotH);

  if (!hasActivity || !geo.linePoints || !geo.last) {
    return card.render(
      `<text data-testid="sparkline-empty" class="spark-empty" x="14" y="24">No commit data</text>`,
    );
  }

  const endLabelY = Math.max(geo.last.y - 6, 8);
  const cx = width / 2;
  const gridLines = [0.25, 0.5, 0.75].map((ratio) => {
    const y = 10 + (chartPlotH - 20) * ratio;
    return `<line class="spark-grid" x1="14" y1="${y}" x2="${width - 14}" y2="${y}"/>`;
  });

  const body = `
    ${gridLines.join("")}
    <path data-testid="sparkline-area" class="spark-area" d="${geo.areaPath}"/>
    <polyline data-testid="sparkline" class="spark" points="${geo.linePoints}"/>
    <circle data-testid="sparkline-end" cx="${geo.last.x}" cy="${geo.last.y}" r="3.5" fill="${safeAccent}"/>
    <text data-testid="sparkline-total" class="spark-end-label" x="${geo.last.x}" y="${endLabelY}" text-anchor="end">${latestTotal} commits</text>
    <text data-testid="sparkline-meta" class="spark-meta" x="${cx}" y="${chartPlotH - 2}" text-anchor="middle">+${windowAdded} in ${windowDays}d</text>`;

  return card.render(body);
};

export { renderSparklineCard, buildSparklinePoints, buildSparklineGeometry };
export default renderSparklineCard;
