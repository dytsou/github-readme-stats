// @ts-check
/**
 * Adapter utilities to convert Express-style handlers to Hono handlers.
 */

import { encodeHTML } from "./html.js";

/**
 * Creates a mock Express response object that works with Hono context.
 *
 * @returns {any} Mock Express response object
 */
export function createMockResponse() {
  const headers = {};
  let responseSent = false;
  let responseBody = null;

  return {
    setHeader: (name, value) => {
      headers[name] = value;
    },
    send: (body) => {
      responseSent = true;
      responseBody = body;

      // Ensure body is a string (Camo requires valid SVG)
      const svgBody = typeof body === "string" ? body : String(body);

      // Build headers object
      const responseHeaders = new Headers();

      // Set Content-Type first (required by GitHub Camo CDN - must be image/svg+xml)
      responseHeaders.set("Content-Type", "image/svg+xml; charset=utf-8");

      // Set Cache-Control if not already set (Camo expects cacheable responses)
      const cacheControl = headers["Cache-Control"] || headers["cache-control"];
      if (cacheControl) {
        responseHeaders.set("Cache-Control", String(cacheControl));
      } else {
        responseHeaders.set("Cache-Control", "public, max-age=3600");
      }

      // Set all other headers
      Object.entries(headers).forEach(([name, value]) => {
        // Don't override Content-Type or Cache-Control if already set
        const lowerName = name.toLowerCase();
        if (lowerName !== "content-type" && lowerName !== "cache-control") {
          responseHeaders.set(name, String(value));
        }
      });

      // Return Response with proper image content type for Camo compatibility
      return new Response(svgBody, {
        status: 200,
        headers: responseHeaders,
      });
    },
    _wasSent: () => responseSent,
    _getBody: () => responseBody,
  };
}

/**
 * Creates a mock Express request object from Hono context.
 *
 * @param {import('hono').Context} c Hono context
 * @returns {any} Mock Express request object
 */
export function createMockRequest(c) {
  return {
    query: c.req.query(),
  };
}

/**
 * Adapts an Express-style handler to work with Hono.
 *
 * @param {Function} expressHandler Express handler function (req, res) => {}
 * @returns {Function} Hono handler function
 */
export function adaptExpressHandler(expressHandler) {
  return async (c) => {
    const req = createMockRequest(c);
    const res = createMockResponse();

    try {
      const result = await expressHandler(req, res);

      // If res.send() was called, it returns a Response object
      if (res._wasSent()) {
        // If result is a Response (from res.send()), return it directly
        if (result instanceof Response) {
          return result;
        }
        // Otherwise, result might be undefined or something else
        // In that case, we already have the body from res._getBody()
        const body = res._getBody();
        if (body !== null) {
          // Reconstruct the response with proper image content type for Camo
          const svgBody = typeof body === "string" ? body : String(body);
          return new Response(svgBody, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
        if (result !== undefined) {
          return result;
        }
        return c;
      }

      // If handler returns something directly (like a Response from guardAccess)
      if (result !== undefined) {
        // If it's a Response, return it directly
        if (result instanceof Response) {
          return result;
        }
        return result;
      }

      // Fallback - should not happen in normal flow
      // Return SVG error card instead of text for Camo compatibility
      const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">No response generated</text></svg>`;
      return new Response(errorSvg, {
        status: 500,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    } catch (error) {
      // Log the error for debugging
      console.error("Adapter error:", error);
      console.error("Error stack:", error.stack);
      console.error("Request URL:", c.req.url);
      console.error("Request query:", c.req.query());

      // Return SVG error card instead of text for Camo compatibility
      // Sanitize error message to prevent XSS
      const safeMessage = encodeHTML(String(error.message || "Unknown error"));
      const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">Error: ${safeMessage}</text></svg>`;
      return new Response(errorSvg, {
        status: 500,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    }
  };
}
