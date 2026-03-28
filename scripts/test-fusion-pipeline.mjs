/**
 * 多图参考融合管道验证脚本
 * 用法: node scripts/test-fusion-pipeline.mjs
 *
 * 取 baokm/ 下两张白底图作为参考，调用 proxy 生成融合立绘，验证管道是否正常。
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadLocalEnv } from "./load-local-env.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
loadLocalEnv(projectRoot)

const proxyApiBaseUrl = process.env.AISERVICEPROXY_BASE_URL || "http://aitools.g-bits.com/aiserviceproxy"
const proxyApiKey = process.env.AISERVICEPROXY_API_KEY || ""
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
const geminiApiKey = process.env.GEMINI_API_KEY || ""
const preferredProvider = (process.env.RUNTIME_IMAGE_PROVIDER || "proxy").toLowerCase()
const model = preferredProvider === "gemini-official"
  ? (process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation")
  : (process.env.AISERVICEPROXY_IMAGE_MODEL || "banana-pro")

async function main() {
  const useGemini = preferredProvider === "gemini-official" || preferredProvider === "gemini"
  if (useGemini && !geminiApiKey) {
    console.error("❌ GEMINI_API_KEY not set")
    process.exit(1)
  }
  if (!useGemini && !proxyApiKey) {
    console.error("❌ AISERVICEPROXY_API_KEY not set")
    process.exit(1)
  }

  console.log(`✅ Provider: ${useGemini ? "gemini-official" : "proxy"}, model: ${model}`)

  // 取 baokm/ 下前两张白底 jpg
  const baokm = path.join(projectRoot, "baokm")
  const files = (await fs.readdir(baokm))
    .filter(f => f.endsWith("_white.jpg"))
    .slice(0, 2)

  if (files.length < 2) {
    console.error("❌ Need at least 2 _white.jpg files in baokm/")
    process.exit(1)
  }

  console.log(`✅ Using reference images:`)
  files.forEach(f => console.log(`   ${f}`))

  // Load as base64
  const refBuffers = await Promise.all(
    files.map(f => fs.readFile(path.join(baokm, f)))
  )

  const prompt = [
    "anime creature key art, fusion evolution of two monsters shown in reference images",
    "blend visual traits from both references into one new creature",
    "clean silhouette, high detail materials, dynamic pose",
    "single creature only, no human, no text, no watermark",
    "solid white background",
  ].join(", ")

  console.log(`\n🚀 Submitting multi-reference image generation...`)
  console.log(`   prompt: ${prompt.slice(0, 80)}...`)

  const startMs = Date.now()
  let b64Result = null

  if (useGemini) {
    // Gemini inline parts
    const referenceParts = refBuffers.map(buf => ({
      inlineData: { mimeType: "image/jpeg", data: buf.toString("base64") }
    }))
    const parts = [{ text: prompt }, ...referenceParts]
    const res = await fetch(
      `${geminiApiBaseUrl}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    )
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
    const text = await res.text()
    if (!res.ok) {
      console.error(`❌ Gemini HTTP ${res.status} after ${elapsed}s`)
      console.error(text.slice(0, 800))
      process.exit(1)
    }
    const payload = JSON.parse(text)
    const candidates = payload?.candidates || []
    for (const c of candidates) {
      for (const p of c?.content?.parts || []) {
        if (p?.inlineData?.data) { b64Result = p.inlineData.data; break }
      }
      if (b64Result) break
    }
    if (!b64Result) {
      console.error(`❌ Gemini returned no image after ${elapsed}s`)
      console.error(JSON.stringify(payload, null, 2).slice(0, 600))
      process.exit(1)
    }
    console.log(`✅ Gemini success in ${elapsed}s`)
  } else {
    // Proxy input_images
    const inputImages = refBuffers.map(buf => `data:image/jpeg;base64,${buf.toString("base64")}`)
    const res = await fetch(`${proxyApiBaseUrl}/api/v1/image/generate`, {
      method: "POST",
      headers: { authorization: `Bearer ${proxyApiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model, prompt,
        negative_prompt: "photo, realistic, multiple characters, text, watermark, blurry",
        size: [768, 1024], n: 1, response_format: "b64_json", async: false,
        input_images: inputImages,
      }),
    })
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
    const text = await res.text()
    if (!res.ok) {
      console.error(`❌ Proxy HTTP ${res.status} after ${elapsed}s`)
      console.error(text.slice(0, 500))
      process.exit(1)
    }
    const payload = JSON.parse(text)
    const image = payload?.data?.images?.[0]
    if (!image?.b64_json) {
      console.error(`❌ Proxy no image after ${elapsed}s`)
      console.error(JSON.stringify(payload, null, 2).slice(0, 500))
      process.exit(1)
    }
    b64Result = image.b64_json
    console.log(`✅ Proxy success in ${elapsed}s`)
  }

  // Save result
  const outPath = path.join(baokm, `fusion_test_result_${Date.now()}.jpg`)
  await fs.writeFile(outPath, Buffer.from(b64Result, "base64"))
  console.log(`\n✅ Saved: ${path.relative(projectRoot, outPath)}`)
  console.log(`   Size: ${(b64Result.length * 0.75 / 1024).toFixed(0)} KB`)
}

main().catch(err => {
  console.error("❌ Fatal:", err.message || err)
  process.exit(1)
})
