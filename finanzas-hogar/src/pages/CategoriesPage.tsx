import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryIcon } from "@/components/CategoryIcon"
import { useCategories, useTransactions } from "@/hooks/useStore"
import { categoriesStore } from "@/lib/store"
import type { Category, TransactionKind } from "@/types"

const ICON_OPTIONS = [
  "Home", "Building2", "Zap", "Droplet", "Flame", "Wifi", "Smartphone",
  "ShoppingCart", "Utensils", "Fuel", "Bus", "HeartPulse", "Pill",
  "GraduationCap", "Tv", "Shirt", "Sparkles", "PawPrint", "Gamepad2",
  "Gift", "PiggyBank", "Landmark", "Shield", "CreditCard", "Banknote",
  "Briefcase", "Laptop", "TrendingUp", "HandCoins", "Car", "Baby",
  "Book", "Coffee", "Plane", "Dumbbell", "Wrench", "Tag", "Ellipsis",
]

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
]

function emptyCat(kind: TransactionKind): Omit<Category, "id" | "createdAt"> {
  return {
    name: "",
    kind,
    icon: kind === "income" ? "Briefcase" : "ShoppingCart",
    color: kind === "income" ? "#22c55e" : "#ef4444",
    isDefault: false,
  }
}

export function CategoriesPage() {
  const categories = useCategories()
  const transactions = useTransactions()

  const [tab, setTab] = useState<TransactionKind>("expense")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyCat("expense"))

  const list = useMemo(
    () =>
      categories
        .filter((c) => c.kind === tab)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, tab],
  )

  const usageCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of transactions) {
      m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + 1)
    }
    return m
  }, [transactions])

  function openNew() {
    setEditing(null)
    setForm(emptyCat(tab))
    setOpen(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({
      name: c.name,
      kind: c.kind,
      icon: c.icon,
      color: c.color,
      isDefault: c.isDefault,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return
    const payload: Category = {
      id: editing?.id ?? "",
      createdAt: editing?.createdAt ?? Date.now(),
      ...form,
    }
    await categoriesStore.upsert(payload)
    setOpen(false)
  }

  async function remove(c: Category) {
    const count = usageCounts.get(c.id) ?? 0
    const msg =
      count > 0
        ? `Esta categoría tiene ${count} movimiento(s) asociado(s). ¿Eliminarla de todos modos? Los movimientos quedarán sin categoría.`
        : "¿Eliminar esta categoría?"
    if (!confirm(msg)) return
    await categoriesStore.remove(c.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Organiza tus ingresos y gastos. Trae una lista inicial pensada para
            hogares colombianos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TransactionKind)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="expense">Gastos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>
            {tab === "expense" ? "Categorías de gastos" : "Categorías de ingresos"}
          </CardTitle>
          <CardDescription>{list.length} categoría(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay categorías. Crea una nueva.
            </p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-background p-3"
                >
                  <CategoryIcon name={c.icon} color={c.color} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {usageCounts.get(c.id) ?? 0} movimiento(s)
                    </p>
                  </div>
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
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
            <DialogDescription>
              Personaliza nombre, ícono y color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Parqueadero"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v: TransactionKind) =>
                    setForm({ ...form, kind: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      onClick={() => setForm({ ...form, color: col })}
                      className={
                        "h-6 w-6 rounded-full border-2 " +
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
            <div className="grid gap-2">
              <Label>Ícono</Label>
              <div className="grid max-h-52 grid-cols-8 gap-1.5 overflow-y-auto rounded-md border p-2 scrollbar-thin">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-md border " +
                      (form.icon === ic
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-accent")
                    }
                    title={ic}
                  >
                    <CategoryIcon name={ic} color={form.color} size={14} />
                  </button>
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
    </div>
  )
}
