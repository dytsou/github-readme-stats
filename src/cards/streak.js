// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { encodeHTML, escapeCSSValue } from "../common/html.js";
import { I18n } from "../common/I18n.js";
import { icons } from "../common/icons.js";
import { streakCardLocales } from "../translations.js";

/** @typedef {import("../fetchers/contributions.js").ContributionsData} ContributionsData */

const DEFAULT_WIDTH = 300;
const CARD_HEIGHT = 165;

/**
 * Renders a GitHub contribution streak card.
 *
 * @param {ContributionsData | ContributionsData["streak"]} input Full payload or streak stats only.
 * @param {object} options Card styling and visibility options.
 * @returns {string} SVG markup.
 */
const renderStreakCard = (input, options = {}) => {
  const streak = "streak" in input ? input.streak : input;
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
    locale,
    hide_total = false,
    hide_current = false,
    hide_longest = false,
    mode = "daily",
    card_width,
  } = options;

  const width = Number.parseInt(card_width, 10) || DEFAULT_WIDTH;
  const cx = width / 2;
  const isWeekly = mode === "weekly";

  const i18n = new I18n({
    locale,
    translations: streakCardLocales,
  });

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const card = new Card({
    defaultTitle: i18n.t("streakcard.title"),
    customTitle: custom_title,
    titlePrefixIcon: icons.commits,
    width,
    height: CARD_HEIGHT,
    border_radius,
    colors: { titleColor, textColor, bgColor, borderColor },
  });

  const safeAccent = escapeCSSValue(titleColor);
  const safeText = escapeCSSValue(textColor);
  card.setCSS(`.hero-label { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeText}; opacity: 0.75 }
    .hero { font: 800 48px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeAccent} }
    .hero-unit { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeAccent}; opacity: 0.95 }
    .footer { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeText}; opacity: 0.8 }`);
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);

  const unit = isWeekly
    ? i18n.t("streakcard.weeks")
    : i18n.t("streakcard.days");
  const heroValue = hide_current ? "" : String(streak.current);

  const heroBlock = hide_current
    ? ""
    : `
    <g data-testid="streak-current">
      <text class="hero-label" x="${cx}" y="8" text-anchor="middle">${encodeHTML(i18n.t("streakcard.current"))}</text>
      <text x="${cx}" y="48" text-anchor="middle">
        <tspan class="hero">${encodeHTML(heroValue)}</tspan>
        <tspan class="hero-unit" dx="6" dy="4">${encodeHTML(unit)}</tspan>
      </text>
    </g>`;

  /** @type {string[]} */
  const footerParts = [];
  if (!hide_total) {
    footerParts.push(
      `${encodeHTML(i18n.t("streakcard.total"))} ${encodeHTML(String(streak.total))}`,
    );
  }
  if (!hide_longest) {
    footerParts.push(
      `${encodeHTML(i18n.t("streakcard.longest"))} ${encodeHTML(String(streak.longest))}`,
    );
  }

  const footerY = hide_current ? 40 : 82;
  const footer =
    footerParts.length > 0
      ? `<text data-testid="streak-footer" class="footer" x="${cx}" y="${footerY}" text-anchor="middle">${footerParts.join(" · ")}</text>`
      : "";

  return card.render(`${heroBlock}${footer}`);
};

export { renderStreakCard };
export default renderStreakCard;
