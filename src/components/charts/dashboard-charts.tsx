'use client'

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PartnerSettlement } from '@/lib/calculations'
import { formatBRL } from '@/lib/calculations'
import { decimalToNumber } from '@/lib/decimal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = [
  '#4f46e5',
  '#16a34a',
  '#f59e0b',
  '#e11d48',
  '#0ea5e9',
  '#7c3aed',
  '#f97316',
  '#14b8a6',
]

const categoryLabels: Record<string, string> = {
  INSCRICAO: 'Inscrição',
  PATROCINIO: 'Patrocínio',
  VENDA: 'Venda',
  REPASSE: 'Repasse',
  OUTRO: 'Outro',
  SITE: 'Site',
  VIAGEM: 'Viagem',
  MARKETING: 'Marketing',
  PANFLETOS: 'Panfletos',
  VIDEOS: 'Vídeos',
  CONTADOR: 'Contador',
  ABERTURA_EMPRESA: 'Abertura de empresa',
  IMPOSTO: 'Imposto',
  RESERVA_FUNDO: 'Reserva / Fundo',
  OPERACIONAL: 'Operacional',
}

interface DashboardChartsProps {
  expensesByCategory: Record<string, string>
  revenuesByCategory: Record<string, string>
  partnerSummaries: PartnerSettlement[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  color?: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) {
    return null
  }

  const first = payload[0]

  if (!first) {
    return null
  }

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{first.name}</p>
      <p className="text-sm font-semibold" style={{ color: first.color ?? '#4f46e5' }}>
        {formatBRL(first.value)}
      </p>
    </div>
  )
}

export function DashboardCharts({
  expensesByCategory,
  revenuesByCategory,
  partnerSummaries,
}: DashboardChartsProps) {
  const expenseData = Object.entries(expensesByCategory).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    value: decimalToNumber(value),
  }))

  const revenueData = Object.entries(revenuesByCategory).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    value: decimalToNumber(value),
  }))

  const partnerData = partnerSummaries.map((partner) => ({
    name: partner.partnerName,
    lucro: decimalToNumber(partner.profitShare),
    reembolso: decimalToNumber(partner.reimbursableExpense),
    total: decimalToNumber(partner.finalAmount),
  }))

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas por categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {revenueData.length === 0 ? (
            <p className="pt-10 text-center text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <PieChart>
                <Pie
                  data={revenueData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {revenueData.map((_, index) => (
                    <Cell key={`revenue-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas por categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {expenseData.length === 0 ? (
            <p className="pt-10 text-center text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`expense-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Distribuição final por sócio</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {partnerData.length === 0 ? (
            <p className="pt-10 text-center text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart data={partnerData}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="lucro" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reembolso" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

