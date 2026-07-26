// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { CustomError } from "../common/error.js";
import { kFormatter } from "../common/fmt.js";
import { I18n } from "../common/I18n.js";
import { icons, rankIcon } from "../common/icons.js";
import { escapeCSSValue } from "../common/html.js";
import { clampValue } from "../common/ops.js";
import { flexLayout, measureText } from "../common/render.js";
import { statCardLocales, wakatimeCardLocales } from "../translations.js";

const CARD_MIN_WIDTH = 287;
const CARD_DEFAULT_WIDTH = 287;
const RANK_CARD_MIN_WIDTH = 420;
const RANK_CARD_DEFAULT_WIDTH = 450;
const RANK_ONLY_CARD_MIN_WIDTH = 290;
const RANK_ONLY_CARD_DEFAULT_WIDTH = 290;

/**
 * Long locales that need more space for text.
 *
 * @type {Set<keyof typeof wakatimeCardLocales["wakatimecard.title"]>}
 */
const LONG_LOCALES = new Set([
  "az",
  "bg",
  "cs",
  "de",
  "el",
  "es",
  "fil",
  "fi",
  "fr",
  "hu",
  "id",
  "ja",
  "ml",
  "my",
  "nl",
  "pl",
  "pt-br",
  "pt-pt",
  "ru",
  "sr",
  "sr-latn",
  "sw",
  "ta",
  "uk-ua",
  "uz",
  "zh-tw",
]);

/**
 * Create a stats card text item.
 *
 * @param {object} params Object that contains the createTextNode parameters.
 * @param {string} params.icon The icon to display.
 * @param {string} params.label The label to display.
 * @param {number} params.value The value to display.
 * @param {string} params.id The id of the stat.
 * @param {string=} params.unitSymbol The unit symbol of the stat.
 * @param {number} params.index The index of the stat.
 * @param {boolean} params.showIcons Whether to show icons.
 * @param {number} params.shiftValuePos Number of pixels the value has to be shifted to the right.
 * @param {boolean} params.bold Whether to bold the label.
 * @param {string} params.numberFormat The format of numbers on card.
 * @param {number=} params.numberPrecision The precision of numbers on card.
 * @returns {string} The stats card text item SVG object.
 */
