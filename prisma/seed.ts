import 'dotenv/config'
import Decimal from 'decimal.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { postgresUrlForNodePg } from '../src/lib/postgres-url'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL não configurada.')
}

const adapter = new PrismaPg({
  connectionString: postgresUrlForNodePg(databaseUrl),
})

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
})

async function main() {
  await prisma.settlementPartnerSummary.deleteMany()
  await prisma.settlement.deleteMany()
  await prisma.expensePayment.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.revenue.deleteMany()
  await prisma.partner.deleteMany()

  console.log('Dados anteriores removidos.')

  const pedro = await prisma.partner.create({
    data: { name: 'Pedro', percentage: '30.00', isActive: true },
  })
  const miguel = await prisma.partner.create({
    data: { name: 'Miguel', percentage: '30.00', isActive: true },
  })
  const marcelo = await prisma.partner.create({
    data: { name: 'Marcelo', percentage: '20.00', isActive: true },
  })
  const josy = await prisma.partner.create({
    data: { name: 'Josy', percentage: '20.00', isActive: true },
  })

  console.log('Sócios criados:', pedro.name, miguel.name, marcelo.name, josy.name)

  // --- Planilha "gastos antecipados" (PDF docs/Planilha gastos antecipados.pdf) ---

  await prisma.expense.create({
    data: {
      description: 'Site',
      category: 'SITE',
      totalAmount: '1500.00',
      date: new Date('2025-09-01'),
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '750.00' },
          { partnerId: miguel.id, amountPaid: '750.00' },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      description: 'Vídeos drone + combustível moto',
      category: 'VIDEOS',
      totalAmount: '424.98',
      date: new Date('2025-10-01'),
      notes: 'Drone R$ 400,00 + comb. moto R$ 25,00 — rateio em três (R$ 141,66 cada).',
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '141.66' },
          { partnerId: miguel.id, amountPaid: '141.66' },
          { partnerId: marcelo.id, amountPaid: '141.66' },
        ],
      },
    },
  })

  const primeiraViagem = new Date('2025-10-04')
  await prisma.expense.create({
    data: {
      description: '1ª viagem Pedro — almoço (reunião Marcelo/Biel/Miguel, 03 e 04/out)',
      category: 'VIAGEM',
      totalAmount: '35.00',
      date: primeiraViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '35.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '1ª viagem Pedro — jantar',
      category: 'VIAGEM',
      totalAmount: '23.00',
      date: primeiraViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '23.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '1ª viagem Pedro — van (volta)',
      category: 'VIAGEM',
      totalAmount: '70.00',
      date: primeiraViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '70.00' }] },
    },
  })

  const segundaViagem = new Date('2025-10-20')
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — almoço (medição percurso, 20/out)',
      category: 'VIAGEM',
      totalAmount: '35.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '35.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — jantar',
      category: 'VIAGEM',
      totalAmount: '23.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '23.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — van ida',
      category: 'VIAGEM',
      totalAmount: '70.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '70.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — van volta',
      category: 'VIAGEM',
      totalAmount: '70.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '70.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — diária Naldinho',
      category: 'VIAGEM',
      totalAmount: '70.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '70.00' }] },
    },
  })
  await prisma.expense.create({
    data: {
      description: '2ª viagem Pedro — gasolina moto',
      category: 'VIAGEM',
      totalAmount: '30.00',
      date: segundaViagem,
      rateType: 'REGISTRO_PAGADOR',
      payments: { create: [{ partnerId: pedro.id, amountPaid: '30.00' }] },
    },
  })

  const bannerBase =
    'Banners e vídeos para divulgação (R$ 210,00/mês — R$ 70,00 para cada um: Pedro, Miguel, Marcelo).'
  await prisma.expense.create({
    data: {
      description: 'Banners e vídeos — novembro/2025',
      category: 'MARKETING',
      totalAmount: '210.00',
      date: new Date('2025-11-01'),
      notes: bannerBase,
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '70.00' },
          { partnerId: miguel.id, amountPaid: '70.00' },
          { partnerId: marcelo.id, amountPaid: '70.00' },
        ],
      },
    },
  })
  await prisma.expense.create({
    data: {
      description: 'Banners e vídeos — dezembro/2025',
      category: 'MARKETING',
      totalAmount: '210.00',
      date: new Date('2025-12-01'),
      notes: bannerBase,
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '70.00' },
          { partnerId: miguel.id, amountPaid: '70.00' },
          { partnerId: marcelo.id, amountPaid: '70.00' },
        ],
      },
    },
  })
  await prisma.expense.create({
    data: {
      description: 'Banners e vídeos — janeiro/2026',
      category: 'MARKETING',
      totalAmount: '210.00',
      date: new Date('2026-01-01'),
      notes: bannerBase,
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '70.00' },
          { partnerId: miguel.id, amountPaid: '70.00' },
          { partnerId: marcelo.id, amountPaid: '70.00' },
        ],
      },
    },
  })
  await prisma.expense.create({
    data: {
      description: 'Banners e vídeos — fevereiro/2026',
      category: 'MARKETING',
      totalAmount: '210.00',
      date: new Date('2026-02-01'),
      notes: bannerBase,
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '70.00' },
          { partnerId: miguel.id, amountPaid: '70.00' },
          { partnerId: marcelo.id, amountPaid: '70.00' },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      description: 'Panfletos',
      category: 'PANFLETOS',
      totalAmount: '289.98',
      date: new Date('2025-11-15'),
      notes: 'Total R$ 290,00 — R$ 96,66 para Pedro, Miguel e Marcelo.',
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '96.66' },
          { partnerId: miguel.id, amountPaid: '96.66' },
          { partnerId: marcelo.id, amountPaid: '96.66' },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      description: 'Abertura de empresa',
      category: 'ABERTURA_EMPRESA',
      totalAmount: '1204.98',
      date: new Date('2025-08-01'),
      notes: 'Total R$ 1.205,00 — R$ 401,66 para Pedro, Miguel e Marcelo.',
      rateType: 'REGISTRO_PAGADOR',
      payments: {
        create: [
          { partnerId: pedro.id, amountPaid: '401.66' },
          { partnerId: miguel.id, amountPaid: '401.66' },
          { partnerId: marcelo.id, amountPaid: '401.66' },
        ],
      },
    },
  })

  const totalExpense = new Decimal('1500.00')
    .plus('424.98')
    .plus('128.00')
    .plus('298.00')
    .plus('840.00')
    .plus('289.98')
    .plus('1204.98')

  console.log('Dados da planilha importados (receitas: nenhuma no PDF; só despesas).')
  console.log(`Total despesas (planilha): R$ ${totalExpense.toFixed(2)}`)
  console.log(
    'Observações do PDF (contador R$ 250/mês, impostos, fundo): não lançadas como linhas — apenas texto na planilha.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
