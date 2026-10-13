import { m, useReducedMotion } from 'framer-motion'
import { ArrowRight, Bell, GraduationCap, Home as HomeIcon, Landmark, LayoutGrid, LifeBuoy, ScanLine, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Topography } from './Backdrop'

/** Seeded candle heights for the analytics mockup (no randomness at render). */
const CANDLES = [
  [40, 62],
  [55, 48],
  [48, 70],
  [64, 58],
  [52, 76],
  [70, 66],
  [60, 84],
  [78, 72],
  [68, 90],
  [82, 78],
  [74, 94],
  [88, 86],
] as const

/** Visual-only iOS switch: mint track, black knob. */
export function MiniToggle({ on = true, className }: { on?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn('flex h-7 w-11 items-center rounded-pill border border-black/10 p-1', on ? 'justify-end bg-pastel-mintStrong' : 'justify-start bg-black/10', className)}>
      <span className={cn('size-5 rounded-pill shadow-sm', on ? 'bg-pastel-ink' : 'bg-white')} />
    </span>
  )
}

function TabBar() {
  return (
    <div className="absolute inset-x-2 bottom-2 flex h-12 items-center justify-around rounded-pill border border-black/5 bg-white shadow-md">
      <LayoutGrid className="size-4 text-black" />
      <LifeBuoy className="size-4 text-black/30" />
      <span className="-mt-6 flex size-10 items-center justify-center rounded-pill border-4 border-white bg-gradient-to-br from-pastel-violet to-pastel-blue">
        <ScanLine className="size-4 text-white" />
      </span>
      <Landmark className="size-4 text-black/30" />
      <UserRound className="size-4 text-black/30" />
    </div>
  )
}

function OnboardingScreen() {
  return (
    <div className="relative flex h-full flex-col justify-end gap-4 overflow-hidden bg-black p-4 text-white">
      <Topography />
      <span className="absolute -left-4 top-12 size-14 rounded-pill bg-pastel-beigeStrong" />
      <span className="absolute -right-6 top-20 size-24 rounded-pill bg-pastel-skyStrong" />
      <span className="absolute left-6 top-1/2 size-7 rounded-pill bg-pastel-lavender" />
      <span className="absolute right-12 top-12 size-3 rotate-45 rounded-sm bg-white" />
      <p className="relative text-3xl font-bold leading-tight">कर्ज से मुक्ति, भारत की प्रगति</p>
      <div className="relative flex items-center gap-2">
        <span className="grid size-10 shrink-0 grid-cols-2 place-content-center gap-1 rounded-pill border border-white/80 p-3">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="size-1 rounded-pill bg-white" />
          ))}
        </span>
        <span className="flex h-10 flex-1 items-center justify-between rounded-pill border border-white/80 pl-4 pr-1 text-xs font-semibold">
          Get Started
          <span className="flex size-7 items-center justify-center rounded-pill bg-white text-black">
            <ArrowRight className="size-3" />
          </span>
        </span>
      </div>
    </div>
  )
}

