import { resolveEvolutionDesign } from "../../../lib/evolution-design.js"

export async function onRequestPost(ctx) {
  const { request, env } = ctx
  let payload
  try {
    payload = await request.json()
  } catch (_) {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  try {
    const design = await resolveEvolutionDesign(payload, env)
    return jsonResponse(200, { ok: true, design })
  } catch (error) {
    return jsonResponse(500, { error: error.message || "Evolution design failed." })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
