import { getShelfRecipe, listAllShelfRecipes } from './recipes.server'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
}

function buildContext(recipes: Awaited<ReturnType<typeof listAllShelfRecipes>>) {
  return recipes.slice(0, 80).map((r) => ({
    slug: r.slug,
    title: r.title,
    cuisine: r.cuisine,
    minutes: r.minutes,
    difficulty: r.difficulty,
    servings: r.servings,
    protein: r.macros.protein,
    calories: r.macros.calories,
    tags: r.tags,
  }))
}

export async function askDragy(messages: ChatMessage[]) {
  const apiKey = getApiKey()
  if (!apiKey) return { error: 'Dragy AI is not configured yet. Add GEMINI_API_KEY to the server environment.' }

  const recipes = await listAllShelfRecipes()
  const recent = messages.slice(-12)

  const system = `You are Dragy, the friendly AI kitchen assistant inside Cook & Flame.
Help with recipes, substitutions, cooking technique, meal planning, and choosing from the Cook & Flame shelf.
Use the shelf context when recommending recipes. Never invent a recipe slug, nutrition value, rating, or ingredient that is not present in the context.
If the user asks for nutrition, explain that listed recipe macros are estimates from the app and may not reflect actual portions.
Be concise and practical. You can recommend a recipe by exact title and slug when useful.

Cook & Flame shelf context:
${JSON.stringify(buildContext(recipes))}`

  const contents = recent.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    console.error('Gemini Dragy error:', response.status, detail)
    return { error: 'Dragy could not reach the AI service right now. Please try again.' }
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim()
  if (!text) return { error: 'Dragy received an empty response. Try asking in a different way.' }

  return { text }
}
