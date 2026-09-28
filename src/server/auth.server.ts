/**
 * Account and session handling. Server-only — never import this from a component.
 *
 * Passwords are bcrypt hashes at cost 12. Session cookies hold a random token,
 * but only the SHA-256 digest of that token is stored, so a database dump
 * cannot be replayed as a login.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { compare, hash } from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { db } from '../../db'
import { sessions, users } from '../../db/schema'

const COOKIE = 'cookr_session'
const SESSION_DAYS = 30
const BCRYPT_COST = 12

export type SessionUser = {
  id: number
  email: string
  displayName: string
  avatar: string
}

const digest = (token: string) => createHash('sha256').update(token).digest('hex')

function isProd() {
  return process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production'
}

/** A deliberately vague message: never reveal whether an address is registered. */
export const GENERIC_LOGIN_ERROR = 'That email and password do not match an account.'

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validatePassword(password: string) {
  if (password.length < 10) return 'Use at least 10 characters.'
  if (password.length > 200) return 'That password is too long.'
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return 'Include at least one letter and one number.'
  return null
}

async function issueSession(userId: number) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000)

  await db.insert(sessions).values({ tokenDigest: digest(token), userId, expiresAt })

  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
}

export async function registerUser(input: {
  email: string
  password: string
  displayName: string
}) {
  const email = normaliseEmail(input.email)
  const displayName = input.displayName.trim().slice(0, 40)

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email looks wrong.' }
  if (displayName.length < 2) return { error: 'Tell us what to call you.' }

  const passwordProblem = validatePassword(input.password)
  if (passwordProblem) return { error: passwordProblem }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length) return { error: 'There is already an account for that email.' }

  const passwordHash = await hash(input.password, BCRYPT_COST)
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName })
    .returning({ id: users.id })

  await issueSession(user.id)
  return { userId: user.id }
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normaliseEmail(input.email)

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))

  // Compare against a dummy hash when the account does not exist so that a
  // missing account and a wrong password take a similar amount of time.
  const hashToCheck =
    user?.passwordHash ?? '$2b$12$0000000000000000000000000000000000000000000000000000'

  const ok = await compare(input.password, hashToCheck).catch(() => false)
  if (!user || !ok) return { error: GENERIC_LOGIN_ERROR }

  await issueSession(user.id)
  return { userId: user.id }
}

export async function logoutCurrentUser() {
  const token = getCookie(COOKIE)
  if (token) await db.delete(sessions).where(eq(sessions.tokenDigest, digest(token)))
  deleteCookie(COOKIE, { path: '/' })
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = getCookie(COOKIE)
  if (!token) return null

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatar: users.avatar,
      tokenDigest: sessions.tokenDigest,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenDigest, digest(token)), gt(sessions.expiresAt, new Date())))

  const row = rows[0]
  if (!row) return null

  // Constant-time confirmation of the digest match.
  const a = Buffer.from(row.tokenDigest)
  const b = Buffer.from(digest(token))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatar: row.avatar,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) throw new Error('You need to be signed in to do that.')
  return user
}
