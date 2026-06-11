import 'dotenv/config'

export const defaultAuthTokenTtlDays = 7
export const maxAuthTokenTtlDays = 365
export const defaultUploadMaxBytes = 5 * 1024 * 1024

export function parseAuthTokenTtlDays(value) {
  const ttlDays = Number(value)

  if (
    !Number.isSafeInteger(ttlDays) ||
    ttlDays <= 0 ||
    ttlDays > maxAuthTokenTtlDays
  ) {
    return defaultAuthTokenTtlDays
  }

  return ttlDays
}

export function parseUploadMaxBytes(value) {
  if (value === undefined || value === null || value === '') {
    return defaultUploadMaxBytes
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultUploadMaxBytes
  }

  return Math.floor(parsed)
}

export const environment = {
  port: Number(process.env.PORT ?? 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  databasePath: process.env.DATABASE_PATH ?? './data/tratto.sqlite',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  authTokenTtlDays: parseAuthTokenTtlDays(
    process.env.AUTH_TOKEN_TTL_DAYS ?? defaultAuthTokenTtlDays,
  ),
  uploadDir: process.env.UPLOAD_DIR ?? './data/uploads',
  uploadMaxBytes: parseUploadMaxBytes(process.env.UPLOAD_MAX_BYTES),
}
