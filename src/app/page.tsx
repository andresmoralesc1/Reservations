import Link from "next/link"
import { Header } from "@/components/Header"
import { Hero, HeroTitle, HeroSubtitle } from "@/components/Hero"
import { Container } from "@/components/Container"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/Card"
import { Button } from "@/components/Button"
import { Badge } from "@/components/Badge"
import { RestaurantImage } from "@/components/RestaurantImage"

const RESTAURANTS = [
  {
    value: "cambrils",
    label: "El Posit - Cambrils",
    imageQuery: "luxury restaurant mediterranean seaside terrace fine dining",
    imageUrl: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1"
  },
  {
    value: "tarragona",
    label: "El Posit - Tarragona",
    imageQuery: "elegant restaurant interior warm lighting cozy atmosphere spanish tapas",
    imageUrl: "https://images.pexels.com/photos/12650876/pexels-photo-12650876.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1"
  },
  {
    value: "vila-seca",
    label: "El Posit - Vila-Seca",
    imageQuery: "gourmet seafood paella spanish cuisine traditional restaurant",
    imageUrl: "https://images.pexels.com/photos/20536247/pexels-photo-20536247.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1"
  },
]

export default function HomePage() {
  return (
    <>
      <Header variant="transparent" />

      {/* Hero Section */}
      <Hero
        backgroundImage="https://images.pexels.com/photos/7262901/pexels-photo-7262901.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
        overlay
      >
        <HeroTitle>
          COCINA<br />MARINERA
        </HeroTitle>
        <HeroSubtitle italic>
          Tradicional
        </HeroSubtitle>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="#reservar">
            <Button variant="secondary" size="lg">
              RESERVAR MESA
            </Button>
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70">
          <span className="progress-indicator">01 —— 03</span>
        </div>
      </Hero>

      {/* Features Section */}
      <section className="section-light py-24" id="sistema">
        <Container>
          <div className="text-center">
            <h2 className="font-display text-display-md uppercase tracking-tight">
              Sistema de Reservas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-neutral-600">
              Gestiona tus reservas con tecnologia de{" "}
              <span className="text-accent-italic">vanguardia</span>
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* IVR Card */}
            <Card variant="outlined" className="text-center hover:border-black transition-colors">
              <CardContent className="py-10">
                <div className="mb-6 text-5xl">📞</div>
                <CardTitle>IVR Inteligente</CardTitle>
                <CardDescription className="text-center">
                  Sistema de respuesta de voz con reconocimiento automatico para reservas telefonicas 24/7
                </CardDescription>
              </CardContent>
            </Card>

            {/* WhatsApp Card */}
            <Card variant="outlined" className="text-center hover:border-black transition-colors">
              <CardContent className="py-10">
                <Badge variant="promo" className="mb-6">Nuevo</Badge>
                <div className="mb-6 text-5xl">💬</div>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription className="text-center">
                  Confirmaciones automaticas con botones interactivos y recordatorios personalizados
                </CardDescription>
              </CardContent>
            </Card>

            {/* Dashboard Card */}
            <Card variant="outlined" className="text-center hover:border-black transition-colors">
              <CardContent className="py-10">
                <div className="mb-6 text-5xl">📊</div>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription className="text-center">
                  Panel de administracion completo con estadisticas y gestion en tiempo real
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section (Black) */}
      <section className="section-dark py-24" id="reservar">
        <Container size="md">
          <div className="text-center">
            <h2 className="font-display text-display-md uppercase text-white tracking-tight">
              RESERVA TU MESA
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-white/80">
              Disfruta de la mejor cocina marinera tradicional en cualquiera de nuestros restaurantes
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a href="tel:+34977000000">
                <Button variant="secondary" size="lg">
                  LLAMAR AHORA
                </Button>
              </a>
              <Link href="/admin">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
                  PANEL ADMIN
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Locations Section with Pexels Images */}
      <section className="section-light py-24" id="restaurantes">
        <Container>
          <div className="text-center mb-16">
            <p className="font-display text-sm uppercase tracking-widest text-neutral-500 mb-2">
              Nuestros Restaurantes
            </p>
            <h2 className="font-display text-display-md uppercase tracking-tight">
              GRUPO EL POSIT
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {RESTAURANTS.map((location) => (
              <div key={location.value} className="text-center group cursor-pointer">
                <div className="aspect-[4/3] mb-6 overflow-hidden">
                  <RestaurantImage
                    imageUrl={location.imageUrl}
                    query={location.imageQuery}
                    alt={location.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
                <h3 className="font-display text-xl uppercase tracking-wide">
                  {location.label.split(" - ")[1]}
                </h3>
                <p className="font-serif text-sm text-neutral-500 mt-2">Cocina marinera</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="flex items-center justify-center gap-4">
              <button className="w-10 h-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors font-sans">
                ←
              </button>
              <span className="font-display text-sm tracking-widest">01 —— 03</span>
              <button className="w-10 h-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors font-sans">
                →
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-display text-2xl uppercase tracking-widest mb-4">El Posit</h4>
              <p className="font-serif text-white/70 text-sm">
                Cocina marinera tradicional desde 1980
              </p>
            </div>
            <div>
              <h5 className="font-display text-sm uppercase tracking-wider mb-4">Enlaces</h5>
              <nav className="flex flex-col gap-2">
                <Link href="/admin" className="font-sans text-sm text-white/70 hover:text-white transition-colors">
                  Panel Admin
                </Link>
                <Link href="/api/docs" className="font-sans text-sm text-white/70 hover:text-white transition-colors">
                  API Docs
                </Link>
              </nav>
            </div>
            <div>
              <h5 className="font-display text-sm uppercase tracking-wider mb-4">Contacto</h5>
              <p className="font-sans text-sm text-white/70">
                info@elposit.com<br />
                +34 977 00 00 00
              </p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-12 pt-8 text-center">
            <p className="font-sans text-xs text-white/50">
              © 2024 El Posit. Todos los derechos reservados.
            </p>
          </div>
        </Container>
      </footer>
    </>
  )
}
