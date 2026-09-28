/**
 * The kitchen domain: cook logs, the XP ledger, badge unlocks, weekly
 * challenge entries and the leaderboards.
 *
 * Server-only. XP is append-only — a chef's total is the sum of the ledger, and
 * a level is derived from that total rather than stored, so the thresholds in
 * `src/data/progress.ts` can be retuned without a migration.
 */
import { getStore } from '@netlify/blobs'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  badges,
  challengeEntries,
  cookLogs,
  entryVotes,
  recipeRatings,
  users,
  userRecipes,
  xpEvents,
} from '../../db/schema'
import { getRecipe, recipes } from '../data/recipes'
import { BADGES, XP, levelFor } from '../data/progress'
import { activeChallenge, challengeWindow } from '../data/challenges'
import { getShelfRecipe } from './recipes.server'

const PHOTO_STORE = 'challenge-photos'
const MAX_PHOTO_BYTES = 6 * 1024 * 1024

const today = () => new Date().toISOString().slice(0, 10)

async function addXp(userId: number, amount: number, reason: string) {
  await db.insert(xpEvents).values({ userId, amount, reason })
}

async function totalXp(userId: number) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
  return row?.total ?? 0
}

/**
 * Longest run of consecutive days ending today or yesterday. A streak that
 * ended two days ago is over, so it reports zero.
 */
export function streakFromDates(dates: Array<string>) {
  const unique = [...new Set(dates)].sort().reverse()
  if (!unique.length) return 0

  const dayMs = 86400000
  const startOfToday = new Date(today()).getTime()
  const newest = new Date(unique[0]).getTime()
  const gap = Math.round((startOfToday - newest) / dayMs)
  if (gap > 1) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const diff = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / dayMs,
    )
    if (diff === 1) streak++
    else if (diff > 1) break
  }
  return streak
}

/** Re-checks every badge rule and unlocks whatever is newly earned. */
async function evaluateBadges(userId: number) {
  const logs = await db
    .select({
      recipeSlug: cookLogs.recipeSlug,
      cuisine: cookLogs.cuisine,
      protein: cookLogs.protein,
      cookedOn: cookLogs.cookedOn,
    })
    .from(cookLogs)
    .where(eq(cookLogs.userId, userId))

  const owned = new Set(
    (
      await db.select({ slug: badges.badgeSlug }).from(badges).where(eq(badges.userId, userId))
    ).map((b) => b.slug),
  )

  const cooked = (await Promise.all(logs.map((l) => getShelfRecipe(l.recipeSlug)))).filter((r) => r !== null)
  const hasTime = (t: string) => cooked.some((r) => r.timeOfDay.includes(t as never))
  const hasTag = (...tags: Array<string>) =>
    cooked.some((r) => r.tags.some((tag) => tags.includes(tag)))

  const entries = await db
    .select({ id: challengeEntries.id })
    .from(challengeEntries)
    .where(eq(challengeEntries.userId, userId))

  let bestVotes = 0
  if (entries.length) {
    const tallies = await db
      .select({ entryId: entryVotes.entryId, votes: count(entryVotes.id) })
      .from(entryVotes)
      .where(
        inArray(
          entryVotes.entryId,
          entries.map((e) => e.id),
        ),
      )
      .groupBy(entryVotes.entryId)
    bestVotes = tallies.reduce((max, t) => Math.max(max, Number(t.votes)), 0)
  }

  const earned: Record<string, boolean> = {
    'first-plate': logs.length >= 1,
    'early-bird': hasTime('breakfast'),
    'night-owl': hasTime('late-night'),
    'sweet-tooth': hasTime('dessert'),
    'pantry-cleared': hasTag('budget', 'five-ingredients'),
    'heritage-cook': hasTag('slow', 'weekend'),
    'three-in-a-row': streakFromDates(logs.map((l) => l.cookedOn)) >= 3,
    'protein-pusher': logs.filter((l) => l.protein >= 25).length >= 5,
    challenger: entries.length >= 1,
    'globe-trotter': new Set(logs.map((l) => l.cuisine)).size >= 5,
    'full-shelf': new Set(logs.map((l) => l.recipeSlug)).size >= 10,
    'crowd-favourite': bestVotes >= 5,
  }

  const newlyEarned = BADGES.filter((b) => earned[b.slug] && !owned.has(b.slug))

  for (const badge of newlyEarned) {
    await db.insert(badges).values({ userId, badgeSlug: badge.slug }).onConflictDoNothing()
    await addXp(userId, XP.badgeUnlock, `Badge: ${badge.name}`)
  }

  return newlyEarned
}

