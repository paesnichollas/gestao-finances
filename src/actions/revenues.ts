'use server'

import { prisma } from '@/lib/prisma'
import { updateTag } from 'next/cache'
import { REVENUE_MUTATION_TAGS } from '@/lib/cache-tags'
import { getRevenuesPage } from '@/lib/data/finance-read-model'
import type { RevenueFormData } from '@/lib/validations'
import { revenueSchema } from '@/lib/validations'
import { decimalToString, toPrismaDecimal } from '@/lib/decimal'
import { requireSession } from '@/lib/session'
import type { DecimalValue } from '@/lib/decimal'
import type { PaginationInput } from '@/lib/pagination'

function serializeRevenue<T extends { amount: DecimalValue }>(revenue: T) {
  return {
    ...revenue,
    amount: decimalToString(revenue.amount, 2),
  }
}

function invalidateRevenueCaches() {
  for (const tag of REVENUE_MUTATION_TAGS) {
    updateTag(tag)
  }
}

export async function getRevenues(input: PaginationInput = {}) {
  await requireSession()
  return getRevenuesPage(input)
}

export async function getRevenueById(id: string) {
  await requireSession()

  const revenue = await prisma.revenue.findUnique({ where: { id } })
  return revenue ? serializeRevenue(revenue) : null
}

export async function createRevenue(data: RevenueFormData) {
  await requireSession()

  const parsed = revenueSchema.parse(data)
  const revenue = await prisma.revenue.create({
    data: {
      description: parsed.description,
      category: parsed.category,
      amount: toPrismaDecimal(parsed.amount, 2),
      date: new Date(parsed.date),
      origin: parsed.origin || null,
      notes: parsed.notes || null,
    },
  })
  invalidateRevenueCaches()
  return serializeRevenue(revenue)
}

export async function updateRevenue(id: string, data: RevenueFormData) {
  await requireSession()

  const parsed = revenueSchema.parse(data)
  const revenue = await prisma.revenue.update({
    where: { id },
    data: {
      description: parsed.description,
      category: parsed.category,
      amount: toPrismaDecimal(parsed.amount, 2),
      date: new Date(parsed.date),
      origin: parsed.origin || null,
      notes: parsed.notes || null,
    },
  })
  invalidateRevenueCaches()
  return serializeRevenue(revenue)
}

export async function deleteRevenue(id: string) {
  await requireSession()

  await prisma.revenue.delete({ where: { id } })
  invalidateRevenueCaches()
}

export async function getTotalRevenue() {
  await requireSession()

  const result = await prisma.revenue.aggregate({
    _sum: { amount: true },
  })
  return decimalToString(result._sum?.amount ?? '0', 2)
}
