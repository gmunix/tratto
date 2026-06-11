import 'dotenv/config'

export const defaultAuthTokenTtlDays = 7

export function parseAuthTokenTtlDays(value) {
  const ttlDays = Number(value)

  if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
    return defaultAuthTokenTtlDays
  }

  return ttlDays
}

export const environment = {
  port: Number(process.env.PORT ?? 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  databasePath: process.env.DATABASE_PATH ?? './data/tratto.sqlite',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  authTokenTtlDays: parseAuthTokenTtlDays(
    process.env.AUTH_TOKEN_TTL_DAYS ?? defaultAuthTokenTtlDays,
  ),
}
