/**
 * Barra de acciones masivas del dashboard
 * Botones para crear reservas, bloquear mesas y exportar CSV
 */

import { BulkActionsBar } from "@/components/admin/BulkActionsBar"

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
        <button
          onClick={onCreateReservation}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#E5B95C] transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Reserva
        </button>
        <button
          onClick={onBlockTables}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Bloquear Mesas
        </button>
      </div>
    </div>
  )
}
