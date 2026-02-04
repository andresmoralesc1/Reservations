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

export interface Table {
  id: string
  tableNumber: string
  capacity: number
  location: "patio" | "interior" | "terraza"
  isAccessible: boolean
  createdAt: string
}

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
          <Button variant="outline" size="md" onClick={() => setShowBulk(true)}>
            + Varias
          </Button>
          <Button variant="primary" size="md" onClick={handleCreateTable}>
            + Agregar Mesa
          </Button>
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

      {/* Location Filter */}
      <LocationTabs value={locationFilter} onChange={setLocationFilter} />

      {/* Tables Grid */}
      <TableGrid
        tables={filteredTables}
        occupiedTableIds={occupiedTableIds}
        onEdit={handleEditTable}
        onDelete={handleDeleteTable}
      />

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
