import { Header } from "@/components/Header"
import { Container } from "@/components/Container"
import Link from "next/link"

export default function PrivacidadPage() {
  return (
    <>
      <Header variant="light" />

      <main className="min-h-screen bg-cream pt-32 pb-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl uppercase tracking-tight mb-8">
              Política de Privacidad
            </h1>

            <div className="prose prose-neutral max-w-none space-y-6">
              <section>
                <h2 className="font-display text-xl uppercase mb-3">1. Información que recopilamos</h2>
                <p className="font-serif text-neutral-600">
                  En El Posit, recopilamos la siguiente información personal cuando realizas una reserva:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Nombre completo</li>
                  <li>Número de teléfono</li>
                  <li>Email (opcional)</li>
                  <li>Fecha y hora de la reserva</li>
                  <li>Número de personas</li>
                  <li>Solicitudes especiales</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">2. Finalidad de los datos</h2>
                <p className="font-serif text-neutral-600">
                  Utilizamos tus datos personales para:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Gestionar tu reserva</li>
                  <li>Enviar confirmaciones por WhatsApp</li>
                  <li>Enviar recordatorios de tu reserva</li>
                  <li>Mejorar nuestros servicios</li>
                  <li>Comunicar cambios o cancelaciones</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">3. Base legal</h2>
                <p className="font-serif text-neutral-600">
                  El tratamiento de tus datos se basa en el consentimiento que nos proporcionas al realizar una reserva,
                  conforme al Reglamento General de Protección de Datos (RGPD) UE 2016/679 y la Ley Orgánica 3/2018.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">4. Derechos del usuario</h2>
                <p className="font-serif text-neutral-600">
                  Tienes derecho a:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Acceder a tus datos personales</li>
                  <li>Solicitar la rectificación de datos inexactos</li>
                  <li>Solicitar la supresión de tus datos ("derecho al olvido")</li>
                  <li>Oponerte al tratamiento de tus datos</li>
                  <li>Solicitar la portabilidad de tus datos</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
                <p className="font-serif text-neutral-600 mt-3">
                  Para ejercer estos derechos, escríbenos a: <a href="mailto:privacidad@elposit.com" className="text-accent underline">privacidad@elposit.com</a>
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">5. Conservación de datos</h2>
                <p className="font-serif text-neutral-600">
                  Tus datos se conservarán mientras mantengas una relación comercial con nosotros o durante el tiempo
                  necesario para cumplir con las obligaciones legales. Una vez finalizada la reserva, los datos se
                  archivarán por periodos de responsabilidad legal.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">6. Compartir datos con terceros</h2>
                <p className="font-serif text-neutral-600">
                  No compartimos tus datos personales con terceros para fines comerciales, excepto cuando sea necesario
                  para:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Cumplir con obligaciones legales</li>
                  <li>Prestar el servicio de reservas</li>
                  <li>Proveer servicios de mensajería (WhatsApp)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">7. Contacto</h2>
                <p className="font-serif text-neutral-600">
                  Para cualquier cuestión relacionada con la privacidad, puedes contactarnos en:
                </p>
                <p className="font-serif text-neutral-600">
                  Email: <a href="mailto:privacidad@elposit.com" className="text-accent underline">privacidad@elposit.com</a><br />
                  Teléfono: +34 977 00 00 00<br />
                  Dirección: Cambrils, Tarragona, España
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
