import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { PageSkeleton } from '@/components/states/Skeletons'
import { ErrorBoundary } from '@/components/states/ErrorBoundary'
import { useSession } from '@/hooks/useAuth'
import { useT } from '@/i18n'
import { LangToggle } from './LangToggle'
import { OfflineBanner } from './OfflineBanner'

export function PublicLayout() {
  const t = useT()
  const { session } = useSession()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-primary-800 bg-primary text-primary-foreground shadow-md">
        <div className="container flex h-14 items-center justify-between gap-2 md:h-16">
          <Link to="/" aria-label="KARJMUKTBHARAT home" className="rounded-card">
            <Logo className="[&_span]:text-primary-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle onDark />
            {session ? (
              <Button asChild variant="secondary" size="sm">
                <Link to="/dashboard">{t('nav_dashboard')}</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                <Link to="/onboard">{t('nav_join')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main id="main" className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<div className="container py-8"><PageSkeleton /></div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col gap-2 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <Logo />
            <p>{t('footer_note')}</p>
          </div>
          <p>© {new Date().getFullYear()} karjmuktbharat.com. {t('footer_rights')}</p>
        </div>
      </footer>
    </div>
  )
}
