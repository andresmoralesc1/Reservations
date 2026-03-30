/**
 * AdminChartsAsync - Componente async para Gráficos del Dashboard
 * Carga después del primer paint para priorizar KPIs
 */

import { Suspense } from "react"
import { AdminCharts } from "./AdminCharts"
import { AdminChartsSkeleton } from "./skeletons/AdminChartsSkeleton"

interface AdminChartsAsyncProps {
  restaurantId: string
  dateFilter: string
}

async function AdminChartsData({ restaurantId, dateFilter }: AdminChartsAsyncProps) {
  // Fetch datos del servidor (chartData)
  const response = await fetch(
    `/api/admin/dashboard/chart-data?restaurantId=${restaurantId}&date=${dateFilter}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error("Error al cargar gráficos")
  }

  const chartData = await response.json()

  return <AdminCharts chartData={chartData} />
}

export function AdminChartsAsync(props: AdminChartsAsyncProps) {
  return (
    <Suspense fallback={<AdminChartsSkeleton />}>
      <AdminChartsData {...props} />
    </Suspense>
  )
}
