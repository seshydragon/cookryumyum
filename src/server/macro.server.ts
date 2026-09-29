import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { macroLogs } from '../../db/schema'

const NARA_VISION_MODEL = process.env.NARA_VISION_MODEL || 'deepseek-v4-flash-vision-exp'
const MAX_IMAGE_BYTES = 6 * 1024 * 1024

const macroItemSchema = z.object({
  name: z.string().min(1).max(120),
  calories: z.number().finite().min(0).max(5000),
  protein: z.number().finite().min(0).max(500),
  carbs: z.number().finite().min(0).max(500),
  fat: z.number().finite().min(0).max(500),
})

const macroAnalysisSchema = z.object({
  title: z.string().min(1).max(160),
  items: z.array(macroItemSchema).max(30),
  totals: z.object({
    calories: z.number().finite().min(0).max(15000),
    protein: z.number().finite().min(0).max(1500),
    carbs: z.number().finite().min(0).max(1500),
    fat: z.number().finite().min(0).max(1500),
  }),
  notes: z.array(z.string().max(280)).max(8),
})

type MacroAnalysis = z.infer<typeof macroAnalysisSchema>
type StoredItem = z.infer<typeof macroItemSchema>

function getApiKey() {
  return process.env.Api_key || process.env.NARA_API_KEY
}

function roundNutrition(value: number) {
  return Math.max(0, Math.round(value))
}

function extractJson(text: string) {
  const trimmed = text.trim().replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/i, '').replace(/\s*\`\`\`$/i, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  return trimmed.slice(start, end + 1)
}

export async function analyzeMacroPhoto(input: {
  data: string
  contentType: string
}): Promise<{ analysis: MacroAnalysis } | { error: string }> {
  const apiKey = getApiKey()
  if (!apiKey) return { error: 'AI nutrition analysis is not configured. Add the Nara key to the server environment.' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(input.contentType)) {
    return { error: 'Photos need to be a JPEG, PNG or WebP.' }
  }

  let imageBytes = 0
  try {
    imageBytes = Buffer.byteLength(input.data, 'base64')
  } catch {
    return { error: 'That image could not be read. Try another photo.' }
  }
  if (!imageBytes || imageBytes > MAX_IMAGE_BYTES) {
    return { error: 'That image is too large. Use a photo under 6 MB.' }
  }

  const system = `You are Cook & Flame's food-photo nutrition estimator.
Identify the visible food and estimate the portion sizes from the image. Give useful, cautious estimates rather than pretending the numbers are exact.
Return ONLY valid JSON matching this shape:
{
  "title": "short meal name",
  "items": [
    { "name": "food item", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "notes": ["brief uncertainty or portion note"]
}
Calories are kcal. Protein, carbs and fat are grams.
Do not give medical advice, weight-loss advice, or body-composition judgments.
If a food or portion is uncertain, say so in notes and use a reasonable estimate.`

  try {
    const response = await fetch('https://router.bynara.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NARA_VISION_MODEL,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this meal photo and estimate its nutrition.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${input.contentType};base64,${input.data}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Nara macro analysis error:', response.status, detail)
      return { error: 'The AI could not analyze that photo. Try another image.' }
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const output = data.choices?.[0]?.message?.content?.trim()
    if (!output) return { error: 'The AI returned no nutrition estimate. Try again.' }

    const parsedText = extractJson(output)
    if (!parsedText) return { error: 'The AI returned an unreadable nutrition estimate. Try again.' }

    const analysis = macroAnalysisSchema.safeParse(JSON.parse(parsedText))
    if (!analysis.success) {
      console.error('Invalid Nara macro response:', analysis.error)
      return { error: 'The AI returned an incomplete nutrition estimate. Try again.' }
    }

    const normalized: MacroAnalysis = {
      ...analysis.data,
      items: analysis.data.items.map((item) => ({
        ...item,
        calories: roundNutrition(item.calories),
        protein: roundNutrition(item.protein),
        carbs: roundNutrition(item.carbs),
        fat: roundNutrition(item.fat),
      })),
      totals: {
        calories: roundNutrition(analysis.data.totals.calories),
        protein: roundNutrition(analysis.data.totals.protein),
        carbs: roundNutrition(analysis.data.totals.carbs),
        fat: roundNutrition(analysis.data.totals.fat),
      },
    }

    return { analysis: normalized }
  } catch (error) {
    console.error('Nara macro request failed:', error)
    return { error: 'The AI service is unavailable right now. Try again in a moment.' }
  }
}

export async function getMacroLog(userId: number, loggedOn: string) {
  return db
    .select({
      id: macroLogs.id,
      loggedOn: macroLogs.loggedOn,
      title: macroLogs.title,
      calories: macroLogs.calories,
      protein: macroLogs.protein,
      carbs: macroLogs.carbs,
      fat: macroLogs.fat,
      items: macroLogs.items,
      notes: macroLogs.notes,
      source: macroLogs.source,
      createdAt: macroLogs.createdAt,
    })
    .from(macroLogs)
    .where(and(eq(macroLogs.userId, userId), eq(macroLogs.loggedOn, loggedOn)))
    .orderBy(desc(macroLogs.createdAt))
}

export async function saveMacroEntry(userId: number, input: {
  loggedOn: string
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
  items?: StoredItem[]
  notes?: string[]
  source?: 'photo' | 'recipe'
}) {
  const [entry] = await db.insert(macroLogs).values({
    userId,
    loggedOn: input.loggedOn,
    title: input.title.trim().slice(0, 160),
    calories: roundNutrition(input.calories),
    protein: roundNutrition(input.protein),
    carbs: roundNutrition(input.carbs),
    fat: roundNutrition(input.fat),
    items: (input.items ?? []).slice(0, 30),
    notes: (input.notes ?? []).join(' ').slice(0, 1200),
    source: input.source ?? 'photo',
  }).returning({
    id: macroLogs.id,
    loggedOn: macroLogs.loggedOn,
    title: macroLogs.title,
    calories: macroLogs.calories,
    protein: macroLogs.protein,
    carbs: macroLogs.carbs,
    fat: macroLogs.fat,
    items: macroLogs.items,
    notes: macroLogs.notes,
    source: macroLogs.source,
    createdAt: macroLogs.createdAt,
  })

  return entry
}

export async function deleteMacroEntry(userId: number, id: number) {
  await db.delete(macroLogs).where(and(eq(macroLogs.id, id), eq(macroLogs.userId, userId)))
  return { ok: true }
}

export async function clearMacroLog(userId: number, loggedOn: string) {
  await db.delete(macroLogs).where(and(eq(macroLogs.userId, userId), eq(macroLogs.loggedOn, loggedOn)))
  return { ok: true }
}
