import { useMemo, useState } from "react"
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MoneyInput } from "@/components/MoneyInput"
import { CategoryIcon } from "@/components/CategoryIcon"
import {
  useCards,
  useCategories,
  useCredits,
  useTransactions,
} from "@/hooks/useStore"
import { transactionsStore } from "@/lib/store"
import { formatCOP, formatDate } from "@/lib/utils"
import type {
  PaymentMethod,
  Transaction,
  TransactionKind,
} from "@/types"

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Débito" },
  { value: "transfer", label: "Transferencia" },
  { value: "credit_card", label: "Tarjeta de crédito" },
  { value: "credit_loan", label: "Crédito / Préstamo" },
]

function emptyTx(): Omit<Transaction, "id" | "createdAt"> {
  return {
    kind: "expense",
    amount: 0,
    categoryId: "",
    description: "",
    date: Date.now(),
    paymentMethod: "cash",
    cardId: null,
    creditId: null,
    installments: 1,
    installmentsPaid: 0,
  }
}

export function TransactionsPage() {
  const transactions = useTransactions()
  const categories = useCategories()
  const cards = useCards()
  const credits = useCredits()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState(emptyTx())
  const [filter, setFilter] = useState<"all" | TransactionKind>("all")
  const [search, setSearch] = useState("")

  const sorted = useMemo(() => {
    return [...transactions]
      .filter((t) => filter === "all" || t.kind === filter)
      .filter((t) =>
        search
          ? (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
          : true,
      )
      .sort((a, b) => b.date - a.date)
  }, [transactions, filter, search])

  function openNew(kind: TransactionKind) {
    setEditing(null)
    setForm({ ...emptyTx(), kind })
    setOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setForm({
      kind: t.kind,
      amount: t.amount,
      categoryId: t.categoryId,
      description: t.description,
      date: t.date,
      paymentMethod: t.paymentMethod,
      cardId: t.cardId ?? null,
      creditId: t.creditId ?? null,
      installments: t.installments ?? 1,
      installmentsPaid: t.installmentsPaid ?? 0,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.amount || form.amount <= 0) return
    if (!form.categoryId) return
    const payload: Transaction = {
      id: editing?.id ?? "",
      createdAt: editing?.createdAt ?? Date.now(),
      ...form,
    }
    await transactionsStore.upsert(payload)
    setOpen(false)
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return
    await transactionsStore.remove(id)
  }

  const relevantCategories = categories
    .filter((c) => c.kind === form.kind)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Movimientos</h2>
          <p className="text-sm text-muted-foreground">
            Registro histórico de ingresos y gastos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openNew("income")}
            variant="outline"
            className="text-success"
          >
            <ArrowUpRight size={16} /> Ingreso
          </Button>
          <Button onClick={() => openNew("expense")} variant="default">
            <Plus size={16} /> Nuevo gasto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex rounded-md bg-muted p-1">
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "rounded-sm px-3 py-1 text-xs font-medium " +
                  (filter === f
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground")
                }
              >
                {f === "all" ? "Todos" : f === "income" ? "Ingresos" : "Gastos"}
              </button>
            ))}
          </div>
          <Input
            placeholder="Buscar por descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <span className="ml-auto text-xs text-muted-foreground">
            {sorted.length} registro(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No hay movimientos. Empieza creando un ingreso o un gasto.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Fecha</th>
                    <th className="px-4 py-2.5 text-left">Descripción</th>
                    <th className="px-4 py-2.5 text-left">Categoría</th>
                    <th className="px-4 py-2.5 text-left">Método</th>
                    <th className="px-4 py-2.5 text-right">Monto</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => {
                    const cat = categories.find((c) => c.id === t.categoryId)
                    const card = cards.find((c) => c.id === t.cardId)
                    const method = PAYMENT_METHODS.find(
                      (m) => m.value === t.paymentMethod,
                    )
                    return (
                      <tr
                        key={t.id}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-2.5 max-w-[220px]">
                          <div className="truncate font-medium">
                            {t.description || "—"}
                          </div>
                          {t.paymentMethod === "credit_card" &&
                          (t.installments ?? 1) > 1 ? (
                            <div className="text-xs text-muted-foreground">
                              {t.installments} cuotas ·{" "}
                              {formatCOP(t.amount / (t.installments ?? 1))}/mes
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-2">
                            <CategoryIcon
                              name={cat?.icon}
                              color={cat?.color}
                              size={14}
                            />
                            <span>{cat?.name ?? "—"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {method?.label}
                          {card ? ` · ${card.name}` : ""}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge
                            variant={
                              t.kind === "income" ? "success" : "destructive"
                            }
                            className="font-mono"
                          >
                            {t.kind === "income" ? "+" : "-"}
                            {formatCOP(t.amount)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(t)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => remove(t.id)}
                            >
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar movimiento" : "Nuevo movimiento"}
            </DialogTitle>
            <DialogDescription>
              Registra ingresos y gastos en pesos colombianos
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex rounded-md bg-muted p-1">
              {(
                [
                  { v: "income", label: "Ingreso", icon: ArrowUpRight },
                  { v: "expense", label: "Gasto", icon: ArrowDownRight },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() =>
                    setForm({ ...form, kind: opt.v, categoryId: "" })
                  }
                  className={
                    "flex flex-1 items-center justify-center gap-2 rounded-sm py-1.5 text-sm " +
                    (form.kind === opt.v
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground")
                  }
                >
                  <opt.icon size={14} /> {opt.label}
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              <Label>Monto (COP)</Label>
              <MoneyInput
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {relevantCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Ej: Mercado Jumbo quincena"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={new Date(form.date).toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const d = new Date(e.target.value)
                    if (!Number.isNaN(d.getTime()))
                      setForm({ ...form, date: d.getTime() })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Método de pago</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v: PaymentMethod) =>
                    setForm({
                      ...form,
                      paymentMethod: v,
                      cardId: v === "credit_card" ? form.cardId : null,
                      creditId: v === "credit_loan" ? form.creditId : null,
                      installments: v === "credit_card" ? form.installments : 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.paymentMethod === "credit_card" && (
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3">
                <div className="grid gap-2">
                  <Label>Tarjeta</Label>
                  <Select
                    value={form.cardId ?? undefined}
                    onValueChange={(v) => setForm({ ...form, cardId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          cards.length ? "Selecciona tarjeta" : "Crea una tarjeta primero"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ····{c.lastFour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Número de cuotas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={form.installments ?? 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        installments: Math.max(1, Number(e.target.value || 1)),
                      })
                    }
                  />
                </div>
                {(form.installments ?? 1) > 1 && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Cuota mensual aprox:{" "}
                    <span className="font-mono font-semibold">
                      {formatCOP(form.amount / (form.installments ?? 1))}
                    </span>
                  </p>
                )}
              </div>
            )}

            {form.paymentMethod === "credit_loan" && (
              <div className="rounded-md border bg-muted/40 p-3">
                <Label>Crédito</Label>
                <Select
                  value={form.creditId ?? undefined}
                  onValueChange={(v) => setForm({ ...form, creditId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        credits.length
                          ? "Selecciona crédito"
                          : "Crea un crédito primero"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {credits.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
