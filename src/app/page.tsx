import Link from "next/link"
import { Header } from "@/components/Header"
import { Hero, HeroTitle, HeroSubtitle } from "@/components/Hero"
import { HeroWithVideo } from "@/components/HeroWithVideo"
import { Container } from "@/components/Container"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/Card"
import { Button } from "@/components/Button"
import { Calendar, Clock, MessageSquare, BarChart3, Smartphone, Users } from "lucide-react"

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <HeroWithVideo
        videoId={27917166}
        fallbackImage="https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
      >
        <HeroTitle>
          ANFITRIÓN
        </HeroTitle>
        <HeroSubtitle italic>
          Gestión inteligente de reservas
        </HeroSubtitle>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/admin">
            <Button variant="secondary" size="lg">
              Acceder al Panel
            </Button>
          </Link>
          <a href="#caracteristicas">
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-black">
              Saber Más
            </Button>
          </a>
        </div>
      </HeroWithVideo>

      {/* Features Section */}
      <section className="section-light py-24" id="caracteristicas">
        <Container>
          <div className="text-center">
            <h2 className="font-display text-display-md uppercase tracking-tight">
              Todo lo que necesitas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-neutral-600">
              Simplifica la gestión de tu restaurante con herramientas diseñadas para el mundo real
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Reservas 24/7 */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>Reservas 24/7</CardTitle>
                <CardDescription className="text-center">
                  Tus clientes reservan cuando quieran. Tú gestionas cuando quieras.
                </CardDescription>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>WhatsApp Integrado</CardTitle>
                <CardDescription className="text-center">
                  Confirmaciones automáticas y recordatorios sin hacer nada.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Dashboard */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>Dashboard en Tiempo Real</CardTitle>
                <CardDescription className="text-center">
                  Métricas, ocupación y tendencias al instante.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Control de Mesas */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>Control de Mesas</CardTitle>
                <CardDescription className="text-center">
                  Visualiza y gestiona tu salón con arrastrar y soltar.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Turnos Flexibles */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>Turnos Flexibles</CardTitle>
                <CardDescription className="text-center">
                  Configura servicios, horarios y duración por mesa.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Móvil */}
            <Card variant="outlined" className="group text-center hover:border-black hover:shadow-lg transition-all duration-300 cursor-default">
              <CardContent className="py-10">
                <div className="mb-6 flex justify-center">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle>Optimizado para Móvil</CardTitle>
                <CardDescription className="text-center">
                  Gestiona desde cualquier lugar, en cualquier dispositivo.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section-dark py-24">
        <Container size="md">
          <div className="text-center">
            <h2 className="font-display text-display-md uppercase text-white tracking-tight">
              ¿Listo para simplificar tu restaurante?
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-white/80">
              Únete a los restaurantes que ya gestionan sus reservas con Anfitrión
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/admin">
                <Button variant="secondary" size="lg">
                  Acceder al Panel
                </Button>
              </Link>
              <a href="mailto:hola@anfitrion.app">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
                  Solicitar Demo
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16" role="contentinfo">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-12">
            <div>
              <h4 className="font-display text-2xl uppercase tracking-widest mb-4 text-white">
                ANFITRIÓN
              </h4>
              <p className="font-serif text-white/90 text-sm">
                Gestión inteligente de reservas para restaurantes modernos
              </p>
            </div>
            <div>
              <h5 className="font-display text-sm uppercase tracking-wider mb-4 text-white">Producto</h5>
              <nav className="flex flex-col gap-2" aria-label="Enlaces del producto">
                <Link href="/admin" className="font-sans text-sm text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-colors">
                  Panel Admin
                </Link>
                <Link href="/api/docs" className="font-sans text-sm text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-colors">
                  API Docs
                </Link>
              </nav>
            </div>
            <div>
              <h5 className="font-display text-sm uppercase tracking-wider mb-4 text-white">Legal</h5>
              <nav className="flex flex-col gap-2" aria-label="Enlaces legales">
                <Link href="/privacidad" className="font-sans text-sm text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-colors">
                  Privacidad
                </Link>
                <Link href="/terminos" className="font-sans text-sm text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-colors">
                  Términos
                </Link>
                <Link href="/cookies" className="font-sans text-sm text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-colors">
                  Cookies
                </Link>
              </nav>
            </div>
            <div>
              <h5 className="font-display text-sm uppercase tracking-wider mb-4 text-white">Contacto</h5>
              <p className="font-sans text-sm text-white/90">
                <a href="mailto:hola@anfitrion.app" className="hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-1 transition-colors">
                  hola@anfitrion.app
                </a>
              </p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-sans text-xs text-white/80">
              © 2026 Anfitrión. Todos los derechos reservados.
            </p>
            <p className="font-sans text-xs text-white/80">
              Hecho con ❤️ en España
            </p>
          </div>
        </Container>
      </footer>
    </>
  )
}
