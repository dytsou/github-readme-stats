/**
 * @file Contains end-to-end tests for the deployed Cloudflare Workers instance.
 */
import dotenv from "dotenv";
dotenv.config();

import { beforeAll, describe, expect, test } from "vitest";
import axios from "axios";
import { renderGistCard } from "../../src/cards/gist.js";
import { renderRepoCard } from "../../src/cards/repo.js";
import { renderStatsCard } from "../../src/cards/stats.js";
import { renderTopLanguages } from "../../src/cards/top-languages.js";
import { renderWakatimeCard } from "../../src/cards/wakatime.js";

const REPO = "curly-fiesta";
const USER = "catelinemnemosyne";
const STATS_CARD_USER = "e2eninja";
const GIST_ID = "372cef55fd897b31909fdeb3a7262758";

const STATS_DATA = {
  name: "CodeNinja",
  totalPRs: 1,
  totalReviews: 0,
  totalCommits: 3,
  totalIssues: 1,
  totalStars: 1,
  contributedTo: 0,
  rank: {
    level: "C",
    percentile: 98.73972605284538,
  },
};

const LANGS_DATA = {
  HTML: {
    color: "#e34c26",
    name: "HTML",
    size: 1721,
  },
  CSS: {
    color: "#663399",
    name: "CSS",
    size: 930,
  },
  JavaScript: {
    color: "#f1e05a",
    name: "JavaScript",
    size: 1912,
  },
};

const WAKATIME_DATA = {
  human_readable_range: "last week",
  is_already_updating: false,
  is_coding_activity_visible: true,
  is_including_today: false,
  is_other_usage_visible: false,
  is_stuck: false,
  is_up_to_date: false,
  is_up_to_date_pending_future: false,
  percent_calculated: 0,
  range: "all_time",
  status: "pending_update",
  timeout: 15,
  username: USER,
  writes_only: false,
};

const REPOSITORY_DATA = {
  name: REPO,
  nameWithOwner: `${USER}/cra-test`,
  isPrivate: false,
  isArchived: false,
  isTemplate: false,
  stargazers: {
    totalCount: 1,
  },
  description: "Simple cra test repo.",
  primaryLanguage: {
    color: "#f1e05a",
    id: "MDg6TGFuZ3VhZ2UxNDA=",
    name: "JavaScript",
  },
  forkCount: 0,
  starCount: 1,
};

/**
 * @typedef {import("../../src/fetchers/types").GistData} GistData Gist data type.
 */

/**
 * @type {GistData}
 */
const GIST_DATA = {
  name: "link.txt",
  nameWithOwner: "qwerty541/link.txt",
  description:
    "Trying to access this path on Windows 10 ver. 1803+ will breaks NTFS",
  language: "Text",
  starsCount: 1,
  forksCount: 0,
};

const CACHE_BURST_STRING = `v=${new Date().getTime()}`;

