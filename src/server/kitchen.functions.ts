/**
 * The public RPC surface. Routes and components import from here; everything
 * in `*.server.ts` stays on the server.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  currentUser,
  loginUser,
  logoutCurrentUser,
  registerUser,
} from './auth.server'
import {
  challengeWinner,
  communityStats,
  getLeaderboards,
  getProfile,
  listChallengeEntries,
  logCook,
  rateRecipe,
  ratingIndex,
  submitChallengeEntry,
  voteForEntry,
} from './kitchen.server'
import { activeChallenge, previousChallenge } from '../data/challenges'
import { askDragy } from './dragy.server'
import { analyzeMacroPhoto, clearMacroLog, deleteMacroEntry, getMacroLog, saveMacroEntry } from './macro.server'
import { addMealPlanItem, clearMealPlan, createUserRecipe, getMealPlan, getMyFavorites, getShelfRecipe, getUserRecipe, listAllShelfRecipes, listMyRecipes, removeMealPlanItem, toggleFavorite } from './recipes.server'

/* ---------------------------------------------------------------- session -- */

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return { user: null, profile: null }
  return { user, profile: await getProfile(user.id) }
})

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().min(3).max(200),
      password: z.string().min(1).max(200),
      displayName: z.string().min(1).max(40),
    }),
  )
  .handler(async ({ data }) => registerUser(data))

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().min(3).max(200),
      password: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data }) => loginUser(data))

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  await logoutCurrentUser()
  return { ok: true }
})

/* ------------------------------------------------------------------- cook -- */

export const cookedIt = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeSlug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to keep track of what you cook.' }
    return logCook(user.id, data.recipeSlug)
  })

export const rate = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ recipeSlug: z.string().min(1).max(120), stars: z.number().min(1).max(5) }),
  )
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to rate a recipe.' }
    return rateRecipe(user.id, data.recipeSlug, data.stars)
  })

export const getStats = createServerFn({ method: 'GET' }).handler(async () => {
  const [stats, ratings] = await Promise.all([communityStats(), ratingIndex()])
  return { stats, ratings }
})

export const getMyKitchen = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return null
  return { user, profile: await getProfile(user.id) }
})

/* -------------------------------------------------------------- challenge -- */

export const getChallengeBoard = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  const active = activeChallenge()
  const previous = previousChallenge()

  const [entries, lastWinner] = await Promise.all([
    listChallengeEntries(active.slug, user?.id ?? null),
    challengeWinner(previous.slug),
  ])

  return {
    signedIn: Boolean(user),
    activeSlug: active.slug,
    previousSlug: previous.slug,
    entries,
    lastWinner,
    hasEntered: entries.some((e) => e.isOwn),
  }
})

export const submitEntry = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      recipeSlug: z.string().min(1).max(120),
      caption: z.string().max(280),
      contentType: z.string().min(3).max(60),
      // Base64 of the photo. Bounded here as well as by byte length later.
      data: z.string().min(1).max(9_000_000),
    }),
  )
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to enter this week’s challenge.' }

    return submitChallengeEntry({
      userId: user.id,
      challengeSlug: activeChallenge().slug,
      recipeSlug: data.recipeSlug,
      caption: data.caption,
      photo: { data: data.data, contentType: data.contentType },
    })
  })

export const vote = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ entryId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to vote.' }
    return voteForEntry(user.id, data.entryId)
  })

/* ------------------------------------------------------------ leaderboard -- */

export const getBoards = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  const boards = await getLeaderboards()
  return { ...boards, viewerId: user?.id ?? null }
})


/* --------------------------------------------------------- personal recipes -- */

export const createRecipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    title: z.string().min(2).max(160),
    description: z.string().max(1000),
    category: z.string().min(1).max(40),
    cuisine: z.string().min(1).max(60),
    difficulty: z.string().min(1).max(20),
    servings: z.number().int().min(1).max(100),
    prepTime: z.number().int().min(0).max(1440),
    cookTime: z.number().int().min(0).max(1440),
    ingredients: z.array(z.string()).max(100),
    instructions: z.array(z.string()).max(100),
  }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to save your recipe.' }
    return createUserRecipe(user.id, data)
  })

export const getMyRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return { recipes: [] }
  return { recipes: await listMyRecipes(user.id) }
})

export const getFavorites = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return { favorites: [] as string[] }
  return { favorites: await getMyFavorites(user.id) }
})

export const favoriteRecipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeSlug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to save favorites.' }
    return toggleFavorite(user.id, data.recipeSlug)
  })

/* ----------------------------------------------------------- meal planner -- */

export const getMyMealPlan = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return { plan: null }
  return { plan: await getMealPlan(user.id) }
})

export const addToMealPlan = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ day: z.string(), recipeSlug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to save a meal plan.' }
    return addMealPlanItem(user.id, data.day, data.recipeSlug)
  })

export const removeFromMealPlan = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to edit your meal plan.' }
    return removeMealPlanItem(user.id, data.id)
  })

export const clearMyMealPlan = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await currentUser()
  if (!user) return { error: 'Sign in to clear your meal plan.' }
  return clearMealPlan(user.id)
})


export const getSavedRecipe = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => getUserRecipe(data.slug))


export const getShelfRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  return { recipes: await listAllShelfRecipes() }
})

export const getUnifiedRecipe = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => getShelfRecipe(data.slug))


export const chatWithDragy = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(4000) })).min(1).max(20) }))
  .handler(async ({ data }) => askDragy(data.messages))


/* ------------------------------------------------------------- macro tracker -- */

const loggedOnSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid calendar date.')

export const analyzeMealPhoto = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    data: z.string().min(1).max(9_000_000),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }))
  .handler(async ({ data }) => analyzeMacroPhoto(data))

export const getMyMacroLog = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ loggedOn: loggedOnSchema }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { entries: [] }
    return { entries: await getMacroLog(user.id, data.loggedOn) }
  })

export const saveMacroLog = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    loggedOn: loggedOnSchema,
    title: z.string().min(1).max(160),
    calories: z.number().finite().min(0).max(15000),
    protein: z.number().finite().min(0).max(1500),
    carbs: z.number().finite().min(0).max(1500),
    fat: z.number().finite().min(0).max(1500),
    items: z.array(z.object({
      name: z.string().min(1).max(120),
      calories: z.number().finite().min(0).max(5000),
      protein: z.number().finite().min(0).max(500),
      carbs: z.number().finite().min(0).max(500),
      fat: z.number().finite().min(0).max(500),
    })).max(30).optional(),
    notes: z.array(z.string().max(280)).max(8).optional(),
    source: z.enum(['photo', 'recipe']).optional(),
  }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to save nutrition entries.' }
    return saveMacroEntry(user.id, data)
  })

export const deleteMyMacroLog = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to edit your nutrition log.' }
    return deleteMacroEntry(user.id, data.id)
  })

export const clearMyMacroLog = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ loggedOn: loggedOnSchema }))
  .handler(async ({ data }) => {
    const user = await currentUser()
    if (!user) return { error: 'Sign in to clear your nutrition log.' }
    return clearMacroLog(user.id, data.loggedOn)
  })
