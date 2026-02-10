/**
 * Pexels API Service
 * Fetches high-quality images for the restaurant website
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ""
const PEXELS_API_URL = "https://api.pexels.com/v1"

export interface PexelsImage {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
}

export interface PexelsResponse {
  photos: PexelsImage[]
  page: number
  per_page: number
  total_results: number
  next_page: string | null
}

/**
 * Search for photos on Pexels
 */
export async function searchPhotos(
  query: string,
  options?: { per_page?: number; page?: number; orientation?: "landscape" | "portrait" | "square" }
): Promise<PexelsImage[]> {
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set")
    return []
  }

  try {
    const params = new URLSearchParams({
      query,
      per_page: String(options?.per_page || 10),
      page: String(options?.page || 1),
      locale: "es-ES",
    })

    if (options?.orientation) {
      params.set("orientation", options.orientation)
    }

    const response = await fetch(`${PEXELS_API_URL}/search?${params}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data: PexelsResponse = await response.json()
    return data.photos
  } catch (error) {
    console.error("Error fetching photos from Pexels:", error)
    return []
  }
}

/**
 * Get a curated photo (featured collection)
 */
export async function getCuratedPhotos(
  per_page: number = 10
): Promise<PexelsImage[]> {
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set")
    return []
  }

  try {
    const response = await fetch(
      `${PEXELS_API_URL}/curated?per_page=${per_page}&locale=es-ES`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data: PexelsResponse = await response.json()
    return data.photos
  } catch (error) {
    console.error("Error fetching curated photos:", error)
    return []
  }
}

/**
 * Get a specific photo by ID
 */
export async function getPhoto(id: string | number): Promise<PexelsImage | null> {
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set")
    return null
  }

  try {
    const response = await fetch(`${PEXELS_API_URL}/photos/${id}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching photo:", error)
    return null
  }
}

// Predefined searches for restaurant images
export const RESTAURANT_IMAGES = {
  hero: {
    query: "seafood restaurant elegant",
    orientation: "landscape" as const,
    per_page: 3,
  },
  interior: {
    query: "restaurant interior elegant cozy",
    orientation: "landscape" as const,
    per_page: 6,
  },
  seafood: {
    query: "seafood paella mediterranean cuisine",
    orientation: "landscape" as const,
    per_page: 6,
  },
  exterior: {
    query: "restaurant terrace mediterranean",
    orientation: "landscape" as const,
    per_page: 3,
  },
}
