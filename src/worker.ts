// src/worker.ts
import { Hono } from "hono";
import statsHandler from "../api/index.js";
import repoCardHandler from "../api/pin.js";
import topLangsHandler from "../api/top-langs.js";
import wakatimeHandler from "../api/wakatime.js";
import gistHandler from "../api/gist.js";
import profileContextHandler from "../api/profile-context.js";
import { setupWorkerEnv } from "./common/worker-env.js";
import {
  adaptExpressHandler,
  svgErrorResponse,
} from "./common/worker-adapter.js";

const SVG = "image/svg+xml; charset=utf-8";

const registerGet = (app, path, expressHandler) => {
  const handler = adaptExpressHandler(expressHandler);
  // @ts-ignore - adaptExpressHandler returns a compatible handler
  app.get(path, handler);
  // @ts-ignore - adaptExpressHandler returns a compatible handler
  app.get(`${path}/`, handler);
};

const cardRoutes = [
  ["/api", statsHandler],
  ["/api/pin", repoCardHandler],
  ["/api/top-langs", topLangsHandler],
  ["/api/wakatime", wakatimeHandler],
  ["/api/gist", gistHandler],
  ["/api/profile/context", profileContextHandler],
];

/**
 * Cloudflare Workers entry point
 * @param {import('@cloudflare/workers-types').Env} env Environment variables from Cloudflare
 */
export default {
  async fetch(request, env, ctx) {
    try {
      setupWorkerEnv(env);

      const app = new Hono();

      for (const [path, handler] of cardRoutes) {
        registerGet(app, path, handler);
      }

      app.get("/", (c) => {
        return c.text("GitHub Readme Stats API - Worker is running");
      });

      app.get("/test", (c) => {
        return c.json({
          status: "ok",
          env: {
            hasGithubPat: !!env.GITHUB_PAT,
            nodeEnv: process.env.NODE_ENV,
            isWorkers:
              globalThis.process === undefined ||
              !globalThis.process.env ||
              Object.keys(globalThis.process.env).length === 0,
          },
        });
      });

      app.get("/debug/query", (c) => {
        return c.json({
          url: c.req.url,
          query: c.req.query(),
          rawQuery: c.req.url.split("?")[1] || "",
        });
      });

      // ponytail: Camo expects SVG bodies even on 404
      app.notFound(() => {
        return new Response(
          `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="#333">Not Found</text></svg>`,
          { status: 404, headers: { "Content-Type": SVG } },
        );
      });

      app.onError((err, c) => {
        console.error("Worker Error:", err);
        console.error("Error stack:", err.stack);
        console.error("Request URL:", c.req.url);
        return svgErrorResponse(err.message || "Unknown error");
      });

      return app.fetch(request, env, ctx);
    } catch (error) {
      console.error("Worker setup error:", error);
      console.error("Error stack:", (error as Error).stack);
      return svgErrorResponse(
        (error as Error).message || "Unknown error",
        500,
        "Worker setup failed",
      );
    }
  },
};
