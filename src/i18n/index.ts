import { useCallback } from 'react'
import { useUiStore } from '@/stores/ui'
import { en, mr, type DictKey } from './dictionary'

const dicts = { en, mr } as const

export function useT() {
  const lang = useUiStore((s) => s.lang)
  return useCallback((key: DictKey) => dicts[lang][key], [lang])
}

export type { DictKey }
