/**
 * VoiceWidget Component
 *
 * Widget flotante para el asistente de voz.
 * Usa el cliente WebRTC prebuilt de Pipecat en un iframe.
 */

"use client";

import { useState, useEffect } from "react";
import { Mic, X, Minimize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetState = "collapsed" | "expanded" | "minimized";

const PIPECAT_CLIENT_URL = process.env.NEXT_PUBLIC_PIPECAT_URL || "https://voicebot.neuralflow.space";

export function VoiceWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>("collapsed");
  const [isVisible, setIsVisible] = useState(true);
  const [pulse, setPulse] = useState(false);

  // Animación de pulso cada 3 segundos para atraer atención
  useEffect(() => {
    if (widgetState === "collapsed") {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [widgetState]);

  // Ocultar widget si el usuario lo cerró (guardar en localStorage)
  useEffect(() => {
    const hidden = localStorage.getItem("voiceWidgetHidden");
    if (hidden === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("voiceWidgetHidden", "true");
  };

  const handleRestore = () => {
    setIsVisible(true);
    localStorage.removeItem("voiceWidgetHidden");
  };

  // Botón flotante restaurar (cuando está oculto)
  if (!isVisible) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title="Mostrar asistente de voz"
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Widget expandido - Modal con iframe */}
      {widgetState === "expanded" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header con botones */}
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mic className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Asistente de Voz</p>
                  <p className="text-xs text-slate-400">Haz tu reserva por voz</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href="/asistente"
                  target="_blank"
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Abrir en página completa"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setWidgetState("collapsed")}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* iframe con el cliente de Pipecat */}
            <iframe
              src={`${PIPECAT_CLIENT_URL}/client/`}
              className="w-full h-[400px] bg-slate-900"
              title="Asistente de Voz"
              allow="microphone; camera"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Widget minimizado - Ventana pequeña */}
      {widgetState === "minimized" && (
        <div className="w-80 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                pulse ? "bg-blue-500/30" : "bg-blue-500/20"
              )}>
                <Mic className={cn(
                  "h-4 w-4 text-blue-400",
                  pulse && "animate-pulse"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Asistente de Voz</p>
                <p className="text-xs text-slate-400">Click para expandir</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setWidgetState("expanded")}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Expandir"
              >
                <Minimize2 className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => setWidgetState("collapsed")}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* iframe mini */}
          <iframe
            src={`${PIPECAT_CLIENT_URL}/client/`}
            className="w-full h-[150px] bg-slate-900"
            title="Asistente de Voz"
            allow="microphone; camera"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Widget colapsado - Botón flotante */}
      {widgetState === "collapsed" && (
        <button
          onClick={() => setWidgetState("expanded")}
          className={cn(
            "group relative p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
            pulse && "animate-pulse"
          )}
          title="Abrir asistente de voz"
        >
          {/* Icono de micrófono */}
          <Mic className={cn(
            "h-6 w-6 transition-transform",
            pulse && "scale-110"
          )} />

          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Asistente de voz
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900" />
          </span>

          {/* Indicador de pulso */}
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50" />
          )}
        </button>
      )}
    </div>
  );
}
