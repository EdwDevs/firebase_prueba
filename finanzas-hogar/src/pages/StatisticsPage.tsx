import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryIcon } from "@/components/CategoryIcon"
import {
  useCards,
  useCategories,
  useCredits,
  useTransactions,
} from "@/hooks/useStore"
import { formatCOP, monthKey } from "@/lib/utils"
import { monthlyStats, totalsByCategory } from "@/lib/calculations"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function StatisticsPage() {
  const transactions = useTransactions()
  const categories = useCategories()
  const cards = useCards()
  const credits = useCredits()

  const [includeFuture, setIncludeFuture] = useState<"true" | "false">("false")
  const [monthFilter, setMonthFilter] = useState<string>("all")

  const stats = useMemo(
    () =>
      monthlyStats(transactions, cards, credits, {
        includeFutureInstallments: includeFuture === "true",
      }),
    [transactions, cards, credits, includeFuture],
  )

  const months = stats.map((s) => s.key)

  const selectedMonth = monthFilter === "all" ? undefined : monthFilter
  const expenseByCat = useMemo(
    () => totalsByCategory(transactions, "expense", selectedMonth),
    [transactions, selectedMonth],
  )
  const incomeByCat = useMemo(
    () => totalsByCategory(transactions, "income", selectedMonth),
    [transactions, selectedMonth],
  )

  const expenseData = useMemo(
    () =>
      [...expenseByCat.entries()]
        .map(([id, value]) => {
          const c = categories.find((x) => x.id === id)
          return {
            id,
            name: c?.name ?? "Sin categoría",
            color: c?.color ?? "#94a3b8",
            icon: c?.icon,
            value,
          }
        })
        .sort((a, b) => b.value - a.value),
    [expenseByCat, categories],
  )

  const incomeData = useMemo(
    () =>
      [...incomeByCat.entries()]
        .map(([id, value]) => {
          const c = categories.find((x) => x.id === id)
          return {
            id,
            name: c?.name ?? "Sin categoría",
            color: c?.color ?? "#94a3b8",
            icon: c?.icon,
            value,
          }
        })
        .sort((a, b) => b.value - a.value),
    [incomeByCat, categories],
  )

  const totalExpense = expenseData.reduce((s, r) => s + r.value, 0)
  const totalIncome = incomeData.reduce((s, r) => s + r.value, 0)

  const timeline = useMemo(() => {
    return stats.map((s) => ({
      label: new Date(`${s.key}-01`).toLocaleDateString("es-CO", {
        month: "short",
        year: "2-digit",
      }),
      key: s.key,
      income: s.income,
      expense: s.expense,
      net: s.net,
    }))
  }, [stats])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Estadísticas</h2>
          <p className="text-sm text-muted-foreground">
            Analiza tus finanzas por mes, categoría, tarjeta y créditos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={monthFilter}
            onValueChange={(v) => setMonthFilter(v)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filtrar mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {months
                .slice()
                .reverse()
                .map((m) => (
                  <SelectItem key={m} value={m}>
                    {new Date(`${m}-01`).toLocaleDateString("es-CO", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              {months.length === 0 && (
                <SelectItem value={monthKey(new Date())}>
                  Este mes
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select
            value={includeFuture}
            onValueChange={(v) => setIncludeFuture(v as "true" | "false")}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Ver solo movimientos reales</SelectItem>
              <SelectItem value="true">
                Incluir cuotas futuras proyectadas
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos totales</CardTitle>
            <CardDescription>
              {monthFilter === "all" ? "Histórico completo" : "Mes seleccionado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-success">
              {formatCOP(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos totales</CardTitle>
            <CardDescription>
              {monthFilter === "all" ? "Histórico completo" : "Mes seleccionado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-destructive">
              {formatCOP(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Ingresos − Gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={
                "font-mono text-2xl font-bold " +
                (totalIncome - totalExpense >= 0
                  ? "text-success"
                  : "text-destructive")
              }
            >
              {formatCOP(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución mensual</CardTitle>
          <CardDescription>
            Ingresos, gastos y balance neto a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {timeline.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aún no hay datos suficientes. Registra algunos movimientos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="label" fontSize={11} />
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
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Ingresos"
                  stroke="#22c55e"
                  fill="url(#gIn)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Gastos"
                  stroke="#ef4444"
                  fill="url(#gEx)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
            <CardDescription>
              {monthFilter === "all" ? "Histórico" : "Mes seleccionado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_240px]">
            {expenseData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin gastos en este periodo
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={80}
                      >
                        {expenseData.map((e) => (
                          <Cell key={e.id} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: unknown) => formatCOP(Number(v))}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="max-h-56 overflow-auto scrollbar-thin text-sm">
                  {expenseData.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 border-b py-1.5 last:border-b-0"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <CategoryIcon
                          name={e.icon}
                          color={e.color}
                          size={12}
                        />
                        <span className="truncate">{e.name}</span>
                      </span>
                      <span className="font-mono text-xs">
                        {formatCOP(e.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos por categoría</CardTitle>
            <CardDescription>
              {monthFilter === "all" ? "Histórico" : "Mes seleccionado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_240px]">
            {incomeData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin ingresos en este periodo
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={80}
                      >
                        {incomeData.map((e) => (
                          <Cell key={e.id} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: unknown) => formatCOP(Number(v))}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="max-h-56 overflow-auto scrollbar-thin text-sm">
                  {incomeData.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 border-b py-1.5 last:border-b-0"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <CategoryIcon
                          name={e.icon}
                          color={e.color}
                          size={12}
                        />
                        <span className="truncate">{e.name}</span>
                      </span>
                      <span className="font-mono text-xs">
                        {formatCOP(e.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance acumulado</CardTitle>
          <CardDescription>
            Tendencia del balance neto mes a mes
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {timeline.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="label" fontSize={11} />
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
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Balance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
