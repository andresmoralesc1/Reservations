/**
 * AdminStatsAsync - Componente async para KPIs del Dashboard
 * Carga primero para mostrar métricas clave rápidamente
 */

import { Suspense } from "react"
import { AdminStats } from "./AdminStats"
import { AdminStatsSkeleton } from "./skeletons/AdminStatsSkeleton"

interface AdminStatsAsyncProps {
  restaurantId: string
  dateFilter: string
}

async function AdminStatsData({ restaurantId, dateFilter }: AdminStatsAsyncProps) {
  // Fetch datos del servidor
  const response = await fetch(
    `/api/admin/dashboard/stats?restaurantId=${restaurantId}&date=${dateFilter}`,
    {
      cache: "no-store", // No cachear para datos en tiempo real
    }
  )

  if (!response.ok) {
    throw new Error("Error al cargar estadísticas")
  }

  const stats = await response.json()

  return <AdminStats stats={stats} />
}

export function AdminStatsAsync(props: AdminStatsAsyncProps) {
  return (
    <Suspense fallback={<AdminStatsSkeleton />}>
      <AdminStatsData {...props} />
    </Suspense>
  )
}
