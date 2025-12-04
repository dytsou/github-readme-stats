// src/worker.ts
import { Hono } from "hono";
import statsHandler from "../api/index.js";
import repoCardHandler from "../api/pin.js";
import topLangsHandler from "../api/top-langs.js";
import wakatimeHandler from "../api/wakatime.js";
import gistHandler from "../api/gist.js";
import { setupWorkerEnv } from "./common/worker-env.js";
import { adaptExpressHandler } from "./common/worker-adapter.js";

/**
 * Cloudflare Workers entry point
 * @param {import('@cloudflare/workers-types').Env} env Environment variables from Cloudflare
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Set up process.env from Cloudflare Workers env
      setupWorkerEnv(env);

      // Create Hono app
      const app = new Hono();

      // Adapt Express handlers to Hono
      // Support both with and without trailing slashes
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api", adaptExpressHandler(statsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/", adaptExpressHandler(statsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/pin", adaptExpressHandler(repoCardHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/pin/", adaptExpressHandler(repoCardHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/top-langs", adaptExpressHandler(topLangsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/top-langs/", adaptExpressHandler(topLangsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/wakatime", adaptExpressHandler(wakatimeHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/wakatime/", adaptExpressHandler(wakatimeHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/gist", adaptExpressHandler(gistHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get("/api/gist/", adaptExpressHandler(gistHandler));

      // Handle root path
      app.get("/", (c) => {
        return c.text("GitHub Readme Stats API - Worker is running");
      });

      // Test endpoint for debugging
      app.get("/test", (c) => {
        return c.json({
          status: "ok",
          env: {
            hasPat1: !!env.PAT_1,
            nodeEnv: process.env.NODE_ENV,
            isWorkers:
              typeof globalThis.process === "undefined" ||
              !globalThis.process.env ||
              Object.keys(globalThis.process.env).length === 0,
          },
        });
      });

      // Debug endpoint to test query parsing
      app.get("/debug/query", (c) => {
        return c.json({
          url: c.req.url,
          query: c.req.query(),
          rawQuery: c.req.url.split("?")[1] || "",
        });
      });

      // Handle 404 - return SVG for Camo compatibility
      app.notFound((c) => {
        const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="#333">Not Found</text></svg>`;
        return new Response(errorSvg, {
          status: 404,
          headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
        });
      });

      // Handle errors - return SVG for Camo compatibility
      app.onError((err, c) => {
        console.error("Worker Error:", err);
        console.error("Error stack:", err.stack);
        console.error("Request URL:", c.req.url);
        const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">Error: ${err.message}</text></svg>`;
        return new Response(errorSvg, {
          status: 500,
          headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
        });
      });

      return app.fetch(request, env, ctx);
    } catch (error) {
      // Catch any errors during setup - return SVG for Camo compatibility
      console.error("Worker setup error:", error);
      console.error("Error stack:", error.stack);
      const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">Worker setup failed: ${error.message}</text></svg>`;
      return new Response(errorSvg, {
        status: 500,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    }
  },
};