/** Records a cook, awards the XP it earns, and returns anything newly unlocked. */
export async function logCook(userId: number, recipeSlug: string) {
  const recipe = await getShelfRecipe(recipeSlug)
  if (!recipe) return { error: 'That recipe is not on the shelf.' }

  const priorLogs = await db
    .select({
      recipeSlug: cookLogs.recipeSlug,
      cuisine: cookLogs.cuisine,
      cookedOn: cookLogs.cookedOn,
    })
    .from(cookLogs)
    .where(eq(cookLogs.userId, userId))

  const date = today()
  const alreadyToday = priorLogs.some(
    (l) => l.cookedOn === date && l.recipeSlug === recipeSlug,
  )
  if (alreadyToday) return { error: 'You already logged this one today.' }

  await db.insert(cookLogs).values({
    userId,
    recipeSlug,
    cuisine: recipe.cuisine,
    protein: recipe.macros.protein,
    cookedOn: date,
  })

  const awards: Array<{ label: string; amount: number }> = [
    { label: 'Cooked a recipe', amount: XP.cookRecipe },
  ]

  if (!priorLogs.some((l) => l.cuisine === recipe.cuisine))
    awards.push({ label: `First ${recipe.cuisine} dish`, amount: XP.newCuisine })

  if (!priorLogs.some((l) => l.recipeSlug === recipeSlug))
    awards.push({ label: 'New recipe', amount: XP.newRecipe })

  if (recipe.macros.protein >= 25)
    awards.push({ label: 'Hit your protein target', amount: XP.hitProteinGoal })

  const streak = streakFromDates([...priorLogs.map((l) => l.cookedOn), date])
  if (streak >= 2) awards.push({ label: `${streak} day streak`, amount: XP.streakDay })

  for (const award of awards) await addXp(userId, award.amount, award.label)

  const newBadges = await evaluateBadges(userId)
  const xp = await totalXp(userId)

  return {
    awards,
    newBadges: newBadges.map((b) => b.slug),
    xp,
    streak,
    level: levelFor(xp).level.name,
  }
}

export async function rateRecipe(userId: number, recipeSlug: string, stars: number) {
  if (!(await getShelfRecipe(recipeSlug))) return { error: 'That recipe is not on the shelf.' }
  const value = Math.max(1, Math.min(5, Math.round(stars)))

  const existing = await db
    .select({ id: recipeRatings.id })
    .from(recipeRatings)
    .where(and(eq(recipeRatings.userId, userId), eq(recipeRatings.recipeSlug, recipeSlug)))

  if (existing.length) {
    await db
      .update(recipeRatings)
      .set({ stars: value })
      .where(eq(recipeRatings.id, existing[0].id))
  } else {
    await db.insert(recipeRatings).values({ userId, recipeSlug, stars: value })
    await addXp(userId, XP.ratingLeft, 'Rated a recipe')
  }

  return { stars: value }
}

/** Everything the kitchen page needs about one cook. */
export async function getProfile(userId: number) {
  const [logs, owned, xp, ratings] = await Promise.all([
    db
      .select({
        recipeSlug: cookLogs.recipeSlug,
        cuisine: cookLogs.cuisine,
        protein: cookLogs.protein,
        cookedOn: cookLogs.cookedOn,
      })
      .from(cookLogs)
      .where(eq(cookLogs.userId, userId))
      .orderBy(desc(cookLogs.cookedOn), desc(cookLogs.id)),
    db
      .select({ slug: badges.badgeSlug, earnedAt: badges.earnedAt })
      .from(badges)
      .where(eq(badges.userId, userId)),
    totalXp(userId),
    db
      .select({ recipeSlug: recipeRatings.recipeSlug, stars: recipeRatings.stars })
      .from(recipeRatings)
      .where(eq(recipeRatings.userId, userId)),
  ])

  const cuisinesTried = new Set(logs.map((l) => l.cuisine))

  return {
    xp,
    ...levelFor(xp),
    streak: streakFromDates(logs.map((l) => l.cookedOn)),
    totalCooks: logs.length,
    distinctRecipes: new Set(logs.map((l) => l.recipeSlug)).size,
    cuisinesTried: [...cuisinesTried],
    highProteinCooks: logs.filter((l) => l.protein >= 25).length,
    badges: owned.map((b) => ({ slug: b.slug, earnedAt: b.earnedAt.toISOString() })),
    ratings: Object.fromEntries(ratings.map((r) => [r.recipeSlug, r.stars])),
    recent: await Promise.all(logs.slice(0, 12).map(async (l) => ({
      slug: l.recipeSlug,
      title: (await getShelfRecipe(l.recipeSlug))?.title ?? l.recipeSlug,
      cuisine: l.cuisine,
      cookedOn: l.cookedOn,
    }))),
  }
}

