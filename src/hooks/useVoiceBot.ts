/**
 * useVoiceBot Hook
 *
 * Hook personalizado para manejar la conexión y estado del bot de voz.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  PipecatClient,
  createPipecatClient,
  ConnectionState,
  PipecatClientEvents,
} from "@/lib/pipecat-client";

export interface VoiceBotState {
  connectionState: ConnectionState;
  isConnected: boolean;
  isBotSpeaking: boolean;
  transcript: string[];
  currentTranscript: string;
  audioLevel: number;
  error: string | null;
}

export interface VoiceBotActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  clearTranscript: () => void;
}

const PIPECAT_SERVER_URL = process.env.NEXT_PUBLIC_PIPECAT_URL || "http://localhost:7860";

export function useVoiceBot(): VoiceBotState & VoiceBotActions {
  const clientRef = useRef<PipecatClient | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Limpiar cliente al desmontar
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // Crear eventos para el cliente
  const events: PipecatClientEvents = {
    onReady: useCallback(() => {
      console.log("[useVoiceBot] Bot ready!");
      setError(null);
    }, []),

    onTranscript: useCallback((text: string, isFinal: boolean) => {
      setCurrentTranscript(text);
      if (isFinal && text.trim()) {
        setTranscript((prev) => [...prev, text]);
      }
    }, []),

    onBotSpeaking: useCallback((speaking: boolean) => {
      setIsBotSpeaking(speaking);
    }, []),

    onError: useCallback((err: Error) => {
      console.error("[useVoiceBot] Error:", err);
      setError(err.message);
    }, []),

    onConnectionChange: useCallback((state: ConnectionState) => {
      setConnectionState(state);
    }, []),

    onAudioLevel: useCallback((level: number) => {
      setAudioLevel(level);
    }, []),
  };

  // Conectar al bot
  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected) {
      console.warn("[useVoiceBot] Already connected");
      return;
    }

    try {
      setError(null);
      const client = createPipecatClient(PIPECAT_SERVER_URL, events);
      clientRef.current = client;
      await client.connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      throw err;
    }
  }, [events]);

  // Desconectar del bot
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setTranscript([]);
      setCurrentTranscript("");
      setIsBotSpeaking(false);
      setAudioLevel(0);
    }
  }, []);

  // Enviar mensaje al bot
  const sendMessage = useCallback((text: string) => {
    if (clientRef.current?.isConnected) {
      clientRef.current.sendMessage(text);
    } else {
      console.warn("[useVoiceBot] Not connected, cannot send message");
    }
  }, []);

  // Limpiar transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setCurrentTranscript("");
  }, []);

  return {
    // Estado
    connectionState,
    isConnected: connectionState === "connected",
    isBotSpeaking,
    transcript,
    currentTranscript,
    audioLevel,
    error,

    // Acciones
    connect,
    disconnect,
    sendMessage,
    clearTranscript,
  };
}
