import Link from 'next/link'
import { Download } from 'lucide-react'
import { getDashboardData } from '@/actions/dashboard'
import { getExpenses, getExpensesByPartner } from '@/actions/expenses'
import { getRevenues } from '@/actions/revenues'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL, formatDateBR } from '@/lib/calculations'
import { compareDecimals } from '@/lib/decimal'
import { parsePaginationSearchParams } from '@/lib/pagination'
import { expenseCategoryOptions, revenueCategoryOptions } from '@/lib/validations'

const revenueCategoryLabel = (category: string) =>
  revenueCategoryOptions.find((option) => option.value === category)?.label ?? category

const expenseCategoryLabel = (category: string) =>
  expenseCategoryOptions.find((option) => option.value === category)?.label ?? category

interface RelatoriosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function buildQueryString(
  currentParams: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number>,
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(currentParams)) {
    const currentValue = firstValue(value)
    if (currentValue) {
      params.set(key, currentValue)
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    params.set(key, String(value))
  }

  return params.toString()
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const params = await searchParams

  const revenuesPagination = parsePaginationSearchParams({
    page: params.revenuesPage,
    pageSize: params.pageSize,
  })
  const expensesPagination = parsePaginationSearchParams({
    page: params.expensesPage,
    pageSize: params.pageSize,
  })

  const [dashboard, expenseByPartner, revenuesPage, expensesPage] = await Promise.all([
    getDashboardData(),
    getExpensesByPartner(),
    getRevenues(revenuesPagination),
    getExpenses(expensesPagination),
  ])

  return (
    <div className="space-y-6">
      <Header
        totalRevenue={dashboard.totalRevenue}
        totalExpense={dashboard.totalExpense}
        netProfit={dashboard.netProfit}
      />

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Consolidado financeiro do projeto</p>
        </div>
        <Button asChild>
          <a href="/api/relatorios/exportar-pdf">
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar PDF
          </a>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extrato geral</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita total</p>
            <p className="text-lg font-semibold text-success">{formatBRL(dashboard.totalRevenue)}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Despesa total</p>
            <p className="text-lg font-semibold text-destructive">{formatBRL(dashboard.totalExpense)}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro líquido</p>
            <p className="text-lg font-semibold text-primary">{formatBRL(dashboard.netProfit)}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sócios ativos</p>
            <p className="text-lg font-semibold">{dashboard.partnersCount}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(dashboard.revenuesByCategory).map(([category, value]) => (
                  <TableRow key={category}>
                    <TableCell>{revenueCategoryLabel(category)}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatBRL(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(dashboard.expensesByCategory).map(([category, value]) => (
                  <TableRow key={category}>
                    <TableCell>{expenseCategoryLabel(category)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatBRL(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas antecipadas por sócio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sócio</TableHead>
                <TableHead className="text-right">Total antecipado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(expenseByPartner)
                .sort((a, b) => compareDecimals(b[1].total, a[1].total))
                .map(([partnerId, partnerData]) => (
                  <TableRow key={partnerId}>
                    <TableCell className="font-medium">{partnerData.partnerName}</TableCell>
                    <TableCell className="text-right font-medium text-warning">
                      {formatBRL(partnerData.total)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apuração final por sócio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sócio</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Lucro proporcional</TableHead>
                <TableHead>Reembolso</TableHead>
                <TableHead className="text-right">Valor final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.partnerSummaries.map((summary) => (
                <TableRow key={summary.partnerId}>
                  <TableCell className="font-medium">{summary.partnerName}</TableCell>
                  <TableCell>{summary.percentage}%</TableCell>
                  <TableCell>{formatBRL(summary.profitShare)}</TableCell>
                  <TableCell className="text-warning">{formatBRL(summary.reimbursableExpense)}</TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {formatBRL(summary.finalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extrato completo de receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenuesPage.items.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell>{formatDateBR(revenue.date)}</TableCell>
                    <TableCell>{revenue.description}</TableCell>
                    <TableCell>{revenueCategoryLabel(revenue.category)}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatBRL(revenue.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {revenuesPage.page} de {revenuesPage.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={revenuesPage.page <= 1}>
                  <Link
                    href={`?${buildQueryString(params, { revenuesPage: Math.max(1, revenuesPage.page - 1) })}`}
                    scroll={false}
                  >
                    Anterior
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={revenuesPage.page >= revenuesPage.totalPages}
                >
                  <Link
                    href={`?${buildQueryString(params, { revenuesPage: Math.min(revenuesPage.totalPages, revenuesPage.page + 1) })}`}
                    scroll={false}
                  >
                    Próxima
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extrato completo de despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pagadores</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesPage.items.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDateBR(expense.date)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expenseCategoryLabel(expense.category)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {expense.payments.map((payment) => (
                          <span key={payment.id} className="text-xs text-muted-foreground">
                            {payment.partner.name}: {formatBRL(payment.amountPaid)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatBRL(expense.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {expensesPage.page} de {expensesPage.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={expensesPage.page <= 1}>
                  <Link
                    href={`?${buildQueryString(params, { expensesPage: Math.max(1, expensesPage.page - 1) })}`}
                    scroll={false}
                  >
                    Anterior
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={expensesPage.page >= expensesPage.totalPages}
                >
                  <Link
                    href={`?${buildQueryString(params, { expensesPage: Math.min(expensesPage.totalPages, expensesPage.page + 1) })}`}
                    scroll={false}
                  >
                    Próxima
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
