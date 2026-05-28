import 'dotenv/config'

export const environment = {
  port: Number(process.env.PORT ?? 8000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
