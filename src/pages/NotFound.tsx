import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { useT } from '@/i18n'

export default function NotFound() {
  const t = useT()
  return (
    <div className="container py-16">
      <EmptyState
        icon={Compass}
        title={t('not_found')}
        action={
          <Button asChild>
            <Link to="/">{t('nav_home')}</Link>
          </Button>
        }
      />
    </div>
  )
}
