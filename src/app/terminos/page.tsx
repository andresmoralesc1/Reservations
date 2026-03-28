import { Header } from "@/components/Header"
import { Container } from "@/components/Container"
import Link from "next/link"

export default function TerminosPage() {
  return (
    <>
      <Header variant="light" />

      <main className="min-h-screen bg-cream pt-32 pb-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl font-bold text-posit-red mb-4">
              Términos y Condiciones
            </h1>

            <p className="text-sm text-neutral-500 mb-8">
              Última actualización: Marzo 2026
            </p>

            <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
              {/* 1. CONDICIONES DEL SERVICIO */}
              <section>
                <h2 className="font-bold text-xl mb-3">1. CONDICIONES DEL SERVICIO DE RESERVAS</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>La reserva no supone pago anticipado</li>
                    <li>La reserva se confirma automáticamente o tras aprobación del restaurante</li>
                  </ul>
                </div>
              </section>

              {/* 2. POLÍTICA DE CANCELACIÓN */}
              <section>
                <h2 className="font-bold text-xl mb-3">2. POLÍTICA DE CANCELACIÓN</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Cancelar con mínimo <strong>4 horas de antelación</strong>: sin consecuencias</li>
                    <li>Cancelar con menos de 4 horas: se registra como cancelación tardía</li>
                    <li>No presentarse (no-show): se registra en el historial del cliente</li>
                  </ul>
                </div>
              </section>

              {/* 3. NO-SHOWS */}
              <section>
                <h2 className="font-bold text-xl mb-3">3. NO-SHOWS</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <p>Para mantener la calidad del servicio y evitar desperdicios:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Tras <strong>3 no-shows</strong> registrados, el sistema podrá requerir confirmación adicional para futuras reservas</li>
                    <li>El restaurante se reserva el derecho de rechazar reservas de clientes con historial de no-shows recurrente</li>
                  </ul>
                </div>
              </section>

              {/* 4. MODIFICACIONES */}
              <section>
                <h2 className="font-bold text-xl mb-3">4. MODIFICACIONES</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Las reservas pueden modificarse hasta <strong>2 horas antes</strong> de la hora reservada</li>
                    <li>Cambios de fecha/hora están sujetos a disponibilidad</li>
                  </ul>
                </div>
              </section>

              {/* 5. LIMITACIÓN DE RESPONSABILIDAD */}
              <section>
                <h2 className="font-bold text-xl mb-3">5. LIMITACIÓN DE RESPONSABILIDAD</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>El sistema de reservas es una herramienta de gestión y no constituye un contrato vinculante de servicio</li>
                    <li>El restaurante se reserva el derecho de gestionar el aforo según necesidades operativas</li>
                  </ul>
                </div>
              </section>

              {/* 6. CONTACTO */}
              <section>
                <h2 className="font-bold text-xl mb-3">6. CONTACTO</h2>
                <div className="text-neutral-700 leading-relaxed">
                  <p>Para cualquier pregunta sobre estos términos, contáctanos en:</p>
                  <p className="mt-2">
                    Email: <a href="mailto:legal@elposit.com" className="text-posit-red hover:underline">legal@elposit.com</a><br />
                    Teléfono: +34 977 00 00 00
                  </p>
                </div>
              </section>

              {/* 7. JURISDICCIÓN */}
              <section>
                <h2 className="font-bold text-xl mb-3">7. LEY APLICABLE Y JURISDICCIÓN</h2>
                <div className="text-neutral-700 leading-relaxed">
                  <p>Estos términos se rigen por las leyes españolas. Cualquier controversia se someterá a los juzgados y tribunales de Tarragona, España.</p>
                </div>
              </section>
            </div>

            <div className="mt-8">
              <Link href="/" className="inline-flex items-center text-posit-red hover:underline font-medium">
                ← Volver a inicio
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </>
  )
}