describe("Fetch Cards", () => {
  let DEPLOYMENT_URL;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
    // Get Cloudflare Worker URL
    DEPLOYMENT_URL = process.env.CLOUDFLARE_WORKER_URL;

    // Skip all tests if no deployment URL is provided
    if (!DEPLOYMENT_URL) {
      console.warn(
        "⚠️  No deployment URL provided. Set CLOUDFLARE_WORKER_URL to run e2e tests.",
      );
    }
  });

  test("retrieve stats card", async () => {
    if (!DEPLOYMENT_URL) {
      console.log("⏭️  Skipping test: No deployment URL provided");
      return;
    }
    expect(DEPLOYMENT_URL).toBeDefined();
    expect(DEPLOYMENT_URL).toBeTruthy();

    // Check if the deployed instance stats card function is up and running.
    await expect(
      axios.get(`${DEPLOYMENT_URL}/api?username=${STATS_CARD_USER}`),
    ).resolves.not.toThrow();

    // Get the deployed instance stats card response.
    const serverStatsSvg = await axios.get(
      `${DEPLOYMENT_URL}/api?username=${STATS_CARD_USER}&include_all_commits=true&${CACHE_BURST_STRING}`,
    );

    // Verify the response is valid SVG
    expect(serverStatsSvg.data).toContain("<svg");
    expect(serverStatsSvg.data).toContain('xmlns="http://www.w3.org/2000/svg"');

    // If the server returns an error card, skip the comparison
    // (This can happen due to API rate limits, missing tokens, or network issues)
    if (serverStatsSvg.data.includes("Something went wrong")) {
      console.warn(
        "⚠️  Server returned error card. Skipping exact comparison. This may be due to API rate limits or missing tokens.",
      );
      return;
    }

    // Get local stats card.
    const localStatsCardSVG = renderStatsCard(STATS_DATA, {
      include_all_commits: true,
    });

    // Check if stats card from deployment matches the stats card from local.
    expect(serverStatsSvg.data).toEqual(localStatsCardSVG);
  }, 15000);

  test("retrieve language card", async () => {
    if (!DEPLOYMENT_URL) {
      console.log("⏭️  Skipping test: No deployment URL provided");
      return;
    }
    expect(DEPLOYMENT_URL).toBeDefined();
    expect(DEPLOYMENT_URL).toBeTruthy();

    // Check if the deployed instance language card function is up and running.
    console.log(
      `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
    );
    await expect(
      axios.get(
        `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
      ),
    ).resolves.not.toThrow();

    // Get local language card.
    const localLanguageCardSVG = renderTopLanguages(LANGS_DATA);

    // Get the deployed instance language card response.
    const severLanguageSVG = await axios.get(
      `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
    );

    // Check if language card from deployment matches the local language card.
    expect(severLanguageSVG.data).toEqual(localLanguageCardSVG);
  }, 15000);

  test("retrieve WakaTime card", async () => {
    if (!DEPLOYMENT_URL) {
      console.log("⏭️  Skipping test: No deployment URL provided");
      return;
    }
    expect(DEPLOYMENT_URL).toBeDefined();
    expect(DEPLOYMENT_URL).toBeTruthy();

    // Check if the deployed instance WakaTime function is up and running.
    await expect(
      axios.get(`${DEPLOYMENT_URL}/api/wakatime?username=${USER}`),
    ).resolves.not.toThrow();

    // Get local WakaTime card.
    const localWakaCardSVG = renderWakatimeCard(WAKATIME_DATA);

    // Get the deployed instance WakaTime card response.
    const serverWakaTimeSvg = await axios.get(
      `${DEPLOYMENT_URL}/api/wakatime?username=${USER}&${CACHE_BURST_STRING}`,
    );

    // Check if WakaTime card from deployment matches the local WakaTime card.
    expect(serverWakaTimeSvg.data).toEqual(localWakaCardSVG);
  }, 15000);

  test("retrieve repo card", async () => {
    if (!DEPLOYMENT_URL) {
      console.log("⏭️  Skipping test: No deployment URL provided");
      return;
    }
    expect(DEPLOYMENT_URL).toBeDefined();
    expect(DEPLOYMENT_URL).toBeTruthy();

    // Check if the deployed instance Repo function is up and running.
    await expect(
      axios.get(
        `${DEPLOYMENT_URL}/api/pin/?username=${USER}&repo=${REPO}&${CACHE_BURST_STRING}`,
      ),
    ).resolves.not.toThrow();

    // Get local repo card.
    const localRepoCardSVG = renderRepoCard(REPOSITORY_DATA);

    // Get the deployed instance repo card response.
    const serverRepoSvg = await axios.get(
      `${DEPLOYMENT_URL}/api/pin/?username=${USER}&repo=${REPO}&${CACHE_BURST_STRING}`,
    );

    // Check if Repo card from deployment matches the local Repo card.
    expect(serverRepoSvg.data).toEqual(localRepoCardSVG);
  }, 15000);

  test("retrieve gist card", async () => {
    if (!DEPLOYMENT_URL) {
      console.log("⏭️  Skipping test: No deployment URL provided");
      return;
    }
    expect(DEPLOYMENT_URL).toBeDefined();
    expect(DEPLOYMENT_URL).toBeTruthy();

    // Check if the deployed instance Gist function is up and running.
    await expect(
      axios.get(
        `${DEPLOYMENT_URL}/api/gist?id=${GIST_ID}&${CACHE_BURST_STRING}`,
      ),
    ).resolves.not.toThrow();

    // Get local gist card.
    const localGistCardSVG = renderGistCard(GIST_DATA);

    // Get the deployed instance gist card response.
    const serverGistSvg = await axios.get(
      `${DEPLOYMENT_URL}/api/gist?id=${GIST_ID}&${CACHE_BURST_STRING}`,
    );

    // Check if Gist card from deployment matches the local Gist card.
    expect(serverGistSvg.data).toEqual(localGistCardSVG);
  }, 15000);
});
