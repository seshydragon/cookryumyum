import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

/**
 * Accounts. Passwords are bcrypt hashes at cost 12 — never the password itself.
 */
export const users = pgTable(
  'users',
  {
    id: serial().primaryKey(),
    email: text().notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    avatar: text().notNull().default('ember'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)],
)

/**
 * Sessions are stored as a SHA-256 digest of the cookie token, so a database
 * dump cannot be replayed as a login.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: serial().primaryKey(),
    tokenDigest: text('token_digest').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sessions_token_digest_key').on(t.tokenDigest),
    index('sessions_user_id_idx').on(t.userId),
  ],
)

/**
 * One row each time someone cooks a recipe. Drives streaks, XP and the
 * "most diverse cook" leaderboard.
 */
export const cookLogs = pgTable(
  'cook_logs',
  {
    id: serial().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    recipeSlug: text('recipe_slug').notNull(),
    cuisine: text().notNull(),
    protein: integer().notNull().default(0),
    cookedOn: date('cooked_on').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('cook_logs_user_id_idx').on(t.userId),
    index('cook_logs_recipe_slug_idx').on(t.recipeSlug),
  ],
)

/** Append-only XP ledger. A chef's level is derived from the sum. */
export const xpEvents = pgTable(
  'xp_events',
  {
    id: serial().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    amount: integer().notNull(),
    reason: text().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('xp_events_user_id_idx').on(t.userId)],
)

/** Unlocked badges. Unique per user + badge so a badge can only be earned once. */
export const badges = pgTable(
  'badges',
  {
    id: serial().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    badgeSlug: text('badge_slug').notNull(),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('badges_user_badge_key').on(t.userId, t.badgeSlug)],
)

/** A photo entry submitted to a weekly cooking challenge. */
export const challengeEntries = pgTable(
  'challenge_entries',
  {
    id: serial().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    challengeSlug: text('challenge_slug').notNull(),
    recipeSlug: text('recipe_slug').notNull(),
    photoKey: text('photo_key').notNull(),
    caption: text().notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('challenge_entries_challenge_idx').on(t.challengeSlug),
    uniqueIndex('challenge_entries_user_challenge_key').on(t.userId, t.challengeSlug),
  ],
)

/** One vote per person per entry, and never for your own plate. */
export const entryVotes = pgTable(
  'entry_votes',
  {
    id: serial().primaryKey(),
    entryId: integer('entry_id')
      .notNull()
      .references(() => challengeEntries.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('entry_votes_entry_user_key').on(t.entryId, t.userId)],
)

/** Ratings left on a recipe, so the trending shelf reflects real cooks. */
export const recipeRatings = pgTable(
  'recipe_ratings',
  {
    id: serial().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    recipeSlug: text('recipe_slug').notNull(),
    stars: integer().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('recipe_ratings_user_recipe_key').on(t.userId, t.recipeSlug)],
)
