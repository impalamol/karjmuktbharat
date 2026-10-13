import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export type LottieName = 'empty' | 'verifying' | 'success'

const loaders: Record<LottieName, () => Promise<{ default: object }>> = {
  empty: () => import('@/assets/lottie/empty.json'),
  verifying: () => import('@/assets/lottie/verifying.json'),
  success: () => import('@/assets/lottie/success.json'),
}

/** Lottie player. This file (and lottie-web) is a lazy chunk; animation JSON loads on demand. */
export default function LottieAnim({ name, className, loop = true }: { name: LottieName; className?: string; loop?: boolean }) {
  const [data, setData] = useState<object | null>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    let alive = true
    void loaders[name]().then((m) => alive && setData(m.default))
    return () => {
      alive = false
    }
  }, [name])
  if (!data) return <div className={className} />
  return <Lottie animationData={data} loop={loop && !reduce} autoplay={!reduce} className={className} aria-hidden rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }} />
}
