// Build-time asset generation: renders every recipe photo through the Netlify AI
// Gateway with a Gemini image model. Run once per new recipe, not at request time.
import { readFile, writeFile, mkdir, access, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join } from 'node:path'
import { GoogleGenAI } from '@google/genai'

const run = promisify(execFile)

const OUT_ROOT = new URL('../public/img/', import.meta.url).pathname
const MODEL = 'gemini-3.1-flash-image'
const CONCURRENCY = 5

const ai = new GoogleGenAI({
  apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
  httpOptions: { baseUrl: process.env.NETLIFY_AI_GATEWAY_BASE_URL?.replace(/\/$/, '') },
})

const { style, images } = JSON.parse(
  await readFile(new URL('./image-prompts.json', import.meta.url), 'utf8'),
)

const exists = async (p) => access(p).then(() => true, () => false)

async function render({ file, prompt }, attempt = 1) {
  const target = join(OUT_ROOT, file)
  if (await exists(target)) return `skip  ${file}`

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: `${prompt}\n\nStyle: ${style}`,
    })
    const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    if (!part) throw new Error('no image part in response')
    await mkdir(dirname(target), { recursive: true })

    // The model hands back a PNG. Nothing links these originals directly — every
    // reference goes through the Image CDN — so they are committed as progressive
    // JPEG instead, which is a fifteenth of the weight at the same visible quality.
    const raw = `${target}.raw.png`
    await writeFile(raw, Buffer.from(part.inlineData.data, 'base64'))
    await run('convert', [raw, '-quality', '88', '-sampling-factor', '4:2:0', '-strip', '-interlace', 'Plane', target])
    await rm(raw, { force: true })

    return `ok    ${file}`
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt))
      return render({ file, prompt }, attempt + 1)
    }
    return `FAIL  ${file} — ${err.message}`
  }
}

const queue = [...images]
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const job = queue.shift()
    console.log(await render(job))
  }
})
await Promise.all(workers)
console.log('done')
