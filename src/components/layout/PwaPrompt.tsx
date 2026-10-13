import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

export function PwaPrompt() {
  const t = useT()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })
  if (!needRefresh) return null
  return (
    <div role="status" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-card border border-border bg-card p-3 shadow-lg md:bottom-6">
      <span className="text-sm">{t('update_available')}</span>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        <RefreshCw aria-hidden /> {t('reload')}
      </Button>
    </div>
  )
}