function DashboardScreen() {
  return (
    <div className="relative flex h-full flex-col gap-3 bg-white p-4 text-black">
      <div className="flex items-center justify-between">
        <span className="flex size-7 items-center justify-center rounded-pill bg-pastel-lavender text-xs font-bold">MP</span>
        <span className="flex size-7 items-center justify-center rounded-pill border border-black/10">
          <Bell className="size-3" />
        </span>
      </div>
      <div>
        <p className="text-xs text-black/50">Total Karj Mukti</p>
        <p className="text-3xl font-bold tracking-tight">
          ₹4,400 <span className="text-xs font-semibold text-black/50">Extra/mo</span>
        </p>
        <div className="mt-1 flex gap-1">
          <span className="rounded-pill bg-pastel-mint px-2 py-0.5 text-xs font-semibold text-pastel-mintInk">6 Varsha Vachle</span>
          <span className="rounded-pill bg-black/5 px-2 py-0.5 text-xs font-semibold">12L Vyaj Vachle</span>
        </div>
      </div>
      <p className="text-xs font-bold">My Block · 1,000 Users</p>
      {(
        [
          ['bg-pastel-mint', 'Borrower Pool', '₹30L'],
          ['bg-pastel-beige', 'CSR Pool', '₹70L'],
        ] as const
      ).map(([bg, title, amt]) => (
        <div key={title} className={cn('flex items-center gap-2 rounded-modal p-3', bg)}>
          <div className="flex-1">
            <p className="flex justify-between text-xs font-semibold">
              {title} <span className="font-bold">{amt}</span>
            </p>
            <p className="text-xs tracking-widest text-black/60">****9292</p>
          </div>
          <MiniToggle className="scale-75" />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-sm bg-pastel-beigeStrong">
          <HomeIcon className="size-3" />
        </span>
        <p className="flex-1 text-xs font-semibold leading-tight">
          Sunita T.<span className="block font-normal text-black/50">Ghar Vachavle · Nashik</span>
        </p>
        <span className="text-xs font-bold text-pastel-mintInk">₹5.2L</span>
      </div>
      <TabBar />
    </div>
  )
}

function AnalyticsScreen() {
  const reduce = useReducedMotion()
  return (
    <div className="flex h-full flex-col gap-3 bg-black p-4 text-white">
      <p className="text-xs text-white/50">Rescue Pool / Month</p>
      <p className="-mt-2 text-3xl font-bold tracking-tight">₹1,120Cr</p>
      <div className="flex rounded-pill bg-white/10 p-1 text-xs">
        <span className="flex-1 rounded-pill bg-white py-1 text-center font-semibold text-black">Daily</span>
        <span className="flex-1 py-1 text-center text-white/50">Weekly</span>
        <span className="flex-1 py-1 text-center text-white/50">Monthly</span>
      </div>
      <svg viewBox="0 0 240 120" className="h-24 w-full" aria-hidden>
        {CANDLES.map(([open, close], i) => {
          const up = close >= open
          const top = 120 - Math.max(open, close)
          const h = Math.abs(close - open) || 2
          return (
            <m.g key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.06 }}>
              <line x1={i * 20 + 10} x2={i * 20 + 10} y1={top - 8} y2={top + h + 8} stroke={up ? '#A8E6CF' : '#6B7280'} strokeWidth={1.2} />
              <rect x={i * 20 + 5} y={top} width={10} height={h} rx={2} fill={up ? '#A8E6CF' : '#6B7280'} />
            </m.g>
          )
        })}
      </svg>
      {(
        [
          [HomeIcon, 'Houses Saved', '22,400'],
          [GraduationCap, 'Students Saved', '11,333'],
        ] as const
      ).map(([Icon, label, val]) => (
        <div key={label} className="flex items-center gap-2 rounded-pill bg-white/10 p-1 pr-3">
          <span className="flex size-7 items-center justify-center rounded-pill bg-pastel-mintStrong text-black">
            <Icon className="size-3" />
          </span>
          <span className="flex-1 text-xs text-white/50">{label}</span>
          <span className="text-sm font-bold">{val}</span>
        </div>
      ))}
      <div className="flex flex-col gap-1 rounded-modal bg-white/10 p-3 text-xs">
        <p className="font-semibold">Pool Breakdown</p>
        <p className="flex justify-between text-white/50">
          Rescue 80% <span className="font-bold text-white">₹1,120Cr</span>
        </p>
        <span className="h-1 w-full rounded-pill bg-white/10">
          <span className="block h-1 w-4/5 rounded-pill bg-pastel-mintStrong" />
        </span>
      </div>
    </div>
  )
}

const SCREENS = { onboarding: OnboardingScreen, dashboard: DashboardScreen, analytics: AnalyticsScreen }

/** iPhone-style frame: 40px radius, black bezel, dynamic island. */
export function Phone({ screen, className }: { screen: keyof typeof SCREENS; className?: string }) {
  const Screen = SCREENS[screen]
  return (
    <div className={cn('h-phone-h w-phone rounded-frame border-4 border-white/20 bg-black p-1 shadow-lg ring-1 ring-white/10', className)}>
      <div className="relative h-full overflow-hidden rounded-bento">
        <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-pill bg-black" />
        <div className="h-full pt-8">
          <Screen />
        </div>
      </div>
    </div>
  )
}

/** Three floating phones: onboarding (left), dashboard (front), analytics (right). */
export function PhoneTrio() {
  const reduce = useReducedMotion()
  const float = (delay: number) => (reduce ? {} : { animate: { y: [0, -15, 0] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const, delay } })
  return (
    <div className="relative mx-auto h-96 w-full max-w-xl sm:h-phone-h" aria-label="KarjMukt app screens: onboarding, dashboard and rescue analytics" role="img">
      <div className="absolute inset-x-0 top-0 h-phone-h origin-top scale-75 sm:scale-100">
        <m.div initial={{ opacity: 0, x: 60, rotate: 0 }} animate={{ opacity: 1, x: 0, rotate: -8 }} transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.3 }} className="absolute left-1/2 top-8"
          style={{ marginLeft: -308 }}>
          <m.div {...float(0.4)}>
            <Phone screen="onboarding" />
          </m.div>
        </m.div>
        <m.div initial={{ opacity: 0, x: -60, rotate: 0 }} animate={{ opacity: 1, x: 0, rotate: 8 }} transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.45 }} className="absolute left-1/2 top-8"
          style={{ marginLeft: 84 }}>
          <m.div {...float(1.2)}>
            <Phone screen="analytics" />
          </m.div>
        </m.div>
        <m.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.15 }} className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <m.div {...float(0)}>
            <Phone screen="dashboard" />
          </m.div>
        </m.div>
      </div>
    </div>
  )
}
