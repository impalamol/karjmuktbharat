import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

interface Props {
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ error, onRetry, retrying, className }: Props) {
  const t = useT()
  const message = error instanceof Error ? error.message : undefined
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-pill bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <p className="font-semibold">{t('error_title')}</p>
      {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} loading={retrying}>
          {t('error_retry')}
        </Button>
      )}
    </div>
  )
}
