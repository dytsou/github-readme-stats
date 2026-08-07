// @ts-check

import { renderHeatmapCard } from "../src/cards/heatmap.js";
import { createContributionHandler } from "../src/common/contribution-api.js";

export default createContributionHandler({
  cacheKey: "CONTRIBUTIONS_CARD",
  render: renderHeatmapCard,
});
