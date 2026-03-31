/**
 * Season utilities for automatic season detection
 *
 * Northern Hemisphere seasons (Spain/Europe):
 * - Spring: March 20 - June 20
 * - Summer: June 21 - September 22
 * - Autumn: September 23 - December 20
 * - Winter: December 21 - March 19
 */

export type Season = 'invierno' | 'primavera' | 'verano' | 'otoño' | 'todos'

export interface SeasonRange {
  season: Season
  start: { month: number; day: number }
  end: { month: number; day: number }
}

const SEASON_RANGES: SeasonRange[] = [
  {
    season: 'invierno',
    start: { month: 12, day: 21 }, // December 21
    end: { month: 3, day: 19 }      // March 19
  },
  {
    season: 'primavera',
    start: { month: 3, day: 20 },   // March 20
    end: { month: 6, day: 20 }      // June 20
  },
  {
    season: 'verano',
    start: { month: 6, day: 21 },   // June 21
    end: { month: 9, day: 22 }      // September 22
  },
  {
    season: 'otoño',
    start: { month: 9, day: 23 },   // September 23
    end: { month: 12, day: 20 }     // December 20
  }
]

/**
 * Get the current season based on today's date
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  // Convert date to day of year for comparison
  const dateValue = month * 100 + day

  // Winter: Dec 21+ OR before Mar 20
  if (dateValue >= 1221 || dateValue <= 319) {
    return 'invierno'
  }
  // Spring: Mar 20 - Jun 20
  if (dateValue >= 320 && dateValue <= 620) {
    return 'primavera'
  }
  // Summer: Jun 21 - Sep 22
  if (dateValue >= 621 && dateValue <= 922) {
    return 'verano'
  }
  // Autumn: Sep 23 - Dec 20
  return 'otoño'
}

/**
 * Get the season for a specific date
 */
export function getSeasonForDate(date: Date | string): Season {
  const d = typeof date === 'string' ? new Date(date) : date
  return getCurrentSeason(d)
}

/**
 * Check if a service with given season should be active on a specific date
 */
export function isSeasonActiveForDate(
  serviceSeason: Season,
  date: Date = new Date()
): boolean {
  if (serviceSeason === 'todos') {
    return true
  }
  return getCurrentSeason(date) === serviceSeason
}

/**
 * Get season display name
 */
export function getSeasonLabel(season: Season): string {
  const labels: Record<Season, string> = {
    invierno: 'Invierno',
    primavera: 'Primavera',
    verano: 'Verano',
    otoño: 'Otoño',
    todos: 'Todas'
  }
  return labels[season]
}

/**
 * Get next season change date
 */
export function getNextSeasonChange(date: Date = new Date()): Date {
  const currentSeason = getCurrentSeason(date)
  const currentIndex = SEASON_RANGES.findIndex(s => s.season === currentSeason)
  const nextSeason = SEASON_RANGES[(currentIndex + 1) % 4]

  const nextDate = new Date(date)
  const nextStart = nextSeason.start

  // If next season starts later this year
  if (nextStart.month > date.getMonth() + 1 ||
    (nextStart.month === date.getMonth() + 1 && nextStart.day >= date.getDate())) {
    nextDate.setMonth(nextStart.month - 1)
    nextDate.setDate(nextStart.day)
  } else {
    // Next season starts next year
    nextDate.setFullYear(nextDate.getFullYear() + 1)
    nextDate.setMonth(nextStart.month - 1)
    nextDate.setDate(nextStart.day)
  }

  return nextDate
}
