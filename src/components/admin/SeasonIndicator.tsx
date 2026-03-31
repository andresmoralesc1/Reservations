import { getCurrentSeason, getNextSeasonChange, getSeasonLabel, type Season } from "@/lib/seasons"
import { useEffect, useState } from "react"

const SEASON_COLORS: Record<Season, string> = {
  invierno: "bg-blue-100 text-blue-700 border-blue-200",
  primavera: "bg-green-100 text-green-700 border-green-200",
  verano: "bg-orange-100 text-orange-700 border-orange-200",
  otoño: "bg-amber-100 text-amber-700 border-amber-200",
  todos: "bg-gray-100 text-gray-700 border-gray-200"
}

const SEASON_ICONS: Record<Season, string> = {
  invierno: "❄️",
  primavera: "🌸",
  verano: "☀️",
  otoño: "🍂",
  todos: "📅"
}

export function SeasonIndicator() {
  const [currentSeason, setCurrentSeason] = useState<Season>(getCurrentSeason())
  const [nextChange, setNextChange] = useState<Date>(getNextSeasonChange())
  const [daysUntil, setDaysUntil] = useState<number>(0)

  useEffect(() => {
    const updateSeason = () => {
      const newSeason = getCurrentSeason()
      const newNextChange = getNextSeasonChange()

      setCurrentSeason(newSeason)
      setNextChange(newNextChange)

      const now = new Date()
      const diff = newNextChange.getTime() - now.getTime()
      setDaysUntil(Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    updateSeason()

    // Update every hour
    const interval = setInterval(updateSeason, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const nextSeasonLabel = getSeasonLabel(
    currentSeason === 'invierno' ? 'primavera' :
    currentSeason === 'primavera' ? 'verano' :
    currentSeason === 'verano' ? 'otoño' : 'invierno'
  )

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${SEASON_COLORS[currentSeason]}`}>
      <span className="text-base">{SEASON_ICONS[currentSeason]}</span>
      <span>{getSeasonLabel(currentSeason)}</span>
      <span className="text-xs opacity-75">
        → {nextSeasonLabel} en {daysUntil} días
      </span>
    </div>
  )
}
