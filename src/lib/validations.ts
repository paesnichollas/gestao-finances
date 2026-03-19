import { z } from 'zod'
import { compareDecimals, decimalToString, normalizeDecimalString } from '@/lib/decimal'

const positiveMoneyString = z
  .string()
  .trim()
  .min(1, 'Valor é obrigatório')
  .transform((value) => decimalToString(normalizeDecimalString(value), 2))
  .refine((value) => compareDecimals(value, 0) === 1, 'Valor deve ser positivo')

const percentageString = z
  .string()
  .trim()
  .min(1, 'Percentual é obrigatório')
  .transform((value) => decimalToString(normalizeDecimalString(value), 2))
  .refine((value) => compareDecimals(value, 0) === 1, 'Percentual deve ser maior que 0')
  .refine((value) => compareDecimals(value, 100) <= 0, 'Percentual não pode exceder 100%')

// ===================== SÓCIOS =====================

export const partnerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  percentage: percentageString,
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

export type PartnerFormData = z.infer<typeof partnerSchema>

// ===================== RECEITAS =====================

export const revenueCategoryOptions = [
  { value: 'INSCRICAO', label: 'Inscrição' },
  { value: 'PATROCINIO', label: 'Patrocínio' },
  { value: 'VENDA', label: 'Venda' },
  { value: 'REPASSE', label: 'Repasse' },
  { value: 'OUTRO', label: 'Outro' },
] as const

export const revenueSchema = z.object({
  description: z.string().min(2, 'Descrição é obrigatória'),
  category: z.enum(['INSCRICAO', 'PATROCINIO', 'VENDA', 'REPASSE', 'OUTRO']),
  amount: positiveMoneyString,
  date: z.string().min(1, 'Data é obrigatória'),
  origin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type RevenueFormData = z.infer<typeof revenueSchema>

// ===================== DESPESAS =====================

export const expenseCategoryOptions = [
  { value: 'SITE', label: 'Site' },
  { value: 'VIAGEM', label: 'Viagem' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PANFLETOS', label: 'Panfletos' },
  { value: 'VIDEOS', label: 'Vídeos' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'ABERTURA_EMPRESA', label: 'Abertura de empresa' },
  { value: 'IMPOSTO', label: 'Imposto' },
  { value: 'RESERVA_FUNDO', label: 'Reserva / Fundo' },
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'OUTRO', label: 'Outro' },
] as const

export const rateTypeOptions = [
  { value: 'REGISTRO_PAGADOR', label: 'Registrar pagador' },
  { value: 'RATEIO_SOCIOS', label: 'Rateio entre sócios definidos' },
  { value: 'RATEIO_IGUALITARIO', label: 'Rateio igualitário' },
  { value: 'RATEIO_PROPORCIONAL', label: 'Rateio proporcional (%)' },
] as const

export const expensePaymentSchema = z.object({
  partnerId: z.string().min(1, 'Selecione o sócio'),
  amountPaid: positiveMoneyString,
})

export const expenseSchema = z.object({
  description: z.string().min(2, 'Descrição é obrigatória'),
  category: z.enum([
    'SITE',
    'VIAGEM',
    'MARKETING',
    'PANFLETOS',
    'VIDEOS',
    'CONTADOR',
    'ABERTURA_EMPRESA',
    'IMPOSTO',
    'RESERVA_FUNDO',
    'OPERACIONAL',
    'OUTRO',
  ]),
  totalAmount: positiveMoneyString,
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional().nullable(),
  rateType: z.enum([
    'REGISTRO_PAGADOR',
    'RATEIO_SOCIOS',
    'RATEIO_IGUALITARIO',
    'RATEIO_PROPORCIONAL',
  ]).default('REGISTRO_PAGADOR'),
  payments: z.array(expensePaymentSchema).min(1, 'Adicione pelo menos um pagamento'),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
export type ExpensePaymentFormData = z.infer<typeof expensePaymentSchema>

