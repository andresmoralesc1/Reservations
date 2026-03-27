import { NextResponse } from "next/server"

/**
 * Combined Migration: Fix timezone AND encoding
 * GET /api/admin/migrations/run-all
 *
 * This runs both migrations in sequence and returns a combined report
 */
export async function GET() {
  const results = {
    timezone: null as any,
    encoding: null as any,
    success: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Run timezone migration
    console.log('🔧 Step 1/2: Fixing timezone...')
    const timezoneResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/admin/migrations/fix-timezone`)
    results.timezone = await timezoneResponse.json()

    // Run encoding migration
    console.log('🔧 Step 2/2: Fixing encoding...')
    const encodingResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/admin/migrations/fix-encoding`)
    results.encoding = await encodingResponse.json()

    results.success = results.timezone.success && results.encoding.success

    return NextResponse.json(results)

  } catch (error) {
    console.error('❌ Error running migrations:', error)
    return NextResponse.json(
      {
        ...results,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
