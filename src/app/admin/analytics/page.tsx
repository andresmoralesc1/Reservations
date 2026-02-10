"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/Button"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { toast } from "@/components/Toast"
import { KPICard } from "@/components/KPICard"
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts"
import { usePolling } from "@/hooks/usePolling"
import { startOfDay, endOfDay, subDays, format } from "date-fns"
import { es } from "date-fns/locale"

interface AnalyticsData {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  summary: {
    totalReservations: number
    confirmedCount: number
    pendingCount: number
    cancelledCount: number
    noShowCount: number
    totalCovers: number
    avgPartySize: number
    confirmationRate: number
    noShowRate: number
    avgOccupancy: number
    totalTables: number
    totalCapacity: number
  }
  dailyBreakdown: Array<{
    date: string
    total: number
    confirmed: number
    pending: number
    cancelled: number
    noShow: number
    covers: number
  }>
  hourlyBreakdown: Array<{
    hour: number
    count: number
    covers: number
  }>
  sourceBreakdown: Record<string, number>
}

const PERIOD_OPTIONS = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
  { label: "Este mes", value: "month" },
  { label: "Personalizado", value: "custom" },
]

export default function AnalyticsPage() {
  const { user, hasPermission } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<number | "month" | "custom">(7)
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.REFRESH,
      handler: () => loadAnalytics(),
    },
    {
      ...SHORTCUTS.EXPORT,
      handler: () => handleExport(),
    },
  ], true)

  const loadAnalytics = useCallback(async () => {
    // Validar que el usuario tenga restaurantId
    if (!user?.restaurantId) {
      toast("No se pudo identificar el restaurante", "error")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("restaurantId", user.restaurantId)

      if (period === "custom" && customRange) {
        params.set("startDate", customRange.start)
        params.set("endDate", customRange.end)
      } else if (period === "month") {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        params.set("startDate", start.toISOString().split("T")[0])
        params.set("endDate", now.toISOString().split("T")[0])
      } else {
        params.set("period", period.toString())
      }

      const response = await fetch(`/api/admin/analytics?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar analíticas")
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast(error instanceof Error ? error.message : "Error al cargar analíticas", "error")
    } finally {
      setLoading(false)
    }
  }, [period, customRange, user])

  // Cargar analíticas cuando cambian los filtros o el usuario
  useEffect(() => {
    if (user?.restaurantId) {
      loadAnalytics()
    }
  }, [period, customRange, user?.restaurantId])

  // Poll para actualizaciones automáticas (solo si hay datos cargados)
  usePolling(
    loadAnalytics,
    () => {},
    { interval: 30000, enabled: !!data }
  )

  function handleExport() {
    if (!data) return

    const rows = [
      [
        "Fecha",
        "Total Reservas",
        "Confirmadas",
        "Pendientes",
        "Canceladas",
        "No Show",
        "Cubiertos",
      ],
      ...data.dailyBreakdown.map((d) => [
        d.date,
        d.total,
        d.confirmed,
        d.pending,
        d.cancelled,
        d.noShow,
        d.covers,
      ]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analiticas-${data.period.startDate}-${data.period.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast("CSV exportado correctamente", "success")
  }

  function handleExportJSON() {
    if (!data) return

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analiticas-${data.period.startDate}-${data.period.endDate}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast("JSON exportado correctamente", "success")
  }

  if (!hasPermission("view_analytics")) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="font-display text-2xl uppercase tracking-wider text-black">
            Acceso Denegado
          </h2>
          <p className="font-sans text-neutral-500 mt-2">
            No tienes permisos para ver las analíticas
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando analíticas..." />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="font-display text-2xl uppercase tracking-wider text-black">
            Sin Datos
          </h2>
          <Button variant="primary" size="md" onClick={loadAnalytics} className="mt-4">
            Recargar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-black">
            Analíticas
          </h1>
          <p className="font-sans text-neutral-500 mt-1">
            {data.period.startDate} - {data.period.endDate}
            <span className="ml-2">({data.period.days} días)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            Exportar JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={loadAnalytics}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Reservas"
          value={data.summary.totalReservations}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KPICard
          title="Tasa Confirmación"
          value={`${data.summary.confirmationRate}%`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Tasa No Show"
          value={`${data.summary.noShowRate}%`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Ocupación Promedio"
          value={`${data.summary.avgOccupancy}%`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Cubiertos"
          value={`${data.summary.totalCovers} pax`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <KPICard
          title="Promedio Grupo"
          value={`${data.summary.avgPartySize} pax`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <KPICard
          title="Canceladas"
          value={data.summary.cancelledCount}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
        <KPICard
          title="Capacidad Total"
          value={`${data.summary.totalCapacity} pax`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Daily Breakdown Chart */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-display text-lg uppercase tracking-wider text-black mb-4">
          Reservas por Día
        </h3>
        <div className="space-y-2">
          {data.dailyBreakdown.slice(0, 14).map((day) => {
            const maxCount = Math.max(...data.dailyBreakdown.map((d) => d.total))
            const height = (day.total / maxCount) * 100

            return (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-neutral-500">
                  {format(new Date(day.date), "dd MMM", { locale: es })}
                </div>
                <div className="flex-1 h-8 bg-neutral-100 rounded-sm relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-black transition-all duration-300"
                    style={{ width: `${height}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {day.total} reservas
                  </div>
                </div>
                <div className="w-20 text-right text-sm text-neutral-600">
                  {day.covers} pax
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-display text-lg uppercase tracking-wider text-black mb-4">
          Reservas por Origen
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.sourceBreakdown).map(([source, count]) => {
            const percentage = data.summary.totalReservations > 0
              ? Math.round((count / data.summary.totalReservations) * 100)
              : 0

            return (
              <div key={source} className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-3xl font-display font-bold text-black">
                  {count}
                </div>
                <div className="text-sm text-neutral-500 uppercase tracking-wide mt-1">
                  {source}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {percentage}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-display text-lg uppercase tracking-wider text-black mb-4">
          Distribución por Hora
        </h3>
        <div className="flex items-end gap-1 h-40">
          {data.hourlyBreakdown
            .filter((h) => h.hour >= 12 && h.hour <= 23)
            .map((hour) => {
              const maxCount = Math.max(
                ...data.hourlyBreakdown.filter((h) => h.hour >= 12 && h.hour <= 23).map((h) => h.count),
                1
              )
              const height = (hour.count / maxCount) * 100

              return (
                <div key={hour.hour} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-32 bg-neutral-100 rounded-sm relative">
                    {hour.count > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-black transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1">
                    {hour.hour}h
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
