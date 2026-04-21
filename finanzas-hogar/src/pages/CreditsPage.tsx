import { useMemo, useState } from "react"
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MoneyInput } from "@/components/MoneyInput"
import { useCredits } from "@/hooks/useStore"
import { creditsStore } from "@/lib/store"
import { formatCOP, formatDate } from "@/lib/utils"
import { generateCreditInstallments } from "@/lib/calculations"
import type { Credit } from "@/types"

function emptyCredit(): Omit<Credit, "id" | "createdAt"> {
  const now = Date.now()
  return {
    name: "",
    lender: "",
    totalAmount: 0,
    monthlyPayment: 0,
    startDate: now,
    endDate: now,
    interestRate: 0,
    paymentDay: 5,
    installmentsTotal: 12,
    installmentsPaid: 0,
  }
}

export function CreditsPage() {
  const credits = useCredits()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Credit | null>(null)
  const [form, setForm] = useState(emptyCredit())
  const [detailId, setDetailId] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(emptyCredit())
    setOpen(true)
  }

  function openEdit(c: Credit) {
    setEditing(c)
    setForm({ ...c })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return
    const end = new Date(form.startDate)
    end.setMonth(end.getMonth() + form.installmentsTotal)
    const payload: Credit = {
      id: editing?.id ?? "",
      createdAt: editing?.createdAt ?? Date.now(),
      ...form,
      endDate: end.getTime(),
    }
    await creditsStore.upsert(payload)
    setOpen(false)
  }

  async function remove(c: Credit) {
    if (!confirm(`¿Eliminar el crédito "${c.name}"?`)) return
    await creditsStore.remove(c.id)
  }

  async function payNext(c: Credit) {
    if (c.installmentsPaid >= c.installmentsTotal) return
    await creditsStore.upsert({ ...c, installmentsPaid: c.installmentsPaid + 1 })
  }

  const detail = useMemo(() => {
    if (!detailId) return null
    const c = credits.find((x) => x.id === detailId)
    if (!c) return null
    return { credit: c, installments: generateCreditInstallments(c) }
  }, [detailId, credits])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Créditos y préstamos</h2>
          <p className="text-sm text-muted-foreground">
            Lleva control de hipotecas, libre inversión, créditos de consumo,
            etc.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo crédito
        </Button>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <PiggyBank className="text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">
              No tienes créditos registrados. Crea uno para proyectar tus pagos
              mensuales.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {credits.map((c) => {
            const progress = (c.installmentsPaid / c.installmentsTotal) * 100
            const remaining =
              (c.installmentsTotal - c.installmentsPaid) * c.monthlyPayment
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{c.name}</CardTitle>
                      <CardDescription>{c.lender}</CardDescription>
                    </div>
                    <Badge variant="outline">{c.interestRate}% EA</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="block">Monto total</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatCOP(c.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="block">Cuota mensual</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatCOP(c.monthlyPayment)}
                      </span>
                    </div>
                    <div>
                      <span className="block">Inicio</span>
                      <span className="font-medium text-foreground">
                        {formatDate(c.startDate)}
                      </span>
                    </div>
                    <div>
                      <span className="block">Día pago</span>
                      <span className="font-medium text-foreground">
                        día {c.paymentDay}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {c.installmentsPaid}/{c.installmentsTotal} cuotas pagadas
                      </span>
                      <span className="font-mono font-semibold">
                        Resta {formatCOP(remaining)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDetailId(c.id)}
                    >
                      Ver cronograma
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => payNext(c)}
                      disabled={c.installmentsPaid >= c.installmentsTotal}
                    >
                      Marcar cuota pagada
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(c)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar crédito" : "Nuevo crédito"}
            </DialogTitle>
            <DialogDescription>
              Registra los datos del crédito para proyectar tus cuotas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Libre inversión Davivienda"
              />
            </div>
            <div className="grid gap-2">
              <Label>Entidad / Banco</Label>
              <Input
                value={form.lender}
                onChange={(e) => setForm({ ...form, lender: e.target.value })}
                placeholder="Davivienda"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Monto total</Label>
                <MoneyInput
                  value={form.totalAmount}
                  onChange={(v) => setForm({ ...form, totalAmount: v })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cuota mensual</Label>
                <MoneyInput
                  value={form.monthlyPayment}
                  onChange={(v) => setForm({ ...form, monthlyPayment: v })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>N° cuotas</Label>
                <Input
                  type="number"
                  min={1}
                  max={360}
                  value={form.installmentsTotal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      installmentsTotal: Math.max(1, Number(e.target.value || 1)),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Pagadas</Label>
                <Input
                  type="number"
                  min={0}
                  max={form.installmentsTotal}
                  value={form.installmentsPaid}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      installmentsPaid: Math.max(0, Number(e.target.value || 0)),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Tasa (% EA)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      interestRate: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={new Date(form.startDate).toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const d = new Date(e.target.value)
                    if (!Number.isNaN(d.getTime()))
                      setForm({ ...form, startDate: d.getTime() })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Día de pago</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.paymentDay}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentDay: Math.min(
                        28,
                        Math.max(1, Number(e.target.value || 1)),
                      ),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detail !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{detail?.credit.name}</DialogTitle>
            <DialogDescription>Cronograma de cuotas</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="max-h-[460px] overflow-auto rounded-md border scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha pago</th>
                    <th className="px-3 py-2 text-left">Cuota</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.installments.map((i) => (
                    <tr
                      key={i.installmentNumber}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(i.dueDate)}
                      </td>
                      <td className="px-3 py-2">
                        {i.installmentNumber}/{i.totalInstallments}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatCOP(i.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {i.paid ? (
                          <Badge variant="success">Pagada</Badge>
                        ) : i.dueDate < Date.now() ? (
                          <Badge variant="destructive">Vencida</Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
