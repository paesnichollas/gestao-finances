import { getDashboardData } from '@/actions/dashboard'
import { getRevenues } from '@/actions/revenues'
import { Header } from '@/components/layout/header'
import { RevenuesClient } from '@/app/receitas/revenues-client'
import { parsePaginationSearchParams } from '@/lib/pagination'

interface ReceitasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReceitasPage({ searchParams }: ReceitasPageProps) {
  const pagination = parsePaginationSearchParams(await searchParams)

  const [revenuesPage, dashboard] = await Promise.all([
    getRevenues(pagination),
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
        <h1 className="text-2xl font-semibold tracking-tight">Receitas</h1>
        <p className="text-sm text-muted-foreground">{revenuesPage.total} receitas cadastradas</p>
      </section>

      <RevenuesClient
        revenues={revenuesPage.items.map((revenue) => ({
          ...revenue,
          amount: String(revenue.amount),
          date: revenue.date.toISOString(),
        }))}
        pagination={{
          page: revenuesPage.page,
          pageSize: revenuesPage.pageSize,
          total: revenuesPage.total,
          totalPages: revenuesPage.totalPages,
        }}
      />
    </div>
  )
}
