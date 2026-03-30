import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customers } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { normalizePhoneNumber } from "@/lib/utils"

// GET /api/admin/customers/[phone] - Get customer info by phone (for risk assessment)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params

    // Normalize phone number (Spanish format: 9 digits, no prefix)
    const cleanPhone = phone.replace(/\D/g, "") // Remove non-digits
    const normalizedPhone = cleanPhone.startsWith("34") && cleanPhone.length === 11
      ? cleanPhone.slice(2)
      : cleanPhone

    const customer = await db.query.customers.findFirst({
      where: eq(customers.phoneNumber, normalizedPhone),
    })

    if (!customer) {
      return NextResponse.json({
        exists: false,
        noShowCount: 0,
        tags: [],
      })
    }

    const response = {
      exists: true,
      id: customer.id,
      name: customer.name,
      noShowCount: customer.noShowCount || 0,
      tags: customer.tags || [],
      // Risk level for quick UI decisions
      riskLevel: (customer.noShowCount || 0) >= 3 ? "high" : (customer.noShowCount || 0) >= 1 ? "medium" : "none",
    }

    console.log(`[Customer Risk] Phone: ${normalizedPhone}, noShowCount: ${response.noShowCount}, riskLevel: ${response.riskLevel}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching customer by phone:", error)
    return NextResponse.json(
      { error: "Error al buscar cliente" },
      { status: 500 }
    )
  }
}
