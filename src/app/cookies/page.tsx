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
            <h1 className="font-serif text-4xl font-bold text-posit-red mb-4">
              Política de Cookies
            </h1>

            <p className="text-sm text-neutral-500 mb-8">
              Última actualización: Marzo 2026
            </p>

            <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
              {/* 1. ¿QUÉ SON LAS COOKIES? */}
              <section>
                <h2 className="font-bold text-xl mb-3">1. ¿QUÉ SON LAS COOKIES?</h2>
                <p className="text-neutral-700 leading-relaxed">
                  Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web.
                  Se utilizan para recordar tus preferencias y mejorar tu experiencia de navegación.
                </p>
              </section>

              {/* 2. COOKIES QUE UTILIZAMOS */}
              <section>
                <h2 className="font-bold text-xl mb-3">2. COOKIES QUE UTILIZAMOS</h2>
                <div className="text-neutral-700 leading-relaxed space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cookies técnicas / necesarias</h3>
                    <p>Esenciales para el funcionamiento del sitio web:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Sesión de autenticación (Supabase)</li>
                      <li>Preferencias de idioma</li>
                      <li>Estado del formulario de reserva</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cookies funcionales</h3>
                    <p>Recuerdan tus preferencias para mejorar la experiencia:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>Último restaurante seleccionado</li>
                      <li>Aceptación de cookies</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      <strong>Importante:</strong> NO utilizamos cookies publicitarias ni de rastreo de terceros.
                      Tu privacidad es nuestra prioridad.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. TABLA DE COOKIES */}
              <section>
                <h2 className="font-bold text-xl mb-3">3. TABLA DE COOKIES</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-neutral-700">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left py-2 font-semibold">Nombre</th>
                        <th className="text-left py-2 font-semibold">Tipo</th>
                        <th className="text-left py-2 font-semibold">Duración</th>
                        <th className="text-left py-2 font-semibold">Finalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">sb-xxx-auth-token</td>
                        <td>Técnica</td>
                        <td>Sesión</td>
                        <td>Autenticación Supabase</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">cookies_accepted</td>
                        <td>Funcional</td>
                        <td>1 año</td>
                        <td>Aceptación de banner cookies</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2">_vercel</td>
                        <td>Técnica</td>
                        <td>Variable</td>
                        <td>Optimización de hosting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. CÓMO GESTIONAR LAS COOKIES */}
              <section>
                <h2 className="font-bold text-xl mb-3">4. CÓMO GESTIONAR LAS COOKIES</h2>
                <div className="text-neutral-700 leading-relaxed space-y-3">
                  <p>Puedes configurar tu navegador para:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Bloquear todas las cookies</li>
                    <li>Aceptar solo cookies técnicas</li>
                    <li>Eliminar cookies existentes</li>
                    <li>Notificar antes de aceptar cookies</li>
                  </ul>
                  <p className="text-sm mt-3 p-3 bg-neutral-50 rounded-lg">
                    <strong>Nota:</strong> Deshabilitar las cookies técnicas puede afectar el funcionamiento del sitio.
                  </p>
                </div>
              </section>

              {/* 5. CONFIGURACIÓN DE NAVEGADORES */}
              <section>
                <h2 className="font-bold text-xl mb-3">5. CONFIGURACIÓN DE NAVEGADORES</h2>
                <p className="text-neutral-700 leading-relaxed mb-3">
                  Para más información sobre cómo gestionar cookies en tu navegador:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-neutral-700">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-posit-red hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/es/kb/habilitar-deshabilitar-cookies" target="_blank" rel="noopener noreferrer" className="text-posit-red hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-posit-red hover:underline">Safari</a></li>
                </ul>
              </section>

              {/* 6. CONTACTO */}
              <section>
                <h2 className="font-bold text-xl mb-3">6. CONTACTO</h2>
                <div className="text-neutral-700 leading-relaxed">
                  <p>Si tienes preguntas sobre nuestras cookies, contáctanos en:</p>
                  <p className="mt-2">
                    Email: <a href="mailto:cookies@elposit.com" className="text-posit-red hover:underline">cookies@elposit.com</a><br />
                    Teléfono: +34 977 00 00 00
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
