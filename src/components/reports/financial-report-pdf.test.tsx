import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToBuffer } from '@react-pdf/renderer'
import { FinancialReportPdf } from './financial-report-pdf'

const report = {
  totalRevenue: '1500.00',
  totalExpense: '500.00',
  netProfit: '1000.00',
  partnersCount: 2,
  revenuesByCategory: { INSCRICAO: '500.00', PATROCINIO: '1000.00' },
  expensesByCategory: { MARKETING: '200.00', SITE: '300.00' },
  expensesByPartner: [{ partnerId: 'partner-1', partnerName: 'Ana', total: '300.00' }],
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
  revenues: [
    {
      id: 'revenue-1',
      description: 'Patrocínio principal',
      category: 'PATROCINIO',
      amount: '1000.00',
      date: new Date('2026-07-01T12:00:00.000Z'),
    },
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
  ],
}

test('renders a valid financial-report PDF document', async () => {
  const pdf = await renderToBuffer(
    <FinancialReportPdf report={report} generatedAt={new Date('2026-07-21T15:30:00.000Z')} />,
  )

  assert.equal(pdf.subarray(0, 5).toString('utf8'), '%PDF-')
  assert.ok(pdf.byteLength > 1_000)
})
