import * as React from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props extends Omit<React.ComponentProps<typeof Input>, 'placeholder'> {
  id: string
  label: string
  hint?: string
  error?: string
  /** Fixed text inside the field, e.g. "+91" */
  prefix?: string
}

/**
 * shadcn Input with a floating label: the label rests inside the field and floats up
 * when focused or filled; the border animates to blue with a soft glow (red on error).
 * Works with react-hook-form `register` (the forwarded ref is merged).
 */
export const FloatingField = React.forwardRef<HTMLInputElement, Props>(function FloatingField(
  { id, label, hint, error, prefix, className, onFocus, onBlur, onChange, ...rest },
  ref,
) {
  const inner = React.useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = React.useState(false)
  const [filled, setFilled] = React.useState(false)

  const setRefs = React.useCallback(
    (el: HTMLInputElement | null) => {
      inner.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )

  // Picks up values restored by react-hook-form defaults or autofill.
  React.useEffect(() => {
    const el = inner.current
    if (!el) return
    setFilled(el.value.length > 0)
    const id = window.setTimeout(() => setFilled(el.value.length > 0), 300)
    return () => window.clearTimeout(id)
  }, [])

  const floated = focused || filled || !!prefix
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-1">
      <m.div
        className={cn('relative rounded-card', error && 'text-destructive')}
        animate={{
          boxShadow: focused
            ? error
              ? '0 0 0 4px rgb(220 38 38 / 0.15)'
              : '0 0 0 4px rgb(59 130 246 / 0.18)'
            : '0 0 0 0px rgb(59 130 246 / 0)',
        }}
        transition={{ duration: 0.2 }}
      >
        {prefix && <span className="pointer-events-none absolute bottom-2 left-3 text-base font-medium text-neutral-500 md:text-sm">{prefix}</span>}
        <Input
          id={id}
          ref={setRefs}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn('h-14 pb-2 pt-6 transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0', focused && !error && 'border-ring', prefix && 'pl-12', className)}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            setFilled(e.target.value.length > 0)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setFilled(e.target.value.length > 0)
            onChange?.(e)
          }}
          {...rest}
        />
        <m.label
          htmlFor={id}
          className={cn('pointer-events-none absolute left-3 top-0 origin-left font-medium', error ? 'text-destructive' : focused ? 'text-primary-500' : 'text-neutral-500')}
          initial={false}
          animate={floated ? { y: 6, scale: 0.8 } : { y: 16, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {label}
        </m.label>
      </m.div>
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <m.p key="e" id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </m.p>
        ) : hint ? (
          <m.p key="h" id={`${id}-hint`} className="text-xs text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {hint}
          </m.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
})
