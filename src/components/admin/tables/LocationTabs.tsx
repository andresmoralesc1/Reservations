"use client"

import { FilterTabs } from "@/components/FilterTabs"

type Location = "all" | "patio" | "interior" | "terraza"

interface LocationTabsProps {
  value: Location
  onChange: (value: Location) => void
}

const LOCATION_OPTIONS = [
  { value: "all" as const, label: "Todas" },
  { value: "patio" as const, label: "Patio" },
  { value: "interior" as const, label: "Interior" },
  { value: "terraza" as const, label: "Terraza" },
]

export function LocationTabs({ value, onChange }: LocationTabsProps) {
  return (
    <FilterTabs
      options={LOCATION_OPTIONS}
      value={value}
      onChange={(val) => onChange(val as Location)}
    />
  )
}
