"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Container } from "@/components/Container"
import { Button } from "@/components/Button"
import { Card, CardContent, CardTitle } from "@/components/Card"
import { Input } from "@/components/Input"
import { Select } from "@/components/Select"
import { toast } from "@/components/Toast"

const RESTAURANTS = [
  { value: "cambrils", label: "El Posit - Cambrils" },
  { value: "tarragona", label: "El Posit - Tarragona" },
  { value: "vila-seca", label: "El Posit - Vila-Seca" },
]

const PARTY_SIZES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? "persona" : "personas"}`,
}))

const TIME_SLOTS = [
  "13:00", "13:30", "14:00", "14:30", "15:00",
  "20:00", "20:30", "21:00", "21:30", "22:00",
]

export default function ReservarPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    restaurant: "",
    date: "",
    time: "",
    partySize: "",
    name: "",
    phone: "",
    email: "",
    specialRequests: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast("Reserva creada correctamente. Te enviaremos un código de confirmación.", "success")
        setStep(4)
      } else {
        const error = await response.json()
        toast(error.error || "Error al crear la reserva", "error")
      }
    } catch (error) {
      toast("Error de conexión. Inténtalo de nuevo.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header variant="light" />

      <main className="min-h-screen bg-cream pt-24 pb-16">
        <Container size="md">
          {/* Progress */}
          <div className="mb-12 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm ${
                  step >= s ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 w-16 ${
                    step > s ? "bg-black" : "bg-neutral-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          <Card variant="elevated">
            <CardContent className="p-8">
              {step === 1 && (
                <>
                  <CardTitle className="mb-8 text-center">Elige Restaurante y Fecha</CardTitle>
                  <div className="space-y-6">
                    <Select
                      label="Restaurante"
                      options={RESTAURANTS}
                      value={formData.restaurant}
                      onChange={(e) => handleInputChange("restaurant", e.target.value)}
                      error={!formData.restaurant ? "Required" : ""}
                    />

                    <Input
                      label="Fecha"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Select
                        label="Hora"
                        options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                      />

                      <Select
                        label="Personas"
                        options={PARTY_SIZES}
                        value={formData.partySize}
                        onChange={(e) => handleInputChange("partySize", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setStep(2)}
                      disabled={!formData.restaurant || !formData.date || !formData.time || !formData.partySize}
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <CardTitle className="mb-8 text-center">Tus Datos</CardTitle>
                  <div className="space-y-6">
                    <Input
                      label="Nombre completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Juan García"
                    />

                    <Input
                      label="Teléfono"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+34 600 000 000"
                    />

                    <Input
                      label="Email (opcional)"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="juan@email.com"
                    />
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(1)}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setStep(3)}
                      disabled={!formData.name || !formData.phone}
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <CardTitle className="mb-8 text-center">Confirmar Reserva</CardTitle>

                  <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
                    <div className="flex justify-between border-b border-neutral-200 pb-4">
                      <span className="font-sans text-sm text-neutral-500">Restaurante</span>
                      <span className="font-display text-sm uppercase">
                        {RESTAURANTS.find((r) => r.value === formData.restaurant)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-4">
                      <span className="font-sans text-sm text-neutral-500">Fecha</span>
                      <span className="font-sans text-sm">{formData.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-4">
                      <span className="font-sans text-sm text-neutral-500">Hora</span>
                      <span className="font-sans text-sm">{formData.time}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-4">
                      <span className="font-sans text-sm text-neutral-500">Personas</span>
                      <span className="font-sans text-sm">{formData.partySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-sm text-neutral-500">Nombre</span>
                      <span className="font-sans text-sm font-medium">{formData.name}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(2)}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Procesando..." : "Confirmar Reserva"}
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <CardTitle className="mb-4">Reserva Solicitada</CardTitle>
                  <p className="font-serif text-neutral-600">
                    Hemos recibido tu solicitud de reserva. Recibirás un código de confirmación por WhatsApp en breve.
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <Link href="/">
                      <Button variant="outline" size="lg">
                        Volver al Inicio
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="primary" size="lg">
                        Panel Admin
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  )
}
