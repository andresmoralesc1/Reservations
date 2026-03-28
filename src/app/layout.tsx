import type { Metadata } from "next"
import { Inter, Oswald, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/Toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider as ToastWithUndoProvider } from "@/components/ToastWithUndo"
import { VoiceWidget } from "@/components/VoiceWidget"
import { CookieBanner } from "@/components/CookieBanner"

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'El Posit — Cocina Marinera Tradicional | Reserva tu Mesa',
  description: 'Reserva mesa en El Posit, restaurante de cocina marinera catalana tradicional en Cambrils, Tarragona y Vila-Seca. Reservas 24/7 por web, teléfono o WhatsApp.',
  keywords: 'restaurante Cambrils, cocina marinera, reservar mesa, El Posit, restaurante Tarragona, marisquería',
  openGraph: {
    title: 'El Posit — Cocina Marinera Tradicional',
    description: 'Reserva tu mesa en El Posit. Cocina marinera catalana desde 1980.',
    url: 'https://reservations-eta-indol.vercel.app',
    siteName: 'El Posit',
    locale: 'es_ES',
    type: 'website',
  },
  robots: { index: true, follow: true },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  manifest: "/manifest.json",
  themeColor: "#C41E3A",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "El Posit",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${oswald.variable} ${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "El Posit",
              "description": "Cocina marinera tradicional catalana",
              "url": "https://reservations-eta-indol.vercel.app",
              "telephone": "+34977000000",
              "servesCuisine": ["Cocina marinera", "Mediterránea", "Catalana"],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Cambrils",
                "addressRegion": "Tarragona",
                "addressCountry": "ES"
              },
              "acceptsReservations": "True",
              "priceRange": "$$"
            })
          }}
        />
      </head>
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastProvider />
        <ToastWithUndoProvider />
        <VoiceWidget />
        <CookieBanner />
      </body>
    </html>
  )
}
