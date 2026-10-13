import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { m, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardHover } from '@/lib/motion'

// Every card: border + shadow-sm, and on hover lifts 4px, gains shadow-lg and a blue border (300ms).
const cardVariants = cva(
  'rounded-card border text-card-foreground shadow-sm transition-[box-shadow,border-color] duration-300 ease-out hover:shadow-lg',
  {
    variants: {
      variant: {
        default: 'border-border bg-card hover:border-primary-200 dark:hover:border-white/20',
        /** Glassmorphism: backdrop-blur-xl + bg-white/80 + border-white/20 */
        glass: 'border-border/60 bg-glass/80 backdrop-blur-xl supports-[backdrop-filter]:bg-glass/70 hover:border-primary-200/60 dark:border-white/10 dark:hover:border-white/20',
        /** Trust Blue feature card */
        brand: 'border-[#0F2C61] bg-[#0F2C61] text-white hover:border-secondary/60 dark:border-white/10 dark:bg-[#0B1530]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface CardProps extends HTMLMotionProps<'div'>, VariantProps<typeof cardVariants> {
  /** Disable hover lift (e.g. for full-width tables) */
  static?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, static: isStatic, ...props }, ref) => (
  <m.div ref={ref} className={cn(cardVariants({ variant }), className)} {...(isStatic ? {} : cardHover)} {...props} />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 p-4 md:p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-semibold leading-tight tracking-tight', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0 md:p-6 md:pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-4 pt-0 md:p-6 md:pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
