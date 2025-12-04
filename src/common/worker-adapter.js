// @ts-check
/**
 * Adapter utilities to convert Express-style handlers to Hono handlers.
 */

/**
 * Creates a mock Express response object that works with Hono context.
 *
 * @param {import('hono').Context} c Hono context
 * @returns {any} Mock Express response object
 */
export function createMockResponse(c) {
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
      
      // Set Content-Type first (required by GitHub Camo CDN)
      c.header('Content-Type', 'image/svg+xml; charset=utf-8');
      
      // Set Cache-Control if not already set (Camo expects cacheable responses)
      if (!headers['Cache-Control'] && !headers['cache-control']) {
        c.header('Cache-Control', 'public, max-age=3600');
      }
      
      // Set all other headers
      Object.entries(headers).forEach(([name, value]) => {
        // Don't override Content-Type if it was already set
        if (name.toLowerCase() !== 'content-type') {
          c.header(name, String(value));
        }
      });
      
      // Ensure body is a string (Camo requires valid SVG)
      const svgBody = typeof body === 'string' ? body : String(body);
      
      // Return the response with explicit 200 status for Camo compatibility
      return c.html(svgBody);
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
    const res = createMockResponse(c);
    
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
          // Reconstruct the response with headers
          return c.html(body);
        }
        return result !== undefined ? result : c;
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
      return c.text('No response generated', 500);
    } catch (error) {
      // Log the error for debugging
      console.error('Adapter error:', error);
      console.error('Error stack:', error.stack);
      console.error('Request URL:', c.req.url);
      console.error('Request query:', c.req.query());
      
      // Return a proper error response instead of throwing
      return c.text(`Error: ${error.message}`, 500);
    }
  };
}

