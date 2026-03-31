/**
 * Hook para cargar y gestionar estadísticas del dashboard
 */

import { useState, useCallback, useEffect } from "react"
import type { EnhancedStats, ChartData } from "@/types/admin"

const initialStats: EnhancedStats = {
  totalToday: 0,
  confirmedCount: 0,
  pendingCount: 0,
  cancelledCount: 0,
  noShowCount: 0,
  confirmationRate: 0,
  avgPartySize: 0,
  occupancyRate: 0,
  totalCovers: 0,
  totalPending: 0,
  expiredSessions: 0,
  nextHourCount: 0,
  totalTables: 0,
  totalCapacity: 0,
}

export function useAdminStats(restaurantId: string, dateFilter: string) {
  const [stats, setStats] = useState<EnhancedStats>(initialStats)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const dateParam = dateFilter || new Date().toISOString().split("T")[0]

      // Load stats
      const statsResponse = await fetch(
        `/api/admin/dashboard/stats?restaurantId=${restaurantId}&date=${dateParam}`
      )

      if (!statsResponse.ok) {
        throw new Error("Error loading stats")
      }

      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load chart data
      const chartResponse = await fetch(
        `/api/admin/dashboard/chart-data?restaurantId=${restaurantId}&date=${dateParam}`
      )

      if (!chartResponse.ok) {
        throw new Error("Error loading chart data")
      }

      const chartDataResult = await chartResponse.json()
      setChartData(chartDataResult)
    } catch (err) {
      console.error("Error loading stats:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [restaurantId, dateFilter])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    chartData,
    loading,
    error,
    reload: loadStats,
  }
}
