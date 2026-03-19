import type { DecimalValue } from '@/lib/decimal'
import {
  addDecimals,
  compareDecimals,
  decimalToNumber,
  decimalToString,
  normalizeDecimalString,
  subtractDecimals,
  sumDecimals,
  toDecimal,
} from '@/lib/decimal'

export interface PartnerData {
  id: string
  name: string
  percentage: string
}

export interface PartnerSettlement {
  partnerId: string
  partnerName: string
  percentage: string
  profitShare: string
  reimbursableExpense: string
  finalAmount: string
}

export interface ProjectSummary {
  totalRevenue: string
  totalExpense: string
  netProfit: string
  partnerSettlements: PartnerSettlement[]
}

/**
 * Calcula o lucro líquido do projeto.
 */
export function calculateNetProfit(totalRevenue: DecimalValue, totalExpense: DecimalValue): string {
  return subtractDecimals(totalRevenue, totalExpense, 2)
}

/**
 * Calcula a parte do lucro de um sócio baseado no percentual.
 */
export function calculateProfitShare(netProfit: DecimalValue, percentage: DecimalValue): string {
  return toDecimal(netProfit)
    .times(toDecimal(percentage).div(100))
    .toDecimalPlaces(2)
    .toFixed(2)
}

/**
 * Calcula o resumo de fechamento para um sócio individual.
 */
export function calculatePartnerSettlement(
  partner: PartnerData,
  totalAdvanced: DecimalValue,
  netProfit: DecimalValue,
): PartnerSettlement {
  const profitShare = calculateProfitShare(netProfit, partner.percentage)
  const finalAmount = addDecimals(profitShare, totalAdvanced, 2)

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    percentage: decimalToString(partner.percentage, 2),
    profitShare,
    reimbursableExpense: decimalToString(totalAdvanced, 2),
    finalAmount,
  }
}

/**
 * Calcula o resumo completo do projeto.
 */
export function calculateProjectSummary(
  revenues: { amount: string }[],
  expenses: { totalAmount: string }[],
  partners: PartnerData[],
  advancedByPartner: Record<string, string>,
): ProjectSummary {
  const totalRevenue = sumDecimals(revenues.map((r) => r.amount), 2)
  const totalExpense = sumDecimals(expenses.map((e) => e.totalAmount), 2)
  const netProfit = calculateNetProfit(totalRevenue, totalExpense)

  const partnerSettlements = partners.map((partner) =>
    calculatePartnerSettlement(
      partner,
      advancedByPartner[partner.id] ?? '0',
      netProfit,
    ),
  )

  return {
    totalRevenue,
    totalExpense,
    netProfit,
    partnerSettlements,
  }
}

/**
 * Formata um valor numérico em BRL.
 */
export function formatBRL(value: DecimalValue): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(decimalToNumber(value))
}

/**
 * Formata uma data como dd/mm/aaaa (pt-BR).
 * Strings ISO que começam com yyyy-mm-dd são tratadas como data civil, sem deslocar fuso.
 */
export function formatDateBR(date: Date | string): string {
  if (typeof date === 'string') {
    const ymd = date.split('T')[0] ?? ''
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Valida que os percentuais dos sócios ativos somam 100.
 */
export function validatePercentages(partners: { percentage: string; isActive: boolean }[]): {
  valid: boolean
  total: string
  message: string
} {
  const activePartners = partners.filter((p) => p.isActive)
  const total = sumDecimals(activePartners.map((p) => p.percentage), 2)

  return {
    valid: compareDecimals(total, '100') === 0,
    total,
    message: compareDecimals(total, '100') === 0
      ? 'Percentuais válidos'
      : `A soma dos percentuais dos sócios ativos é ${total}%, deveria ser 100%`,
  }
}

/**
 * Valida que os pagamentos de uma despesa não ultrapassam o total.
 */
export function validateExpensePayments(
  totalAmount: string,
  payments: { amountPaid: string }[],
): {
  valid: boolean
  totalPaid: string
  remaining: string
  message: string
} {
  const normalizedTotal = decimalToString(normalizeDecimalString(totalAmount), 2)
  const totalPaid = sumDecimals(payments.map((p) => p.amountPaid), 2)
  const remaining = subtractDecimals(normalizedTotal, totalPaid, 2)

  if (compareDecimals(totalPaid, normalizedTotal) === 1) {
    return {
      valid: false,
      totalPaid,
      remaining,
      message: `Pagamentos (${formatBRL(totalPaid)}) excedem o valor da despesa (${formatBRL(normalizedTotal)})`,
    }
  }

  return {
    valid: true,
    totalPaid,
    remaining,
    message: compareDecimals(remaining, 0) === 1
      ? `Faltam ${formatBRL(remaining)} para cobrir a despesa`
      : 'Despesa totalmente coberta',
  }
}
