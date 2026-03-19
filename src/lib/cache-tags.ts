export const FINANCE_CACHE_TAGS = {
  dashboard: 'finance:dashboard',
  revenues: 'finance:revenues',
  expenses: 'finance:expenses',
  partners: 'finance:partners',
  settlements: 'finance:settlements',
  reports: 'finance:reports',
} as const

export const REVENUE_MUTATION_TAGS = [
  FINANCE_CACHE_TAGS.revenues,
  FINANCE_CACHE_TAGS.dashboard,
  FINANCE_CACHE_TAGS.reports,
] as const

export const EXPENSE_MUTATION_TAGS = [
  FINANCE_CACHE_TAGS.expenses,
  FINANCE_CACHE_TAGS.dashboard,
  FINANCE_CACHE_TAGS.reports,
  FINANCE_CACHE_TAGS.settlements,
] as const

export const PARTNER_MUTATION_TAGS = [
  FINANCE_CACHE_TAGS.partners,
  FINANCE_CACHE_TAGS.dashboard,
  FINANCE_CACHE_TAGS.settlements,
  FINANCE_CACHE_TAGS.reports,
] as const

export const SETTLEMENT_MUTATION_TAGS = [
  FINANCE_CACHE_TAGS.settlements,
  FINANCE_CACHE_TAGS.dashboard,
  FINANCE_CACHE_TAGS.reports,
] as const
