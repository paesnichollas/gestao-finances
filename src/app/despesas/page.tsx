import { getDashboardData } from '@/actions/dashboard'
import { getExpenses } from '@/actions/expenses'
import { getActivePartners } from '@/actions/partners'
import { Header } from '@/components/layout/header'
import { ExpensesClient } from '@/app/despesas/expenses-client'
import { parsePaginationSearchParams } from '@/lib/pagination'

interface DespesasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const pagination = parsePaginationSearchParams(await searchParams)

  const [expensesPage, partners, dashboard] = await Promise.all([
    getExpenses(pagination),
    getActivePartners(),
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
        <h1 className="text-2xl font-semibold tracking-tight">Despesas</h1>
        <p className="text-sm text-muted-foreground">{expensesPage.total} despesas cadastradas</p>
      </section>

      <ExpensesClient
        expenses={expensesPage.items.map((expense) => ({
          id: expense.id,
          description: expense.description,
          category: expense.category,
          totalAmount: String(expense.totalAmount),
          date: expense.date.toISOString(),
          notes: expense.notes,
          rateType: expense.rateType,
          payments: expense.payments.map((payment) => ({
            id: payment.id,
            partnerId: payment.partnerId,
            amountPaid: String(payment.amountPaid),
            partnerName: payment.partner.name,
          })),
        }))}
        partners={partners.map((partner) => ({
          id: partner.id,
          name: partner.name,
        }))}
        pagination={{
          page: expensesPage.page,
          pageSize: expensesPage.pageSize,
          total: expensesPage.total,
          totalPages: expensesPage.totalPages,
        }}
      />
    </div>
  )
}
