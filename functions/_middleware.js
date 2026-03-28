// Global CORS middleware for all /api/* routes
export async function onRequest(ctx) {
  const { request, next } = ctx

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const response = await next()
  const newResponse = new Response(response.body, response)
  for (const [key, value] of Object.entries(corsHeaders())) {
    newResponse.headers.set(key, value)
  }
  return newResponse
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  }
}
