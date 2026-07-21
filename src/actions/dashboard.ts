'use server'

import { prisma } from '@/lib/prisma'
import { updateTag } from 'next/cache'
import { SETTLEMENT_MUTATION_TAGS } from '@/lib/cache-tags'
import { getDashboardReadModel, getSettlementsPage } from '@/lib/data/finance-read-model'
import { calculateNetProfit, calculateProfitShare } from '@/lib/calculations'
import { addDecimals, decimalToString, toPrismaDecimal } from '@/lib/decimal'
import { requireSession } from '@/lib/session'
import type { DecimalValue } from '@/lib/decimal'
import type { PaginationInput } from '@/lib/pagination'

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

function invalidateSettlementCaches() {
  for (const tag of SETTLEMENT_MUTATION_TAGS) {
    updateTag(tag)
  }
}

export async function getDashboardData() {
  await requireSession()
  return getDashboardReadModel()
}

export async function generateSettlement(referenceLabel: string) {
  await requireSession()

  const [revenueSum, expenseSum, partners, paymentsByPartner] = await Promise.all([
    prisma.revenue.aggregate({
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        percentage: true,
      },
    }),
    prisma.expensePayment.groupBy({
      by: ['partnerId'],
      orderBy: { partnerId: 'asc' },
      _sum: { amountPaid: true },
    }),
  ])

  const totalRevenue = decimalToString(revenueSum._sum?.amount ?? '0', 2)
  const totalExpense = decimalToString(expenseSum._sum?.totalAmount ?? '0', 2)
  const netProfit = calculateNetProfit(totalRevenue, totalExpense)

  const advancedByPartner: Record<string, string> = Object.fromEntries(
    paymentsByPartner.map((payment) => [payment.partnerId, decimalToString(payment._sum?.amountPaid ?? '0', 2)]),
  )

  const settlement = await prisma.settlement.create({
    data: {
      referenceLabel,
      totalRevenue: toPrismaDecimal(totalRevenue, 2),
      totalExpense: toPrismaDecimal(totalExpense, 2),
      netProfit: toPrismaDecimal(netProfit, 2),
      status: 'RASCUNHO',
      partnerSummaries: {
        create: partners.map((partner) => {
          const profitShare = calculateProfitShare(netProfit, partner.percentage)
          const reimbursable = advancedByPartner[partner.id] ?? '0.00'
          const finalAmount = addDecimals(profitShare, reimbursable, 2)
          return {
            partnerId: partner.id,
            percentage: toPrismaDecimal(partner.percentage, 2),
            profitShare: toPrismaDecimal(profitShare, 2),
            reimbursableExpense: toPrismaDecimal(reimbursable, 2),
            finalAmount: toPrismaDecimal(finalAmount, 2),
            amountAlreadyPaid: toPrismaDecimal('0', 2),
            pendingAmount: toPrismaDecimal(finalAmount, 2),
          }
        }),
      },
    },
    include: {
      partnerSummaries: {
        include: { partner: true },
      },
    },
  })

  invalidateSettlementCaches()

  return serializeSettlement({
    ...settlement,
    partnerSummaries: settlement.partnerSummaries.map((summary) => ({
      ...summary,
      partnerName: summary.partner.name,
    })),
  })
}

export async function getSettlements(input: PaginationInput = {}) {
  await requireSession()
  return getSettlementsPage(input)
}

export async function getSettlementById(id: string) {
  await requireSession()

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      partnerSummaries: {
        include: { partner: true },
        orderBy: { partner: { name: 'asc' } },
      },
    },
  })

  if (!settlement) {
    return null
  }

  return serializeSettlement({
    ...settlement,
    partnerSummaries: settlement.partnerSummaries.map((summary) => ({
      ...summary,
      partnerName: summary.partner.name,
    })),
  })
}

export async function finalizeSettlement(id: string) {
  await requireSession()

  const settlement = await prisma.settlement.update({
    where: { id },
    data: { status: 'FINALIZADO' },
  })

  invalidateSettlementCaches()
  return serializeSettlement(settlement)
}

export async function deleteSettlement(id: string) {
  await requireSession()

  await prisma.settlement.delete({ where: { id } })
  invalidateSettlementCaches()
}
