import { getDashboardData, getSettlements } from '@/actions/dashboard'
import { Header } from '@/components/layout/header'
import { SettlementClient } from '@/app/fechamento/settlement-client'
import { decimalToString } from '@/lib/decimal'
import { parsePaginationSearchParams } from '@/lib/pagination'

interface FechamentoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FechamentoPage({ searchParams }: FechamentoPageProps) {
  const pagination = parsePaginationSearchParams(await searchParams)

  const [settlementsPage, dashboard] = await Promise.all([
    getSettlements(pagination),
    getDashboardData(),
  ])

  return (
    <div className="space-y-6">
      <Header
        totalRevenue={dashboard.totalRevenue}
        totalExpense={dashboard.totalExpense}
        netProfit={dashboard.netProfit}
      />

      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Fechamento financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Apuração automática do projeto ({settlementsPage.total} registros)
        </p>
      </section>

      <SettlementClient
        settlements={settlementsPage.items.map((settlement) => ({
          id: settlement.id,
          referenceLabel: settlement.referenceLabel,
          totalRevenue: decimalToString(settlement.totalRevenue, 2),
          totalExpense: decimalToString(settlement.totalExpense, 2),
          netProfit: decimalToString(settlement.netProfit, 2),
          totalPaidOut: decimalToString(settlement.totalPaidOut, 2),
          status: settlement.status,
          partnerSummaries: settlement.partnerSummaries.map((summary) => ({
            id: summary.id,
            partnerId: summary.partnerId,
            partnerName: summary.partnerName,
            percentage: decimalToString(summary.percentage, 2),
            profitShare: decimalToString(summary.profitShare, 2),
            reimbursableExpense: decimalToString(summary.reimbursableExpense, 2),
            finalAmount: decimalToString(summary.finalAmount, 2),
            amountAlreadyPaid: decimalToString(summary.amountAlreadyPaid, 2),
            pendingAmount: decimalToString(summary.pendingAmount, 2),
          })),
        }))}
        pagination={{
          page: settlementsPage.page,
          pageSize: settlementsPage.pageSize,
          total: settlementsPage.total,
          totalPages: settlementsPage.totalPages,
        }}
        currentSummary={{
          totalRevenue: decimalToString(dashboard.totalRevenue, 2),
          totalExpense: decimalToString(dashboard.totalExpense, 2),
          netProfit: decimalToString(dashboard.netProfit, 2),
          partnerSummaries: dashboard.partnerSummaries.map((summary) => ({
            ...summary,
            percentage: decimalToString(summary.percentage, 2),
            profitShare: decimalToString(summary.profitShare, 2),
            reimbursableExpense: decimalToString(summary.reimbursableExpense, 2),
            finalAmount: decimalToString(summary.finalAmount, 2),
          })),
        }}
      />
    </div>
  )
}
