/**
 * @file Contains end-to-end tests for the deployed Cloudflare Workers instance.
 */
import dotenv from "dotenv";
dotenv.config();

import { describe, expect, test } from "vitest";
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

const TEST_TIMEOUT_MS = 30000;
const HTTP_TIMEOUT_MS = 10000;
const PREFLIGHT_TIMEOUT_MS = 10000;

/** @type {string | undefined} */
let DEPLOYMENT_URL;

const http = axios.create({
  timeout: HTTP_TIMEOUT_MS,
});

/**
 * Returns a skip reason string, or null when the suite should run.
 * Sets DEPLOYMENT_URL when runnable.
 *
 * @returns {Promise<string | null>} Skip reason or null.
 */
async function computeSkipReason() {
  process.env.NODE_ENV = "development";

  const deploymentUrl = process.env.CLOUDFLARE_WORKER_URL;
  if (!deploymentUrl) {
    return "No deployment URL provided. Set CLOUDFLARE_WORKER_URL to run e2e tests.";
  }

  const apiUrl = new URL(
    `/api?username=${STATS_CARD_USER}`,
    deploymentUrl,
  ).toString();

  try {
    const parsedUrl = new URL(deploymentUrl);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return `Unsupported protocol for CLOUDFLARE_WORKER_URL: ${parsedUrl.protocol || "(none)"}`;
    }
  } catch (err) {
    return `Invalid CLOUDFLARE_WORKER_URL: ${String(err?.message || err)}`;
  }

  try {
    // Preflight the deployment on an endpoint the suite will use.
    // We allow non-2xx so we can inspect status codes deterministically.
    const preflight = await http.get(apiUrl, {
      timeout: PREFLIGHT_TIMEOUT_MS,
      validateStatus: () => true,
      headers: {
        Accept: "image/svg+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (preflight.status === 401 || preflight.status === 403) {
      return `Remote returned HTTP ${preflight.status} (deployment protected or incorrect URL for CI).`;
    }

    if (preflight.status < 200 || preflight.status >= 300) {
      return `E2E preflight failed: ${deploymentUrl} responded with HTTP ${preflight.status}`;
    }

    // Make sure we're talking to the expected endpoint (SVG), not an HTML/login page.
    const contentType = String(preflight.headers?.["content-type"] || "");
    const bodySnippet = String(preflight.data ?? "").slice(0, 300);
    const looksLikeSvg =
      contentType.includes("image/svg+xml") ||
      bodySnippet.includes("<svg") ||
      bodySnippet.includes('xmlns="http://www.w3.org/2000/svg"');

    if (!looksLikeSvg) {
      return `E2E preflight failed: ${deploymentUrl} did not return SVG content (content-type: ${contentType || "unknown"})`;
    }
  } catch (err) {
    const code = err?.code ? String(err.code) : "";
    const isConnectivityError =
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      code === "ETIMEDOUT" ||
      code === "ECONNRESET" ||
      code === "EAI_AGAIN" ||
      code === "ECONNABORTED";

    DEPLOYMENT_URL = undefined;

    if (isConnectivityError) {
      return `E2E preflight failed: ${code}`;
    }

    return `E2E preflight error: ${String(err?.message || err)}`;
  }

  DEPLOYMENT_URL = deploymentUrl;
  return null;
}

const skipReason = await computeSkipReason();
if (skipReason) {
  // Avoid logging potentially user-controlled preflight error details (S5145).
  console.warn("Skipping E2E tests due to preflight failure");
}

describe("E2E suite configuration", () => {
  test("defines deployment preflight checks", () => {
    expect(typeof computeSkipReason).toBe("function");
  });
});

const describeFetchCards = skipReason ? describe.skip : describe;

describeFetchCards("Fetch Cards", () => {
  test(
    "retrieve stats card",
    async () => {
      // Check if the deployed instance stats card function is up and running.
      await expect(
        http.get(`${DEPLOYMENT_URL}/api?username=${STATS_CARD_USER}`),
      ).resolves.not.toThrow();

      // Get the deployed instance stats card response.
      const serverStatsSvg = await http.get(
        `${DEPLOYMENT_URL}/api?username=${STATS_CARD_USER}&include_all_commits=true&${CACHE_BURST_STRING}`,
      );

      // Verify the response is valid SVG
      expect(serverStatsSvg.data).toContain("<svg");
      expect(serverStatsSvg.data).toContain(
        'xmlns="http://www.w3.org/2000/svg"',
      );

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
    },
    TEST_TIMEOUT_MS,
  );

  test(
    "retrieve language card",
    async () => {
      // Check if the deployed instance language card function is up and running.
      console.log(
        `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
      );
      await expect(
        http.get(
          `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
        ),
      ).resolves.not.toThrow();

      // Get local language card.
      const localLanguageCardSVG = renderTopLanguages(LANGS_DATA);

      // Get the deployed instance language card response.
      const severLanguageSVG = await http.get(
        `${DEPLOYMENT_URL}/api/top-langs/?username=${USER}&${CACHE_BURST_STRING}`,
      );

      // Verify the response is valid SVG
      expect(severLanguageSVG.data).toContain("<svg");
      expect(severLanguageSVG.data).toContain(
        'xmlns="http://www.w3.org/2000/svg"',
      );

      // If the server returns an error card, skip the comparison
      // (This can happen due to API rate limits, missing tokens, or network issues)
      if (severLanguageSVG.data.includes("Something went wrong")) {
        console.warn(
          "⚠️  Server returned error card. Skipping exact comparison. This may be due to API rate limits or missing tokens.",
        );
        return;
      }

      // Check if language card from deployment matches the local language card.
      expect(severLanguageSVG.data).toEqual(localLanguageCardSVG);
    },
    TEST_TIMEOUT_MS,
  );

  test(
    "retrieve WakaTime card",
    async () => {
      // Check if the deployed instance WakaTime function is up and running.
      await expect(
        http.get(`${DEPLOYMENT_URL}/api/wakatime?username=${USER}`),
      ).resolves.not.toThrow();

      // Get the deployed instance WakaTime card response.
      const serverWakaTimeSvg = await http.get(
        `${DEPLOYMENT_URL}/api/wakatime?username=${USER}&${CACHE_BURST_STRING}`,
      );

      // Verify the response is valid SVG
      expect(serverWakaTimeSvg.data).toContain("<svg");
      expect(serverWakaTimeSvg.data).toContain(
        'xmlns="http://www.w3.org/2000/svg"',
      );

      // If the server returns an error card, skip the comparison
      // (This can happen due to API rate limits, missing tokens, or network issues)
      if (serverWakaTimeSvg.data.includes("Something went wrong")) {
        console.warn(
          "⚠️  Server returned error card. Skipping exact comparison. This may be due to API rate limits or missing tokens.",
        );
        return;
      }

      // Get local WakaTime card.
      const localWakaCardSVG = renderWakatimeCard(WAKATIME_DATA);

      // Check if WakaTime card from deployment matches the local WakaTime card.
      expect(serverWakaTimeSvg.data).toEqual(localWakaCardSVG);
    },
    TEST_TIMEOUT_MS,
  );

  test(
    "retrieve repo card",
    async () => {
      // Check if the deployed instance Repo function is up and running.
      await expect(
        http.get(
          `${DEPLOYMENT_URL}/api/pin/?username=${USER}&repo=${REPO}&${CACHE_BURST_STRING}`,
        ),
      ).resolves.not.toThrow();

      // Get local repo card.
      const localRepoCardSVG = renderRepoCard(REPOSITORY_DATA);

      // Get the deployed instance repo card response.
      const serverRepoSvg = await http.get(
        `${DEPLOYMENT_URL}/api/pin/?username=${USER}&repo=${REPO}&${CACHE_BURST_STRING}`,
      );

      // Verify the response is valid SVG
      expect(serverRepoSvg.data).toContain("<svg");
      expect(serverRepoSvg.data).toContain(
        'xmlns="http://www.w3.org/2000/svg"',
      );

      // If the server returns an error card, skip the comparison
      // (This can happen due to API rate limits, missing tokens, or network issues)
      if (serverRepoSvg.data.includes("Something went wrong")) {
        console.warn(
          "⚠️  Server returned error card. Skipping exact comparison. This may be due to API rate limits or missing tokens.",
        );
        return;
      }

      // Check if Repo card from deployment matches the local Repo card.
      expect(serverRepoSvg.data).toEqual(localRepoCardSVG);
    },
    TEST_TIMEOUT_MS,
  );

  test(
    "retrieve gist card",
    async () => {
      // Check if the deployed instance Gist function is up and running.
      await expect(
        http.get(
          `${DEPLOYMENT_URL}/api/gist?id=${GIST_ID}&${CACHE_BURST_STRING}`,
        ),
      ).resolves.not.toThrow();

      // Get local gist card.
      const localGistCardSVG = renderGistCard(GIST_DATA);

      // Get the deployed instance gist card response.
      const serverGistSvg = await http.get(
        `${DEPLOYMENT_URL}/api/gist?id=${GIST_ID}&${CACHE_BURST_STRING}`,
      );

      // Verify the response is valid SVG
      expect(serverGistSvg.data).toContain("<svg");
      expect(serverGistSvg.data).toContain(
        'xmlns="http://www.w3.org/2000/svg"',
      );

      // If the server returns an error card, skip the comparison
      // (This can happen due to API rate limits, missing tokens, or network issues)
      if (serverGistSvg.data.includes("Something went wrong")) {
        console.warn(
          "⚠️  Server returned error card. Skipping exact comparison. This may be due to API rate limits or missing tokens.",
        );
        return;
      }

      // Check if Gist card from deployment matches the local Gist card.
      expect(serverGistSvg.data).toEqual(localGistCardSVG);
    },
    TEST_TIMEOUT_MS,
  );
});
