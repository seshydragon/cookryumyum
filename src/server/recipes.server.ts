import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { mealPlanItems, recipeFavorites, userRecipes } from '../../db/schema'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)

export async function createUserRecipe(userId: number, input: {
  title: string
  description: string
  category: string
  cuisine: string
  difficulty: string
  servings: number
  prepTime: number
  cookTime: number
  ingredients: string[]
  instructions: string[]
}) {
  const title = input.title.trim().slice(0, 160)
  if (title.length < 2) return { error: 'Give the recipe a name.' }
  const base = slugify(title) || 'recipe'
  const slug = `user-${userId}-${base}-${Date.now().toString(36)}`

  const [recipe] = await db.insert(userRecipes).values({
    userId,
    slug,
    title,
    description: input.description.trim().slice(0, 1000),
    category: input.category.trim().slice(0, 40),
    cuisine: input.cuisine.trim().slice(0, 60),
    difficulty: input.difficulty.trim().slice(0, 20),
    servings: Math.max(1, Math.min(100, Math.round(input.servings))),
    prepTime: Math.max(0, Math.min(1440, Math.round(input.prepTime))),
    cookTime: Math.max(0, Math.min(1440, Math.round(input.cookTime))),
    ingredients: input.ingredients.map((x) => x.trim()).filter(Boolean).slice(0, 100),
    instructions: input.instructions.map((x) => x.trim()).filter(Boolean).slice(0, 100),
  }).returning({ slug: userRecipes.slug })

  return { slug: recipe.slug }
}

export async function getUserRecipe(slug: string) {
  const [recipe] = await db.select({
    slug: userRecipes.slug,
    title: userRecipes.title,
    description: userRecipes.description,
    category: userRecipes.category,
    cuisine: userRecipes.cuisine,
    difficulty: userRecipes.difficulty,
    servings: userRecipes.servings,
    prepTime: userRecipes.prepTime,
    cookTime: userRecipes.cookTime,
    ingredients: userRecipes.ingredients,
    instructions: userRecipes.instructions,
    userId: userRecipes.userId,
  }).from(userRecipes).where(eq(userRecipes.slug, slug))
  return recipe ?? null
}

export async function listMyRecipes(userId: number) {
  return db.select({
    slug: userRecipes.slug,
    title: userRecipes.title,
    description: userRecipes.description,
    category: userRecipes.category,
    cuisine: userRecipes.cuisine,
    difficulty: userRecipes.difficulty,
    servings: userRecipes.servings,
    prepTime: userRecipes.prepTime,
    cookTime: userRecipes.cookTime,
    ingredients: userRecipes.ingredients,
    instructions: userRecipes.instructions,
    createdAt: userRecipes.createdAt,
  }).from(userRecipes).where(eq(userRecipes.userId, userId)).orderBy(desc(userRecipes.createdAt))
}

export async function getMyFavorites(userId: number) {
  const rows = await db.select({ recipeSlug: recipeFavorites.recipeSlug })
    .from(recipeFavorites)
    .where(eq(recipeFavorites.userId, userId))
  return rows.map((r) => r.recipeSlug)
}

export async function toggleFavorite(userId: number, recipeSlug: string) {
  const existing = await db.select({ id: recipeFavorites.id })
    .from(recipeFavorites)
    .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeSlug, recipeSlug)))

  if (existing.length) {
    await db.delete(recipeFavorites).where(eq(recipeFavorites.id, existing[0].id))
    return { saved: false }
  }

  await db.insert(recipeFavorites).values({ userId, recipeSlug })
  return { saved: true }
}

export async function getMealPlan(userId: number) {
  const rows = await db.select({
    id: mealPlanItems.id,
    day: mealPlanItems.day,
    position: mealPlanItems.position,
    recipeSlug: mealPlanItems.recipeSlug,
  }).from(mealPlanItems).where(eq(mealPlanItems.userId, userId))

  const plan: Record<string, Array<{ id: number; recipeSlug: string; position: number }>> = {}
  for (const day of DAYS) plan[day] = []
  for (const row of rows) {
    if (!plan[row.day]) plan[row.day] = []
    plan[row.day].push({ id: row.id, recipeSlug: row.recipeSlug, position: row.position })
  }
  for (const day of DAYS) plan[day].sort((a, b) => a.position - b.position)
  return plan
}

export async function addMealPlanItem(userId: number, day: string, recipeSlug: string) {
  if (!DAYS.includes(day)) return { error: 'That is not a valid day.' }
  const rows = await db.select({ position: mealPlanItems.position })
    .from(mealPlanItems)
    .where(and(eq(mealPlanItems.userId, userId), eq(mealPlanItems.day, day)))
  const position = rows.reduce((max, row) => Math.max(max, row.position), -1) + 1
  const [item] = await db.insert(mealPlanItems).values({ userId, day, position, recipeSlug })
    .returning({ id: mealPlanItems.id, day: mealPlanItems.day, position: mealPlanItems.position, recipeSlug: mealPlanItems.recipeSlug })
  return { item }
}

export async function removeMealPlanItem(userId: number, id: number) {
  await db.delete(mealPlanItems).where(and(eq(mealPlanItems.id, id), eq(mealPlanItems.userId, userId)))
  return { ok: true }
}

export async function clearMealPlan(userId: number) {
  await db.delete(mealPlanItems).where(eq(mealPlanItems.userId, userId))
  return { ok: true }
}
