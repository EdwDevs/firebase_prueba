import { useMemo, useState } from "react"
import { CreditCard as CardIcon, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { useCards, useTransactions } from "@/hooks/useStore"
import { cardsStore } from "@/lib/store"
import { formatCOP, formatDate } from "@/lib/utils"
import { cardBalance, generateCardInstallments } from "@/lib/calculations"
import type { CreditCard } from "@/types"

const CARD_COLORS = [
  "#1e3a8a", "#7c2d12", "#1f2937", "#064e3b", "#4c1d95",
  "#831843", "#0c4a6e", "#713f12",
]

function emptyCard(): Omit<CreditCard, "id" | "createdAt"> {
  return {
    name: "",
    bank: "",
    lastFour: "",
    creditLimit: 0,
    cutoffDay: 15,
    paymentDay: 5,
    color: CARD_COLORS[0],
  }
}

export function CardsPage() {
  const cards = useCards()
  const transactions = useTransactions()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [form, setForm] = useState(emptyCard())
  const [detailCardId, setDetailCardId] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(emptyCard())
    setOpen(true)
  }

  function openEdit(c: CreditCard) {
    setEditing(c)
    setForm({
      name: c.name,
      bank: c.bank,
      lastFour: c.lastFour,
      creditLimit: c.creditLimit,
      cutoffDay: c.cutoffDay,
      paymentDay: c.paymentDay,
      color: c.color,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return
    const payload: CreditCard = {
      id: editing?.id ?? "",
      createdAt: editing?.createdAt ?? Date.now(),
      ...form,
    }
    await cardsStore.upsert(payload)
    setOpen(false)
  }

  async function remove(c: CreditCard) {
    const count = transactions.filter((t) => t.cardId === c.id).length
    const msg =
      count > 0
        ? `Esta tarjeta tiene ${count} movimiento(s). ¿Eliminar de todas formas?`
        : "¿Eliminar esta tarjeta?"
    if (!confirm(msg)) return
    await cardsStore.remove(c.id)
  }

  const detail = useMemo(() => {
    if (!detailCardId) return null
    const card = cards.find((c) => c.id === detailCardId)
    if (!card) return null
    const related = transactions.filter(
      (t) => t.paymentMethod === "credit_card" && t.cardId === card.id,
    )
    const installments = related
      .flatMap((t) => generateCardInstallments(t, card))
      .sort((a, b) => a.dueDate - b.dueDate)
    return { card, installments, transactions: related }
  }, [detailCardId, cards, transactions])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Tarjetas de crédito</h2>
          <p className="text-sm text-muted-foreground">
            Administra cupo, fecha de corte, fecha de pago y cuotas activas.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nueva tarjeta
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CardIcon className="text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">
              No tienes tarjetas registradas todavía.
            </p>
            <Button onClick={openNew} variant="outline">
              <Plus size={16} /> Agregar tarjeta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const bal = cardBalance(c.id, transactions, c)
            const usedPct =
              c.creditLimit > 0
                ? Math.min(100, (bal.totalPending / c.creditLimit) * 100)
                : 0
            return (
              <Card key={c.id} className="overflow-hidden">
                <div
                  className="relative flex h-36 flex-col justify-between p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                      {c.bank || "Banco"}
                    </span>
                    <CardIcon size={20} />
                  </div>
                  <div>
                    <p className="font-mono text-lg tracking-widest">
                      •••• •••• •••• {c.lastFour || "0000"}
                    </p>
                    <p className="mt-1 text-xs uppercase opacity-80">
                      {c.name}
                    </p>
                  </div>
                </div>
                <CardContent className="grid gap-3 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="block">Corte</span>
                      <span className="font-medium text-foreground">
                        día {c.cutoffDay}
                      </span>
                    </div>
                    <div>
                      <span className="block">Pago</span>
                      <span className="font-medium text-foreground">
                        día {c.paymentDay}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Deuda pendiente</span>
                      <span className="font-mono font-semibold">
                        {formatCOP(bal.totalPending)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${usedPct}%`,
                          backgroundColor:
                            usedPct > 80
                              ? "#ef4444"
                              : usedPct > 50
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>Cupo: {formatCOP(c.creditLimit)}</span>
                      <span>{usedPct.toFixed(0)}% usado</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDetailCardId(c.id)}
                    >
                      Ver cuotas
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

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar tarjeta" : "Nueva tarjeta"}
            </DialogTitle>
            <DialogDescription>
              Registra los datos clave para proyectar tus cuotas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Alias / Nombre</Label>
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Visa Bancolombia Platinum"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Banco</Label>
                <Input
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  placeholder="Bancolombia"
                />
              </div>
              <div className="grid gap-2">
                <Label>Últimos 4 dígitos</Label>
                <Input
                  value={form.lastFour}
                  maxLength={4}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastFour: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  placeholder="1234"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cupo asignado (COP)</Label>
              <MoneyInput
                value={form.creditLimit}
                onChange={(v) => setForm({ ...form, creditLimit: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Día de corte</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.cutoffDay}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cutoffDay: Math.min(
                        28,
                        Math.max(1, Number(e.target.value || 1)),
                      ),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Día máximo de pago</Label>
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
            <div className="grid gap-2">
              <Label>Color de la tarjeta</Label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => setForm({ ...form, color: col })}
                    className={
                      "h-8 w-8 rounded-full border-2 " +
                      (form.color === col
                        ? "border-foreground"
                        : "border-transparent")
                    }
                    style={{ backgroundColor: col }}
                    aria-label={col}
                  />
                ))}
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

      {/* Detail dialog */}
      <Dialog
        open={detail !== null}
        onOpenChange={(v) => !v && setDetailCardId(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{detail?.card.name}</DialogTitle>
            <DialogDescription>
              Cronograma completo de cuotas proyectadas
            </DialogDescription>
          </DialogHeader>
          {detail && detail.installments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay compras a crédito registradas en esta tarjeta.
            </p>
          )}
          {detail && detail.installments.length > 0 && (
            <div className="max-h-[460px] overflow-auto rounded-md border scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha pago</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-left">Cuota</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.installments.map((i, idx) => (
                    <tr
                      key={`${i.transactionId}-${i.installmentNumber}-${idx}`}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(i.dueDate)}
                      </td>
                      <td className="px-3 py-2">{i.description}</td>
                      <td className="px-3 py-2 text-muted-foreground">
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
