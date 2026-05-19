import { cacheLife, cacheTag } from 'next/cache'
import { calculateNetProfit, calculateProfitShare, type PartnerSettlement } from '@/lib/calculations'
import { FINANCE_CACHE_TAGS } from '@/lib/cache-tags'
import { addDecimals, decimalToString, type DecimalValue } from '@/lib/decimal'
import { normalizePagination, toPaginatedResult, type PaginationInput } from '@/lib/pagination'
import { prisma } from '@/lib/prisma'

function serializePayment<T extends { amountPaid: DecimalValue }>(payment: T) {
  return {
    ...payment,
    amountPaid: decimalToString(payment.amountPaid, 2),
  }
}

function serializeExpense<T extends { totalAmount: DecimalValue; payments?: Array<{ amountPaid: DecimalValue }> }>(
  expense: T,
) {
  return {
    ...expense,
    totalAmount: decimalToString(expense.totalAmount, 2),
    payments: expense.payments?.map(serializePayment),
  }
}

function serializeRevenue<T extends { amount: DecimalValue }>(revenue: T) {
  return {
    ...revenue,
    amount: decimalToString(revenue.amount, 2),
  }
}

function serializeSettlementPartnerSummary<T extends {
  percentage: DecimalValue
  profitShare: DecimalValue
  reimbursableExpense: DecimalValue
  finalAmount: DecimalValue
  amountAlreadyPaid: DecimalValue
  pendingAmount: DecimalValue
}>(summary: T) {
  return {
    ...summary,
    percentage: decimalToString(summary.percentage, 2),
    profitShare: decimalToString(summary.profitShare, 2),
    reimbursableExpense: decimalToString(summary.reimbursableExpense, 2),
    finalAmount: decimalToString(summary.finalAmount, 2),
    amountAlreadyPaid: decimalToString(summary.amountAlreadyPaid, 2),
    pendingAmount: decimalToString(summary.pendingAmount, 2),
  }
}

function serializeSettlement<T extends {
  totalRevenue: DecimalValue
  totalExpense: DecimalValue
  netProfit: DecimalValue
  totalPaidOut: DecimalValue
  partnerSummaries?: Array<{
    percentage: DecimalValue
    profitShare: DecimalValue
    reimbursableExpense: DecimalValue
    finalAmount: DecimalValue
    amountAlreadyPaid: DecimalValue
    pendingAmount: DecimalValue
  }>
}>(settlement: T) {
  return {
    ...settlement,
    totalRevenue: decimalToString(settlement.totalRevenue, 2),
    totalExpense: decimalToString(settlement.totalExpense, 2),
    netProfit: decimalToString(settlement.netProfit, 2),
    totalPaidOut: decimalToString(settlement.totalPaidOut, 2),
    partnerSummaries: settlement.partnerSummaries?.map(serializeSettlementPartnerSummary),
  }
}

export async function getDashboardReadModel() {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.dashboard, FINANCE_CACHE_TAGS.reports)

  const [
    revenueSum,
    expenseSum,
    partnersCount,
    activePartners,
    expenseByCategoryRows,
    revenueByCategoryRows,
    advancedByPartnerRows,
    recentRevenues,
    recentExpenses,
  ] = await prisma.$transaction([
    prisma.revenue.aggregate({
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.partner.count({
      where: { isActive: true },
    }),
    prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        percentage: true,
      },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      orderBy: { category: 'asc' },
      _sum: { totalAmount: true },
    }),
    prisma.revenue.groupBy({
      by: ['category'],
      orderBy: { category: 'asc' },
      _sum: { amount: true },
    }),
    prisma.expensePayment.groupBy({
      by: ['partnerId'],
      orderBy: { partnerId: 'asc' },
      _sum: { amountPaid: true },
    }),
    prisma.revenue.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
      },
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        totalAmount: true,
        date: true,
      },
    }),
  ])

  const totalRevenue = decimalToString(revenueSum._sum?.amount ?? '0', 2)
  const totalExpense = decimalToString(expenseSum._sum?.totalAmount ?? '0', 2)
  const netProfit = calculateNetProfit(totalRevenue, totalExpense)

  const revenuesByCategory = Object.fromEntries(
    revenueByCategoryRows.map((row) => [row.category, decimalToString(row._sum?.amount ?? '0', 2)]),
  )

  const expensesByCategory = Object.fromEntries(
    expenseByCategoryRows.map((row) => [row.category, decimalToString(row._sum?.totalAmount ?? '0', 2)]),
  )

  const advancedByPartner: Record<string, string> = Object.fromEntries(
    advancedByPartnerRows.map((row) => [row.partnerId, decimalToString(row._sum?.amountPaid ?? '0', 2)]),
  )

  const partnerSummaries: PartnerSettlement[] = activePartners.map((partner) => {
    const profitShare = calculateProfitShare(netProfit, partner.percentage)
    const reimbursableExpense = advancedByPartner[partner.id] ?? '0.00'

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      percentage: decimalToString(partner.percentage, 2),
      profitShare,
      reimbursableExpense,
      finalAmount: addDecimals(profitShare, reimbursableExpense, 2),
    }
  })

  return {
    totalRevenue,
    totalExpense,
    netProfit,
    partnersCount,
    expensesByCategory,
    revenuesByCategory,
    partnerSummaries,
    advancedByPartner,
    recentRevenues: recentRevenues.map(serializeRevenue),
    recentExpenses: recentExpenses.map(serializeExpense),
  }
}

