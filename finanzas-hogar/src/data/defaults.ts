import type { Category } from "@/types"

const now = () => Date.now()

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  // Ingresos
  { name: "Salario", kind: "income", icon: "Briefcase", color: "#16a34a", isDefault: true },
  { name: "Bonificación", kind: "income", icon: "Gift", color: "#22c55e", isDefault: true },
  { name: "Freelance", kind: "income", icon: "Laptop", color: "#0ea5e9", isDefault: true },
  { name: "Intereses / Rendimientos", kind: "income", icon: "TrendingUp", color: "#06b6d4", isDefault: true },
  { name: "Venta / Otros ingresos", kind: "income", icon: "HandCoins", color: "#10b981", isDefault: true },

  // Gastos hogar Colombia
  { name: "Arriendo / Hipoteca", kind: "expense", icon: "Home", color: "#ef4444", isDefault: true },
  { name: "Administración", kind: "expense", icon: "Building2", color: "#f97316", isDefault: true },
  { name: "Servicios - Energía", kind: "expense", icon: "Zap", color: "#eab308", isDefault: true },
  { name: "Servicios - Agua", kind: "expense", icon: "Droplet", color: "#0ea5e9", isDefault: true },
  { name: "Servicios - Gas", kind: "expense", icon: "Flame", color: "#f59e0b", isDefault: true },
  { name: "Internet", kind: "expense", icon: "Wifi", color: "#3b82f6", isDefault: true },
  { name: "Celular / Plan de datos", kind: "expense", icon: "Smartphone", color: "#6366f1", isDefault: true },
  { name: "Mercado", kind: "expense", icon: "ShoppingCart", color: "#84cc16", isDefault: true },
  { name: "Restaurantes / Domicilios", kind: "expense", icon: "Utensils", color: "#f43f5e", isDefault: true },
  { name: "Transporte - Gasolina", kind: "expense", icon: "Fuel", color: "#dc2626", isDefault: true },
  { name: "Transporte público / Taxi / Uber", kind: "expense", icon: "Bus", color: "#ea580c", isDefault: true },
  { name: "Salud / EPS / Medicina prepagada", kind: "expense", icon: "HeartPulse", color: "#e11d48", isDefault: true },
  { name: "Medicamentos / Farmacia", kind: "expense", icon: "Pill", color: "#db2777", isDefault: true },
  { name: "Educación", kind: "expense", icon: "GraduationCap", color: "#7c3aed", isDefault: true },
  { name: "Suscripciones (Netflix, Spotify...)", kind: "expense", icon: "Tv", color: "#8b5cf6", isDefault: true },
  { name: "Ropa y calzado", kind: "expense", icon: "Shirt", color: "#ec4899", isDefault: true },
  { name: "Hogar y aseo", kind: "expense", icon: "Sparkles", color: "#14b8a6", isDefault: true },
  { name: "Mascotas", kind: "expense", icon: "PawPrint", color: "#a855f7", isDefault: true },
  { name: "Entretenimiento", kind: "expense", icon: "Gamepad2", color: "#d946ef", isDefault: true },
  { name: "Regalos / Detalles", kind: "expense", icon: "Gift", color: "#f472b6", isDefault: true },
  { name: "Ahorro / Inversión", kind: "expense", icon: "PiggyBank", color: "#059669", isDefault: true },
  { name: "Impuestos", kind: "expense", icon: "Landmark", color: "#64748b", isDefault: true },
  { name: "Seguros", kind: "expense", icon: "Shield", color: "#475569", isDefault: true },
  { name: "Cuotas tarjeta de crédito", kind: "expense", icon: "CreditCard", color: "#be123c", isDefault: true },
  { name: "Cuotas créditos / préstamos", kind: "expense", icon: "Banknote", color: "#9f1239", isDefault: true },
  { name: "Otros gastos", kind: "expense", icon: "Ellipsis", color: "#6b7280", isDefault: true },
]

export function buildDefaultCategories(): Category[] {
  const t = now()
  return DEFAULT_CATEGORIES.map((c, i) => ({
    ...c,
    id: `default_${i}_${c.kind}`,
    createdAt: t + i,
  }))
}
