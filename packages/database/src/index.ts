import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export { type Prisma } from '@prisma/client'
export type {
  Product,
  Category,
  PickupSlot,
  Order,
  OrderItem,
  OrderStatus,
} from '@prisma/client'
export { SlotFullError, SlotNotFoundError } from './queries/orders'

export * from './queries/products'
export * from './queries/categories'
export * from './queries/slots'
export * from './queries/orders'
