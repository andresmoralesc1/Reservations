/**
 * Barra de acciones masivas del dashboard
 * Botones para crear reservas, bloquear mesas y exportar CSV
 */

import { BulkActionsBar } from "@/components/admin/BulkActionsBar"
import { Button } from "@/components/Button"

interface ActionBarProps {
  selectedIds: string[]
  selectedCount: number
  onClearSelection: () => void
  onApproveAll: () => void
  onRejectAll: () => void
  onExportCSV: () => void
  onCreateReservation: () => void
  onBlockTables: () => void
}

export function ActionBar({
  selectedIds,
  selectedCount,
  onClearSelection,
  onApproveAll,
  onRejectAll,
  onExportCSV,
  onCreateReservation,
  onBlockTables,
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <BulkActionsBar
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onApproveAll={onApproveAll}
        onRejectAll={onRejectAll}
        onClearSelection={onClearSelection}
        onExportCSV={onExportCSV}
      />
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          size="md"
          onClick={onCreateReservation}
          className="flex-1 sm:flex-none"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Reserva
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={onBlockTables}
          className="flex-1 sm:flex-none text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Bloquear Mesas
        </Button>
      </div>
    </div>
  )
}
