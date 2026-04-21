import { useEffect, useState } from "react"
import {
  cardsStore,
  categoriesStore,
  creditsStore,
  transactionsStore,
} from "@/lib/store"
import { buildDefaultCategories } from "@/data/defaults"
import type {
  Category,
  Credit,
  CreditCard,
  Transaction,
} from "@/types"

function useCollection<T extends { id: string }>(
  store: {
    subscribe: (l: (items: T[]) => void) => () => void
    list: () => T[]
  },
): T[] {
  const [items, setItems] = useState<T[]>(() => store.list())
  useEffect(() => store.subscribe(setItems), [store])
  return items
}

export function useCategories() {
  return useCollection<Category>(categoriesStore)
}
export function useTransactions() {
  return useCollection<Transaction>(transactionsStore)
}
export function useCards() {
  return useCollection<CreditCard>(cardsStore)
}
export function useCredits() {
  return useCollection<Credit>(creditsStore)
}

let seeded = false
export async function ensureSeedCategories() {
  if (seeded) return
  seeded = true
  const existing = categoriesStore.list()
  if (existing.length > 0) return
  const defaults = buildDefaultCategories()
  await categoriesStore.bulkInsert(defaults)
}
