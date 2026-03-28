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
            <h1 className="font-display text-4xl uppercase tracking-tight mb-8">
              Términos de Uso
            </h1>

            <div className="prose prose-neutral max-w-none space-y-6">
              <section>
                <h2 className="font-display text-xl uppercase mb-3">1. Aceptación de los términos</h2>
                <p className="font-serif text-neutral-600">
                  Al utilizar el sistema de reservas de El Posit, aceptas estos términos y condiciones. Si no estás
                  de acuerdo con alguno de estos términos, por favor no utilices nuestro servicio.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">2. Descripción del servicio</h2>
                <p className="font-serif text-neutral-600">
                  El Posit proporciona un sistema de reservas en línea que permite a los clientes:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Realizar reservas en nuestros restaurantes</li>
                  <li>Recibir confirmaciones por WhatsApp</li>
                  <li>Gestionar y modificar sus reservas</li>
                  <li>Recibir recordatorios automáticos</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">3. Responsabilidades del usuario</h2>
                <p className="font-serif text-neutral-600">
                  Al usar nuestro servicio, el usuario se compromete a:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Presentarse en el restaurante en la hora reservada</li>
                  <li>Notificar con antelación cualquier cancelación o modificación</li>
                  <li>Respetar las normas del restaurante</li>
                  <li>No realizar reservas falsas o fraudulentas</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">4. Política de reservas</h2>
                <p className="font-serif text-neutral-600">
                  <strong className="text-neutral-900">Confirmación:</strong> Las reservas están sujetas a confirmación por parte del restaurante.
                </p>
                <p className="font-serif text-neutral-600">
                  <strong className="text-neutral-900">Cancelaciones:</strong> Se recomienda cancelar con al menos 24 horas de antelación.
                </p>
                <p className="font-serif text-neutral-600">
                  <strong className="text-neutral-900">No-show:</strong> Los clientes que no se presenten sin cancelar podrán ser registrados en nuestro sistema.
                </p>
                <p className="font-serif text-neutral-600">
                  <strong className="text-neutral-900">Capacidad:</strong> El restaurante se reserva el derecho de limitar el tamaño de grupos sin aviso previo.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">5. Propiedad intelectual</h2>
                <p className="font-serif text-neutral-600">
                  Todos los elementos de este sitio web (diseño, texto, gráficos, logos, imágenes, software) son propiedad
                  de El Posit o de sus proveedores de contenido y están protegidos por las leyes de propiedad intelectual.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">6. Limitación de responsabilidad</h2>
                <p className="font-serif text-neutral-600">
                  El Posit no se hace responsable por:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Daños directos o indirectos derivados del uso del servicio</li>
                  <li>Interrupciones del servicio por causas técnicas</li>
                  <li>Errores o interrupciones en el sistema de reservas</li>
                  <li>El contenido de sitios web enlazados</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">7. Modificaciones del servicio</h2>
                <p className="font-serif text-neutral-600">
                  El Posit se reserva el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio
                  en cualquier momento, sin previo aviso.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">8. Ley aplicable y jurisdicción</h2>
                <p className="font-serif text-neutral-600">
                  Estos términos se rigen por las leyes españolas. Cualquier controversia se someterá a los juzgados y
                  tribunales de Tarragona, España.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">9. Contacto</h2>
                <p className="font-serif text-neutral-600">
                  Para cualquier pregunta sobre estos términos, contáctanos en:
                </p>
                <p className="font-serif text-neutral-600">
                  Email: <a href="mailto:legal@elposit.com" className="text-accent underline">legal@elposit.com</a><br />
                  Teléfono: +34 977 00 00 00
                </p>
              </section>

              <section>
                <p className="font-serif text-sm text-neutral-500">
                  Última actualización: Febrero 2026
                </p>
              </section>
            </div>

            <div className="mt-12">
              <Link href="/">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </>
  )
}
