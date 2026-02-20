"use client"

import React from "react"
import { Keyboard } from "lucide-react"

export const KeyboardShortcutsHint: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
      <div className="flex items-start gap-2">
        <Keyboard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Atajos de Teclado
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-blue-900 font-mono">
                Ctrl + D
              </kbd>
              <span>Duplicar mesa seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-blue-900 font-mono">
                Delete
              </kbd>
              <span>Eliminar mesa seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-blue-900 font-mono">
                Esc
              </kbd>
              <span>Deseleccionar mesa</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-blue-900 font-mono">
                Click
              </kbd>
              <span>Seleccionar/Arrastrar mesa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
