/**
 * Asistente de Voz - Página dedicada
 *
 * Página principal del asistente de voz para hacer reservas.
 */

import { Metadata } from "next";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Mic, Phone, Calendar, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Asistente de Voz | El Posit",
  description:
    "Haz tu reserva por voz con nuestro asistente inteligente. Disponible 24/7.",
};

export default function AsistentePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mic className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Asistente de Voz
                </h1>
                <p className="text-sm text-slate-400">
                  El Posit - Reservas Inteligentes
                </p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Reserva por <span className="text-blue-400">Voz</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Habla naturalmente con nuestro asistente. Haz reservas, consulta
              disponibilidad, modifica o cancela tus reservaciones sin escribir
              nada.
            </p>
          </div>

          {/* Voice Assistant */}
          <VoiceAssistant />

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Crear Reservas"
              description="Dile la fecha, hora y número de personas para crear tu
                reserva al instante."
            />
            <FeatureCard
              icon={<Phone className="h-6 w-6" />}
              title="Consultar y Modificar"
              description="Consulta tus reservas con el código y modifícalas si
                tus planes cambian."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Disponible 24/7"
              description="Nuestro asistente nunca duerme. Haz tu reserva cuando
                quieras."
            />
          </div>

          {/* Tips */}
          <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Consejos para una mejor experiencia
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                Habla en un lugar tranquilo sin mucho ruido de fondo
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                Usa fechas claras: "mañana", "el 15 de febrero", "próximo
                martes"
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                Para las horas: "7 de la noche", "19:00", "8 PM"
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                Ten tu código de reserva a mano (RES-XXXXX) para consultas
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>
            Powered by AI • Tecnología de reconocimiento de voz y procesamiento
            de lenguaje natural
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
