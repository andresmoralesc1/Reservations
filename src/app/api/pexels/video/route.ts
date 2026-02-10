import { NextRequest, NextResponse } from "next/server"
import { getVideoUrl } from "@/lib/pexels"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    const videoUrl = await getVideoUrl(id)

    if (!videoUrl) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ videoUrl })
  } catch (error) {
    console.error("Error fetching video URL:", error)
    return NextResponse.json(
      { error: "Failed to fetch video URL" },
      { status: 500 }
    )
  }
}
