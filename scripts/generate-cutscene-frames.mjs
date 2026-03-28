/**
 * 生成开场神兽战关键帧
 * 输出目录：assets/cutscenes/opening/
 * 用法：node scripts/generate-cutscene-frames.mjs
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const outputDir = path.join(projectRoot, "assets", "cutscenes", "opening")

const proxyApiBaseUrl = process.env.AISERVICEPROXY_BASE_URL || "http://aitools.g-bits.com/aiserviceproxy"
const proxyApiKey = process.env.AISERVICEPROXY_API_KEY || ""
const proxyImageModel = process.env.AISERVICEPROXY_IMAGE_MODEL || "banana-pro"
const geminiApiBase = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
const geminiApiKey = process.env.GEMINI_API_KEY || ""
const geminiModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"

// 视觉基线：两大神兽的共同描述前缀（保持跨帧风格一致）
const SOLARAITH_DESC = "Solaraith the legendary solar fusion sacred beast (golden four-legged dragon with left wing made of fire and right wing made of white crystal-light, golden armor with fusion seams, sun halo)"
const ABYSSALOR_DESC = "Abyssalor the legendary abyss sea ancient dragon (massive dark blue-black sea dragon with bioluminescent purple-blue markings, oceanic dorsal fins, glowing purple void core in chest)"
const STYLE_SUFFIX = "official Pokemon-style legendary creature art, extremely detailed cel-shading with dramatic cinematic lighting, bold clean black outlines, epic battle composition, dynamic perspective, 16:9 widescreen cinematic format, no text, no watermark, no UI, 16:9 aspect ratio"

const FRAMES = [
  {
    filename: "frame_01_standoff.jpg",
    label: "对峙",
    prompt: `Epic cinematic standoff scene: ${SOLARAITH_DESC} stands on the LEFT side facing right, and ${ABYSSALOR_DESC} stands on the RIGHT side facing left. Both beasts are in full view, tensed and ready to strike, separated by a charged gap of crackling energy in the center. The ground between them is cracked and glowing from the pressure of their opposing auras - solar fire energy on the left side, dark ocean-void energy on the right. Camera is wide, low angle looking slightly upward to make both beasts feel colossal. The atmosphere is electric with tension, storm clouds forming above, lit dramatically by the clash of golden light vs deep-ocean blue-dark. ${STYLE_SUFFIX}`
  },
  {
    filename: "frame_02_first_clash.jpg",
    label: "首次交锋",
    prompt: `Epic cinematic first clash: ${SOLARAITH_DESC} and ${ABYSSALOR_DESC} colliding violently in the CENTER of frame, their bodies meeting in an explosive impact. Solaraith's fire-crystal wing slashing against Abyssalor's dark sea-dragon body, massive shockwave explosion radiating outward from the point of contact, debris and energy fragments flying outward in all directions. Both beasts locked together in a power struggle, teeth and claws engaged, expressions fierce. The impact point glows brilliant white from the collision of solar fire vs deep ocean void energy. Camera close and dynamic, tilted for dramatic effect, capturing the raw force of the collision. ${STYLE_SUFFIX}`
  },
  {
    filename: "frame_03_energy_clash.jpg",
    label: "能量对冲",
    prompt: `Epic cinematic energy beam collision: ${SOLARAITH_DESC} on the LEFT firing a massive golden solar fire + crystal light fusion beam from its open jaws, ${ABYSSALOR_DESC} on the RIGHT countering with a devastating dark ocean-void beam of deep blue-black destructive water energy. The two beams COLLIDE in the CENTER of frame in a colossal energy explosion - at the collision point a massive sphere of mixed gold-white and dark-blue energy is expanding outward violently, the ground beneath completely obliterated, shockwave rings rippling outward. Both beasts are straining with full power, auras blazing, the clash of energies creating a blinding storm of particles. Wide shot capturing both beasts and the full scale of the energy collision. ${STYLE_SUFFIX}`
  },
  {
    filename: "frame_04_devour_suppression.jpg",
    label: "吞噬压制",
    prompt: `Epic cinematic devour suppression: ${ABYSSALOR_DESC} is dominating the scene, its massive void maw wide open generating a powerful gravitational vortex of dark ocean energy that is pulling everything toward it, ${SOLARAITH_DESC} being pushed backward on the RIGHT side, struggling to resist the pull, its fusion wings straining against the suction force. Abyssalor takes up more than half the frame, overwhelming presence, the void-maw creating a dark vortex that bends light and pulls debris inward. Solaraith's golden aura is being partially absorbed and distorted by the devour force. The scene conveys Abyssalor having the upper hand, Solaraith forced on the defensive. Dark and intense lighting, Abyssalor's bioluminescent markings blazing at maximum intensity. ${STYLE_SUFFIX}`
  },
  {
    filename: "frame_05_fusion_counterattack.jpg",
    label: "融合反击",
    prompt: `Epic cinematic fusion counterattack: ${SOLARAITH_DESC} dramatically turns the tide, both wings fully spread to maximum span - LEFT wing erupting in towering pillars of solar fire, RIGHT wing crystallizing into a massive wall of pure light-crystal energy, both energies MERGING together at the wing junction in a blinding fusion explosion. Solaraith in a powerful forward-charging stance, the fusion energy detonation pushing back ${ABYSSALOR_DESC} on the right side, Abyssalor visibly being overwhelmed and pushed backward by the fusion burst. The fusion explosion is the most spectacular visual of the sequence - an expanding nova of gold-white crystal fire that overwhelms the dark ocean-void with sheer combined power. Solaraith is triumphant and magnificent in this moment. ${STYLE_SUFFIX}`
  },
  {
    filename: "frame_06_white_convergence.jpg",
    label: "白光收束（梦醒前）",
    prompt: `Epic cinematic final convergence before awakening: both ${SOLARAITH_DESC} and ${ABYSSALOR_DESC} are locked in a final mutual energy release, both beasts silhouetted against an overwhelming blinding white light that is consuming the entire frame from the center outward. The beasts are visible as dark silhouettes being consumed by the expanding white-gold light, their forms dissolving at the edges. The center of frame is pure blinding white, with just enough detail at the edges to see both dragon silhouettes being absorbed into the light. This is the dream-ending moment - the white light of awakening washing over everything. The composition should feel like the whole scene is fading to white, almost everything consumed. Serene yet overwhelming, a moment of transcendent power. ${STYLE_SUFFIX}`
  },
]

async function generateViaProxy(prompt) {
  const response = await fetch(`${proxyApiBaseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${proxyApiKey}`,
    },
    body: JSON.stringify({
      model: proxyImageModel,
      prompt,
      size: "1920x1080",
      n: 1,
    }),
    signal: AbortSignal.timeout(180000),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Proxy error ${response.status}: ${text.slice(0, 200)}`)
  }
  const data = await response.json()
  const img = data?.data?.[0]
  if (!img) throw new Error("Proxy returned no image data")
  return img
}

async function generateViaGemini(prompt) {
  const url = `${geminiApiBase}/models/${geminiModel}:generateContent?key=${geminiApiKey}`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["Image"],
        imageConfig: { aspectRatio: "16:9" },
      },
    }),
    signal: AbortSignal.timeout(180000),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini error ${response.status}: ${text.slice(0, 200)}`)
  }
  const data = await response.json()
  const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
  if (!part) throw new Error("Gemini returned no image part")
  return { b64_json: part.inlineData.data, mime_type: part.inlineData.mimeType }
}

async function resolveImageBytes(img) {
  if (img.b64_json) {
    return Buffer.from(img.b64_json, "base64")
  }
  if (img.url) {
    const res = await fetch(img.url, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) throw new Error(`Image download failed: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error("No image data in response")
}

async function generateFrame(frame, index) {
  console.log(`\n[${index + 1}/6] 生成「${frame.label}」...`)
  let img
  if (proxyApiKey) {
    try {
      img = await generateViaProxy(frame.prompt)
    } catch (err) {
      console.warn(`  Proxy 失败，切换 Gemini: ${err.message}`)
    }
  }
  if (!img && geminiApiKey) {
    img = await generateViaGemini(frame.prompt)
  }
  if (!img) throw new Error("无可用图像提供商（请设置 AISERVICEPROXY_API_KEY 或 GEMINI_API_KEY）")

  const bytes = await resolveImageBytes(img)
  const outPath = path.join(outputDir, frame.filename)
  await fs.writeFile(outPath, bytes)
  console.log(`  ✓ 已保存：assets/cutscenes/opening/${frame.filename}`)
  return outPath
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  console.log("=== 开场神兽战关键帧生成 ===")
  console.log(`输出目录：${outputDir}\n`)

  const results = []
  for (let i = 0; i < FRAMES.length; i++) {
    const outPath = await generateFrame(FRAMES[i], i)
    results.push({ label: FRAMES[i].label, file: FRAMES[i].filename, path: outPath })
  }

  console.log("\n=== 生成完成 ===")
  results.forEach(r => console.log(`  ${r.label} → ${r.file}`))
}

main().catch(err => {
  console.error("生成失败:", err.message)
  process.exit(1)
})