const createTextNode = ({
  icon,
  label,
  value,
  id,
  unitSymbol,
  index,
  showIcons,
  shiftValuePos,
  bold,
  numberFormat,
  numberPrecision,
}) => {
  const precision =
    typeof numberPrecision === "number" && !Number.isNaN(numberPrecision)
      ? clampValue(numberPrecision, 0, 2)
      : undefined;
  const kValue =
    numberFormat.toLowerCase() === "long" || id === "prs_merged_percentage"
      ? value
      : kFormatter(value, precision);
  const staggerDelay = (index + 3) * 150;

  const labelOffset = showIcons ? `x="25"` : "";
  const iconSvg = showIcons
    ? `
    <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
      ${icon}
    </svg>
  `
    : "";
  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      ${iconSvg}
      <text class="stat ${
        bold ? " bold" : "not_bold"
      }" ${labelOffset} y="12.5">${label}:</text>
      <text
        class="stat ${bold ? " bold" : "not_bold"}"
        x="${(showIcons ? 140 : 120) + shiftValuePos}"
        y="12.5"
        data-testid="${id}"
      >${kValue}${unitSymbol ? ` ${unitSymbol}` : ""}</text>
    </g>
  `;
};

/**
 * Calculates progress along the boundary of the circle, i.e. its circumference.
 *
 * @param {number} value The rank value to calculate progress for.
 * @returns {number} Progress value.
 */
const calculateCircleProgress = (value) => {
  const radius = 40;
  const c = Math.PI * (radius * 2);

  if (value < 0) {
    value = 0;
  }
  if (value > 100) {
    value = 100;
  }

  return ((100 - value) / 100) * c;
};

/**
 * Retrieves the animation to display progress along the circumference of circle
 * from the beginning to the given value in a clockwise direction.
 *
 * @param {{progress: number}} progress The progress value to animate to.
 * @returns {string} Progress animation css.
 */
const getProgressAnimation = ({ progress }) => {
  return `
    @keyframes rankAnimation {
      from {
        stroke-dashoffset: ${calculateCircleProgress(0)};
      }
      to {
        stroke-dashoffset: ${calculateCircleProgress(progress)};
      }
    }
  `;
};

/**
 * Retrieves CSS styles for a card.
 *
 * @param {Object} colors The colors to use for the card.
 * @param {string} colors.titleColor The title color.
 * @param {string} colors.textColor The text color.
 * @param {string} colors.iconColor The icon color.
 * @param {string} colors.ringColor The ring color.
 * @param {boolean} colors.show_icons Whether to show icons.
 * @param {number} colors.progress The progress value to animate to.
 * @returns {string} Card CSS styles.
 */
const getStyles = ({
  // eslint-disable-next-line no-unused-vars
  titleColor,
  textColor,
  iconColor,
  ringColor,
  show_icons,
  progress,
}) => {
  // Sanitize color values to prevent XSS
  const safeTextColor = escapeCSSValue(textColor);
  const safeIconColor = escapeCSSValue(iconColor);
  const safeRingColor = escapeCSSValue(ringColor);
  return `
    .stat {
      font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${safeTextColor};
    }
    @supports(-moz-appearance: auto) {
      /* Selector detects Firefox */
      .stat { font-size:12px; }
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .rank-text {
      font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${safeTextColor};
      animation: scaleInAnimation 0.3s ease-in-out forwards;
    }
    .rank-percentile-header {
      font-size: 14px;
    }
    .rank-percentile-text {
      font-size: 16px;
    }
    
    .not_bold { font-weight: 400 }
    .bold { font-weight: 700 }
    .icon {
      fill: ${safeIconColor};
      display: ${show_icons ? "block" : "none"};
    }

    .rank-circle-rim {
      stroke: ${safeRingColor};
      fill: none;
      stroke-width: 6;
      opacity: 0.2;
    }
    .rank-circle {
      stroke: ${safeRingColor};
      stroke-dasharray: 250;
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      opacity: 0.8;
      transform-origin: -10px 8px;
      transform: rotate(-90deg);
      animation: rankAnimation 1s forwards ease-in-out;
    }
    ${process.env.NODE_ENV === "test" ? "" : getProgressAnimation({ progress })}
  `;
};

/**
 * Return the label for commits according to the selected options
 *
 * @param {boolean} include_all_commits Option to include all years
 * @param {number|undefined} commits_year Option to include only selected year
 * @param {I18n} i18n The I18n instance.
 * @returns {string} The label corresponding to the options.
 */
const getTotalCommitsYearLabel = (include_all_commits, commits_year, i18n) => {
  if (include_all_commits) {
    return "";
  }
  if (commits_year) {
    return ` (${commits_year})`;
  }
  return ` (${i18n.t("wakatimecard.lastyear")})`;
};

/**
 * @typedef {import('../fetchers/types').StatsData} StatsData
 * @typedef {import('./types').StatCardOptions} StatCardOptions
 */

/**
 * Renders the stats card.
 *
 * @param {StatsData} stats The stats data.
 * @param {Partial<StatCardOptions>} options The card options.
 * @returns {string} The stats card SVG object.
 */

/**
 * Builds the optional/extra stats entries controlled by the `show` option.
 *
 * @param {object} args - Stats source values and options.
 * @returns {Record<string, object>} Extra stats entries to merge into STATS.
 */
const buildOptionalStatsEntries = ({
  show,
  i18n,
  totalPRsMerged,
  mergedPRsPercentage,
  number_precision,
  totalReviews,
  totalDiscussionsStarted,
  totalDiscussionsAnswered,
}) => {
  /** @type {Record<string, object>} */
  const optional = {};

  if (show.includes("prs_merged")) {
    optional.prs_merged = {
      icon: icons.prs_merged,
      label: i18n.t("statcard.prs-merged"),
      value: totalPRsMerged,
      id: "prs_merged",
    };
  }

  if (show.includes("prs_merged_percentage")) {
    optional.prs_merged_percentage = {
      icon: icons.prs_merged_percentage,
      label: i18n.t("statcard.prs-merged-percentage"),
      value: mergedPRsPercentage.toFixed(
        typeof number_precision === "number" && !Number.isNaN(number_precision)
          ? clampValue(number_precision, 0, 2)
          : 2,
      ),
      id: "prs_merged_percentage",
      unitSymbol: "%",
    };
  }

  if (show.includes("reviews")) {
    optional.reviews = {
      icon: icons.reviews,
      label: i18n.t("statcard.reviews"),
      value: totalReviews,
      id: "reviews",
    };
  }

  if (show.includes("discussions_started")) {
    optional.discussions_started = {
      icon: icons.discussions_started,
      label: i18n.t("statcard.discussions-started"),
      value: totalDiscussionsStarted,
      id: "discussions_started",
    };
  }

  if (show.includes("discussions_answered")) {
    optional.discussions_answered = {
      icon: icons.discussions_answered,
      label: i18n.t("statcard.discussions-answered"),
      value: totalDiscussionsAnswered,
      id: "discussions_answered",
    };
  }

  return optional;
};

/**
 * Resolves stats card width from the requested value and computed defaults.
 *
 * @param {number|undefined} card_width - Requested width.
 * @param {number} defaultCardWidth - Default width.
 * @param {number} minCardWidth - Minimum allowed width.
 * @returns {number} Resolved width.
 */
const resolveStatsCardWidth = (card_width, defaultCardWidth, minCardWidth) => {
  let width =
    card_width === undefined || card_width === null || Number.isNaN(card_width)
      ? defaultCardWidth
      : card_width;
  if (width < minCardWidth) {
    return minCardWidth;
  }
  return width;
};

/**
 * Creates i18n instance for stats card.
 *
 * @param {string} name Username.
 * @param {string|undefined} locale Locale.
 * @returns {I18n} I18n instance.
 */
const createStatsCardI18n = (name, locale) => {
  const apostrophe = /s$/i.test(name.trim()) ? "" : "s";
  return new I18n({
    locale,
    translations: {
      ...statCardLocales({ name, apostrophe }),
      ...wakatimeCardLocales,
    },
  });
};

const renderStatsCard = (stats, options = {}) => {
  const {
    name,
    totalStars,
    totalCommits,
    totalIssues,
    totalPRs,
    totalPRsMerged,
    mergedPRsPercentage,
    totalReviews,
    totalDiscussionsStarted,
    totalDiscussionsAnswered,
    contributedTo,
    rank,
  } = stats;
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    card_width,
    hide_rank = false,
    include_all_commits = false,
    commits_year,
    line_height = 25,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold = true,
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
    number_format = "short",
    number_precision,
    locale,
    disable_animations = false,
    rank_icon = "default",
    show = [],
  } = options;

  const lheight = Number.parseInt(String(line_height), 10);

  // returns theme based colors with proper overrides and defaults
  const { titleColor, iconColor, textColor, bgColor, borderColor, ringColor } =
    getCardColors({
      title_color,
      text_color,
      icon_color,
      bg_color,
      border_color,
      ring_color,
      theme,
    });

  const i18n = createStatsCardI18n(name, locale);

  // Meta data for creating text nodes with createTextNode function
  const STATS = {};

  STATS.stars = {
    icon: icons.star,
    label: i18n.t("statcard.totalstars"),
    value: totalStars,
    id: "stars",
  };
  STATS.commits = {
    icon: icons.commits,
    label: `${i18n.t("statcard.commits")}${getTotalCommitsYearLabel(
      include_all_commits,
      commits_year,
      i18n,
    )}`,
    value: totalCommits,
    id: "commits",
  };
  STATS.prs = {
    icon: icons.prs,
    label: i18n.t("statcard.prs"),
    value: totalPRs,
    id: "prs",
  };

  Object.assign(
    STATS,
    buildOptionalStatsEntries({
      show,
      i18n,
      totalPRsMerged,
      mergedPRsPercentage,
      number_precision,
      totalReviews,
      totalDiscussionsStarted,
      totalDiscussionsAnswered,
    }),
  );

  STATS.issues = {
    icon: icons.issues,
    label: i18n.t("statcard.issues"),
    value: totalIssues,
    id: "issues",
  };

  STATS.contribs = {
    icon: icons.contribs,
    label: i18n.t("statcard.contribs"),
    value: contributedTo,
    id: "contribs",
  };

  // @ts-ignore
  const isLongLocale = locale ? LONG_LOCALES.has(locale) : false;

  // filter out hidden stats defined by user & create the text nodes
  const statItems = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key, index) => {
      // @ts-ignore
      const stats = STATS[key];

      // create the text nodes, and pass index so that we can calculate the line spacing
      return createTextNode({
        icon: stats.icon,
        label: stats.label,
        value: stats.value,
        id: stats.id,
        unitSymbol: stats.unitSymbol,
        index,
        showIcons: show_icons,
        shiftValuePos: 79.01 + (isLongLocale ? 50 : 0),
        bold: text_bold,
        numberFormat: number_format,
        numberPrecision: number_precision,
      });
    });

  if (statItems.length === 0 && hide_rank) {
    throw new CustomError(
      "Could not render stats card.",
      "Either stats or rank are required.",
    );
  }

  // Calculate the card height depending on how many items there are
  // but if rank circle is visible clamp the minimum height to `150`
  let minHeight = 0;
  if (!hide_rank) {
    minHeight = statItems.length ? 150 : 180;
  }
  let height = Math.max(45 + (statItems.length + 1) * lheight, minHeight);

  // the lower the user's percentile the better
  const progress = 100 - rank.percentile;
  const cssStyles = getStyles({
    titleColor,
    ringColor,
    textColor,
    iconColor,
    show_icons,
    progress,
  });

  const calculateTextWidth = () => {
    let titleText = i18n.t("statcard.ranktitle");
    if (custom_title) {
      titleText = custom_title;
    } else if (statItems.length) {
      titleText = i18n.t("statcard.title");
    }
    return measureText(titleText);
  };

  /*
    When hide_rank=true, the minimum card width is 270 px + the title length and padding.
    When hide_rank=false, the minimum card_width is 340 px + the icon width (if show_icons=true).
    Numbers are picked by looking at existing dimensions on production.
  */
  const iconWidth = show_icons && statItems.length ? 16 + /* padding */ 1 : 0;
  let baseMinCardWidth = RANK_ONLY_CARD_MIN_WIDTH;
  if (hide_rank) {
    baseMinCardWidth = clampValue(
      50 /* padding */ + calculateTextWidth() * 2,
      CARD_MIN_WIDTH,
      Infinity,
    );
  } else if (statItems.length) {
    baseMinCardWidth = RANK_CARD_MIN_WIDTH;
  }
  const minCardWidth = baseMinCardWidth + iconWidth;

  let baseDefaultCardWidth = RANK_ONLY_CARD_DEFAULT_WIDTH;
  if (hide_rank) {
    baseDefaultCardWidth = CARD_DEFAULT_WIDTH;
  } else if (statItems.length) {
    baseDefaultCardWidth = RANK_CARD_DEFAULT_WIDTH;
  }
  const defaultCardWidth = baseDefaultCardWidth + iconWidth;
  let width = resolveStatsCardWidth(card_width, defaultCardWidth, minCardWidth);

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: statItems.length
      ? i18n.t("statcard.title")
      : i18n.t("statcard.ranktitle"),
    width,
    height,
    border_radius,
    colors: {
      titleColor,
      textColor,
      iconColor,
      bgColor,
      borderColor,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);

  if (disable_animations) {
    card.disableAnimations();
  }

  /**
   * Calculates the right rank circle translation values such that the rank circle
   * keeps respecting the following padding:
   *
   * width > RANK_CARD_DEFAULT_WIDTH: The default right padding of 70 px will be used.
   * width < RANK_CARD_DEFAULT_WIDTH: The left and right padding will be enlarged
   *   equally from a certain minimum at RANK_CARD_MIN_WIDTH.
   *
   * @returns {number} - Rank circle translation value.
   */
  const calculateRankXTranslation = () => {
    if (statItems.length) {
      const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
      if (width > RANK_CARD_DEFAULT_WIDTH) {
        const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
        return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
      } else {
        return minXTranslation + (width - minCardWidth) / 2;
      }
    } else {
      return width / 2 + 20 - 10;
    }
  };

  // Conditionally rendered elements
  const rankCircle = hide_rank
    ? ""
    : `<g data-testid="rank-circle"
          transform="translate(${calculateRankXTranslation()}, ${
            height / 2 - 50
          })">
        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
        <circle class="rank-circle" cx="-10" cy="8" r="40" />
        <g class="rank-text">
          ${rankIcon(rank_icon, rank?.level, rank?.percentile)}
        </g>
      </g>`;

  // Accessibility Labels
  const labels = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key) => {
      // @ts-ignore
      const stats = STATS[key];
      if (key === "commits") {
        return `${i18n.t("statcard.commits")} ${getTotalCommitsYearLabel(
          include_all_commits,
          commits_year,
          i18n,
        )} : ${stats.value}`;
      }
      return `${stats.label}: ${stats.value}`;
    })
    .join(", ");

  card.setAccessibilityLabel({
    title: `${card.title}, Rank: ${rank.level}`,
    desc: labels,
  });

  return card.render(`
    ${rankCircle}
    <svg x="0" y="0">
      ${flexLayout({
        items: statItems,
        gap: lheight,
        direction: "column",
      }).join("")}
    </svg>
  `);
};

export { renderStatsCard };
export default renderStatsCard;
