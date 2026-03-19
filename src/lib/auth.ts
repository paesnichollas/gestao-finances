import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

function resolveAuthBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

if (process.env.VERCEL === '1' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    'BETTER_AUTH_SECRET é obrigatório na Vercel (Settings → Environment Variables).',
  )
}

const authSecret =
  process.env.BETTER_AUTH_SECRET
  ?? 'dev-secret-only-change-in-production'
const authBaseURL = resolveAuthBaseURL()

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseURL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
})
