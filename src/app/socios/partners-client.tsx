'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { createPartner, deletePartner, updatePartner } from '@/actions/partners'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/calculations'

interface PartnerRow {
  id: string
  name: string
  percentage: string
  isActive: boolean
  notes: string | null
  totalAdvanced: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function PartnersClient({
  partners,
  pagination,
}: {
  partners: PartnerRow[]
  pagination: PaginationInfo
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPaginating, startPaginationTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<PartnerRow | null>(null)
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [percentage, setPercentage] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dialogTitle = useMemo(
    () => (editingPartner ? 'Editar sócio' : 'Novo sócio'),
    [editingPartner],
  )

  function resetForm() {
    setEditingPartner(null)
    setName('')
    setPercentage('')
    setIsActive(true)
    setNotes('')
    setErrorMessage(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(partner: PartnerRow) {
    setEditingPartner(partner)
    setName(partner.name)
    setPercentage(partner.percentage)
    setIsActive(partner.isActive)
    setNotes(partner.notes ?? '')
    setErrorMessage(null)
    setDialogOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const payload = {
        name,
        percentage,
        isActive,
        notes: notes || null,
      }

      if (editingPartner) {
        await updatePartner(editingPartner.id, payload)
      } else {
        await createPartner(payload)
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar o sócio.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePartner() {
    if (!deletingPartnerId) {
      return
    }

    setLoading(true)
    try {
      await deletePartner(deletingPartnerId)
      setDeletingPartnerId(null)
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
          Novo sócio
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Defina o percentual e o status do sócio.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partner-name">Nome</Label>
                <Input
                  id="partner-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-percentage">Percentual (%)</Label>
                <Input
                  id="partner-percentage"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={percentage}
                  onChange={(event) => setPercentage(event.target.value)}
                  required
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={isActive} onCheckedChange={(value) => setIsActive(Boolean(value))} />
                  Sócio ativo
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-notes">Observações</Label>
              <Textarea
                id="partner-notes"
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
                {loading ? 'Salvando...' : editingPartner ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingPartnerId)} onOpenChange={() => setDeletingPartnerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sócio</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o sócio e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Percentual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total antecipado</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum sócio cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.percentage}%</TableCell>
                  <TableCell>
                    <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                      {partner.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatBRL(partner.totalAdvanced)}</TableCell>
                  <TableCell>{partner.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(partner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingPartnerId(partner.id)}
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
