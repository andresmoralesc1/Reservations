"use client"

interface TableStatsCardsProps {
  total: number
  byLocation: {
    patio: number
    interior: number
    terraza: number
  }
  totalCapacity: number
  accessibleCount: number
  utilizationRate: number
}

export function TableStatsCards({
  total,
  byLocation,
  totalCapacity,
  accessibleCount,
  utilizationRate,
}: TableStatsCardsProps) {
  const cards = [
    {
      label: "Total Mesas",
      value: total.toString(),
      detail: `${totalCapacity} pax capacidad`,
    },
    {
      label: "Patio",
      value: byLocation.patio.toString(),
      detail: `${byLocation.patio * 4} pax aprox`,
    },
    {
      label: "Interior",
      value: byLocation.interior.toString(),
      detail: `${byLocation.interior * 4} pax aprox`,
    },
    {
      label: "Terraza",
      value: byLocation.terraza.toString(),
      detail: `${byLocation.terraza * 4} pax aprox`,
    },
    {
      label: "Accesibles",
      value: accessibleCount.toString(),
      detail: "♿ PMR",
    },
    {
      label: "Utilización",
      value: `${utilizationRate}%`,
      detail: "ocupación hoy",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-neutral-200 rounded-lg p-4"
        >
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
            {card.label}
          </div>
          <div className="font-display text-2xl font-semibold text-black">
            {card.value}
          </div>
          <div className="text-xs text-neutral-400 mt-1">{card.detail}</div>
        </div>
      ))}
    </div>
  )
}
