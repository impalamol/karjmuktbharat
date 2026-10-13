import { Text, type TextProps } from 'react-native'
import { cn } from '@/lib/cn'

type Variant = 'hero' | 'amount' | 'title' | 'body' | 'label' | 'small'

/** Type scale from the reference: huge tight amounts, medium body, 12px gray small print. */
const variants: Record<Variant, string> = {
  hero: 'font-heavy text-[40px] leading-[44px] tracking-[-0.8px]',
  amount: 'font-heavy text-[36px] leading-[42px] tracking-[-0.72px]',
  title: 'font-heavy text-xl tracking-[-0.2px]',
  body: 'font-body text-[15px] leading-[22px]',
  label: 'font-semi text-sm',
  small: 'font-body text-xs text-gray-500',
}

export function T({ variant = 'body', className, ...props }: TextProps & { variant?: Variant; className?: string }) {
  return <Text className={cn('text-ink', variants[variant], className)} {...props} />
}
