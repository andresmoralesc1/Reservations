import type { Metadata, Viewport } from "next"
import { Inter, Oswald, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/Toast"
import { AuthProvider } from "@/contexts/AuthContext"
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
  title: "El Posit - Reservas",
  description: "Sistema de reservas - Cocina Marinera Tradicional",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "El Posit",
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
          {children}
        </AuthProvider>
        <ToastProvider />
        <ToastWithUndoProvider />
        <VoiceWidget />
      </body>
    </html>
  )
}
