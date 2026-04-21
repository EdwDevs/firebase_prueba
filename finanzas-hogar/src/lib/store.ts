import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"
import { uid } from "./utils"

type Listener<T> = (items: T[]) => void

interface Entity {
  id: string
}

class Collection<T extends Entity> {
  private name: string
  private memory: Map<string, T> = new Map()
  private listeners = new Set<Listener<T>>()
  private useFirestore: boolean
  private unsubFirestore: (() => void) | null = null
  private ready = false

  constructor(name: string) {
    this.name = name
    this.useFirestore = isFirebaseConfigured && db !== null
    this.bootstrap()
  }

  private bootstrap() {
    if (this.useFirestore && db) {
      this.unsubFirestore = onSnapshot(
        collection(db, this.name),
        (snap) => {
          this.memory.clear()
          snap.forEach((d) => {
            this.memory.set(d.id, { ...(d.data() as T), id: d.id })
          })
          this.ready = true
          this.emit()
        },
        (err) => {
          console.error(`Firestore subscribe error on ${this.name}:`, err)
          this.useFirestore = false
          this.loadFromLocalStorage()
        },
      )
    } else {
      this.loadFromLocalStorage()
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(`finanzas:${this.name}`)
      if (raw) {
        const parsed = JSON.parse(raw) as T[]
        parsed.forEach((it) => this.memory.set(it.id, it))
      }
    } catch (e) {
      console.warn("localStorage load failed", e)
    }
    this.ready = true
    this.emit()
  }

  private persistLocal() {
    if (this.useFirestore) return
    try {
      localStorage.setItem(
        `finanzas:${this.name}`,
        JSON.stringify([...this.memory.values()]),
      )
    } catch (e) {
      console.warn("localStorage save failed", e)
    }
  }

  private emit() {
    const items = [...this.memory.values()]
    this.listeners.forEach((l) => l(items))
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    if (this.ready) listener([...this.memory.values()])
    return () => {
      this.listeners.delete(listener)
    }
  }

  list(): T[] {
    return [...this.memory.values()]
  }

  get(id: string): T | undefined {
    return this.memory.get(id)
  }

  async upsert(item: Omit<T, "id"> & { id?: string }): Promise<T> {
    const finalId = item.id ?? uid(this.name.slice(0, 3))
    const full = { ...(item as T), id: finalId }
    this.memory.set(finalId, full)
    this.emit()
    if (this.useFirestore && db) {
      try {
        const { id: _ignored, ...rest } = full as T & { id: string }
        void _ignored
        await setDoc(doc(db, this.name, finalId), rest, { merge: true })
      } catch (e) {
        console.error(`Firestore upsert error on ${this.name}:`, e)
      }
    } else {
      this.persistLocal()
    }
    return full
  }

  async remove(id: string): Promise<void> {
    this.memory.delete(id)
    this.emit()
    if (this.useFirestore && db) {
      try {
        await deleteDoc(doc(db, this.name, id))
      } catch (e) {
        console.error(`Firestore delete error on ${this.name}:`, e)
      }
    } else {
      this.persistLocal()
    }
  }

  async bulkInsert(items: T[]): Promise<void> {
    items.forEach((it) => this.memory.set(it.id, it))
    this.emit()
    if (this.useFirestore && db) {
      try {
        const batch = writeBatch(db)
        for (const it of items) {
          const { id, ...rest } = it
          batch.set(doc(db, this.name, id), rest, { merge: true })
        }
        await batch.commit()
      } catch (e) {
        console.error(`Firestore bulk insert error on ${this.name}:`, e)
      }
    } else {
      this.persistLocal()
    }
  }

  destroy() {
    this.unsubFirestore?.()
    this.listeners.clear()
  }
}

import type { Category, CreditCard, Credit, Transaction } from "@/types"

export const categoriesStore = new Collection<Category>("categories")
export const transactionsStore = new Collection<Transaction>("transactions")
export const cardsStore = new Collection<CreditCard>("cards")
export const creditsStore = new Collection<Credit>("credits")

export const storageMode: "firestore" | "local" = isFirebaseConfigured
  ? "firestore"
  : "local"
