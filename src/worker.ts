// src/worker.ts
import { Hono } from 'hono';
import statsHandler from '../api/index.js';
import repoCardHandler from '../api/pin.js';
import topLangsHandler from '../api/top-langs.js';
import wakatimeHandler from '../api/wakatime.js';
import gistHandler from '../api/gist.js';
import { setupWorkerEnv } from './common/worker-env.js';
import { adaptExpressHandler } from './common/worker-adapter.js';

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
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get('/api', adaptExpressHandler(statsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get('/api/pin', adaptExpressHandler(repoCardHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get('/api/top-langs', adaptExpressHandler(topLangsHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get('/api/wakatime', adaptExpressHandler(wakatimeHandler));
      // @ts-ignore - adaptExpressHandler returns a compatible handler
      app.get('/api/gist', adaptExpressHandler(gistHandler));
      
      // Handle root path
      app.get('/', (c) => {
        return c.text('GitHub Readme Stats API - Worker is running');
      });
      
      // Test endpoint for debugging
      app.get('/test', (c) => {
        return c.json({
          status: 'ok',
          env: {
            hasPat1: !!env.PAT_1,
            nodeEnv: process.env.NODE_ENV,
            isWorkers: typeof globalThis.process === 'undefined' || !globalThis.process.env || Object.keys(globalThis.process.env).length === 0,
          },
        });
      });
      
      // Handle 404
      app.notFound((c) => {
        return c.text('Not Found', 404);
      });
      
      // Handle errors
      app.onError((err, c) => {
        console.error('Worker Error:', err);
        console.error('Error stack:', err.stack);
        console.error('Request URL:', c.req.url);
        return c.text(`Internal Server Error: ${err.message}`, 500);
      });
      
      return app.fetch(request, env, ctx);
    } catch (error) {
      // Catch any errors during setup
      console.error('Worker setup error:', error);
      console.error('Error stack:', error.stack);
      return new Response(`Worker setup failed: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};
