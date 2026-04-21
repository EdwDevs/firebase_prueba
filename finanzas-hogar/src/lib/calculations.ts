import type {
  Credit,
  CreditCard,
  InstallmentView,
  Transaction,
} from "@/types"
import { monthKey } from "./utils"

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function nextPaymentDate(purchaseDate: Date, card: CreditCard): Date {
  const cutoff = Math.min(Math.max(card.cutoffDay, 1), 28)
  const payDay = Math.min(Math.max(card.paymentDay, 1), 28)
  const year = purchaseDate.getFullYear()
  const month = purchaseDate.getMonth()
  const cutoffThisMonth = new Date(year, month, cutoff, 23, 59, 59)
  let payMonthOffset = 1
  if (purchaseDate.getTime() > cutoffThisMonth.getTime()) {
    payMonthOffset = 2
  }
  return new Date(year, month + payMonthOffset, payDay)
}

export function generateCardInstallments(
  t: Transaction,
  card: CreditCard,
): InstallmentView[] {
  const total = Math.max(1, t.installments ?? 1)
  const amount = t.amount / total
  const purchase = new Date(t.date)
  const firstPay = nextPaymentDate(purchase, card)
  const list: InstallmentView[] = []
  for (let i = 0; i < total; i++) {
    const due = addMonths(firstPay, i)
    list.push({
      transactionId: t.id,
      cardId: card.id,
      description: t.description,
      categoryId: t.categoryId,
      totalInstallments: total,
      installmentNumber: i + 1,
      amount,
      dueDate: due.getTime(),
      paid: (t.installmentsPaid ?? 0) > i,
    })
  }
  return list
}

export function generateCreditInstallments(
  credit: Credit,
): InstallmentView[] {
  const total = Math.max(1, credit.installmentsTotal)
  const amount =
    credit.monthlyPayment && credit.monthlyPayment > 0
      ? credit.monthlyPayment
      : credit.totalAmount / total
  const start = new Date(credit.startDate)
  const payDay = Math.min(Math.max(credit.paymentDay, 1), 28)
  const list: InstallmentView[] = []
  for (let i = 0; i < total; i++) {
    const due = new Date(start.getFullYear(), start.getMonth() + i, payDay)
    list.push({
      transactionId: credit.id,
      creditId: credit.id,
      description: credit.name,
      categoryId: "credit",
      totalInstallments: total,
      installmentNumber: i + 1,
      amount,
      dueDate: due.getTime(),
      paid: credit.installmentsPaid > i,
    })
  }
  return list
}

export interface MonthlyStats {
  key: string
  income: number
  expense: number
  net: number
}

export function monthlyStats(
  transactions: Transaction[],
  cards: CreditCard[],
  credits: Credit[],
  options: { includeFutureInstallments?: boolean } = {},
): MonthlyStats[] {
  const map = new Map<string, MonthlyStats>()
  const bump = (key: string, kind: "income" | "expense", amt: number) => {
    if (!map.has(key)) {
      map.set(key, { key, income: 0, expense: 0, net: 0 })
    }
    const row = map.get(key)!
    if (kind === "income") row.income += amt
    else row.expense += amt
    row.net = row.income - row.expense
  }

  const cardById = new Map(cards.map((c) => [c.id, c]))

  for (const t of transactions) {
    if (t.paymentMethod === "credit_card" && t.cardId && (t.installments ?? 1) > 1) {
      const card = cardById.get(t.cardId)
      if (card && options.includeFutureInstallments) {
        for (const inst of generateCardInstallments(t, card)) {
          bump(monthKey(inst.dueDate), "expense", inst.amount)
        }
        continue
      }
    }
    bump(monthKey(t.date), t.kind, t.amount)
  }

  if (options.includeFutureInstallments) {
    for (const credit of credits) {
      for (const inst of generateCreditInstallments(credit)) {
        bump(monthKey(inst.dueDate), "expense", inst.amount)
      }
    }
  }

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function totalsByCategory(
  transactions: Transaction[],
  kind: "income" | "expense",
  monthFilterKey?: string,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.kind !== kind) continue
    if (monthFilterKey && monthKey(t.date) !== monthFilterKey) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return map
}

export function upcomingInstallments(
  transactions: Transaction[],
  cards: CreditCard[],
  credits: Credit[],
  daysAhead = 45,
): InstallmentView[] {
  const now = Date.now()
  const limit = now + daysAhead * 24 * 60 * 60 * 1000
  const list: InstallmentView[] = []
  const cardById = new Map(cards.map((c) => [c.id, c]))
  for (const t of transactions) {
    if (t.paymentMethod !== "credit_card" || !t.cardId) continue
    const card = cardById.get(t.cardId)
    if (!card) continue
    for (const inst of generateCardInstallments(t, card)) {
      if (inst.paid) continue
      if (inst.dueDate >= now && inst.dueDate <= limit) list.push(inst)
    }
  }
  for (const credit of credits) {
    for (const inst of generateCreditInstallments(credit)) {
      if (inst.paid) continue
      if (inst.dueDate >= now && inst.dueDate <= limit) list.push(inst)
    }
  }
  return list.sort((a, b) => a.dueDate - b.dueDate)
}

export function cardBalance(
  cardId: string,
  transactions: Transaction[],
  card: CreditCard,
): { usedThisCycle: number; totalPending: number } {
  let usedThisCycle = 0
  let totalPending = 0
  const today = new Date()
  const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1)
  for (const t of transactions) {
    if (t.paymentMethod !== "credit_card" || t.cardId !== cardId) continue
    const installments = generateCardInstallments(t, card)
    for (const inst of installments) {
      if (inst.paid) continue
      totalPending += inst.amount
      if (
        inst.dueDate >= cycleStart.getTime() &&
        inst.dueDate < new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1).getTime()
      ) {
        usedThisCycle += inst.amount
      }
    }
  }
  return { usedThisCycle, totalPending }
}
