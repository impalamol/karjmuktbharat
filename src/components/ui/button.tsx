import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { m, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonMotion } from '@/lib/motion'

// shadcn/ui Button + Framer Motion press physics (hover 1.02, tap 0.98, spring 400/17).
// Every button has loading + disabled states and a 44px touch target on touch screens.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-card text-sm font-semibold transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none will-change-transform',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-600 active:bg-primary-800',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-600',
        /** Gold CTA with a soft glow on hover */
        glow: 'bg-secondary text-secondary-foreground shadow-md hover:shadow-[0_0_0_4px_rgb(255_183_3/0.25),0_12px_32px_-8px_rgb(255_183_3/0.6)]',
        success: 'bg-accent-700 text-accent-foreground shadow-sm hover:bg-accent-700/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-card text-foreground hover:border-primary-300 hover:bg-primary-50',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 px-4 py-2',
        sm: 'min-h-11 px-3 text-xs fine:md:min-h-8',
        lg: 'min-h-12 px-6 text-base',
        icon: 'size-11',
        pill: 'min-h-11 rounded-pill px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

const MotionSlot = m.create(Slot)

type NativeButton = Omit<HTMLMotionProps<'button'>, 'children'>

export interface ButtonProps extends NativeButton, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, disabled, children, type, ...props }, ref) => {
    const motionProps = disabled || loading ? {} : buttonMotion
    if (asChild) {
      return (
        <MotionSlot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...motionProps} {...(props as object)}>
          {children}
        </MotionSlot>
      )
    }
    return (
      <m.button
        ref={ref}
        type={type ?? 'button'}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </m.button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
