// @ts-check

import {
  createMockResponse,
  adaptExpressHandler,
} from "../src/common/worker-adapter.js";
import { describe, expect, it } from "vitest";

describe("worker-adapter", () => {
  it("preserves application/json Content-Type for JSON handlers", async () => {
    const res = createMockResponse();
    res.setHeader("Content-Type", "application/json");
    const response = res.send({ up: true });

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.text()).toBe('{"up":true}');
  });

  it("defaults to SVG Content-Type for string card bodies", async () => {
    const res = createMockResponse();
    const response = res.send("<svg></svg>");

    expect(response.headers.get("Content-Type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
  });

  it("honors text/plain Content-Type for prose handlers", async () => {
    const res = createMockResponse();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const response = res.send("hello");

    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(await response.text()).toBe("hello");
  });

  it("returns non-200 status codes set on the mock response", async () => {
    const res = createMockResponse();
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    const response = res.send({ error: { code: "NOT_WHITELISTED" } });

    expect(response.status).toBe(403);
  });

  it("adapts JSON handlers through adaptExpressHandler", async () => {
    const handler = adaptExpressHandler(async (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      return res.send({ ok: true });
    });

    const response = await handler({
      req: { query: () => ({}) },
    });

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual({ ok: true });
  });
});
