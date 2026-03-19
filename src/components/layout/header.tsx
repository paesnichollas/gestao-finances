import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatBRL } from '@/lib/calculations'
import { compareDecimals } from '@/lib/decimal'

interface HeaderProps {
  totalRevenue: string
  totalExpense: string
  netProfit: string
}

export function Header({ totalRevenue, totalExpense, netProfit }: HeaderProps) {
  const netPositive = compareDecimals(netProfit, 0) >= 0

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Receitas</p>
            <p className="text-xl font-semibold text-emerald-600">{formatBRL(totalRevenue)}</p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Despesas</p>
            <p className="text-xl font-semibold text-rose-600">{formatBRL(totalExpense)}</p>
          </div>
          <TrendingDown className="h-5 w-5 text-rose-600" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro líquido</p>
            <p className={`text-xl font-semibold ${netPositive ? 'text-primary' : 'text-rose-600'}`}>
              {formatBRL(netProfit)}
            </p>
          </div>
          <Wallet className={`h-5 w-5 ${netPositive ? 'text-primary' : 'text-rose-600'}`} />
        </CardContent>
      </Card>
    </div>
  )
}

