/**
 * Indicador visual para reservas con notas/observaciones
 *
 * Muestra un ícono de advertencia cuando la reserva tiene specialRequests
 */

import { FileText } from "lucide-react"

interface NotesIndicatorProps {
  notes?: string | null
  showText?: boolean
}

/**
 * Versión completa para mostrar en detalles o modales
 */
export function NotesIndicator({ notes, showText = false }: NotesIndicatorProps) {
  const hasNotes = notes && notes.trim().length > 0

  if (!hasNotes) {
    return null
  }

  const notesPreview = notes.length > 50 ? notes.substring(0, 50) + "..." : notes

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200 transition-colors cursor-help"
      title={`📝 Notas:\n${notes}`}
    >
      <FileText className="h-3.5 w-3.5" />
      {showText && <span className="text-xs font-medium">Notas</span>}
    </div>
  )
}

/**
 * Versión compacta para usar en celdas de tabla
 * Muestra un badge con un signo de exclamación
 */
export function NotesBadge({ notes }: { notes?: string | null }) {
  const hasNotes = notes && notes.trim().length > 0

  if (!hasNotes) {
    return null
  }

  return (
    <div
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 border border-amber-400 text-amber-700 cursor-help hover:bg-amber-200 transition-colors"
      title={`📝 ${notes}`}
    >
      <span className="text-xs font-bold">!</span>
    </div>
  )
}

/**
 * Versión con icono para celdas de tabla
 * Muestra un ícono de documento más visible
 */
export function NotesIcon({ notes }: { notes?: string | null }) {
  const hasNotes = notes && notes.trim().length > 0

  if (!hasNotes) {
    return <span className="text-neutral-300">-</span>
  }

  return (
    <div
      className="inline-flex items-center justify-center p-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors cursor-help"
      title={`📝 ${notes}`}
    >
      <FileText className="h-4 w-4" strokeWidth={2.5} />
    </div>
  )
}