/** Counters on the landing page, read live from the database. */
export async function communityStats() {
  const [[cooks], [cooked], [entries], [votes], [ratings]] = await Promise.all([
    db.select({ n: count(users.id) }).from(users),
    db.select({ n: count(cookLogs.id) }).from(cookLogs),
    db.select({ n: count(challengeEntries.id) }).from(challengeEntries),
    db.select({ n: count(entryVotes.id) }).from(entryVotes),
    db.select({ n: count(recipeRatings.id) }).from(recipeRatings),
  ])

  return {
    recipes: recipes.length + Number((await db.select({ n: count(userRecipes.id) }).from(userRecipes))[0]?.n ?? 0),
    cooks: Number(cooks?.n ?? 0),
    mealsCooked: Number(cooked?.n ?? 0),
    challengeEntries: Number(entries?.n ?? 0),
    votes: Number(votes?.n ?? 0),
    ratings: Number(ratings?.n ?? 0),
  }
}

/** Average community rating per recipe, blended with the shipped baseline. */
export async function ratingIndex() {
  const rows = await db
    .select({
      slug: recipeRatings.recipeSlug,
      avg: sql<number>`avg(${recipeRatings.stars})::float`,
      n: count(recipeRatings.id),
    })
    .from(recipeRatings)
    .groupBy(recipeRatings.recipeSlug)

  return Object.fromEntries(rows.map((r) => [r.slug, { avg: r.avg, n: Number(r.n) }]))
}

