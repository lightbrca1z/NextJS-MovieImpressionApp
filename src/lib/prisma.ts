import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/** schema 追加後に古い PrismaClient が global に残ると delegate が undefined になる（Turbopack / HMR） */
function clientHasPasswordReset(c: PrismaClient): boolean {
  return typeof (c as unknown as { passwordResetToken?: { deleteMany: unknown } }).passwordResetToken
    ?.deleteMany === 'function'
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  if (cached && clientHasPasswordReset(cached)) {
    return cached
  }
  if (cached) {
    cached.$disconnect().catch(() => {})
    globalForPrisma.prisma = undefined
  }
  const client = createClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrisma()
