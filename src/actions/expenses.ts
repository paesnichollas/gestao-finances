'use server'

import { prisma } from '@/lib/prisma'
import { updateTag } from 'next/cache'
import { EXPENSE_MUTATION_TAGS } from '@/lib/cache-tags'
import { getExpensesByPartnerReadModel, getExpensesPage } from '@/lib/data/finance-read-model'
import type { ExpenseFormData } from '@/lib/validations'
import { expenseSchema } from '@/lib/validations'
import { decimalToString, toPrismaDecimal } from '@/lib/decimal'
import { requireSession } from '@/lib/session'
import type { DecimalValue } from '@/lib/decimal'
import type { PaginationInput } from '@/lib/pagination'

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

function invalidateExpenseCaches() {
  for (const tag of EXPENSE_MUTATION_TAGS) {
    updateTag(tag)
  }
}

export async function getExpenses(input: PaginationInput = {}) {
  await requireSession()
  return getExpensesPage(input)
}

export async function getExpenseById(id: string) {
  await requireSession()

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      payments: {
        include: { partner: true },
      },
    },
  })

  return expense ? serializeExpense(expense) : null
}

export async function createExpense(data: ExpenseFormData) {
  await requireSession()

  const parsed = expenseSchema.parse(data)
  const expense = await prisma.expense.create({
    data: {
      description: parsed.description,
      category: parsed.category,
      totalAmount: toPrismaDecimal(parsed.totalAmount, 2),
      date: new Date(parsed.date),
      notes: parsed.notes || null,
      rateType: parsed.rateType,
      payments: {
        create: parsed.payments.map((p) => ({
          partnerId: p.partnerId,
          amountPaid: toPrismaDecimal(p.amountPaid, 2),
        })),
      },
    },
    include: {
      payments: {
        include: { partner: true },
      },
    },
  })
  invalidateExpenseCaches()
  return serializeExpense(expense)
}

export async function updateExpense(id: string, data: ExpenseFormData) {
  await requireSession()

  const parsed = expenseSchema.parse(data)

  // Atualizar despesa e recriar pagamentos
  await prisma.expensePayment.deleteMany({ where: { expenseId: id } })

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      description: parsed.description,
      category: parsed.category,
      totalAmount: toPrismaDecimal(parsed.totalAmount, 2),
      date: new Date(parsed.date),
      notes: parsed.notes || null,
      rateType: parsed.rateType,
      payments: {
        create: parsed.payments.map((p) => ({
          partnerId: p.partnerId,
          amountPaid: toPrismaDecimal(p.amountPaid, 2),
        })),
      },
    },
    include: {
      payments: {
        include: { partner: true },
      },
    },
  })
  invalidateExpenseCaches()
  return serializeExpense(expense)
}

export async function deleteExpense(id: string) {
  await requireSession()

  await prisma.expense.delete({ where: { id } })
  invalidateExpenseCaches()
}

export async function getTotalExpense() {
  await requireSession()

  const result = await prisma.expense.aggregate({
    _sum: { totalAmount: true },
  })
  return decimalToString(result._sum?.totalAmount ?? '0', 2)
}

export async function getExpensesByPartner() {
  await requireSession()
  return getExpensesByPartnerReadModel()
}
