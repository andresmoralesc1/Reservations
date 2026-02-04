import type { Metadata } from "next"
import { Inter, Oswald, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/Toast"

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${oswald.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="font-sans">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
