import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { PageSkeleton } from '@/components/states/Skeletons'
import { ErrorBoundary } from '@/components/states/ErrorBoundary'
import { useProfile } from '@/hooks/useAuth'
import { useT } from '@/i18n'
import { signOut } from '@/lib/supabase'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import { NAV } from './nav'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { LangToggle } from './LangToggle'
import { OfflineBanner } from './OfflineBanner'

/** Authenticated layout: bottom nav (<768), collapsible sidebar (768-1024), fixed 280px sidebar (>1024). */
export function AppShell() {
  const t = useT()
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const items = NAV.filter((n) => !n.adminOnly || profile?.user_type === 'admin')

  const logout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-dvh">
      <Sidebar items={items} onLogout={logout} />

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-primary px-4 text-primary-foreground shadow-md md:hidden">
        <Logo className="[&_span]:text-primary-foreground" />
        <div className="flex items-center gap-1">
          <LangToggle onDark />
          <Button variant="ghost" size="icon" onClick={logout} aria-label={t('nav_logout')} className="text-primary-foreground hover:bg-primary-600">
            <LogOut aria-hidden />
          </Button>
        </div>
      </header>

      <div className={cn('transition-[padding] duration-200', collapsed ? 'md:pl-20 lg:pl-70' : 'md:pl-70')}>
        <OfflineBanner />
        <main id="main" className="container pb-bottom-nav pt-4 md:pb-8 md:pt-6 xl:pt-8">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  )
}
