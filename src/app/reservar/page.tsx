"use client"

import { useState, useEffect } from "react"
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
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.history.back()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.restaurant) newErrors.restaurant = "Selecciona un restaurante"
    if (!formData.date) newErrors.date = "Selecciona una fecha"
    if (!formData.time) newErrors.time = "Selecciona una hora"
    if (!formData.partySize) newErrors.partySize = "Selecciona el número de personas"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }
    if (!formData.phone || !/^3\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Teléfono inválido (formato: 3XXXXXXXXX)"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-cream pt-24 pb-16">
        <Container size="md">
          {/* Progress */}
          <nav className="mb-12" aria-label="Progreso de reserva">
            <ol className="flex items-center justify-center gap-2 sm:gap-4">
              {[1, 2, 3].map((s, index) => (
                <li key={s} className="flex items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-sm transition-all ${
                      step >= s
                        ? "bg-black text-white"
                        : "bg-neutral-200 text-neutral-500"
                    } ${step === s ? "ring-4 ring-black/20" : ""}`}
                    aria-current={step === s ? "step" : undefined}
                  >
                    {s}
                  </div>
                  {index < 2 && (
                    <div className={`h-0.5 w-8 sm:w-16 transition-all ${
                      step > s ? "bg-black" : "bg-neutral-200"
                    }`} aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <Card variant="elevated">
            <CardContent className="p-6 sm:p-8">
              {step === 1 && (
                <>
                  <CardTitle className="mb-8 text-center">Elige Restaurante y Fecha</CardTitle>
                  <div className="space-y-6">
                    <Select
                      label="Restaurante"
                      options={RESTAURANTS}
                      value={formData.restaurant}
                      onChange={(e) => handleInputChange("restaurant", e.target.value)}
                      error={errors.restaurant}
                      required
                    />

                    <Input
                      label="Fecha"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      error={errors.date}
                      required
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Select
                        label="Hora"
                        options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        error={errors.time}
                        required
                      />

                      <Select
                        label="Personas"
                        options={PARTY_SIZES}
                        value={formData.partySize}
                        onChange={(e) => handleInputChange("partySize", e.target.value)}
                        error={errors.partySize}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleNextStep}
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
                      error={errors.name}
                      required
                    />

                    <Input
                      label="Teléfono"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="3XXXXXXXXX"
                      error={errors.phone}
                      helperText="Formato: 3 seguido de 9 dígitos"
                      required
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
                      onClick={handleNextStep}
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
                      <span className="font-display text-sm uppercase text-right">
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
                      loading={loading}
                    >
                      {loading ? "Procesando..." : "Confirmar Reserva"}
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100" role="img" aria-label="Éxito">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <CardTitle className="mb-4">Reserva Solicitada</CardTitle>
                  <p className="font-serif text-neutral-600 mb-6">
                    Hemos recibido tu solicitud de reserva. Recibirás un código de confirmación por WhatsApp en breve.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link href="/">
                      <Button variant="outline" size="lg">
                        Volver al Inicio
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
