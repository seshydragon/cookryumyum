/**
 * Weekly cooking challenges.
 *
 * The rota is deterministic: the active challenge is picked from the ISO week
 * number, so a new one opens every Monday without needing a scheduled job, and
 * everyone loading the site in the same week sees the same prompt.
 */

export type Challenge = {
  slug: string
  title: string
  prompt: string
  rules: Array<string>
  /** Recipes that obviously qualify, shown as a starting point. */
  suggested: Array<string>
  accent: string
}

export const CHALLENGES: Array<Challenge> = [
  {
    slug: 'healthy-comfort-food',
    title: 'Healthy Comfort Food Week',
    prompt:
      'Cook the thing you reach for when the day has gone badly — but get some protein and some green into it.',
    rules: [
      'Anything that still counts as comfort at the end of it',
      'At least 25g of protein a serving',
      'One photo, taken before you eat it',
    ],
    suggested: [
      'gochujang-salmon-rice-bowl',
      'greek-lemon-chicken-orzo',
      'mapo-tofu-home-strength',
      'harissa-roast-cauliflower-lunch',
    ],
    accent: 'amber',
  },
  {
    slug: 'five-ingredients-or-less',
    title: 'Five Ingredients or Less',
    prompt:
      'Salt, oil and water are free. Everything else counts. Five things, on a plate, that taste like more.',
    rules: [
      'Five ingredients, not counting salt, oil, water or pepper',
      'No shop-bought sauces doing the work',
      'Tell us what the five were in your caption',
    ],
    suggested: [
      'cacio-e-pepe',
      'charred-broccoli-anchovy-crumbs',
      'soft-scrambled-eggs-chive',
      'late-night-garlic-noodles',
    ],
    accent: 'emerald',
  },
  {
    slug: 'cook-the-shelf',
    title: 'Cook the Shelf',
    prompt:
      'Open the cupboard, take what is closest to going off, and build dinner around it. No shopping trip allowed.',
    rules: [
      'Nothing bought specially for the dish',
      'Name the ingredient you rescued',
      'Substitutions encouraged and celebrated',
    ],
    suggested: [
      'chickpea-apricot-tagine',
      'spanish-tortilla-caramelised-onion',
      'miso-butter-mushroom-toast',
      'chilaquiles-verdes',
    ],
    accent: 'orange',
  },
  {
    slug: 'one-pan-only',
    title: 'One Pan Only',
    prompt:
      'Everything in a single pan or tray. The washing up at the end should be one item plus a spoon.',
    rules: [
      'One cooking vessel, start to finish',
      'A kettle for pasta water is cheating',
      'Photograph it in the pan',
    ],
    suggested: [
      'greek-lemon-chicken-orzo',
      'shakshuka-feta-dill',
      'spanish-tortilla-caramelised-onion',
      'charred-broccoli-anchovy-crumbs',
    ],
    accent: 'rose',
  },
  {
    slug: 'breakfast-for-dinner',
    title: 'Breakfast for Dinner',
    prompt:
      'Take something from the breakfast shelf and serve it at 8pm like it was always the plan.',
    rules: [
      'Cooked and eaten after 6pm',
      'Must involve eggs, oats, or bread',
      'Bonus respect for adding a vegetable',
    ],
    suggested: [
      'shakshuka-feta-dill',
      'soft-scrambled-eggs-chive',
      'chilaquiles-verdes',
      'ricotta-hotcakes-burnt-honey',
    ],
    accent: 'sky',
  },
  {
    slug: 'someone-elses-kitchen',
    title: "Someone Else's Kitchen",
    prompt:
      'Cook from a cuisine you have never cooked from before. Badly is fine. Not trying is not.',
    rules: [
      'A cuisine that is new to you',
      'Follow the recipe properly the first time',
      'Say in your caption what surprised you',
    ],
    suggested: [
      'thai-green-curry-aubergine',
      'banh-mi-lemongrass-pork',
      'pistachio-rose-basbousa',
      'coq-au-vin-blanc',
    ],
    accent: 'violet',
  },
]

export const challengeBySlug = new Map(CHALLENGES.map((c) => [c.slug, c]))

/** ISO week number, used to rotate the challenge rota. */
export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function activeChallenge(date = new Date()) {
  return CHALLENGES[isoWeek(date) % CHALLENGES.length]
}

export function previousChallenge(date = new Date()) {
  const week = isoWeek(date)
  return CHALLENGES[(week - 1 + CHALLENGES.length) % CHALLENGES.length]
}

/** Monday 00:00 UTC of the current week, and the following Monday. */
export function challengeWindow(date = new Date()) {
  const d = new Date(date)
  const day = d.getUTCDay() || 7
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (day - 1)),
  )
  const end = new Date(start.getTime() + 7 * 86400000)
  return { start, end }
}

export function daysLeftInChallenge(date = new Date()) {
  const { end } = challengeWindow(date)
  return Math.max(0, Math.ceil((end.getTime() - date.getTime()) / 86400000))
}
