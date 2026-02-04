"use client"

import { cn } from "@/lib/utils"
import { useRef, useState, useEffect, ReactNode } from "react"
import { Button } from "./Button"

export interface DropdownOption {
  value: string
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "danger"
}

export interface DropdownProps {
  trigger: ReactNode
  options: DropdownOption[]
  align?: "left" | "right"
  className?: string
}

export function Dropdown({ trigger, options, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] border bg-white shadow-lg",
            align === "left" ? "left-0" : "right-0"
          )}
          style={{ borderColor: "rgb(229, 229, 229)" }}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  option.onClick()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-black/5",
                  option.variant === "danger" && "text-posit-red hover:bg-posit-red/5"
                )}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span className="flex-1 font-sans text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Convenience component for action buttons
export function ActionDropdown({ items }: { items: Omit<DropdownOption, "value">[] }) {
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" className="px-3">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      }
      options={items.map((item, index) => ({
        ...item,
        value: index.toString(),
      }))}
      align="right"
    />
  )
}
