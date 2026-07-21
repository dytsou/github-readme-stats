// @ts-check
/**
 * Adapter utilities to convert Express-style handlers to Hono handlers.
 */

import { encodeHTML } from "./html.js";

const DEFAULT_SVG_CONTENT_TYPE = "image/svg+xml; charset=utf-8";

/**
 * Resolves the response Content-Type for adapter responses.
 *
 * @param {Record<string, string>} headers Express-style response headers.
 * @param {unknown} body Response body.
 * @returns {string} Content-Type header value.
 */
const resolveResponseContentType = (headers, body) => {
  const explicitType =
    headers["Content-Type"] ||
    headers["content-type"] ||
    headers["CONTENT-TYPE"];

  if (explicitType) {
    return String(explicitType);
  }

  if (typeof body === "object" && body !== null) {
    return "application/json";
  }

  return DEFAULT_SVG_CONTENT_TYPE;
};

/**
 * Serializes a response body for the adapter Response object.
 *
 * @param {unknown} body Response body.
 * @param {string} contentType Resolved Content-Type header.
 * @returns {string} Serialized body.
 */
const serializeResponseBody = (body, contentType) => {
  if (typeof body === "string") {
    return body;
  }

  if (contentType.startsWith("application/json")) {
    return JSON.stringify(body);
  }

  return String(body);
};

/**
 * Creates a mock Express response object that works with Hono context.
 *
 * @returns {any} Mock Express response object
 */
export function createMockResponse() {
  const headers = {};
  let responseSent = false;
  let responseBody = null;
  let statusCode = 200;

  return {
    set statusCode(value) {
      statusCode = value;
    },
    get statusCode() {
      return statusCode;
    },
    setHeader: (name, value) => {
      headers[name] = value;
    },
    send: (body) => {
      responseSent = true;
      responseBody = body;

      const contentType = resolveResponseContentType(headers, body);
      const responseBodyText = serializeResponseBody(body, contentType);

      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", contentType);

      const cacheControl = headers["Cache-Control"] || headers["cache-control"];
      if (cacheControl) {
        responseHeaders.set("Cache-Control", String(cacheControl));
      } else if (contentType === DEFAULT_SVG_CONTENT_TYPE) {
        responseHeaders.set("Cache-Control", "public, max-age=3600");
      }

      Object.entries(headers).forEach(([name, value]) => {
        const lowerName = name.toLowerCase();
        if (lowerName !== "content-type" && lowerName !== "cache-control") {
          responseHeaders.set(name, String(value));
        }
      });

      return new Response(responseBodyText, {
        status: statusCode,
        headers: responseHeaders,
      });
    },
    _wasSent: () => responseSent,
    _getBody: () => responseBody,
    _getHeaders: () => headers,
    _getStatusCode: () => statusCode,
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
 * Builds a fallback Response when the adapter cannot reconstruct one.
 *
 * @param {any} res Mock Express response.
 * @returns {Response} Hono-compatible response.
 */
const buildFallbackResponse = (res) => {
  const body = res._getBody();
  if (body !== null) {
    const headers = res._getHeaders();
    const contentType = resolveResponseContentType(headers, body);
    const responseBodyText = serializeResponseBody(body, contentType);
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);

    const cacheControl = headers["Cache-Control"] || headers["cache-control"];
    if (cacheControl) {
      responseHeaders.set("Cache-Control", String(cacheControl));
    } else if (contentType === DEFAULT_SVG_CONTENT_TYPE) {
      responseHeaders.set("Cache-Control", "public, max-age=3600");
    }

    return new Response(responseBodyText, {
      status: res._getStatusCode(),
      headers: responseHeaders,
    });
  }

  const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">No response generated</text></svg>`;
  return new Response(errorSvg, {
    status: 500,
    headers: { "Content-Type": DEFAULT_SVG_CONTENT_TYPE },
  });
};

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

      if (res._wasSent()) {
        if (result instanceof Response) {
          return result;
        }

        return buildFallbackResponse(res);
      }

      if (result !== undefined) {
        if (result instanceof Response) {
          return result;
        }
        return result;
      }

      return buildFallbackResponse(res);
    } catch (error) {
      console.error("Adapter error:", error);
      console.error("Error stack:", error.stack);
      console.error("Request URL:", c.req.url);
      console.error("Request query:", c.req.query());

      const safeMessage = encodeHTML(String(error.message || "Unknown error"));
      const errorSvg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="20" y="50" font-family="Arial" font-size="16" fill="red">Error: ${safeMessage}</text></svg>`;
      return new Response(errorSvg, {
        status: 500,
        headers: { "Content-Type": DEFAULT_SVG_CONTENT_TYPE },
      });
    }
  };
}