export async function getRevenuesPage(input: PaginationInput = {}) {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.revenues, FINANCE_CACHE_TAGS.reports)

  const { page, pageSize, skip, take } = normalizePagination(input)

  const [total, items] = await prisma.$transaction([
    prisma.revenue.count(),
    prisma.revenue.findMany({
      orderBy: { date: 'desc' },
      skip,
      take,
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        date: true,
        origin: true,
        notes: true,
      },
    }),
  ])

  return toPaginatedResult(items.map(serializeRevenue), total, page, pageSize)
}

export async function getExpensesPage(input: PaginationInput = {}) {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.expenses, FINANCE_CACHE_TAGS.reports)

  const { page, pageSize, skip, take } = normalizePagination(input)

  const [total, items] = await prisma.$transaction([
    prisma.expense.count(),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      skip,
      take,
      select: {
        id: true,
        description: true,
        category: true,
        totalAmount: true,
        date: true,
        notes: true,
        rateType: true,
        payments: {
          select: {
            id: true,
            partnerId: true,
            amountPaid: true,
            partner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ])

  return toPaginatedResult(items.map(serializeExpense), total, page, pageSize)
}

export async function getPartnersPage(input: PaginationInput = {}) {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.partners, FINANCE_CACHE_TAGS.dashboard, FINANCE_CACHE_TAGS.settlements)

  const { page, pageSize, skip, take } = normalizePagination(input)

  const result = await prisma.$transaction(async (tx) => {
    const [total, items] = await Promise.all([
      tx.partner.count(),
      tx.partner.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          percentage: true,
          isActive: true,
          notes: true,
        },
      }),
    ])

    const partnerIds = items.map((partner) => partner.id)
    const advancedByPartner = partnerIds.length > 0
      ? await tx.expensePayment.groupBy({
        by: ['partnerId'],
        orderBy: { partnerId: 'asc' },
        where: {
          partnerId: { in: partnerIds },
        },
        _sum: {
          amountPaid: true,
        },
      })
      : []

    return {
      total,
      items,
      advancedByPartner,
    }
  })

  const advancedMap = new Map(
    result.advancedByPartner.map((row) => [row.partnerId, decimalToString(row._sum?.amountPaid ?? '0', 2)]),
  )

  const items = result.items.map((partner) => ({
    ...partner,
    percentage: decimalToString(partner.percentage, 2),
    totalAdvanced: advancedMap.get(partner.id) ?? '0.00',
  }))

  return toPaginatedResult(items, result.total, page, pageSize)
}

export async function getActivePartnersReadModel() {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.partners)

  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      percentage: true,
      isActive: true,
      notes: true,
    },
  })

  return partners.map((partner) => ({
    ...partner,
    percentage: decimalToString(partner.percentage, 2),
  }))
}

export async function getSettlementsPage(input: PaginationInput = {}) {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 })
  cacheTag(FINANCE_CACHE_TAGS.settlements, FINANCE_CACHE_TAGS.reports)

  const { page, pageSize, skip, take } = normalizePagination(input)

  const [total, items] = await prisma.$transaction([
    prisma.settlement.count(),
    prisma.settlement.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        partnerSummaries: {
          include: {
            partner: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            partner: {
              name: 'asc',
            },
          },
        },
      },
    }),
  ])

  const serializedItems = items.map((settlement) =>
    serializeSettlement({
      ...settlement,
      partnerSummaries: settlement.partnerSummaries.map((summary) => ({
        ...summary,
        partnerName: summary.partner.name,
      })),
    }))

  return toPaginatedResult(serializedItems, total, page, pageSize)
}

export async function getExpensesByPartnerReadModel() {
  'use cache: remote'
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 })
  cacheTag(FINANCE_CACHE_TAGS.expenses, FINANCE_CACHE_TAGS.reports)

  const rows = await prisma.expensePayment.groupBy({
    by: ['partnerId'],
    orderBy: { partnerId: 'asc' },
    _sum: {
      amountPaid: true,
    },
  })

  const partnerIds = rows.map((row) => row.partnerId)
  if (partnerIds.length === 0) {
    return {}
  }

  const partners = await prisma.partner.findMany({
    where: {
      id: {
        in: partnerIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const partnerNameMap = new Map(partners.map((partner) => [partner.id, partner.name]))
  const byPartner: Record<string, { partnerName: string; total: string }> = {}

  for (const row of rows) {
    byPartner[row.partnerId] = {
      partnerName: partnerNameMap.get(row.partnerId) ?? 'Sócio',
      total: decimalToString(row._sum?.amountPaid ?? '0', 2),
    }
  }

  return byPartner
}
