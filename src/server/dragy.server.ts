import { listAllShelfRecipes } from './recipes.server'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const NARA_MODEL = process.env.NARA_MODEL || 'auto/bynara'

function getApiKey() {
  // Keep compatibility with the exact Netlify variable name the app is
  // currently configured with. The fallback also supports the conventional
  // name if it is added later.
  return process.env.Api_key || process.env.NARA_API_KEY
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
  if (!apiKey) {
    return {
      error: 'Dragy AI is not configured yet. Add the Nara API key to the server environment.',
    }
  }

  const recipes = await listAllShelfRecipes()
  const recent = messages.slice(-12)

  const system = `You are Dragy, the friendly AI kitchen assistant inside Cook & Flame.
Help with recipes, substitutions, cooking technique, meal planning, and choosing from the Cook & Flame shelf.
Use the shelf context when recommending recipes. Never invent a recipe slug, nutrition value, rating, or ingredient that is not present in the context.
If the user asks about nutrition, explain that listed recipe macros are estimates from the app and may not reflect actual portions.
Be concise and practical. You can recommend a recipe by exact title and slug when useful.

Cook & Flame shelf context:
${JSON.stringify(buildContext(recipes))}`

  const naraMessages = [
    { role: 'system', content: system },
    ...recent.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  ]

  try {
    const response = await fetch('https://router.bynara.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NARA_MODEL,
        messages: naraMessages,
        temperature: 0.7,
        max_tokens: 700,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Nara Dragy error:', response.status, detail)
      return { error: 'Dragy could not reach the AI service right now. Please try again.' }
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { error: 'Dragy received an empty response. Try asking in a different way.' }
    }

    return { text }
  } catch (error) {
    console.error('Nara Dragy request failed:', error)
    return { error: 'Dragy could not reach the AI service right now. Please try again.' }
  }
}
