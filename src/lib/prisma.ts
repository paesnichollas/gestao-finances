import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { postgresUrlForNodePg } from './postgres-url'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está configurada.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: postgresUrlForNodePg(databaseUrl),
    // Neon / serverless: pool pequeno + timeouts explícitos (Prisma 7 + adapter-pg)
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  })

  return new PrismaClient({
    adapter,
    log: ['warn', 'error'],
    transactionOptions: {
      maxWait: 10_000,
      timeout: 30_000,
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
