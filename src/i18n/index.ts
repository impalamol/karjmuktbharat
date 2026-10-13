import { en, type DictKey } from './dictionary'

/** English is the only UI language. Copy still lives in one dictionary so it stays easy to edit. */
const t = (key: DictKey) => en[key]

export function useT() {
  return t
}

export type { DictKey }
