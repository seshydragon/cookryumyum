/**
 * Chef levels and badges. Both are pure functions of data already in the
 * database (the XP ledger and the cook log), so nothing here needs its own
 * table beyond the `badges` unlock rows.
 */

export type Level = {
  name: string
  minXp: number
  blurb: string
}

export const LEVELS: Array<Level> = [
  { name: 'Kitchen Novice', minXp: 0, blurb: 'You have found the knives.' },
  { name: 'Line Learner', minXp: 120, blurb: 'You cook without reading every line twice.' },
  { name: 'Home Cook', minXp: 320, blurb: 'Dinner happens without a plan.' },
  { name: 'Confident Cook', minXp: 650, blurb: 'You season by taste, not by teaspoon.' },
  { name: 'Sous Chef', minXp: 1100, blurb: 'You run two pans and a timer at once.' },
  { name: 'Chef de Partie', minXp: 1700, blurb: 'Your own variations are better than the recipe.' },
  { name: 'Head Chef', minXp: 2600, blurb: 'People ask you what to cook.' },
  { name: 'Executive Chef', minXp: 4000, blurb: 'The shelf holds nothing you cannot use.' },
]

export const XP = {
  cookRecipe: 25,
  newCuisine: 40,
  newRecipe: 15,
  streakDay: 10,
  hitProteinGoal: 20,
  challengeEntry: 60,
  voteReceived: 8,
  ratingLeft: 5,
  badgeUnlock: 50,
} as const

export function levelFor(xp: number) {
  let index = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].minXp) index = i

  const current = LEVELS[index]
  const next = LEVELS[index + 1]
  const span = next ? next.minXp - current.minXp : 1
  const into = xp - current.minXp

  return {
    index,
    level: current,
    next,
    xpIntoLevel: into,
    xpForNext: next ? next.minXp - xp : 0,
    progress: next ? Math.min(1, into / span) : 1,
  }
}

export type BadgeDef = {
  slug: string
  name: string
  /** Key into the icon map in `src/components/BadgeIcon.tsx`. */
  icon: string
  how: string
  /** Rough order of difficulty, used for display only. */
  tier: 'bronze' | 'silver' | 'gold'
}

export const BADGES: Array<BadgeDef> = [
  {
    slug: 'first-plate',
    name: 'First Plate',
    icon: 'utensils',
    how: 'Log the first recipe you cook from the shelf.',
    tier: 'bronze',
  },
  {
    slug: 'early-bird',
    name: 'Early Bird',
    icon: 'sunrise',
    how: 'Cook something from the breakfast shelf.',
    tier: 'bronze',
  },
  {
    slug: 'night-owl',
    name: 'Night Owl',
    icon: 'moon',
    how: 'Cook a late-night recipe.',
    tier: 'bronze',
  },
  {
    slug: 'sweet-tooth',
    name: 'Sweet Tooth',
    icon: 'cake',
    how: 'Make anything from the dessert shelf.',
    tier: 'bronze',
  },
  {
    slug: 'pantry-cleared',
    name: 'Pantry Cleared',
    icon: 'archive',
    how: 'Cook a budget or five-ingredient recipe instead of going to the shop.',
    tier: 'silver',
  },
  {
    slug: 'heritage-cook',
    name: 'Heritage Cook',
    icon: 'book',
    how: 'Cook a recipe marked slow or weekend — the ones worth the afternoon.',
    tier: 'silver',
  },
  {
    slug: 'three-in-a-row',
    name: 'Three In A Row',
    icon: 'flame',
    how: 'Cook on three consecutive days.',
    tier: 'silver',
  },
  {
    slug: 'protein-pusher',
    name: 'Protein Pusher',
    icon: 'dumbbell',
    how: 'Log five high-protein meals.',
    tier: 'silver',
  },
  {
    slug: 'challenger',
    name: 'Challenger',
    icon: 'target',
    how: 'Enter a weekly cooking challenge with a photo.',
    tier: 'silver',
  },
  {
    slug: 'globe-trotter',
    name: 'Globe Trotter',
    icon: 'globe',
    how: 'Cook from five different cuisines.',
    tier: 'gold',
  },
  {
    slug: 'full-shelf',
    name: 'Full Shelf',
    icon: 'basket',
    how: 'Cook ten different recipes.',
    tier: 'gold',
  },
  {
    slug: 'crowd-favourite',
    name: 'Crowd Favourite',
    icon: 'trophy',
    how: 'Collect five votes on a single challenge entry.',
    tier: 'gold',
  },
]

export const badgeBySlug = new Map(BADGES.map((b) => [b.slug, b]))
