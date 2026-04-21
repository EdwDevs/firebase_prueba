import { NavLink, Outlet } from "react-router-dom"
import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Tag,
  Wallet,
  Menu,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { storageMode } from "@/lib/store"

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/movimientos", label: "Movimientos", icon: ListChecks },
  { to: "/categorias", label: "Categorías", icon: Tag },
  { to: "/tarjetas", label: "Tarjetas de crédito", icon: CreditCard },
  { to: "/creditos", label: "Créditos", icon: PiggyBank },
  { to: "/estadisticas", label: "Estadísticas", icon: Wallet },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-full min-h-screen bg-muted/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Finanzas Hogar</p>
            <p className="text-[11px] text-muted-foreground">
              CRM personal COP
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-5 py-4 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
              storageMode === "firestore"
                ? "bg-success/10 text-success"
                : "bg-amber-500/10 text-amber-600",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                storageMode === "firestore" ? "bg-success" : "bg-amber-500",
              )}
            />
            {storageMode === "firestore"
              ? "Firestore conectado"
              : "Modo local (sin Firebase)"}
          </span>
        </div>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        />
      )}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-base font-semibold">
            Mi CRM de finanzas del hogar
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
