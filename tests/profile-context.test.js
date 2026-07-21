import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import profileContext from "../api/profile-context.js";

const mock = new MockAdapter(axios);

const data_stats = {
  data: {
    user: {
      name: "Anurag Hazra",
      repositoriesContributedTo: { totalCount: 50 },
      commits: { totalCommitContributions: 200 },
      reviews: { totalPullRequestReviewContributions: 50 },
      pullRequests: { totalCount: 400 },
      mergedPullRequests: { totalCount: 320 },
      openIssues: { totalCount: 300 },
      closedIssues: { totalCount: 0 },
      followers: { totalCount: 10 },
      repositoryDiscussions: { totalCount: 0 },
      repositoryDiscussionComments: { totalCount: 0 },
      repositories: {
        totalCount: 1,
        nodes: [{ name: "repo", stargazers: { totalCount: 100 } }],
        pageInfo: { hasNextPage: false, endCursor: "cursor" },
      },
    },
  },
};

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            name: "repo",
            languages: {
              edges: [
                { size: 100, node: { color: "#0f0", name: "JavaScript" } },
              ],
            },
          },
        ],
      },
    },
  },
};

const notFoundError = {
  errors: [
    {
      type: "NOT_FOUND",
      message: "Could not resolve to a User with the login of 'missing'.",
    },
  ],
};

const buildFaker = (
  query,
  {
    stats = data_stats,
    langs = data_langs,
    statsStatus = 200,
    langsStatus = 200,
  } = {},
) => {
  const req = {
    query: {
      username: "anuraghazra",
      ...query,
    },
  };
  const res = {
    statusCode: 200,
    set statusCode(value) {
      this._statusCode = value;
    },
    get statusCode() {
      return this._statusCode ?? 200;
    },
    setHeader: vi.fn(),
    send: vi.fn(),
  };

  mock
    .onPost("https://api.github.com/graphql")
    .replyOnce(statsStatus, stats)
    .onPost("https://api.github.com/graphql")
    .replyOnce(langsStatus, langs);

  return { req, res };
};

beforeEach(() => {
  process.env.CACHE_SECONDS = undefined;
  delete process.env.PAT_1;
});

afterEach(() => {
  mock.reset();
  vi.unstubAllEnvs();
});

describe("Test /api/profile/context", () => {
  it("returns JSON by default", async () => {
    const { req, res } = buildFaker({});

    await profileContext(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "anuraghazra",
        stats: expect.objectContaining({ totalStars: 100 }),
        languages: expect.arrayContaining([
          expect.objectContaining({ name: "JavaScript", percent: 100 }),
        ]),
      }),
    );
  });

  it("returns prose when format=prose", async () => {
    const { req, res } = buildFaker({ format: "prose" });

    await profileContext(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/plain; charset=utf-8",
    );
    const body = res.send.mock.calls[0][0];
    expect(body).toContain("GitHub profile context");
    expect(body).toContain("JavaScript");
    expect(body).not.toContain("<svg");
  });

  it("returns JSON with summary when format=both", async () => {
    const { req, res } = buildFaker({ format: "both" });

    await profileContext(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.stringContaining("GitHub profile context"),
      }),
    );
  });

  it("returns 400 for invalid format", async () => {
    const { req, res } = buildFaker({ format: "xml" });

    await profileContext(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INVALID_FORMAT" }),
      }),
    );
  });

  it("returns 400 when username is missing", async () => {
    const req = { query: {} };
    const res = {
      statusCode: 200,
      set statusCode(value) {
        this._statusCode = value;
      },
      get statusCode() {
        return this._statusCode ?? 200;
      },
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    await profileContext(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "MISSING_PARAM" }),
      }),
    );
  });

  it("returns 404 JSON when user is not found", async () => {
    const { req, res } = buildFaker(
      { username: "missing" },
      { stats: notFoundError, langs: notFoundError },
    );

    await profileContext(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
      }),
    );
  });

  it("returns 403 JSON when username is not whitelisted", async () => {
    vi.stubEnv("WHITELIST", "allowed-user");
    vi.resetModules();

    const { default: isolatedHandler } =
      await import("../api/profile-context.js");

    const req = { query: { username: "blocked-user" } };
    const res = {
      statusCode: 200,
      set statusCode(value) {
        this._statusCode = value;
      },
      get statusCode() {
        return this._statusCode ?? 200;
      },
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    await isolatedHandler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "NOT_WHITELISTED" }),
      }),
    );
    expect(String(res.send.mock.calls[0][0])).not.toContain("<svg");
  });
});
