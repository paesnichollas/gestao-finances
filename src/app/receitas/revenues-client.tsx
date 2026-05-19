'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { createRevenue, deleteRevenue, updateRevenue } from '@/actions/revenues'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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
import { formatBRL, formatDateBR } from '@/lib/calculations'
import { brDateToIsoYmd, isoYmdToBr, maskDateBrInput } from '@/lib/date-br'
import { revenueCategoryOptions } from '@/lib/validations'

interface RevenueRow {
  id: string
  description: string
  category: string
  amount: string
  date: string
  origin: string | null
  notes: string | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const categoryLabel = (category: string) =>
  revenueCategoryOptions.find((option) => option.value === category)?.label ?? category

export function RevenuesClient({
  revenues,
  pagination,
}: {
  revenues: RevenueRow[]
  pagination: PaginationInfo
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPaginating, startPaginationTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<RevenueRow | null>(null)
  const [deletingRevenueId, setDeletingRevenueId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('INSCRICAO')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [origin, setOrigin] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEditing = Boolean(editingRevenue)

  const dialogTitle = useMemo(
    () => (isEditing ? 'Editar receita' : 'Nova receita'),
    [isEditing],
  )

  function resetForm() {
    setEditingRevenue(null)
    setDescription('')
    setCategory('INSCRICAO')
    setAmount('')
    setDate('')
    setOrigin('')
    setNotes('')
    setErrorMessage(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(revenue: RevenueRow) {
    setEditingRevenue(revenue)
    setDescription(revenue.description)
    setCategory(revenue.category)
    setAmount(revenue.amount)
    setDate(isoYmdToBr(revenue.date))
    setOrigin(revenue.origin ?? '')
    setNotes(revenue.notes ?? '')
    setErrorMessage(null)
    setDialogOpen(true)
  }

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

      const payload = {
        description,
        category: category as 'INSCRICAO' | 'PATROCINIO' | 'VENDA' | 'REPASSE' | 'OUTRO',
        amount,
        date: dateIso,
        origin: origin || null,
        notes: notes || null,
      }

      if (editingRevenue) {
        await updateRevenue(editingRevenue.id, payload)
      } else {
        await createRevenue(payload)
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar a receita.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRevenue() {
    if (!deletingRevenueId) {
      return
    }

    setLoading(true)

    try {
      await deleteRevenue(deletingRevenueId)
      setDeletingRevenueId(null)
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
          Nova receita
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Preencha os dados da receita.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="revenue-description">Descrição</Label>
                <Input
                  id="revenue-description"
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
                    {revenueCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-amount">Valor</Label>
                <CurrencyInput
                  id="revenue-amount"
                  value={amount}
                  onValueChange={setAmount}
                  allowEmpty
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-date">Data</Label>
                <Input
                  id="revenue-date"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="dd/mm/aaaa"
                  value={date}
                  onChange={(event) => setDate(maskDateBrInput(event.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-origin">Origem</Label>
                <Input
                  id="revenue-origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue-notes">Observações</Label>
              <Textarea
                id="revenue-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingRevenueId)} onOpenChange={() => setDeletingRevenueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A receita será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRevenue}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma receita cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              revenues.map((revenue) => (
                <TableRow key={revenue.id}>
                  <TableCell className="font-medium">{revenue.description}</TableCell>
                  <TableCell>{categoryLabel(revenue.category)}</TableCell>
                  <TableCell>{formatDateBR(revenue.date)}</TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {formatBRL(revenue.amount)}
                  </TableCell>
                  <TableCell>{revenue.origin || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(revenue)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingRevenueId(revenue.id)}
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
      </div>

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
