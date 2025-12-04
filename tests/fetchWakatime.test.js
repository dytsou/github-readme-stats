import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fetchWakatimeStats } from "../src/fetchers/wakatime.js";

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

const wakaTimeData = {
  data: {
    categories: [
      {
        digital: "22:40",
        hours: 22,
        minutes: 40,
        name: "Coding",
        percent: 100,
        text: "22 hrs 40 mins",
        total_seconds: 81643.570077,
      },
    ],
    daily_average: 16095,
    daily_average_including_other_language: 16329,
    days_including_holidays: 7,
    days_minus_holidays: 5,
    editors: [
      {
        digital: "22:40",
        hours: 22,
        minutes: 40,
        name: "VS Code",
        percent: 100,
        text: "22 hrs 40 mins",
        total_seconds: 81643.570077,
      },
    ],
    holidays: 2,
    human_readable_daily_average: "4 hrs 28 mins",
    human_readable_daily_average_including_other_language: "4 hrs 32 mins",
    human_readable_total: "22 hrs 21 mins",
    human_readable_total_including_other_language: "22 hrs 40 mins",
    id: "random hash",
    is_already_updating: false,
    is_coding_activity_visible: true,
    is_including_today: false,
    is_other_usage_visible: true,
    is_stuck: false,
    is_up_to_date: true,
    languages: [
      {
        digital: "0:19",
        hours: 0,
        minutes: 19,
        name: "Other",
        percent: 1.43,
        text: "19 mins",
        total_seconds: 1170.434361,
      },
      {
        digital: "0:01",
        hours: 0,
        minutes: 1,
        name: "TypeScript",
        percent: 0.1,
        text: "1 min",
        total_seconds: 83.293809,
      },
      {
        digital: "0:00",
        hours: 0,
        minutes: 0,
        name: "YAML",
        percent: 0.07,
        text: "0 secs",
        total_seconds: 54.975151,
      },
    ],
    operating_systems: [
      {
        digital: "22:40",
        hours: 22,
        minutes: 40,
        name: "Mac",
        percent: 100,
        text: "22 hrs 40 mins",
        total_seconds: 81643.570077,
      },
    ],
    percent_calculated: 100,
    range: "last_7_days",
    status: "ok",
    timeout: 15,
    total_seconds: 80473.135716,
    total_seconds_including_other_language: 81643.570077,
    user_id: "random hash",
    username: "anuraghazra",
    writes_only: false,
  },
};

describe("WakaTime fetcher", () => {
  it("should fetch correct WakaTime data", async () => {
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const repo = await fetchWakatimeStats({ username });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should fetch correct WakaTime data with custom api_domain", async () => {
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://api.wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const repo = await fetchWakatimeStats({
      username,
      api_domain: "api.wakatime.com",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should throw error if username param missing", async () => {
    mock.onGet(/\/https:\/\/wakatime\.com\/api/).reply(404, wakaTimeData);

    await expect(fetchWakatimeStats("noone")).rejects.toThrow(
      'Missing params "username" make sure you pass the parameters in URL',
    );
  });

  it("should throw error if username is not found", async () => {
    const username = "noone";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(404, wakaTimeData);

    await expect(fetchWakatimeStats({ username })).rejects.toThrow(
      "Could not resolve to a User with the login of 'noone'",
    );
  });

  it("should throw error if api_domain is not whitelisted", async () => {
    await expect(
      fetchWakatimeStats({
        username: "test",
        api_domain: "evil.com",
      }),
    ).rejects.toThrow(
      "Invalid API domain. Only whitelisted WakaTime domains are allowed.",
    );
  });

  it("should throw error if api_domain is localhost (SSRF attempt)", async () => {
    await expect(
      fetchWakatimeStats({
        username: "test",
        api_domain: "localhost:8080",
      }),
    ).rejects.toThrow(
      "Invalid API domain. Only whitelisted WakaTime domains are allowed.",
    );
  });

  it("should reject domain with protocol injection (SSRF attempt)", async () => {
    await expect(
      fetchWakatimeStats({
        username: "test",
        api_domain: "http://evil.com",
      }),
    ).rejects.toThrow(
      "Invalid API domain. Only whitelisted WakaTime domains are allowed.",
    );
  });

  it("should strip port and use only hostname (SSRF protection)", async () => {
    // Port should be stripped, only hostname used
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    // Even with port specified, only hostname should be used
    const repo = await fetchWakatimeStats({
      username,
      api_domain: "wakatime.com:8080",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should strip path and use only hostname (SSRF protection)", async () => {
    // Path should be stripped, only hostname used
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    // Even with path specified, only hostname should be used
    const repo = await fetchWakatimeStats({
      username,
      api_domain: "wakatime.com/evil",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should strip user info and use only hostname (SSRF protection)", async () => {
    // User info should be stripped, only hostname used
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    // Even with user info specified, only hostname should be used
    const repo = await fetchWakatimeStats({
      username,
      api_domain: "user@wakatime.com",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should reject domain with mixed attack (SSRF attempt)", async () => {
    await expect(
      fetchWakatimeStats({
        username: "test",
        api_domain: "wakatime.com@evil.com",
      }),
    ).rejects.toThrow(
      "Invalid API domain. Only whitelisted WakaTime domains are allowed.",
    );
  });

  it("should accept valid domain with trailing slash (normalized)", async () => {
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const repo = await fetchWakatimeStats({
      username,
      api_domain: "wakatime.com/",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should accept valid domain with protocol prefix (normalized)", async () => {
    const username = "anuraghazra";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://api.wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const repo = await fetchWakatimeStats({
      username,
      api_domain: "https://api.wakatime.com",
    });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });

  it("should handle username with special characters", async () => {
    const username = "user@example.com";
    const encodedUsername = encodeURIComponent(username);
    mock
      .onGet(
        `https://wakatime.com/api/v1/users/${encodedUsername}/stats?is_including_today=true`,
      )
      .reply(200, wakaTimeData);

    const repo = await fetchWakatimeStats({ username });
    expect(repo).toStrictEqual(wakaTimeData.data);
  });
});

export { wakaTimeData };
