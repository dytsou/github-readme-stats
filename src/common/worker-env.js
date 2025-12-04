// @ts-check

// Initialize process.env early to prevent errors during module imports
// This is safe because if we're in Node.js, process.env already exists
// If we're in Workers, we'll populate it later via setupWorkerEnv
if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: {} };
}

/**
 * Checks if we're running in Cloudflare Workers environment.
 * Detects by checking for Cloudflare-specific globals that exist at import time.
 * @returns {boolean} True if running in Cloudflare Workers, false otherwise
 */
export function isCloudflareWorkers() {
  // Check for Cloudflare Workers runtime globals
  // These exist at import time, before setupWorkerEnv is called
  // In Workers, process.env typically doesn't exist or is empty at import time
  return (
    typeof globalThis.process === "undefined" ||
    !globalThis.process.env ||
    Object.keys(globalThis.process.env).length === 0
  );
}

/**
 * Sets up process.env from Cloudflare Workers env object.
 * This allows the existing codebase to work with Cloudflare Workers
 * without requiring changes to all files that use process.env.
 *
 * @param {Record<string, any>} env Cloudflare Workers environment object
 */
export function setupWorkerEnv(env) {
  // Copy all env vars to process.env
  // Cloudflare Workers don't have process.env, so we create a mock
  if (typeof globalThis.process === "undefined") {
    globalThis.process = { env: {} };
  }

  // Merge Cloudflare env vars into process.env
  Object.assign(globalThis.process.env, env);

  // Also set NODE_ENV if not already set
  // Check using 'in' operator to avoid triggering the "define" replacement warning
  if (!("NODE_ENV" in globalThis.process.env)) {
    globalThis.process.env.NODE_ENV = "production";
  }
}
