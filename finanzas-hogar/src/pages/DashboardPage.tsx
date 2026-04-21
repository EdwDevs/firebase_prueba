import { useMemo } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  PiggyBank,
  Wallet,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  useCards,
  useCategories,
  useCredits,
  useTransactions,
} from "@/hooks/useStore"
import { formatCOP, formatDate, monthKey } from "@/lib/utils"
import {
  monthlyStats,
  totalsByCategory,
  upcomingInstallments,
} from "@/lib/calculations"
import { CategoryIcon } from "@/components/CategoryIcon"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function DashboardPage() {
  const categories = useCategories()
  const transactions = useTransactions()
  const cards = useCards()
  const credits = useCredits()

  const thisMonth = monthKey(new Date())

  const stats = useMemo(
    () => monthlyStats(transactions, cards, credits, { includeFutureInstallments: false }),
    [transactions, cards, credits],
  )
  const current = stats.find((s) => s.key === thisMonth) ?? {
    key: thisMonth,
    income: 0,
    expense: 0,
    net: 0,
  }

  const last6 = useMemo(() => {
    const map = new Map(stats.map((s) => [s.key, s]))
    const result: { key: string; label: string; income: number; expense: number }[] = []
    const d = new Date()
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1)
      const k = monthKey(dd)
      const row = map.get(k)
      result.push({
        key: k,
        label: dd.toLocaleDateString("es-CO", { month: "short" }),
        income: row?.income ?? 0,
        expense: row?.expense ?? 0,
      })
    }
    return result
  }, [stats])

  const expenseBreakdown = useMemo(() => {
    const totals = totalsByCategory(transactions, "expense", thisMonth)
    const data = [...totals.entries()]
      .map(([catId, value]) => {
        const c = categories.find((x) => x.id === catId)
        return {
          id: catId,
          name: c?.name ?? "Sin categoría",
          color: c?.color ?? "#94a3b8",
          value,
        }
      })
      .sort((a, b) => b.value - a.value)
    const top = data.slice(0, 6)
    const rest = data.slice(6)
    if (rest.length > 0) {
      top.push({
        id: "otros",
        name: "Otros",
        color: "#94a3b8",
        value: rest.reduce((s, r) => s + r.value, 0),
      })
    }
    return top
  }, [transactions, categories, thisMonth])

  const upcoming = useMemo(
    () => upcomingInstallments(transactions, cards, credits, 45).slice(0, 6),
    [transactions, cards, credits],
  )

  const recent = useMemo(() => {
    return [...transactions].sort((a, b) => b.date - a.date).slice(0, 6)
  }, [transactions])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ingresos del mes"
          amount={current.income}
          hint="Entradas registradas este mes"
          icon={<ArrowUpRight className="text-success" />}
          tone="income"
        />
        <KpiCard
          title="Gastos del mes"
          amount={current.expense}
          hint="Salidas registradas este mes"
          icon={<ArrowDownRight className="text-destructive" />}
          tone="expense"
        />
        <KpiCard
          title="Balance neto"
          amount={current.net}
          hint={current.net >= 0 ? "Vas en verde 💚" : "Cuidado, gastos > ingresos"}
          icon={<Wallet />}
          tone="net"
        />
        <KpiCard
          title="Créditos activos"
          amount={credits.reduce(
            (s, c) => s + c.monthlyPayment * (c.installmentsTotal - c.installmentsPaid),
            0,
          )}
          hint={`${credits.length} crédito(s) · pendiente por pagar`}
          icon={<PiggyBank />}
          tone="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Gastos (últimos 6 meses)</CardTitle>
            <CardDescription>
              Evolución mensual en pesos colombianos
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis
                  fontSize={11}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}k`
                        : v
                  }
                />
                <Tooltip
                  formatter={(v: unknown) => formatCOP(Number(v))}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría (este mes)</CardTitle>
            <CardDescription>Distribución del gasto actual</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {expenseBreakdown.length === 0 ? (
              <EmptyState text="Aún no hay gastos este mes" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {expenseBreakdown.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => formatCOP(Number(v))}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos pagos</CardTitle>
              <CardDescription>
                Cuotas de tarjetas y créditos a 45 días
              </CardDescription>
            </div>
            <CalendarClock className="text-muted-foreground" size={20} />
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState text="No hay pagos próximos" />
            ) : (
              <ul className="flex flex-col divide-y">
                {upcoming.map((i, idx) => (
                  <li
                    key={`${i.transactionId}-${i.installmentNumber}-${idx}`}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{i.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Cuota {i.installmentNumber}/{i.totalInstallments} ·{" "}
                        {formatDate(i.dueDate)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {formatCOP(i.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>Últimas 6 transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState text="Agrega tu primer movimiento" />
            ) : (
              <ul className="flex flex-col divide-y">
                {recent.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId)
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <CategoryIcon name={cat?.icon} color={cat?.color} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t.description || cat?.name || "Sin descripción"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cat?.name ?? "Sin categoría"} · {formatDate(t.date)}
                        </p>
                      </div>
                      <Badge
                        variant={t.kind === "income" ? "success" : "destructive"}
                        className="font-mono"
                      >
                        {t.kind === "income" ? "+" : "-"}
                        {formatCOP(t.amount)}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  amount,
  hint,
  icon,
  tone,
}: {
  title: string
  amount: number
  hint: string
  icon: React.ReactNode
  tone: "income" | "expense" | "net" | "info"
}) {
  const toneColor =
    tone === "income"
      ? "text-success"
      : tone === "expense"
        ? "text-destructive"
        : tone === "net"
          ? amount >= 0
            ? "text-success"
            : "text-destructive"
          : "text-primary"
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className={`mt-1 text-2xl font-bold font-mono ${toneColor}`}>
            {formatCOP(amount)}
          </p>
        </div>
        <span className="rounded-lg bg-muted p-2">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
