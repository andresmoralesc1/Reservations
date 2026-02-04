"use client"

import { useEffect } from "react"

export interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, enabled])
}

export const SHORTCUTS = {
  NEW_RESERVATION: { key: "n", description: "Nueva reserva" },
  SEARCH: { key: "f", description: "Buscar" },
  APPROVE: { key: "a", description: "Aprobar seleccionada" },
  REJECT: { key: "r", description: "Rechazar seleccionada" },
  EXPORT: { key: "e", description: "Exportar CSV" },
  REFRESH: { key: "F5", description: "Recargar" },
  HELP: { key: "?", description: "Ver atajos" },
  NEXT_TAB: { key: "Tab", shiftKey: true, description: "Siguiente pestaña" },
  PREV_TAB: { key: "Tab", description: "Pestaña anterior" },
  NAV_DASHBOARD: { key: "1", description: "Ir a Dashboard" },
  NAV_TABLES: { key: "2", description: "Ir a Mesas" },
  NAV_ANALYTICS: { key: "3", description: "Ir a Analíticas" },
}
