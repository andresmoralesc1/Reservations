"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const COOKIE_STORAGE_KEY = "cookies_accepted"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user already accepted cookies
    const accepted = localStorage.getItem(COOKIE_STORAGE_KEY)
    if (!accepted) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_STORAGE_KEY, "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 shadow-lg">
      <div className="bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-700 flex-1">
              Utilizamos cookies técnicas necesarias para el funcionamiento del sitio.
              {" "}
              <Link
                href="/cookies"
                className="text-posit-red hover:underline underline-offset-2"
              >
                Más información
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-posit-red text-white text-sm font-medium rounded-lg hover:bg-posit-red/90 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
