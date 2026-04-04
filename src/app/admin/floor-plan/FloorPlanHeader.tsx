/**
 * Encabezado de la página de Floor Plan
 * Incluye selector de fecha con navegación rápida
 */

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, addDays, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"

interface FloorPlanHeaderProps {
  dateFilter: string
  onDateChange: (date: string) => void
}

export function FloorPlanHeader({ dateFilter, onDateChange }: FloorPlanHeaderProps) {
  const currentDate = dateFilter ? new Date(dateFilter + 'T00:00:00') : new Date()

  const navigateDay = (days: number) => {
    const newDate = addDays(currentDate, days)
    onDateChange(format(newDate, 'yyyy-MM-dd'))
  }

  const getQuickDate = (days: number) => {
    const date = addDays(new Date(), days)
    return {
      label: isToday(date)
        ? "Hoy"
        : isTomorrow(date)
        ? "Mañana"
        : format(date, 'EEE d', { locale: es }),
      date: format(date, 'yyyy-MM-dd'),
      isToday: isToday(date)
    }
  }

  const quickDates = [
    getQuickDate(0),  // Hoy
    getQuickDate(1),  // Mañana
    getQuickDate(2),  // Pasado mañana
  ]

  return (
    <>
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.1em] text-white">
            Floor Plan
          </h1>
          <p className="font-sans text-[#A0A0A0] mt-1 text-sm">
            Vista visual de mesas y reservas en tiempo real
          </p>
        </div>
      </div>

      {/* Date navigation row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#333333]">
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] text-[#A0A0A0] hover:text-white transition-all"
            title="Día anterior (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] text-[#A0A0A0] hover:text-white transition-all"
            title="Día siguiente (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current date display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg min-w-[200px] border border-[#333333]">
          <Calendar className="w-4 h-4 text-[#D4A84B]" />
          <span className="font-medium text-white">
            {isToday(currentDate)
              ? "Hoy"
              : format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </span>
          <span className="text-[#666666] text-sm">
            ({format(currentDate, "dd/MM/yy")})
          </span>
        </div>

        {/* Quick date buttons */}
        <div className="flex items-center gap-2">
          {quickDates.map(({ label, date, isToday: isTodayDate }) => (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all border
                ${isTodayDate
                  ? "bg-[#D4A84B] text-black border-[#D4A84B]"
                  : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-[#D4A84B] hover:text-white"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date input */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-[#A0A0A0]">Ir a fecha:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
            className="px-3 py-2 bg-[#2a2a2a] border border-[#333333] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A84B] transition-colors"
          />
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-4 text-xs text-[#666666] px-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#333333] rounded text-[#D4A84B]">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#333333] rounded text-[#D4A84B]">→</kbd>
          <span>Navegar días</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#333333] rounded text-[#D4A84B]">H</kbd>
          <span>Hoy</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#333333] rounded text-[#D4A84B]">Esc</kbd>
          <span>Cerrar mesa</span>
        </span>
      </div>
    </>
  )
}
