"use client"

import { useEffect, useRef, useCallback } from "react"

export interface PollingOptions {
  interval: number // in milliseconds
  enabled: boolean
  onError?: (error: Error) => void
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  onData: (data: T) => void,
  options: PollingOptions
) {
  const { interval, enabled, onError } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const poll = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return

    try {
      const data = await fetchFn()
      if (isMountedRef.current) {
        onData(data)
      }
    } catch (error) {
      if (isMountedRef.current && onError) {
        onError(error as Error)
      }
    }

    if (enabled && isMountedRef.current) {
      timeoutRef.current = setTimeout(poll, interval)
    }
  }, [fetchFn, onData, interval, enabled, onError])

  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      poll()
    }

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, poll])

  return { poll }
}

// Hook for polling with automatic backoff on failure
export function useSmartPolling<T>(
  fetchFn: () => Promise<T>,
  onData: (data: T) => void,
  options: {
    baseInterval: number
    maxInterval: number
    backoffMultiplier: number
    enabled: boolean
    onError?: (error: Error) => void
  }
) {
  const {
    baseInterval,
    maxInterval,
    backoffMultiplier,
    enabled,
    onError,
  } = options

  const currentIntervalRef = useRef(baseInterval)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const poll = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return

    try {
      const data = await fetchFn()
      if (isMountedRef.current) {
        onData(data)
        currentIntervalRef.current = baseInterval // Reset on success
      }
    } catch (error) {
      if (isMountedRef.current) {
        onError?.(error as Error)
        // Back off on error
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * backoffMultiplier,
          maxInterval
        )
      }
    }

    if (enabled && isMountedRef.current) {
      timeoutRef.current = setTimeout(poll, currentIntervalRef.current)
    }
  }, [fetchFn, onData, baseInterval, maxInterval, backoffMultiplier, enabled, onError])

  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      poll()
    }

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, poll])

  return { poll }
}
