import { calculateNetProfit, calculateProfitShare, type PartnerSettlement } from '@/lib/calculations'
import { addDecimals, compareDecimals, sumDecimals } from '@/lib/decimal'

export interface ReportExportPartner {
  id: string
  name: string
  percentage: string
  isActive: boolean
}

export interface ReportExportRevenue {
  id: string
  description: string
  category: string
  amount: string
  date: Date
}

export interface ReportExportExpensePayment {
  id: string
  partnerId: string
  amountPaid: string
  partner: {
    name: string
  }
}

export interface ReportExportExpense {
  id: string
  description: string
  category: string
  totalAmount: string
  date: Date
  payments: ReportExportExpensePayment[]
}

export interface FinancialReportSnapshot {
  totalRevenue: string
  totalExpense: string
  netProfit: string
  partnersCount: number
  revenuesByCategory: Record<string, string>
  expensesByCategory: Record<string, string>
  expensesByPartner: Array<{
    partnerId: string
    partnerName: string
    total: string
  }>
  partnerSummaries: PartnerSettlement[]
  revenues: ReportExportRevenue[]
  expenses: ReportExportExpense[]
}

function addToCategoryTotal(categoryTotals: Record<string, string>, category: string, amount: string) {
  categoryTotals[category] = addDecimals(categoryTotals[category] ?? '0', amount, 2)
}

export function reportPdfFilename(generatedAt: Date) {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Maceio',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(generatedAt)
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value

  return `relatorio-financeiro-${part('year')}-${part('month')}-${part('day')}.pdf`
}

export function createPdfDownloadResponse(pdf: Uint8Array, generatedAt: Date) {
  const body = new Uint8Array(pdf.byteLength)
  body.set(pdf)

  return new Response(body.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportPdfFilename(generatedAt)}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export function buildPartnerReportSections(report: Pick<FinancialReportSnapshot, 'partnerSummaries' | 'expensesByPartner'>) {
  return {
    receipts: report.partnerSummaries.map((summary) => ({
      partnerId: summary.partnerId,
      partnerName: summary.partnerName,
      percentage: summary.percentage,
      amount: summary.profitShare,
    })),
    expenses: report.expensesByPartner.map((partner) => ({
      partnerId: partner.partnerId,
      partnerName: partner.partnerName,
      amount: partner.total,
    })),
  }
}

export function getPartnerSettlementContext(netProfit: string) {
  if (compareDecimals(netProfit, '0') < 0) {
    return {
      resultLabel: 'Participação no prejuízo',
      reimbursementLabel: 'Reembolso líquido sugerido',
      notice: 'Não há lucro distribuível. Os valores de reembolso devolvem parte das despesas adiantadas, já descontada a participação de cada sócio no prejuízo.',
    }
  }

  return {
    resultLabel: 'Participação no lucro',
    reimbursementLabel: 'Reembolso e lucro sugeridos',
    notice: null,
  }
}

export function buildFinancialReportSnapshot({
  partners,
  revenues,
  expenses,
}: {
  partners: ReportExportPartner[]
  revenues: ReportExportRevenue[]
  expenses: ReportExportExpense[]
}): FinancialReportSnapshot {
  const totalRevenue = sumDecimals(revenues.map((revenue) => revenue.amount), 2)
  const totalExpense = sumDecimals(expenses.map((expense) => expense.totalAmount), 2)
  const netProfit = calculateNetProfit(totalRevenue, totalExpense)
  const revenuesByCategory: Record<string, string> = {}
  const expensesByCategory: Record<string, string> = {}
  const advancedByPartner = new Map<string, { partnerName: string; total: string }>()

  for (const revenue of revenues) {
    addToCategoryTotal(revenuesByCategory, revenue.category, revenue.amount)
  }

  for (const expense of expenses) {
    addToCategoryTotal(expensesByCategory, expense.category, expense.totalAmount)

    for (const payment of expense.payments) {
      const current = advancedByPartner.get(payment.partnerId)
      advancedByPartner.set(payment.partnerId, {
        partnerName: payment.partner.name,
        total: addDecimals(current?.total ?? '0', payment.amountPaid, 2),
      })
    }
  }

  const activePartners = partners
    .filter((partner) => partner.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  const partnerSummaries = activePartners.map((partner) => {
    const reimbursableExpense = advancedByPartner.get(partner.id)?.total ?? '0.00'
    const profitShare = calculateProfitShare(netProfit, partner.percentage)

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      percentage: partner.percentage,
      profitShare,
      reimbursableExpense,
      finalAmount: addDecimals(profitShare, reimbursableExpense, 2),
    }
  })

  return {
    totalRevenue,
    totalExpense,
    netProfit,
    partnersCount: activePartners.length,
    revenuesByCategory,
    expensesByCategory,
    expensesByPartner: Array.from(advancedByPartner.entries())
      .map(([partnerId, data]) => ({ partnerId, ...data }))
      .sort((a, b) => compareDecimals(b.total, a.total) || a.partnerName.localeCompare(b.partnerName, 'pt-BR')),
    partnerSummaries,
    revenues,
    expenses,
  }
}
