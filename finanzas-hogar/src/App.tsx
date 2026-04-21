import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { TransactionsPage } from "@/pages/TransactionsPage"
import { CategoriesPage } from "@/pages/CategoriesPage"
import { CardsPage } from "@/pages/CardsPage"
import { CreditsPage } from "@/pages/CreditsPage"
import { StatisticsPage } from "@/pages/StatisticsPage"
import { ensureSeedCategories } from "@/hooks/useStore"
import { categoriesStore } from "@/lib/store"

function SeedBootstrap() {
  useEffect(() => {
    const unsub = categoriesStore.subscribe((items) => {
      if (items.length === 0) {
        void ensureSeedCategories()
      }
    })
    return unsub
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SeedBootstrap />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/movimientos" element={<TransactionsPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/tarjetas" element={<CardsPage />} />
          <Route path="/creditos" element={<CreditsPage />} />
          <Route path="/estadisticas" element={<StatisticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
