"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"

interface Reservation {
  id: string
  reservationCode: string
  customerName: string
  customerPhone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  status: string
  source: string
  restaurant?: {
    id: string
    name: string
  }
  customer?: {
    id: string
    phoneNumber: string
    noShowCount: number
  }
}

interface Stats {
  totalPending: number
  todayPending: number
  expiredSessions: number
  nextHour: number
}

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    todayPending: 0,
    expiredSessions: 0,
    nextHour: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("pending")
  const supabase = createClient()

  useEffect(() => {
    loadReservations()
  }, [filter])

  async function loadReservations() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.set("status", filter.toUpperCase())
      }

      const response = await fetch(`/api/admin/reservations?${params}`)
      const data = await response.json()

      setReservations(data.reservations || [])
      setStats(data.meta || stats)
    } catch (error) {
      console.error("Error loading reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })

      if (response.ok) {
        await loadReservations()
      }
    } catch (error) {
      console.error("Error approving reservation:", error)
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Razón del rechazo (opcional):")
    if (reason === null) return

    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      })

      if (response.ok) {
        await loadReservations()
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "CONFIRMADO":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "CANCELADO":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white shadow-sm dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Panel de Administración
            </h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {stats.totalPending}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Pendientes Totales
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.todayPending}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Pendientes Hoy
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <div className="text-2xl font-bold text-orange-600">
              {stats.expiredSessions}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Sesiones Expiradas
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <div className="text-2xl font-bold text-red-600">
              {stats.nextHour}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Próxima Hora
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === "confirmed"
                ? "bg-green-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === "cancelled"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Canceladas
          </button>
        </div>

        {/* Reservations Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-slate-800">
            <p className="text-slate-600 dark:text-slate-400">No hay reservas para mostrar</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Personas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-50">
                      {reservation.reservationCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {reservation.customerName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {reservation.customerPhone}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-50">
                      {new Date(reservation.reservationDate).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      {reservation.reservationTime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-50">
                      {reservation.partySize}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        {reservation.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {reservation.source}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      {reservation.status === "PENDIENTE" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
