/**
 * Encabezado de la página de administración
 * Incluye selector de fecha con navegación rápida y atajos
 */

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, addDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { useRef } from "react"

interface PageHeaderProps {
  dateFilter: string
  onDateChange: (date: string) => void
  onTodayClick: () => void
}

export function PageHeader({ dateFilter, onDateChange, onTodayClick }: PageHeaderProps) {
  const currentDate = dateFilter ? new Date(dateFilter + 'T00:00:00') : new Date()
  const dateInputRef = useRef<HTMLInputElement>(null)

  const navigateDay = (days: number) => {
    const newDate = addDays(currentDate, days)
    onDateChange(format(newDate, 'yyyy-MM-dd'))
  }

  const goToToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    onDateChange(today)
    onTodayClick()
  }

  const handleDateDisplayClick = () => {
    dateInputRef.current?.showPicker()
  }

  const quickDates = [
    { label: "Hoy", date: format(new Date(), 'yyyy-MM-dd'), isToday: true },
    { label: "Mañana", date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), isToday: false },
    { label: format(addDays(new Date(), 2), 'EEE d', { locale: es }), date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), isToday: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.15em] text-black">
            Dashboard
          </h1>
          <p className="font-sans text-neutral-500 mt-1 text-sm">
            Resumen de reservas y estadísticas
          </p>
        </div>
      </div>

      {/* Date navigation row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-black transition-all"
            title="Día anterior (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-black transition-all"
            title="Día siguiente (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Clickable date display - opens native calendar */}
        <button
          onClick={handleDateDisplayClick}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer min-w-[220px] border border-neutral-300"
          title="Click para abrir calendario"
        >
          <Calendar className="w-4 h-4 text-[#D4A84B]" />
          <span className="font-medium text-black">
            {isToday(currentDate)
              ? "Hoy"
              : format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </span>
          <span className="text-neutral-400 text-sm">
            ({format(currentDate, "dd/MM/yy")})
          </span>
        </button>

        {/* Hidden date input that opens when clicking the display */}
        <input
          ref={dateInputRef}
          type="date"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
          className="sr-only"
          aria-hidden="true"
        />

        {/* Quick date buttons */}
        <div className="flex items-center gap-2">
          {quickDates.map(({ label, date }) => (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all border
                ${date === dateFilter
                  ? "bg-[#D4A84B] text-black border-[#D4A84B]"
                  : "bg-transparent text-neutral-600 border-neutral-300 hover:border-[#D4A84B] hover:text-black"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Today button */}
        <button
          onClick={goToToday}
          className="ml-auto px-4 py-2 bg-[#D4A84B] text-black rounded-lg text-sm font-medium hover:bg-[#E5B95C] transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-4 text-xs text-neutral-400 px-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-black">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-black">→</kbd>
          <span>Navegar días</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-black">H</kbd>
          <span>Hoy</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-black">Click</kbd>
          <span>en fecha para calendario</span>
        </span>
      </div>
    </div>
  )
}
