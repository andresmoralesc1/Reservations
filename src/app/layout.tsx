import type { Metadata, Viewport } from "next"
import { Inter, Oswald, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/Toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { RestaurantProvider } from "@/contexts/RestaurantContext"
import { ToastProvider as ToastWithUndoProvider } from "@/components/ToastWithUndo"
import { VoiceWidget } from "@/components/VoiceWidget"

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
  title: "Anfitrión - Gestión Inteligente de Reservas",
  description: "Sistema de gestión de reservas para restaurantes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anfitrión",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${oswald.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <RestaurantProvider>
            {children}
          </RestaurantProvider>
        </AuthProvider>
        <ToastProvider />
        <ToastWithUndoProvider />
        <VoiceWidget />
      </body>
    </html>
  )
}
