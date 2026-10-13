import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/lib/env'
import { useDebouncedCallback } from './useDebouncedCallback'

/**
 * Subscribes to a Supabase Broadcast topic (fan-out, no per-client DB polling).
 * Only `pools` and `rescue_wall` topics are used. Updates are debounced by 1s so a
 * burst of verifications causes one refetch per client, not hundreds.
 */
export function useBroadcast<T = unknown>(topic: 'pools' | 'rescue_wall', event: string, onUpdate: (payloads: T[]) => void, enabled = true) {
  const buffer = useRef<T[]>([])
  const flush = useDebouncedCallback(() => {
    onUpdate(buffer.current.splice(0, buffer.current.length))
  }, 1000)

  useEffect(() => {
    if (!enabled || !isConfigured || import.meta.env.MODE === 'demo') return
    const channel = supabase
      .channel(topic, { config: { broadcast: { self: false } } })
      .on('broadcast', { event }, ({ payload }) => {
        buffer.current.push(payload as T)
        flush()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, event, enabled])
}
