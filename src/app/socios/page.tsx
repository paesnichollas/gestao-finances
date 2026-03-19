import { getDashboardData } from '@/actions/dashboard'
import { getActivePartners, getPartners } from '@/actions/partners'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { compareDecimals, sumDecimals } from '@/lib/decimal'
import { PartnersClient } from '@/app/socios/partners-client'
import { parsePaginationSearchParams } from '@/lib/pagination'

interface SociosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SociosPage({ searchParams }: SociosPageProps) {
  const pagination = parsePaginationSearchParams(await searchParams)

  const [partnersPage, activePartners, dashboard] = await Promise.all([
    getPartners(pagination),
    getActivePartners(),
    getDashboardData(),
  ])

  const totalPercentage = sumDecimals(activePartners.map((partner) => partner.percentage), 2)
  const percentageIsValid = compareDecimals(totalPercentage, 100) === 0

  return (
    <div className="space-y-6">
      <Header
        totalRevenue={dashboard.totalRevenue}
        totalExpense={dashboard.totalExpense}
        netProfit={dashboard.netProfit}
      />

      <section className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sócios</h1>
          <p className="text-sm text-muted-foreground">
            {activePartners.length} sócios ativos
          </p>
        </div>
        <Badge variant={percentageIsValid ? 'secondary' : 'destructive'}>
          Percentual total: {totalPercentage}%
        </Badge>
      </section>

      <PartnersClient
        partners={partnersPage.items.map((partner) => ({
          id: partner.id,
          name: partner.name,
          percentage: partner.percentage,
          isActive: partner.isActive,
          notes: partner.notes,
          totalAdvanced: partner.totalAdvanced,
        }))}
        pagination={{
          page: partnersPage.page,
          pageSize: partnersPage.pageSize,
          total: partnersPage.total,
          totalPages: partnersPage.totalPages,
        }}
      />
    </div>
  )
}
