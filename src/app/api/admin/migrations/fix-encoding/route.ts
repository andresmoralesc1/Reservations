import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

/**
 * Migration: Fix encoding issues in services (corrupted UTF-8)
 * GET /api/admin/migrations/fix-encoding
 */
export async function GET() {
  try {
    console.log('🔧 Fixing encoding in services...\n')

    // Get all services
    const allServices = await db.query.services.findMany()

    console.log(`📋 Checking ${allServices.length} services for encoding issues...`)

    // Find services with potential encoding issues
    const corruptedServices = allServices.filter(s => {
      const desc = (s.description || '').toLowerCase()
      const name = (s.name || '').toLowerCase()

      // Check for common encoding corruption patterns
      return desc.includes('s_') ||
             desc.includes('s%') ||
             desc.includes('s\ufffd') ||
             name.includes('s_') ||
             name.includes('s%')
    })

    if (corruptedServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ No encoding issues found in services',
        services: allServices.map(s => ({
          name: s.name,
          description: s.description
        }))
      })
    }

    console.log(`📋 Found ${corruptedServices.length} services with encoding issues:`)
    corruptedServices.forEach(s => {
      console.log(`   - ${s.name}: "${s.description}"`)
    })

    // Fix encoding issues
    const fixed = []

    for (const service of corruptedServices) {
      let newDescription = service.description || ''
      let newName = service.name || ''

      // Fix common encoding issues
      const replacements: Record<string, string> = {
        's_bados': 'sábados',
        's\\bados': 'sábados',
        'S_bados': 'Sábados',
        's%bados': 'sábados',
        's\ufffdbados': 'sábados',
        's\ufffd\bados': 'sábados',
      }

      let hasChanges = false

      for (const [corrupt, correct] of Object.entries(replacements)) {
        if (newDescription.includes(corrupt)) {
          newDescription = newDescription.replace(new RegExp(corrupt, 'g'), correct)
          hasChanges = true
          console.log(`   Fixed in "${service.name}": "${corrupt}" → "${correct}"`)
        }
        if (newName.includes(corrupt)) {
          newName = newName.replace(new RegExp(corrupt, 'g'), correct)
          hasChanges = true
        }
      }

      // Update if changed
      if (hasChanges) {
        const [updatedService] = await db
          .update(services)
          .set({
            name: newName,
            description: newDescription,
            updatedAt: new Date()
          })
          .where(eq(services.id, service.id))
          .returning()

        fixed.push(updatedService)
        console.log(`✅ Updated service: ${updatedService.name}`)
      }
    }

    // Show all services after fix
    const verify = await db.query.services.findMany()

    return NextResponse.json({
      success: true,
      message: `✅ Fixed encoding in ${fixed.length} service(s)`,
      fixed: fixed.map(s => ({
        name: s.name,
        description: s.description
      })),
      allServices: verify.map(s => ({
        name: s.name,
        description: s.description
      }))
    })

  } catch (error) {
    console.error('❌ Error fixing encoding:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
