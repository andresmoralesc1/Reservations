/**
 * Pipecat RTVI Client
 *
 * Cliente WebRTC para conectarse al bot Pipecat usando el protocolo RTVI.
 *
 * RTVI (Real-Time Voice Interface) es un framework que permite comunicación
 * bidireccional de voz entre un cliente Web y un bot de IA.
 *
 * Flujo de conexión:
 * 1. Conectar WebSocket al servidor de señalización
 * 2. Enviar handshake RTVI
 * 3. Establecer conexión WebRTC para audio
 * 4. Intercambiar tracks de audio
 */

// Tipos de mensajes RTVI
export type RTVIMessageType =
  | "rtvi-ai"
  | "rtvi-audio"
  | "rtvi-config"
  | "rtvi-error";

export interface RTVIMessage {
  label?: string;
  type: RTVIMessageType;
  data?: Record<string, unknown>;
}

export interface RTVIConfig {
  config: Array<{ name: string; value: unknown }>;
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface PipecatClientEvents {
  onReady?: () => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onBotSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  onAudioLevel?: (level: number) => void;
}

export interface PipecatClientConfig {
  serverUrl: string; // ej: "http://localhost:7860" o "https://voicebot.neuralflow.space"
  events?: PipecatClientEvents;
  enableAudio?: boolean; // Habilitar entrada/salida de audio
}

/**
 * Cliente para conectarse al bot Pipecat usando RTVI sobre WebRTC
 */
export class PipecatClient {
  private serverUrl: string;
  private events?: PipecatClientEvents;
  private enableAudio: boolean;

  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private microphoneNode: MediaStreamAudioSourceNode | null = null;

  private _isConnected = false;
  private _isBotSpeaking = false;
  private _connectionState: ConnectionState = "disconnected";

  // Audio level monitoring
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: PipecatClientConfig) {
    // Convertir http:// a ws:// y https:// a wss://
    this.serverUrl = config.serverUrl.replace(/^https?:/, (match) =>
      match === "https:" ? "wss:" : "ws:"
    );
    console.log("[PipecatClient] URL original:", config.serverUrl);
    console.log("[PipecatClient] URL convertida:", this.serverUrl);
    this.events = config.events;
    this.enableAudio = config.enableAudio ?? true;
  }

  /**
   * Conecta al bot Pipecat
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      console.warn("[PipecatClient] Already connected");
      return;
    }

    try {
      this.setConnectionState("connecting");

      // 1. Conectar WebSocket para señalización
      await this.connectWebSocket();

      // 2. Solicitar permisos de audio
      if (this.enableAudio) {
        await this.setupAudio();
      }

      // 3. Crear PeerConnection WebRTC
      await this.createPeerConnection();

      // 4. Iniciar handshake RTVI
      await this.startRTVIHandshake();

      this._isConnected = true;
      this.setConnectionState("connected");
      console.log("[PipecatClient] Connected successfully");
    } catch (error) {
      this.setConnectionState("error");
      this.events?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Desconecta del bot
   */
  disconnect(): void {
    this._isConnected = false;

    // Detener monitoreo de nivel de audio
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    // Cerrar WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Cerrar PeerConnection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Detener tracks de audio
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Cerrar AudioContext
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.analyzer) {
      this.analyzer = null;
    }
    if (this.microphoneNode) {
      this.microphoneNode = null;
    }

