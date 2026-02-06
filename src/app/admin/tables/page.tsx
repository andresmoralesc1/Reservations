"use client"

import { useEffect, useState, useCallback } from "react"
import { Container } from "@/components/Container"
import { Button } from "@/components/Button"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { toast } from "@/components/Toast"
import { TableGrid } from "@/components/admin/tables/TableGrid"
import { TableStatsCards } from "@/components/admin/tables/TableStatsCards"
import { LocationTabs } from "@/components/admin/tables/LocationTabs"
import { TableWizardModal } from "@/components/admin/tables/TableWizardModal"
import { BulkTableModal } from "@/components/admin/tables/BulkTableModal"
import { TableLayoutEditor } from "@/components/admin/tables/TableLayoutEditor"
import { Table as TableType } from "@/drizzle/schema"

export interface Table {
  id: string
  restaurantId: string
  tableNumber: string
  capacity: number
  location: "patio" | "interior" | "terraza" | null
  isAccessible: boolean
  shape: string | null
  positionX: number
  positionY: number
  rotation: number
  width: number | null
  height: number | null
  diameter: number | null
  stoolCount: number | null
  stoolPositions: number[] | null
  createdAt: string
}

type ViewMode = "list" | "layout"
type Location = "all" | "patio" | "interior" | "terraza"

// TODO: Get from environment or auth
const RESTAURANT_ID = "default-restaurant-id"

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [stats, setStats] = useState({
    total: 0,
    byLocation: { patio: 0, interior: 0, terraza: 0 },
    totalCapacity: 0,
    accessibleCount: 0,
    utilizationRate: 0,
  })
  const [occupiedTableIds, setOccupiedTableIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState<Location>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [showWizard, setShowWizard] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editTable, setEditTable] = useState<Table | undefined>()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load tables
      const tablesResponse = await fetch(`/api/admin/tables?restaurantId=${RESTAURANT_ID}`)
      const tablesData = await tablesResponse.json()
      setTables(tablesData.tables || [])

      // Load stats
      const statsResponse = await fetch(`/api/admin/tables/stats?restaurantId=${RESTAURANT_ID}`)
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Get occupied tables from today's reservations
      const today = new Date().toISOString().split("T")[0]
      const reservationsResponse = await fetch(
        `/api/admin/reservations?date=${today}&restaurantId=${RESTAURANT_ID}`
      )
      const reservationsData = await reservationsResponse.json()

      const occupied = new Set<string>()
      for (const res of reservationsData.reservations || []) {
        if (res.tableIds) {
          for (const tableId of res.tableIds) {
            occupied.add(tableId)
          }
        }
      }
      setOccupiedTableIds(occupied)
    } catch (error) {
      console.error("Error loading tables:", error)
      toast("Error al cargar las mesas", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleEditTable(table: Table) {
    setEditTable(table)
    setShowWizard(true)
  }

  function handleCreateTable() {
    setEditTable(undefined)
    setShowWizard(true)
  }

  function handleWizardClose() {
    setShowWizard(false)
    setEditTable(undefined)
  }

  function handleDeleteTable(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId))
  }

  async function handleUpdateTable(id: string, updates: Partial<TableType>) {
    try {
      const response = await fetch(`/api/admin/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Error updating table")
      }

      const data = await response.json()
      setTables((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data.table } : t))
      )
    } catch (error) {
      console.error("Error updating table:", error)
      toast("Error al actualizar la mesa", "error")
      throw error
    }
  }

  async function handleDeleteTableFromEditor(id: string) {
    try {
      const response = await fetch(`/api/admin/tables/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error deleting table")
      }

      setTables((prev) => prev.filter((t) => t.id !== id))
      toast("Mesa eliminada correctamente", "success")
    } catch (error: any) {
      console.error("Error deleting table:", error)
      toast(error.message || "Error al eliminar la mesa", "error")
      throw error
    }
  }

  const filteredTables = tables.filter((t) =>
    locationFilter === "all" || t.location === locationFilter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando mesas..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-black">
            Configuración de Mesas
          </h1>
          <p className="font-sans text-neutral-500 mt-1">
            Gestiona la configuración de mesas del restaurante
          </p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode === "list" && (
            <>
              <Button variant="outline" size="md" onClick={() => setShowBulk(true)}>
                + Varias
              </Button>
              <Button variant="primary" size="md" onClick={handleCreateTable}>
                + Agregar Mesa
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <TableStatsCards
        total={stats.total}
        byLocation={stats.byLocation}
        totalCapacity={stats.totalCapacity}
        accessibleCount={stats.accessibleCount}
        utilizationRate={stats.utilizationRate}
      />

      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode("list")}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            viewMode === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Vista Lista
        </button>
        <button
          onClick={() => setViewMode("layout")}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            viewMode === "layout"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Editor Visual
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === "list" ? (
        <>
          {/* Location Filter */}
          <LocationTabs value={locationFilter} onChange={setLocationFilter} />

          {/* Tables Grid */}
          <TableGrid
            tables={filteredTables}
            occupiedTableIds={occupiedTableIds}
            onEdit={handleEditTable}
            onDelete={handleDeleteTable}
          />
        </>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: "70vh" }}>
          <TableLayoutEditor
            tables={tables as any}
            onTablesChange={setTables as any}
            onCreateTable={handleCreateTable}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTableFromEditor}
            restaurantId={RESTAURANT_ID}
          />
        </div>
      )}

      {/* Wizard Modal */}
      <TableWizardModal
        isOpen={showWizard}
        onClose={handleWizardClose}
        onSave={() => {
          loadData()
          handleWizardClose()
        }}
        restaurantId={RESTAURANT_ID}
        editTable={editTable}
      />

      {/* Bulk Modal */}
      <BulkTableModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onSave={() => {
          loadData()
          setShowBulk(false)
        }}
        restaurantId={RESTAURANT_ID}
      />
    </div>
  )
}
