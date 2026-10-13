import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageSkeleton } from '@/components/states/Skeletons'
import { useProfile, useSession } from '@/hooks/useAuth'

export function RequireAuth() {
  const { session, ready } = useSession()
  const location = useLocation()
  if (!ready) return <div className="container py-8"><PageSkeleton /></div>
  if (!session) return <Navigate to="/onboard" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** UI guard only. Real enforcement is RLS + Edge Function role checks. */
export function RequireAdmin() {
  const profile = useProfile()
  if (profile.isLoading) return <PageSkeleton />
  if (profile.data?.user_type !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
