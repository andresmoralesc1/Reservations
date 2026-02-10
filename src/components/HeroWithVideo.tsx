import { Hero } from "@/components/Hero"
import { getVideoUrl } from "@/lib/pexels"

interface HeroWithVideoProps {
  videoId: string | number
  fallbackImage: string
  children: React.ReactNode
}

export async function HeroWithVideo({ videoId, fallbackImage, children }: HeroWithVideoProps) {
  // Get video URL from Pexels API on server side
  const videoUrl = await getVideoUrl(videoId)

  return (
    <Hero
      backgroundVideo={videoUrl || undefined}
      backgroundImage={!videoUrl ? fallbackImage : undefined}
      overlay
    >
      {children}
    </Hero>
  )
}
