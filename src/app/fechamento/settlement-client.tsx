'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calculator, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { deleteSettlement, finalizeSettlement, generateSettlement } from '@/actions/dashboard'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL } from '@/lib/calculations'
import type { PartnerSettlement } from '@/lib/calculations'
import { compareDecimals } from '@/lib/decimal'

interface PartnerSummaryRow {
  id: string
  partnerId: string
  partnerName: string
  percentage: string
  profitShare: string
  reimbursableExpense: string
  finalAmount: string
  amountAlreadyPaid: string
  pendingAmount: string
}

interface SettlementRow {
  id: string
  referenceLabel: string
  totalRevenue: string
  totalExpense: string
  netProfit: string
  totalPaidOut: string
  status: string
  partnerSummaries: PartnerSummaryRow[]
}

interface CurrentSummary {
  totalRevenue: string
  totalExpense: string
  netProfit: string
  partnerSummaries: PartnerSettlement[]
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function SettlementClient({
  settlements,
  pagination,
  currentSummary,
}: {
  settlements: SettlementRow[]
  pagination: PaginationInfo
  currentSummary: CurrentSummary
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPaginating, startPaginationTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [referenceLabel, setReferenceLabel] = useState('')
  const [expandedSettlementId, setExpandedSettlementId] = useState<string | null>(null)
  const [deletingSettlementId, setDeletingSettlementId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      await generateSettlement(referenceLabel)
      setReferenceLabel('')
      setDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalize(settlementId: string) {
    setLoading(true)

    try {
      await finalizeSettlement(settlementId)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteSettlement() {
    if (!deletingSettlementId) {
      return
    }

    setLoading(true)
    try {
      await deleteSettlement(deletingSettlementId)
      setDeletingSettlementId(null)
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return
    }

    startPaginationTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(nextPage))
      params.set('pageSize', String(pagination.pageSize))
      router.replace(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Situação atual</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fechamento em tempo real com receitas e despesas registradas.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Calculator className="h-4 w-4" />
            Gerar fechamento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita total</p>
              <p className="text-lg font-semibold text-success">{formatBRL(currentSummary.totalRevenue)}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Despesa total</p>
              <p className="text-lg font-semibold text-destructive">{formatBRL(currentSummary.totalExpense)}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro líquido</p>
              <p className="text-lg font-semibold text-primary">{formatBRL(currentSummary.netProfit)}</p>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sócio</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Lucro proporcional</TableHead>
                  <TableHead>Despesas antecipadas</TableHead>
                  <TableHead className="text-right">Valor final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSummary.partnerSummaries.map((summary) => (
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar fechamento</DialogTitle>
            <DialogDescription>Defina uma referência para este fechamento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reference-label">Referência / período</Label>
              <Input
                id="reference-label"
                value={referenceLabel}
                onChange={(event) => setReferenceLabel(event.target.value)}
                placeholder="Ex.: março de 2026"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Gerando...' : 'Gerar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingSettlementId)} onOpenChange={() => setDeletingSettlementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fechamento</AlertDialogTitle>
            <AlertDialogDescription>
              O fechamento selecionado será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSettlement}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {settlements.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Fechamentos anteriores</h2>
          {settlements.map((settlement) => {
            const expanded = expandedSettlementId === settlement.id

            return (
              <Card key={settlement.id}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{settlement.referenceLabel}</CardTitle>
                    <Badge variant={settlement.status === 'FINALIZADO' ? 'secondary' : 'outline'}>
                      {settlement.status === 'FINALIZADO' ? 'Finalizado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      Lucro: {formatBRL(settlement.netProfit)}
                    </span>
                    {settlement.status === 'RASCUNHO' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleFinalize(settlement.id)}
                          disabled={loading}
                        >
                          <Check className="h-4 w-4" />
                          Finalizar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingSettlementId(settlement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setExpandedSettlementId(expanded ? null : settlement.id)}
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {expanded ? (
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita</p>
                        <p className="font-semibold text-success">{formatBRL(settlement.totalRevenue)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Despesa</p>
                        <p className="font-semibold text-destructive">{formatBRL(settlement.totalExpense)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro</p>
                        <p className="font-semibold text-primary">{formatBRL(settlement.netProfit)}</p>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sócio</TableHead>
                            <TableHead>%</TableHead>
                            <TableHead>Lucro</TableHead>
                            <TableHead>Reembolso</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Pendente</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settlement.partnerSummaries.map((summary) => (
                            <TableRow key={summary.id}>
                              <TableCell className="font-medium">{summary.partnerName}</TableCell>
                              <TableCell>{summary.percentage}%</TableCell>
                              <TableCell>{formatBRL(summary.profitShare)}</TableCell>
                              <TableCell className="text-warning">
                                {formatBRL(summary.reimbursableExpense)}
                              </TableCell>
                              <TableCell className="text-success">
                                {formatBRL(summary.finalAmount)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  compareDecimals(summary.pendingAmount, 0) === 1
                                    ? 'text-warning'
                                    : 'text-success'
                                }`}
                              >
                                {formatBRL(summary.pendingAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            )
          })}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={isPaginating || pagination.page <= 1}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={isPaginating || pagination.page >= pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
