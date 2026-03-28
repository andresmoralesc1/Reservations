/**
 * Configuración centralizada del sistema
 *
 * Todas las variables de entorno y constantes se gestionan aquí.
 * Valida que las variables críticas estén presentes al inicio.
 */

/**
 * Obtiene una variable de entorno o lanza error si falta
 */
function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Obtiene una variable de entorno opcional con valor por defecto
 */
function getEnvVarOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

/**
 * Validación de configuración al inicio
 */
function validateConfig() {
  const errors: string[] = []

  // Variables requeridas en producción
  const isProd = process.env.NODE_ENV === 'production'
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

  if (isProd && !isBuild) {
    if (!process.env.RESTAURANT_ID) {
      errors.push('RESTAURANT_ID is required in production')
    }
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production')
    }
  }

  if (errors.length > 0) {
    throw new Error(`❌ Configuration errors:\n${errors.join('\n')}`)
  }

  // Log de configuración en desarrollo
  if (!isProd) {
    console.log('✅ Configuration validated:', {
      nodeEnv: process.env.NODE_ENV,
      restaurantId: process.env.RESTAURANT_ID || 'using default',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
    })
  }
}

// Validar al importar este archivo
validateConfig()

/**
 * Configuración pública del sistema
 */
export const config = {
  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Restaurante
  restaurantId: getEnvVarOrDefault('RESTAURANT_ID', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

  // Base de datos
  databaseUrl: process.env.DATABASE_URL,

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // API Keys
  pexelsApiKey: process.env.PEXELS_API_KEY,

  // Voice/IVR (opcional)
  telnyxApiKey: process.env.TELNYX_API_KEY,
  telnyxPhoneNumber: process.env.TELNYX_PHONE_NUMBER,

  // Integraciones (opcional)
  voiceBridgeKey: process.env.VOICE_BRIDGE_API_KEY,

  // URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Características del sistema
  maxPartySize: parseInt(process.env.MAX_PARTY_SIZE || '50', 10),
  minPartySize: parseInt(process.env.MIN_PARTY_SIZE || '1', 10),
  defaultReservationDuration: parseInt(process.env.DEFAULT_RESERVATION_DURATION || '120', 10),
} as const

/**
 * Alias para compatibilidad con código existente
 * @deprecated Usar config.restaurantId directamente
 */
export const RESTAURANT_ID = config.restaurantId

/**
 * Type exports para TypeScript
 */
export type Config = typeof config
