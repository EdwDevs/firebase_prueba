import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCOP(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "$ 0"
  return copFormatter.format(value)
}

export function parseCOPInput(input: string): number {
  if (!input) return 0
  const cleaned = input.replace(/[^\d-]/g, "")
  const n = Number.parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}

export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatMonth(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  })
}

export function monthKey(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
