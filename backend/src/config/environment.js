import 'dotenv/config'

export const environment = {
  port: Number(process.env.PORT ?? 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  databasePath: process.env.DATABASE_PATH ?? './data/tratto.sqlite',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  authTokenTtlDays: Number(process.env.AUTH_TOKEN_TTL_DAYS ?? 7),
}
