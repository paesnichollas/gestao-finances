import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFinancialReportSnapshot,
  buildPartnerReportSections,
  createPdfDownloadResponse,
  getPartnerSettlementContext,
  reportPdfFilename,
} from './report-export'

test('uses the local issue date in the PDF filename', () => {
  assert.equal(
    reportPdfFilename(new Date('2026-07-22T01:30:00.000Z')),
    'relatorio-financeiro-2026-07-21.pdf',
  )
})

test('creates a downloadable PDF response with a dated filename', async () => {
  const response = createPdfDownloadResponse(
    new Uint8Array([37, 80, 68, 70]),
    new Date('2026-07-21T15:30:00.000Z'),
  )

  assert.equal(response.headers.get('content-type'), 'application/pdf')
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="relatorio-financeiro-2026-07-21.pdf"')
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([37, 80, 68, 70]))
})

test('separates proportional receipts from expenses paid by each partner', () => {
  const sections = buildPartnerReportSections({
    partnerSummaries: [
      {
        partnerId: 'partner-1',
        partnerName: 'Ana',
        percentage: '60.00',
        profitShare: '600.00',
        reimbursableExpense: '300.00',
        finalAmount: '900.00',
      },
    ],
    expensesByPartner: [{ partnerId: 'partner-1', partnerName: 'Ana', total: '300.00' }],
  })

  assert.deepEqual(sections.receipts, [
    { partnerId: 'partner-1', partnerName: 'Ana', percentage: '60.00', amount: '600.00' },
  ])
  assert.deepEqual(sections.expenses, [
    { partnerId: 'partner-1', partnerName: 'Ana', amount: '300.00' },
  ])
})

test('explains that partner payouts are reimbursements when the project has a loss', () => {
  assert.deepEqual(getPartnerSettlementContext('-2139.21'), {
    resultLabel: 'Participação no prejuízo',
    reimbursementLabel: 'Reembolso líquido sugerido',
    notice: 'Não há lucro distribuível. Os valores de reembolso devolvem parte das despesas adiantadas, já descontada a participação de cada sócio no prejuízo.',
  })
})

test('builds a complete financial snapshot from all report records', () => {
  const report = buildFinancialReportSnapshot({
    partners: [
      { id: 'partner-1', name: 'Ana', percentage: '60.00', isActive: true },
      { id: 'partner-2', name: 'Bruno', percentage: '40.00', isActive: true },
      { id: 'partner-3', name: 'Carla', percentage: '0.00', isActive: false },
    ],
    revenues: [
      { id: 'revenue-1', description: 'Patrocínio', category: 'PATROCINIO', amount: '1000.00', date: new Date('2026-07-01T12:00:00.000Z') },
      { id: 'revenue-2', description: 'Inscrição', category: 'INSCRICAO', amount: '500.00', date: new Date('2026-07-02T12:00:00.000Z') },
    ],
    expenses: [
      {
        id: 'expense-1',
        description: 'Hospedagem',
        category: 'SITE',
        totalAmount: '300.00',
        date: new Date('2026-07-03T12:00:00.000Z'),
        payments: [{ id: 'payment-1', partnerId: 'partner-1', amountPaid: '300.00', partner: { name: 'Ana' } }],
      },
      {
        id: 'expense-2',
        description: 'Anúncios',
        category: 'MARKETING',
        totalAmount: '200.00',
        date: new Date('2026-07-04T12:00:00.000Z'),
        payments: [{ id: 'payment-2', partnerId: 'partner-2', amountPaid: '200.00', partner: { name: 'Bruno' } }],
      },
    ],
  })

  assert.equal(report.totalRevenue, '1500.00')
  assert.equal(report.totalExpense, '500.00')
  assert.equal(report.netProfit, '1000.00')
  assert.equal(report.partnersCount, 2)
  assert.deepEqual(report.revenuesByCategory, { INSCRICAO: '500.00', PATROCINIO: '1000.00' })
  assert.deepEqual(report.expensesByCategory, { MARKETING: '200.00', SITE: '300.00' })
  assert.deepEqual(report.expensesByPartner, [
    { partnerId: 'partner-1', partnerName: 'Ana', total: '300.00' },
    { partnerId: 'partner-2', partnerName: 'Bruno', total: '200.00' },
  ])
  assert.deepEqual(report.partnerSummaries, [
    {
      partnerId: 'partner-1',
      partnerName: 'Ana',
      percentage: '60.00',
      profitShare: '600.00',
      reimbursableExpense: '300.00',
      finalAmount: '900.00',
    },
    {
      partnerId: 'partner-2',
      partnerName: 'Bruno',
      percentage: '40.00',
      profitShare: '400.00',
      reimbursableExpense: '200.00',
      finalAmount: '600.00',
    },
  ])
  assert.equal(report.revenues.length, 2)
  assert.equal(report.expenses.length, 2)
})
