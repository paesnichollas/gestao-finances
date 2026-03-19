import { getDashboardData } from '@/actions/dashboard'
import { DashboardCharts } from '@/components/charts/dashboard-charts'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL } from '@/lib/calculations'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <Header
        totalRevenue={data.totalRevenue}
        totalExpense={data.totalExpense}
        netProfit={data.netProfit}
      />

      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral financeira do projeto</p>
        </div>
        <Badge variant="secondary">{data.partnersCount} sócios ativos</Badge>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.partnerSummaries.map((summary) => (
          <Card key={summary.partnerId}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{summary.partnerName}</span>
                <Badge variant="outline">{summary.percentage}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lucro proporcional</span>
                <span className="font-medium">{formatBRL(summary.profitShare)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Despesas antecipadas</span>
                <span className="font-medium text-amber-600">
                  {formatBRL(summary.reimbursableExpense)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-muted-foreground">Valor final</span>
                <span className="font-semibold text-emerald-600">{formatBRL(summary.finalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <DashboardCharts
        expensesByCategory={data.expensesByCategory}
        revenuesByCategory={data.revenuesByCategory}
        partnerSummaries={data.partnerSummaries}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentRevenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhuma receita cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentRevenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>{revenue.description}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatBRL(revenue.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhuma despesa cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        {formatBRL(expense.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
