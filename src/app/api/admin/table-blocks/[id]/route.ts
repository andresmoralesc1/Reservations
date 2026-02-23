import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tableBlocks } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

// DELETE /api/admin/table-blocks/[id] - Delete a table block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blockId } = await params

    // Check if block exists
    const existingBlock = await db.query.tableBlocks.findFirst({
      where: eq(tableBlocks.id, blockId),
    })

    if (!existingBlock) {
      return NextResponse.json(
        { error: "Bloqueo no encontrado" },
        { status: 404 }
      )
    }

    // Delete block
    await db.delete(tableBlocks).where(eq(tableBlocks.id, blockId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting table block:", error)
    return NextResponse.json(
      { error: "Error al eliminar bloqueo" },
      { status: 500 }
    )
  }
}