    this.setConnectionState("disconnected");
    console.log("[PipecatClient] Disconnected");
  }

  /**
   * Envía un mensaje de texto al bot
   */
  sendMessage(text: string): void {
    if (!this._isConnected || !this.ws) {
      console.warn("[PipecatClient] Not connected");
      return;
    }

    // El mensaje se envía a través de RTVI
    this.sendRTVI("ai", {
      text,
    });
  }

  /**
   * Obtiene el nivel de audio actual (0-1)
   */
  getAudioLevel(): number {
    if (!this.analyzer) return 0;

    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(dataArray);

    // Calcular promedio
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return sum / dataArray.length / 255;
  }

  // Getters
  get isConnected(): boolean {
    return this._isConnected;
  }

  get isBotSpeaking(): boolean {
    return this._isBotSpeaking;
  }

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  // ============ Métodos privados ============

  private setConnectionState(state: ConnectionState): void {
    this._connectionState = state;
    this.events?.onConnectionChange?.(state);
  }

  private setBotSpeaking(speaking: boolean): void {
    if (this._isBotSpeaking !== speaking) {
      this._isBotSpeaking = speaking;
      this.events?.onBotSpeaking?.(speaking);
    }
  }

  /**
   * Conecta el WebSocket de señalización
   */
  private async connectWebSocket(): Promise<void> {
    // No agregar trailing slash - el servidor redirige / a /client/
    const wsUrl = this.serverUrl;
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, 10000);

      this.ws!.onopen = () => {
        clearTimeout(timeout);
        console.log("[PipecatClient] WebSocket connected");

        // Escuchar mensajes
        this.ws!.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as RTVIMessage;
            this.handleRTVIMessage(message);
          } catch (error) {
            console.error("[PipecatClient] Failed to parse message:", error);
          }
        };

        resolve();
      };

      this.ws!.onerror = (error) => {
        clearTimeout(timeout);
        console.error("[PipecatClient] WebSocket error:", error);
        console.error("[PipecatClient] WebSocket URL:", wsUrl);
        console.error("[PipecatClient] WebSocket state:", this.ws?.readyState);
        reject(new Error(`WebSocket error: ${JSON.stringify(error)}`));
      };

      this.ws!.onclose = (event) => {
        console.log("[PipecatClient] WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (this._isConnected) {
          this.disconnect();
        }
      };
    });
  }

  /**
   * Configura el audio (micrófono y salida)
   */
  private async setupAudio(): Promise<void> {
    try {
      // Solicitar acceso al micrófono
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Óptimo para voz
        },
        video: false,
      });

      // Configurar AudioContext para análisis
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      this.analyzer.smoothingTimeConstant = 0.8;

      this.microphoneNode = this.audioContext.createMediaStreamSource(
        this.localStream
      );
      this.microphoneNode.connect(this.analyzer);

      // Iniciar monitoreo de nivel de audio
      this.startAudioLevelMonitoring();

      console.log("[PipecatClient] Audio setup complete");
    } catch (error) {
      console.error("[PipecatClient] Failed to setup audio:", error);
      throw new Error("Failed to access microphone");
    }
  }

  /**
   * Inicia el monitoreo del nivel de audio
   */
  private startAudioLevelMonitoring(): void {
    this.audioLevelInterval = setInterval(() => {
      const level = this.getAudioLevel();
      this.events?.onAudioLevel?.(level);
    }, 50); // 20 FPS
  }

  /**
   * Crea la conexión WebRTC PeerConnection
   */
  private async createPeerConnection(): Promise<void> {
    // Configuración ICE para conexión local
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    this.pc = new RTCPeerConnection(config);

    // Manejar candidatos ICE
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendRTVI("ice", { candidate: event.candidate.toJSON() });
      }
    };

    // Manejar conexión de tracks remotos (audio del bot)
    this.pc.ontrack = (event) => {
      console.log("[PipecatClient] Received remote track:", event.track.kind);

      if (event.track.kind === "audio" && event.streams[0]) {
        this.playRemoteAudio(event.streams[0]);
      }
    };

    // Agregar tracks locales (micrófono)
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    console.log("[PipecatClient] PeerConnection created");
  }

  /**
   * Reproduce el audio remoto del bot
   */
  private playRemoteAudio(stream: MediaStream): void {
    const audioElement = new Audio();
    audioElement.srcObject = stream;
    audioElement.autoplay = true;
    audioElement.play().catch(console.error);

    // Detectar cuando el bot está hablando
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);

    const checkSpeaking = () => {
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const isSpeaking = sum > 100; // Umbral para detectar voz

      this.setBotSpeaking(isSpeaking);

      if (this._isConnected) {
        requestAnimationFrame(checkSpeaking);
      }
    };

    checkSpeaking();
  }

  /**
   * Inicia el handshake RTVI
   */
  private async startRTVIHandshake(): Promise<void> {
    // Crear oferta WebRTC
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);

    // Enviar configuración y oferta a través de RTVI
    this.sendRTVI("config", {
      config: [
        { name: "transport", value: "webrtc" },
        { name: "audio_in_enabled", value: true },
        { name: "audio_out_enabled", value: true },
      ],
    });

    this.sendRTVI("ice", { sdp: offer.sdp, type: offer.type });
  }

  /**
   * Maneja mensajes RTVI recibidos
   */
  private handleRTVIMessage(message: RTVIMessage): void {
    switch (message.type) {
      case "rtvi-ai":
        // Mensaje del bot (transcript)
        if (message.data?.text) {
          const text = message.data.text as string;
          this.events?.onTranscript?.(text, message.data?.final as boolean ?? true);
        }
        break;

      case "rtvi-config":
        // Configuración RTVI
        console.log("[PipecatClient] RTVI config:", message.data);
        break;

      case "rtvi-error":
        // Error del bot
        console.error("[PipecatClient] RTVI error:", message.data);
        this.events?.onError?.(new Error(String(message.data?.error || "Unknown error")));
        break;

      case "rtvi-audio":
        // Mensaje de audio (puede contener metadatos)
        if (message.data?.bot === "ready") {
          console.log("[PipecatClient] Bot is ready!");
          this.events?.onReady?.();
        }
        break;

      default:
        // Otros mensajes (ICE, SDP, etc.)
        if (message.data?.sdp && message.data?.type) {
          // Respuesta SDP del servidor
          this.handleRemoteDescription(
            message.data.sdp as string,
            message.data.type as "offer" | "answer" | "pranswer" | "rollback"
          );
        }
        if (message.data?.candidate) {
          // Candidato ICE del servidor
          this.handleRemoteCandidate(message.data.candidate as RTCIceCandidateInit);
        }
        break;
    }
  }

  /**
   * Maneja la descripción remota (answer/offer)
   */
  private async handleRemoteDescription(
    sdp: string,
    type: "offer" | "answer" | "pranswer" | "rollback"
  ): Promise<void> {
    try {
      await this.pc!.setRemoteDescription(
        new RTCSessionDescription({ sdp, type })
      );
      console.log("[PipecatClient] Remote description set");
    } catch (error) {
      console.error("[PipecatClient] Failed to set remote description:", error);
    }
  }

  /**
   * Maneja un candidato ICE remoto
   */
  private async handleRemoteCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("[PipecatClient] Failed to add ICE candidate:", error);
    }
  }

  /**
   * Envía un mensaje RTVI
   */
  private sendRTVI(type: string, data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[PipecatClient] WebSocket not ready");
      return;
    }

    const message: RTVIMessage = {
      label: "client",
      type: `rtvi-${type}` as RTVIMessageType,
      data,
    };

    this.ws.send(JSON.stringify(message));
  }
}

/**
 * Factory function para crear una instancia del cliente
 */
export function createPipecatClient(
  serverUrl: string,
  events?: PipecatClientEvents
): PipecatClient {
  return new PipecatClient({
    serverUrl,
    events,
    enableAudio: true,
  });
}
