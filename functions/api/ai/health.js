import { resolveProviderState } from "../../lib/image-generator.js"

export async function onRequestGet(ctx) {
  const { env } = ctx
  const providerState = resolveProviderState(env)
  return jsonResponse(200, {
    ok: true,
    server: true,
    imageProvider: providerState.primaryProvider,
    imageProviderReady: providerState.ready,
    availableProviders: providerState.availableProviders,
    comfyBaseUrl: null,
    comfyReachable: providerState.ready,
    activeTaskId: null,
    queuedCount: 0,
    publicBaseUrl: null,
    providerHint: providerState.hint,
  })
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
