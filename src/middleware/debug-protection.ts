import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware wrapper para proteger endpoints debug
 * Bloquea acceso en producción, permite en development
 */
export function withDebugProtection(
  handler: (req?: NextRequest) => Promise<NextResponse | Response>
) {
  return async (req?: NextRequest) => {
    // Bloquear en producción
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: 'Debug endpoints are disabled in production',
          hint: 'Use CLI scripts instead: npm run seed:*'
        },
        { status: 403 }
      )
    }

    // Log en development
    if (req) {
      console.log(`[DEBUG] Debug endpoint accessed: ${req.nextUrl.pathname}`)
    }

    return handler(req)
  }
}
