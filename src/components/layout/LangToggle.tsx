import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

export function LangToggle({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const t = useT()
  const toggle = useUiStore((s) => s.toggleLang)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn(onDark && 'text-primary-foreground hover:bg-primary-600', className)}
      aria-label="Switch language / भाषा बदला"
    >
      <Languages aria-hidden />
      <span>{t('langToggle')}</span>
    </Button>
  )
}
