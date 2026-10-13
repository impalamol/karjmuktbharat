import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { PageSkeleton } from '@/components/states/Skeletons'
import { ErrorBoundary } from '@/components/states/ErrorBoundary'
import { useSession } from '@/hooks/useAuth'
import { useT } from '@/i18n'
import { ThemeToggle } from './ThemeToggle'
import { OfflineBanner } from './OfflineBanner'
import { AnimatedOutlet } from './AnimatedOutlet'

export function PublicLayout() {
  const t = useT()
  const { session } = useSession()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-2 md:h-16">
          <Link to="/" aria-label="KARJMUKTBHARAT home" className="rounded-card">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <Button asChild size="sm" className="rounded-pill">
                <Link to="/dashboard">{t('nav_dashboard')}</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="hidden rounded-pill sm:inline-flex">
                <Link to="/onboard">{t('nav_join')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main id="main" className="flex-1 pt-14 md:pt-16">
        <ErrorBoundary>
          <Suspense fallback={<div className="container py-8"><PageSkeleton /></div>}>
            <AnimatedOutlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-border/60 bg-background">
        <div className="container grid gap-8 py-16 md:grid-cols-[2fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">{t('footer_note')}</p>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-1 text-sm">
            <p className="pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Product</p>
            <Link className="inline-flex min-h-11 items-center hover:text-secondary-800" to="/onboard">{t('nav_join')}</Link>
            <a className="inline-flex min-h-11 items-center hover:text-secondary-800" href="/#story">How it works</a>
            <a className="inline-flex min-h-11 items-center hover:text-secondary-800" href="/#faq">FAQs</a>
          </nav>
          <nav aria-label="Account" className="flex flex-col gap-1 text-sm">
            <p className="pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Account</p>
            <Link className="inline-flex min-h-11 items-center hover:text-secondary-800" to="/dashboard">{t('nav_dashboard')}</Link>
            <Link className="inline-flex min-h-11 items-center hover:text-secondary-800" to="/refer">{t('nav_refer')}</Link>
          </nav>
        </div>
        <div className="container flex flex-col gap-2 border-t border-border/60 py-6 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} karjmuktbharat.com. {t('footer_rights')}</p>
          <p>{t('motto')}</p>
        </div>
      </footer>
    </div>
  )
}
