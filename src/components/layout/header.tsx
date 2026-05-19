import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatBRL } from '@/lib/calculations'
import { compareDecimals } from '@/lib/decimal'
import { cn } from '@/lib/utils'

interface HeaderProps {
  totalRevenue: string
  totalExpense: string
  netProfit: string
}

interface KpiCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: 'success' | 'destructive' | 'primary'
}

const ACCENT_TEXT: Record<KpiCardProps['accent'], string> = {
  success: 'text-success',
  destructive: 'text-destructive',
  primary: 'text-primary',
}

const ACCENT_BG: Record<KpiCardProps['accent'], string> = {
  success: 'bg-success/10',
  destructive: 'bg-destructive/10',
  primary: 'bg-primary/10',
}

function KpiCard({ label, value, icon: Icon, accent }: KpiCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('truncate text-2xl font-bold tabular-nums', ACCENT_TEXT[accent])}>
            {value}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ACCENT_BG[accent])}>
          <Icon className={cn('h-5 w-5', ACCENT_TEXT[accent])} />
        </div>
      </CardContent>
    </Card>
  )
}

export function Header({ totalRevenue, totalExpense, netProfit }: HeaderProps) {
  const netPositive = compareDecimals(netProfit, 0) >= 0

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <KpiCard label="Receitas" value={formatBRL(totalRevenue)} icon={TrendingUp} accent="success" />
      <KpiCard label="Despesas" value={formatBRL(totalExpense)} icon={TrendingDown} accent="destructive" />
      <KpiCard
        label="Lucro líquido"
        value={formatBRL(netProfit)}
        icon={Wallet}
        accent={netPositive ? 'primary' : 'destructive'}
      />
    </div>
  )
}
