import { env as cloudflareEnv } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function getConnectionString() {
  const workerEnv = cloudflareEnv as unknown as {
    HYPERDRIVE?: { connectionString?: string }
  }

  return workerEnv.HYPERDRIVE?.connectionString || process.env.DATABASE_URL
}

const connectionString = getConnectionString()

if (!connectionString) {
  throw new Error(
    'No database connection configured. Set up the Cloudflare HYPERDRIVE binding for production or DATABASE_URL for local development.',
  )
}

const client = postgres(connectionString, {
  max: 5,
  fetch_types: false,
  prepare: true,
})

export const db = drizzle({ client, schema })
