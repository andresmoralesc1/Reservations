import { Header } from "@/components/Header"
import { Container } from "@/components/Container"
import Link from "next/link"

export default function CookiesPage() {
  return (
    <>
      <Header variant="light" />

      <main className="min-h-screen bg-cream pt-32 pb-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl uppercase tracking-tight mb-8">
              Política de Cookies
            </h1>

            <div className="prose prose-neutral max-w-none space-y-6">
              <section>
                <h2 className="font-display text-xl uppercase mb-3">1. ¿Qué son las cookies?</h2>
                <p className="font-serif text-neutral-600">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
                  Se utilizan para recordar tus preferencias y mejorar tu experiencia de navegación.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">2. Tipos de cookies que utilizamos</h2>

                <h3 className="font-display text-lg uppercase mb-2 mt-4">Cookies técnicas</h3>
                <p className="font-serif text-neutral-600">
                  Esenciales para el funcionamiento del sitio web. Incluyen:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Autenticación de usuarios</li>
                  <li>Gestión de sesiones</li>
                  <li>Carrito de reservas</li>
                  <li>Protección contra fraude</li>
                </ul>

                <h3 className="font-display text-lg uppercase mb-2 mt-4">Cookies analíticas</h3>
                <p className="font-serif text-neutral-600">
                  Nos ayudan a entender cómo los usuarios utilizan el sitio:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Páginas más visitadas</li>
                  <li>Tiempo de navegación</li>
                  <li>Errores encontrados</li>
                  <li>Rutas de navegación</li>
                </ul>

                <h3 className="font-display text-lg uppercase mb-2 mt-4">Cookies de terceros</h3>
                <p className="font-serif text-neutral-600">
                  Cookies establecidas por servicios de terceros que utilizamos:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Google Analytics (análisis de tráfico)</li>
                  <li>Vercel (hosting y rendimiento)</li>
                  <li>WhatsApp Business (confirmaciones de reserva)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">3. Tabla de cookies</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-serif text-neutral-600">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left py-2">Nombre</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Duración</th>
                        <th className="text-left py-2">Finalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">_session</td>
                        <td>Técnica</td>
                        <td>30 minutos</td>
                        <td>Gestión de sesión IVR</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">_ga</td>
                        <td>Analítica</td>
                        <td>2 años</td>
                        <td>Google Analytics</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">_gid</td>
                        <td>Analítica</td>
                        <td>24 horas</td>
                        <td>Google Analytics</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">vercel</td>
                        <td>Técnica</td>
                        <td>Variable</td>
                        <td>Optimización de hosting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">4. Cómo gestionar las cookies</h2>
                <p className="font-serif text-neutral-600">
                  Puedes configurar tu navegador para:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li>Bloquear todas las cookies</li>
                  <li>Aceptar solo cookies técnicas</li>
                  <li>Eliminar cookies existentes</li>
                  <li>Notificar antes de aceptar cookies</li>
                </ul>
                <p className="font-serif text-neutral-600 mt-3">
                  <strong className="text-neutral-900">Nota:</strong> Deshabilitar las cookies técnicas puede afectar el funcionamiento del sitio.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">5. Configuración de navegadores</h2>
                <p className="font-serif text-neutral-600">
                  Para más información sobre cómo gestionar cookies en tu navegador:
                </p>
                <ul className="list-disc list-inside font-serif text-neutral-600 space-y-1">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/es/kb/habilitar-deshabilitar-cookies" target="_blank" rel="noopener noreferrer" className="text-accent underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent underline">Safari</a></li>
                  <li><a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-accent underline">Microsoft Edge</a></li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">6. Actualizaciones</h2>
                <p className="font-serif text-neutral-600">
                  Podemos actualizar esta política de cookies periódicamente para reflejar cambios en nuestro uso
                  de cookies o por cambios legislativos. Te recomendamos revisar esta página regularmente.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl uppercase mb-3">7. Contacto</h2>
                <p className="font-serif text-neutral-600">
                  Si tienes preguntas sobre nuestras cookies, contáctanos en:
                </p>
                <p className="font-serif text-neutral-600">
                  Email: <a href="mailto:cookies@elposit.com" className="text-accent underline">cookies@elposit.com</a><br />
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
