/**
 * VoiceAssistant Component
 *
 * Interfaz principal del asistente de voz con visualizador de audio.
 */

"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Waves } from "lucide-react";
import { useVoiceBot } from "@/hooks/useVoiceBot";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  className?: string;
  onClose?: () => void;
  embedded?: boolean; // Si es true, no muestra el botón de cerrar
}

export function VoiceAssistant({
  className,
  onClose,
  embedded = false,
}: VoiceAssistantProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const {
    connectionState,
    isConnected,
    isBotSpeaking,
    transcript,
    currentTranscript,
    audioLevel,
    error,
    connect,
    disconnect,
    clearTranscript,
  } = useVoiceBot();

  // Dibujar visualizador de ondas de audio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Función de animación
    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Limpiar canvas
      ctx.clearRect(0, 0, width, height);

      // Configurar estilo
      ctx.strokeStyle = isBotSpeaking
        ? "rgba(59, 130, 246, 0.8)" // Azul cuando habla el bot
        : "rgba(34, 197, 94, 0.8)";  // Verde cuando habla el usuario
      ctx.lineWidth = 2;

      // Dibujar ondas basadas en el nivel de audio
      const bars = 32;
      const barWidth = width / bars;
      const level = audioLevel * 3; // Amplificar para visualización

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const barHeight = Math.max(4, level * Math.sin((i / bars) * Math.PI * 2) * 20 + 4);

        // Centrar verticalmente
        const y = (height - barHeight) / 2;

        // Dibujar barra redondeada
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 4);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isBotSpeaking]);

  // Manejar conexión/desconexión
  const handleToggleConnection = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  // Determinar el icono y texto del botón principal
  const getButtonContent = () => {
    switch (connectionState) {
      case "connecting":
        return {
          icon: <Waves className="h-6 w-6 animate-pulse" />,
          text: "Conectando...",
        };
      case "connected":
        return {
          icon: <PhoneOff className="h-6 w-6" />,
          text: "Terminar",
        };
      case "error":
        return {
          icon: <Phone className="h-6 w-6" />,
          text: "Reintentar",
        };
      default:
        return {
          icon: <Phone className="h-6 w-6" />,
          text: "Iniciar",
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-6 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl",
        className
      )}
    >
      {/* Header con título y botón de cerrar */}
      {!embedded && (
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Mic className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Asistente de Voz
              </h2>
              <p className="text-sm text-slate-400">
                {isConnected
                  ? "Habla ahora para hacer tu reserva"
                  : "Presiona iniciar para comenzar"}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <PhoneOff className="h-5 w-5 text-slate-400" />
            </button>
          )}
        </div>
      )}

      {/* Visualizador de ondas de audio */}
      <div className="relative w-full h-32 bg-slate-950/50 rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />

        {/* Estado de conexión */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isConnected
                ? "bg-green-500 animate-pulse"
                : connectionState === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-slate-500"
            )}
          />
          <span className="text-xs text-slate-400">
            {isConnected
              ? "Conectado"
              : connectionState === "connecting"
              ? "Conectando..."
              : "Desconectado"}
          </span>
        </div>

        {/* Indicador de speaking */}
        {isBotSpeaking && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full">
            <Volume2 className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-blue-400">Asistente hablando</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      {(transcript.length > 0 || currentTranscript) && (
        <div className="w-full max-h-40 overflow-y-auto space-y-2">
          {transcript.map((text, index) => (
            <div
              key={index}
              className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300"
            >
              {text}
            </div>
          ))}
          {currentTranscript && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
              <span className="animate-pulse">●</span> {currentTranscript}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center space-x-4">
        {/* Botón principal de conectar/desconectar */}
        <button
          onClick={handleToggleConnection}
          disabled={connectionState === "connecting"}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all",
            isConnected
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white",
            connectionState === "connecting" && "cursor-not-allowed opacity-70"
          )}
        >
          {buttonContent.icon}
          <span>{buttonContent.text}</span>
        </button>

        {/* Botón de limpiar transcript */}
        {transcript.length > 0 && (
          <button
            onClick={clearTranscript}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
            title="Limpiar conversación"
          >
            <MicOff className="h-5 w-5 text-slate-300" />
          </button>
        )}
      </div>

      {/* Instrucciones */}
      {!isConnected && (
        <div className="text-center text-sm text-slate-400 space-y-1">
          <p>Presiona <strong>Iniciar</strong> para comenzar a hablar con el asistente.</p>
          <p>Puedes hacer reservas, consultar, modificar o cancelar reservaciones.</p>
        </div>
      )}

      {/* Indicador de micrófono */}
      {isConnected && !isBotSpeaking && (
        <div className="flex items-center space-x-2 text-green-400">
          <Mic className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Escuchando...</span>
        </div>
      )}
    </div>
  );
}