export async function getLeaderboards() {
  const byXp = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      avatar: users.avatar,
      xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int`,
    })
    .from(users)
    .leftJoin(xpEvents, eq(xpEvents.userId, users.id))
    .groupBy(users.id, users.displayName, users.avatar)
    .orderBy(desc(sql`coalesce(sum(${xpEvents.amount}), 0)`))
    .limit(20)

  const { start } = challengeWindow()

  const thisWeek = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      avatar: users.avatar,
      cooks: count(cookLogs.id),
      highProtein: sql<number>`count(case when ${cookLogs.protein} >= 25 then 1 end)::int`,
      cuisines: sql<number>`count(distinct ${cookLogs.cuisine})::int`,
    })
    .from(users)
    .innerJoin(cookLogs, eq(cookLogs.userId, users.id))
    .where(sql`${cookLogs.cookedOn} >= ${start.toISOString().slice(0, 10)}`)
    .groupBy(users.id, users.displayName, users.avatar)

  const rows = thisWeek.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
    avatar: r.avatar,
    cooks: Number(r.cooks),
    highProtein: Number(r.highProtein),
    cuisines: Number(r.cuisines),
  }))

  return {
    chefLevel: byXp.map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      avatar: r.avatar,
      xp: Number(r.xp),
      level: levelFor(Number(r.xp)).level.name,
    })),
    mostCooked: [...rows].sort((a, b) => b.cooks - a.cooks).slice(0, 10),
    highProtein: [...rows]
      .filter((r) => r.highProtein > 0)
      .sort((a, b) => b.highProtein - a.highProtein)
      .slice(0, 10),
    mostDiverse: [...rows]
      .filter((r) => r.cuisines > 0)
      .sort((a, b) => b.cuisines - a.cuisines)
      .slice(0, 10),
    weekStart: start.toISOString().slice(0, 10),
  }
}

/** Stores a challenge photo in Blobs and records the entry. */
export async function submitChallengeEntry(input: {
  userId: number
  challengeSlug: string
  recipeSlug: string
  caption: string
  photo: { data: string; contentType: string }
}) {
  if (!getRecipe(input.recipeSlug)) return { error: 'Pick a recipe from the shelf.' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(input.photo.contentType))
    return { error: 'Photos need to be a JPEG, PNG or WebP.' }

  const bytes = Buffer.from(input.photo.data, 'base64')
  if (!bytes.length) return { error: 'That photo did not upload. Try again.' }
  if (bytes.length > MAX_PHOTO_BYTES) return { error: 'That photo is over 6MB.' }

  const existing = await db
    .select({ id: challengeEntries.id, photoKey: challengeEntries.photoKey })
    .from(challengeEntries)
    .where(
      and(
        eq(challengeEntries.userId, input.userId),
        eq(challengeEntries.challengeSlug, input.challengeSlug),
      ),
    )

  const key = `${input.challengeSlug}/${input.userId}-${Date.now()}`
  const store = getStore(PHOTO_STORE)
  await store.set(key, bytes, { metadata: { contentType: input.photo.contentType } })

  const caption = input.caption.trim().slice(0, 280)

  if (existing.length) {
    // Replacing an entry: swap the photo, keep the votes already cast.
    await db
      .update(challengeEntries)
      .set({ photoKey: key, caption, recipeSlug: input.recipeSlug })
      .where(eq(challengeEntries.id, existing[0].id))
    await store.delete(existing[0].photoKey).catch(() => {})
    await evaluateBadges(input.userId)
    return { entryId: existing[0].id, replaced: true }
  }

  const [entry] = await db
    .insert(challengeEntries)
    .values({
      userId: input.userId,
      challengeSlug: input.challengeSlug,
      recipeSlug: input.recipeSlug,
      photoKey: key,
      caption,
    })
    .returning({ id: challengeEntries.id })

  await addXp(input.userId, XP.challengeEntry, 'Entered the weekly challenge')
  const newBadges = await evaluateBadges(input.userId)

  return { entryId: entry.id, newBadges: newBadges.map((b) => b.slug) }
}

export async function readChallengePhoto(key: string) {
  const store = getStore(PHOTO_STORE)
  const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
  if (!result) return null
  return {
    body: result.data,
    contentType: (result.metadata?.contentType as string) ?? 'image/jpeg',
  }
}

export async function listChallengeEntries(challengeSlug: string, viewerId: number | null) {
  const rows = await db
    .select({
      id: challengeEntries.id,
      userId: challengeEntries.userId,
      displayName: users.displayName,
      avatar: users.avatar,
      recipeSlug: challengeEntries.recipeSlug,
      photoKey: challengeEntries.photoKey,
      caption: challengeEntries.caption,
      createdAt: challengeEntries.createdAt,
    })
    .from(challengeEntries)
    .innerJoin(users, eq(users.id, challengeEntries.userId))
    .where(eq(challengeEntries.challengeSlug, challengeSlug))
    .orderBy(desc(challengeEntries.createdAt))

  if (!rows.length) return []

  const ids = rows.map((r) => r.id)

  const tallies = await db
    .select({ entryId: entryVotes.entryId, votes: count(entryVotes.id) })
    .from(entryVotes)
    .where(inArray(entryVotes.entryId, ids))
    .groupBy(entryVotes.entryId)

  const voteCount = new Map(tallies.map((t) => [t.entryId, Number(t.votes)]))

  const mine = viewerId
    ? new Set(
        (
          await db
            .select({ entryId: entryVotes.entryId })
            .from(entryVotes)
            .where(and(inArray(entryVotes.entryId, ids), eq(entryVotes.userId, viewerId)))
        ).map((v) => v.entryId),
      )
    : new Set<number>()

  return rows
    .map((r) => ({
      id: r.id,
      cook: { id: r.userId, displayName: r.displayName, avatar: r.avatar },
      recipe: {
        slug: r.recipeSlug,
        title: getRecipe(r.recipeSlug)?.title ?? r.recipeSlug,
      },
      photoUrl: `/api/challenge-photo/${encodeURIComponent(r.photoKey)}`,
      caption: r.caption,
      votes: voteCount.get(r.id) ?? 0,
      votedByViewer: mine.has(r.id),
      isOwn: viewerId === r.userId,
      createdAt: r.createdAt.toISOString(),
    }))
    .sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt))
}

export async function voteForEntry(userId: number, entryId: number) {
  const [entry] = await db
    .select({ id: challengeEntries.id, userId: challengeEntries.userId })
    .from(challengeEntries)
    .where(eq(challengeEntries.id, entryId))

  if (!entry) return { error: 'That entry is gone.' }
  if (entry.userId === userId) return { error: 'You cannot vote for your own plate.' }

  const existing = await db
    .select({ id: entryVotes.id })
    .from(entryVotes)
    .where(and(eq(entryVotes.entryId, entryId), eq(entryVotes.userId, userId)))

  if (existing.length) {
    await db.delete(entryVotes).where(eq(entryVotes.id, existing[0].id))
    return { voted: false }
  }

  await db.insert(entryVotes).values({ entryId, userId }).onConflictDoNothing()
  await addXp(entry.userId, XP.voteReceived, 'A cook voted for your plate')
  await evaluateBadges(entry.userId)

  return { voted: true }
}

/** Winner of the week that has just closed, for the hall of fame. */
export async function challengeWinner(challengeSlug: string) {
  const entries = await listChallengeEntries(challengeSlug, null)
  return entries.length ? entries[0] : null
}

export const currentChallenge = () => activeChallenge()
