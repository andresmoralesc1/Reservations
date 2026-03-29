/**
 * Componente de gráficos del dashboard
 * Muestra gráfico de barras por hora y gráfico de donut de estados
 */

import { HourlyBarChart } from "@/components/admin/HourlyBarChart"
import { StatusDonutChart } from "@/components/admin/StatusDonutChart"
import type { ChartData } from "../types"

interface AdminChartsProps {
  chartData: ChartData | null
}

export function AdminCharts({ chartData }: AdminChartsProps) {
  if (!chartData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          "Distribución por hora",
          "Distribución por estado",
        ].map((title, index) => (
          <div
            key={index}
            className="bg-white border border-neutral-200 rounded-lg p-6 flex items-center justify-center"
          >
            <div className="text-center text-neutral-400">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Cargando {title}...</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <HourlyBarChart
          data={chartData.hourly.data}
          maxCount={chartData.hourly.maxCount}
        />
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <StatusDonutChart
          data={chartData.statusDistribution.data}
          percentages={chartData.statusDistribution.percentages}
        />
      </div>
    </div>
  )
}
