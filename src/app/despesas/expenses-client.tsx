'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { createExpense, deleteExpense, updateExpense } from '@/actions/expenses'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatBRL, formatDateBR } from '@/lib/calculations'
import { brDateToIsoYmd, isoYmdToBr, maskDateBrInput } from '@/lib/date-br'
import { compareDecimals, subtractDecimals, sumDecimals, toDecimal } from '@/lib/decimal'
import { expenseCategoryOptions } from '@/lib/validations'

interface PaymentRow {
  id: string
  partnerId: string
  amountPaid: string
  partnerName: string
}

interface ExpenseRow {
  id: string
  description: string
  category: string
  totalAmount: string
  date: string
  notes: string | null
  rateType: string
  payments: PaymentRow[]
}

interface PartnerOption {
  id: string
  name: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface PaymentInput {
  partnerId: string
  amountPaid: string
}

const categoryLabel = (category: string) =>
  expenseCategoryOptions.find((option) => option.value === category)?.label ?? category

function normalizeForPreview(value: string) {
  if (!value.trim()) {
    return '0.00'
  }

  try {
    return toDecimal(value).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function ExpensesClient({
  expenses,
  partners,
  pagination,
}: {
  expenses: ExpenseRow[]
  partners: PartnerOption[]
  pagination: PaginationInfo
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPaginating, startPaginationTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('SITE')
  const [totalAmount, setTotalAmount] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [payments, setPayments] = useState<PaymentInput[]>([{ partnerId: '', amountPaid: '' }])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dialogTitle = useMemo(
    () => (editingExpense ? 'Editar despesa' : 'Nova despesa'),
    [editingExpense],
  )

  function resetForm() {
    setEditingExpense(null)
    setDescription('')
    setCategory('SITE')
    setTotalAmount('')
    setDate('')
    setNotes('')
    setPayments([{ partnerId: '', amountPaid: '' }])
    setErrorMessage(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(expense: ExpenseRow) {
    setEditingExpense(expense)
    setDescription(expense.description)
    setCategory(expense.category)
    setTotalAmount(expense.totalAmount)
    setDate(isoYmdToBr(expense.date))
    setNotes(expense.notes ?? '')
    setPayments(
      expense.payments.length > 0
        ? expense.payments.map((payment) => ({
            partnerId: payment.partnerId,
            amountPaid: payment.amountPaid,
          }))
        : [{ partnerId: '', amountPaid: '' }],
    )
    setErrorMessage(null)
    setDialogOpen(true)
  }

  function addPayment() {
    setPayments((current) => [...current, { partnerId: '', amountPaid: '' }])
  }

  function removePayment(index: number) {
    setPayments((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function updatePayment(index: number, field: keyof PaymentInput, value: string) {
    setPayments((current) =>
      current.map((payment, currentIndex) =>
        currentIndex === index ? { ...payment, [field]: value } : payment,
      ),
    )
  }

  const totalPaid = sumDecimals(payments.map((payment) => normalizeForPreview(payment.amountPaid)), 2)
  const normalizedTotalAmount = normalizeForPreview(totalAmount)
  const remaining = subtractDecimals(normalizedTotalAmount, totalPaid, 2)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const dateIso = brDateToIsoYmd(date)
      if (!dateIso) {
        setErrorMessage('Informe uma data válida no formato dd/mm/aaaa.')
        return
      }

      const validPayments = payments.filter((payment) => payment.partnerId && payment.amountPaid.trim().length > 0)
      const payload = {
        description,
        category:
          category as
            | 'SITE'
            | 'VIAGEM'
            | 'MARKETING'
            | 'PANFLETOS'
            | 'VIDEOS'
            | 'CONTADOR'
            | 'ABERTURA_EMPRESA'
            | 'IMPOSTO'
            | 'RESERVA_FUNDO'
            | 'OPERACIONAL'
            | 'OUTRO',
        totalAmount,
        date: dateIso,
        notes: notes || null,
        rateType: 'REGISTRO_PAGADOR' as const,
        payments: validPayments,
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload)
      } else {
        await createExpense(payload)
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar a despesa.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteExpense() {
    if (!deletingExpenseId) {
      return
    }

    setLoading(true)
    try {
      await deleteExpense(deletingExpenseId)
      setDeletingExpenseId(null)
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
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nova despesa
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Registre a despesa e os respectivos pagadores.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expense-description">Descrição</Label>
                <Input
                  id="expense-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-total">Valor total (R$)</Label>
                <Input
                  id="expense-total"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={totalAmount}
                  onChange={(event) => setTotalAmount(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-date">Data</Label>
                <Input
                  id="expense-date"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="dd/mm/aaaa"
                  value={date}
                  onChange={(event) => setDate(maskDateBrInput(event.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-notes">Observações</Label>
              <Textarea
                id="expense-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Pagamentos</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPayment}>
                  <Plus className="h-4 w-4" />
                  Adicionar pagador
                </Button>
              </div>

              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={`${payment.partnerId}-${index}`} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                    <Select
                      value={payment.partnerId}
                      onValueChange={(value) => updatePayment(index, 'partnerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sócio" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Valor pago"
                      value={payment.amountPaid}
                      onChange={(event) => updatePayment(index, 'amountPaid', event.target.value)}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removePayment(index)}
                      disabled={payments.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <p className="text-muted-foreground">
                  Total pago: <span className="font-medium">{formatBRL(totalPaid)}</span>
                </p>
                <p
                  className={
                    compareDecimals(remaining, 0) === 1
                      ? 'text-amber-600'
                      : compareDecimals(remaining, 0) === -1
                        ? 'text-destructive'
                        : 'text-emerald-600'
                  }
                >
                  {compareDecimals(remaining, 0) === 1
                    ? `Faltam ${formatBRL(remaining)}`
                    : compareDecimals(remaining, 0) === -1
                      ? `Excedente ${formatBRL(toDecimal(remaining).abs().toFixed(2))}`
                      : 'Despesa totalmente coberta'}
                </p>
              </div>
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editingExpense ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingExpenseId)} onOpenChange={() => setDeletingExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
            <AlertDialogDescription>
              A despesa e os pagamentos vinculados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Pagadores</TableHead>
              <TableHead className="text-right">Valor total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma despesa cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{categoryLabel(expense.category)}</TableCell>
                  <TableCell>{formatDateBR(expense.date)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {expense.payments.map((payment) => (
                        <span key={payment.id} className="text-xs text-muted-foreground">
                          {payment.partnerName}: {formatBRL(payment.amountPaid)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-rose-600">
                    {formatBRL(expense.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingExpenseId(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
  )
}
