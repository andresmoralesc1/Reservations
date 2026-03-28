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
            <h1 className="font-serif text-4xl font-bold text-posit-red mb-4">
              Política de Privacidad
            </h1>

            <p className="text-sm text-neutral-500 mb-8">
              Última actualización: Marzo 2026
            </p>

            <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
              {/* 1. RESPONSABLE DEL TRATAMIENTO */}
              <section>
                <h2 className="font-bold text-xl mb-3">1. RESPONSABLE DEL TRATAMIENTO</h2>
                <div className="text-neutral-700 leading-relaxed space-y-1">
                  <p><strong>El Posit — Cocina Marinera Tradicional</strong></p>
                  <p>Dirección: Cambrils, Tarragona, España</p>
                  <p>Email de contacto: <a href="mailto:privacidad@elposit.com" className="text-posit-red hover:underline">privacidad@elposit.com</a></p>
                </div>
              </section>

              {/* 2. DATOS QUE RECOGEMOS */}
              <section>
                <h2 className="font-bold text-xl mb-3">2. DATOS QUE RECOGEMOS</h2>
                <div className="text-neutral-700 leading-relaxed space-y-3">
                  <p>Recopilamos los siguientes datos personales:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nombre completo (al hacer una reserva)</li>
                    <li>Número de teléfono (para contacto y WhatsApp)</li>
                    <li>Dirección de email (opcional, si la proporciona)</li>
                    <li>Grabaciones de voz (cuando usa el sistema IVR telefónico)</li>
                    <li>Historial de reservas (fechas, horas, número de comensales)</li>
                    <li>Datos de no-show (ausencias sin cancelación previa)</li>
                    <li>Datos técnicos de navegación (IP, navegador, para cookies técnicas)</li>
                  </ul>
                </div>
              </section>

              {/* 3. FINALIDAD DEL TRATAMIENTO */}
              <section>
                <h2 className="font-bold text-xl mb-3">3. FINALIDAD DEL TRATAMIENTO</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <p>Utilizamos tus datos personales para:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Gestión de reservas de mesa</li>
                    <li>Envío de confirmaciones por WhatsApp</li>
                    <li>Envío de recordatorios 24h antes de la reserva</li>
                    <li>Mejora del servicio y análisis de ocupación</li>
                    <li>Procesamiento de voz para reservas telefónicas con IA</li>
                  </ul>
                </div>
              </section>

              {/* 4. BASE LEGAL */}
              <section>
                <h2 className="font-bold text-xl mb-3">4. BASE LEGAL</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <p>El tratamiento de tus datos se basa en:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Consentimiento del interesado (Art. 6.1.a RGPD)</li>
                    <li>Ejecución de un contrato de servicio (Art. 6.1.b RGPD)</li>
                  </ul>
                  <p className="text-sm mt-2">Conforme al Reglamento General de Protección de Datos (RGPD) UE 2016/679 y la Ley Orgánica 3/2018.</p>
                </div>
              </section>

              {/* 5. DESTINATARIOS */}
              <section>
                <h2 className="font-bold text-xl mb-3">5. DESTINATARIOS</h2>
                <div className="text-neutral-700 leading-relaxed space-y-2">
                  <p>Terceros con acceso a datos (todos con cláusulas contractuales tipo o certificaciones adecuadas):</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Supabase Inc.</strong> — Alojamiento de base de datos, servidores en UE</li>
                    <li><strong>Twilio Inc.</strong> — Envío de mensajes WhatsApp</li>
                    <li><strong>OpenAI Inc.</strong> — Procesamiento de lenguaje natural para IVR</li>
                    <li><strong>Cartesia Inc.</strong> — Síntesis de voz</li>
                    <li><strong>Vercel Inc.</strong> — Alojamiento web</li>
                    <li><strong>Telnyx Inc.</strong> — Telefonía VoIP</li>
                  </ul>
                </div>
              </section>

              {/* 6. CONSERVACIÓN DE DATOS */}
              <section>
                <h2 className="font-bold text-xl mb-3">6. CONSERVACIÓN DE DATOS</h2>
                <div className="text-neutral-700 leading-relaxed">
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Datos de reservas: <strong>2 años</strong> desde la fecha de la reserva</li>
                    <li>Grabaciones de voz IVR: <strong>30 días</strong></li>
                    <li>Datos de contacto: hasta que solicite su supresión</li>
                  </ul>
                </div>
              </section>

              {/* 7. DERECHOS DEL USUARIO */}
              <section>
                <h2 className="font-bold text-xl mb-3">7. DERECHOS DEL USUARIO</h2>
                <div className="text-neutral-700 leading-relaxed space-y-3">
                  <p>Tienes derecho a:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Acceso a tus datos personales</li>
                    <li>Rectificación de datos inexactos</li>
                    <li>Supresión ("derecho al olvido")</li>
                    <li>Limitación del tratamiento</li>
                    <li>Portabilidad</li>
                    <li>Oposición</li>
                  </ul>
                  <p className="mt-3">
                    Para ejercer estos derechos: envía email a <a href="mailto:privacidad@elposit.com" className="text-posit-red hover:underline">privacidad@elposit.com</a> indicando el derecho que deseas ejercer y tu nombre/teléfono para identificarte.
                  </p>
                  <p className="text-sm">
                    Autoridad de control: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-posit-red hover:underline">Agencia Española de Protección de Datos (www.aepd.es)</a>
                  </p>
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
