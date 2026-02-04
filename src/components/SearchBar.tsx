"use client"

import { cn } from "@/lib/utils"
import { useState, ChangeEvent } from "react"
import { Input } from "./Input"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchBar({
  onSearch,
  placeholder = "Buscar...",
  className,
  debounceMs = 300
}: SearchBarProps) {
  const [value, setValue] = useState("")

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearch(newValue)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }

  const handleClear = () => {
    setValue("")
    onSearch("")
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            className="h-4 w-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-11"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 transition-colors hover:text-black"
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
