"use client"

import { useState, useEffect } from "react"
import { searchPhotos } from "@/lib/pexels"
import type { PexelsImage } from "@/lib/pexels"

interface RestaurantImageProps {
  query?: string
  imageUrl?: string
  alt: string
  className?: string
  orientation?: "landscape" | "portrait" | "square"
  priority?: boolean
}

export function RestaurantImage({
  query,
  imageUrl,
  alt,
  className = "",
  orientation = "landscape",
  priority = false,
}: RestaurantImageProps) {
  const [image, setImage] = useState<PexelsImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // If imageUrl is provided, use it directly
    if (imageUrl) {
      setLoading(false)
      return
    }

    // Otherwise search by query
    if (!query) {
      setError(true)
      setLoading(false)
      return
    }

    async function fetchImage() {
      try {
        const photos = await searchPhotos(query as string, { per_page: 1, orientation })
        if (photos.length > 0) {
          setImage(photos[0])
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [query, orientation, imageUrl])

  if (loading) {
    return (
      <div className={`bg-neutral-200 animate-pulse ${className}`} />
    )
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
      />
    )
  }

  if (error || !image) {
    return (
      <div className={`bg-gradient-to-br from-neutral-300 to-neutral-400 ${className}`} />
    )
  }

  return (
    <img
      src={image.src.large}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  )
}
