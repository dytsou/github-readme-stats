import { afterEach, describe, expect, it } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { request } from "../src/common/http.js";

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

describe("GitHub GraphQL HTTP client", () => {
  it("uses a Cloudflare-supported cache mode", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, { data: {} });

    await request({ query: "query {}" }, { Authorization: "token test" });

    expect(mock.history.post[0].fetchOptions).toEqual({ cache: "no-store" });
  });
});
