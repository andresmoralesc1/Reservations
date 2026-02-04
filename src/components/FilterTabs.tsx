"use client"

import { cn } from "@/lib/utils"

interface FilterTabsProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function FilterTabs<T extends string>({ options, value, onChange, className }: FilterTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "whitespace-nowrap px-6 py-2 font-display text-sm uppercase tracking-wider transition-colors",
            value === option.value
              ? "bg-black text-white"
              : "bg-transparent text-black border border-black hover:bg-black hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
