import { lazy, useEffect } from 'react'
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'framer-motion'
import { queryClient } from '@/lib/queryClient'
import { isConfigured } from '@/lib/env'
import { useAuthBootstrap } from '@/hooks/useAuth'
import { applyTheme, useUiStore } from '@/stores/ui'
import { useT } from '@/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PwaPrompt } from '@/components/layout/PwaPrompt'
import { RequireAdmin, RequireAuth } from '@/components/auth/Guards'

// Animation features (incl. drag + layout) load async after first paint.
const loadMotionFeatures = () => import('@/lib/motion-features').then((r) => r.default)

// Every page is its own chunk.
const Landing = lazy(() => import('@/pages/Landing'))
const Onboard = lazy(() => import('@/pages/Onboard'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Bank = lazy(() => import('@/pages/Bank'))
const Refer = lazy(() => import('@/pages/Refer'))
const Admin = lazy(() => import('@/pages/Admin'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Demo builds are hosted where the server can't rewrite deep links, so they route by #hash.
const createRouter = import.meta.env.MODE === 'demo' ? createHashRouter : createBrowserRouter
const router = createRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/onboard', element: <Onboard /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/bank', element: <Bank /> },
          { path: '/refer', element: <Refer /> },
          { element: <RequireAdmin />, children: [{ path: '/admin', element: <Admin /> }] },
        ],
      },
    ],
  },
])

function Boot() {
  useAuthBootstrap()
  const theme = useUiStore((s) => s.theme)
  const t = useT()
  useEffect(() => applyTheme(theme), [theme])
  return (
    <>
      {!isConfigured && (
        <div role="status" className="bg-warning px-4 py-2 text-center text-xs font-medium text-warning-foreground">
          {t('not_configured')}
        </div>
      )}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <PwaPrompt />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <Boot />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  )
}
