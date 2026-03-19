'use server'

import { prisma } from '@/lib/prisma'
import { updateTag } from 'next/cache'
import { PARTNER_MUTATION_TAGS } from '@/lib/cache-tags'
import { getActivePartnersReadModel, getPartnersPage } from '@/lib/data/finance-read-model'
import type { PartnerFormData } from '@/lib/validations'
import { partnerSchema } from '@/lib/validations'
import { decimalToString, toPrismaDecimal } from '@/lib/decimal'
import { requireSession } from '@/lib/session'
import type { DecimalValue } from '@/lib/decimal'
import type { PaginationInput } from '@/lib/pagination'

function serializePartner<T extends { percentage: DecimalValue; expensePayments?: Array<{ amountPaid: DecimalValue }> }>(
  partner: T,
) {
  return {
    ...partner,
    percentage: decimalToString(partner.percentage, 2),
    expensePayments: partner.expensePayments?.map((payment) => ({
      ...payment,
      amountPaid: decimalToString(payment.amountPaid, 2),
    })),
  }
}

function invalidatePartnerCaches() {
  for (const tag of PARTNER_MUTATION_TAGS) {
    updateTag(tag)
  }
}

export async function getPartners(input: PaginationInput = {}) {
  await requireSession()
  return getPartnersPage(input)
}

export async function getActivePartners() {
  await requireSession()
  return getActivePartnersReadModel()
}

export async function getPartnerById(id: string) {
  await requireSession()

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { expensePayments: true },
  })

  return partner ? serializePartner(partner) : null
}

export async function createPartner(data: PartnerFormData) {
  await requireSession()

  const parsed = partnerSchema.parse(data)
  const partner = await prisma.partner.create({
    data: {
      name: parsed.name,
      percentage: toPrismaDecimal(parsed.percentage, 2),
      isActive: parsed.isActive,
      notes: parsed.notes || null,
    },
  })
  invalidatePartnerCaches()
  return serializePartner(partner)
}

export async function updatePartner(id: string, data: PartnerFormData) {
  await requireSession()

  const parsed = partnerSchema.parse(data)
  const partner = await prisma.partner.update({
    where: { id },
    data: {
      name: parsed.name,
      percentage: toPrismaDecimal(parsed.percentage, 2),
      isActive: parsed.isActive,
      notes: parsed.notes || null,
    },
  })
  invalidatePartnerCaches()
  return serializePartner(partner)
}

export async function deletePartner(id: string) {
  await requireSession()

  await prisma.partner.delete({ where: { id } })
  invalidatePartnerCaches()
}
