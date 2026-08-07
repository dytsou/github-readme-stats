// @ts-check

import { renderStreakCard } from "../src/cards/streak.js";
import {
  createContributionHandler,
  streakFetchOptions,
} from "../src/common/contribution-api.js";

export default createContributionHandler({
  cacheKey: "CONTRIBUTIONS_CARD",
  render: renderStreakCard,
  getFetchOptions: streakFetchOptions,
});
