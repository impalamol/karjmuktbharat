import { extendTailwindMerge } from 'tailwind-merge'

/** Our font families (font-body / font-semi / font-heavy) are one group, so a later one wins. */
const twMerge = extendTailwindMerge({ extend: { classGroups: { 'font-family': [{ font: ['body', 'semi', 'heavy'] }] } } })

/** Joins class names; conflicting utilities resolve to the last one (text-[10px] beats text-[15px]). */
export const cn = (...parts: (string | false | null | undefined)[]) => twMerge(parts.filter(Boolean).join(' '))
