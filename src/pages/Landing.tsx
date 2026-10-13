import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  Gift,
  GraduationCap,
  HeartHandshake,
  Home as HomeIcon,
  Landmark,
  Lock,
  ReceiptText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SpringCounter } from '@/components/brand/SpringCounter'
import { usePlatformStats } from '@/hooks/queries'
import { calculateBlockBreakdown, calculateRegularPerUser, calculateTargetTotals } from '@/lib/calculations'
import { formatCompactINR, formatCompactNumber, formatINR, formatNumber } from '@/lib/format'
import { fadeUp, float, reveal, staggerContainer } from '@/lib/motion'
import { isConfigured } from '@/lib/env'
import { cn } from '@/lib/utils'
import { darkColors } from '@/lib/design-tokens'
import { useThemeColors } from '@/lib/theme'

const HERO_YEARS = 7
const edu = calculateBlockBreakdown('education')
const home = calculateBlockBreakdown('home')

/**
 * CRED-inspired landing: a dark editorial page (with a light theme) built from
 * full-bleed sections, serif display type and scroll-linked motion.
 */
export default function Landing() {
  return (
    <div className="-mt-14 md:-mt-16">
      <Hero />
      <Manifesto />
      <Showcase />
      <PoolRing />
      <Products />
      <Rescue />
      <Security />
      <Proof />
      <Door />
      <Faq />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground', className)}>{children}</p>
}

function Display({ children, className, as: Tag = 'h2', id }: { children: React.ReactNode; className?: string; as?: 'h1' | 'h2'; id?: string }) {
  return (
    <Tag id={id} className={cn('font-display font-semibold tracking-tight text-foreground', className)}>
      {children}
    </Tag>
  )
}

/** Paragraph whose words light up one by one as it scrolls through the viewport. */
function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={cn('flex flex-wrap font-display', className)}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} still={!!reduce}>
          {w}
        </Word>
      ))}
    </p>
  )
}

function Word({ progress, range, still, children }: { progress: MotionValue<number>; range: [number, number]; still: boolean; children: string }) {
  const opacity = useTransform(progress, range, still ? [1, 1] : [0.18, 1])
  return (
    <m.span style={{ opacity }} className="mr-[0.28em]">
      {children}
    </m.span>
  )
}

// ---------------------------------------------------------------------------
// 1. Hero: corridor of light, serif headline, parallax, spring counter
// ---------------------------------------------------------------------------
function Corridor() {
  const pillars = 'repeating-linear-gradient(90deg, rgb(var(--neutral-200)) 0 34px, rgb(var(--neutral-100)) 34px 40px, transparent 40px 78px)'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [perspective:900px]">
      <div className="absolute inset-y-0 left-0 w-1/2 origin-left [transform:rotateY(62deg)]" style={{ backgroundImage: pillars }} />
      <div className="absolute inset-y-0 right-0 w-1/2 origin-right [transform:rotateY(-62deg)]" style={{ backgroundImage: pillars }} />
      <m.div
        className="absolute bottom-0 left-1/2 h-3/4 w-2/3 -translate-x-1/2 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(255_183_3/0.35),transparent)]"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_45%,transparent,rgb(var(--background))_85%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background" />
    </div>
  )
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroTotal = calculateRegularPerUser('education') * 12 * HERO_YEARS

  return (
    <section ref={ref} className="relative isolate flex min-h-dvh items-center overflow-hidden pt-16" aria-labelledby="hero-title">
      <Corridor />
      <m.div style={{ y, opacity }} className="container relative flex flex-col items-center gap-6 py-16 text-center" initial="hidden" animate="show" variants={staggerContainer(0.1, 0.1)}>
        <m.div variants={fadeUp}>
          <Badge variant="outline" className="gap-2 rounded-pill border-border/60 bg-background/40 px-4 py-1 backdrop-blur-xl">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-pill bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-pill bg-accent" />
            </span>
            Karj Se Mukti, Bharat Ki Pragati
          </Badge>
        </m.div>
        <m.div variants={fadeUp}>
          <Display as="h1" id="hero-title" className="max-w-4xl text-6xl lg:text-7xl">
            crafted for those
            <br />
            <span className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">who repay.</span>
          </Display>
        </m.div>
        <m.p variants={fadeUp} className="max-w-xl text-base text-muted-foreground md:text-lg">
          KARJMUKTBHARAT is a members-only community of verified borrowers. Together with CSR partners, we pay your education or home loan down
          every month, straight into your bank loan account.
        </m.p>
        <m.div variants={fadeUp} className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="glow" className="w-full rounded-pill sm:w-auto">
            <Link to="/onboard">
              Join your block <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full rounded-pill sm:w-auto">
            <a href="#story">See how it works</a>
          </Button>
        </m.div>
        <m.div variants={fadeUp} className="flex flex-col items-center gap-1 pt-6">
          <SpringCounter value={heroTotal} format={formatINR} className="font-display text-4xl font-semibold tabular text-secondary-800 md:text-5xl" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            extra paid into an education loan over {HERO_YEARS} years
          </span>
        </m.div>
      </m.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 2. Manifesto: words light up on scroll
// ---------------------------------------------------------------------------
function Manifesto() {
  return (
    <section id="story" className="scroll-mt-16 py-16" aria-label="Our story">
      <div className="container flex max-w-4xl flex-col gap-8">
        <Eyebrow>not every loan should take a lifetime.</Eyebrow>
        <ScrollText
          className="text-3xl leading-tight md:text-5xl"
          text="the story of karjmuktbharat begins with trust. we believe people who repay their loans every month deserve better: shorter loans, less interest, and a community that has their back. one block. one thousand borrowers. one crore every month. this is the status quo we're breaking."
        />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 3. Showcase: three phones fan out on scroll
// ---------------------------------------------------------------------------
function PhoneScreen({ variant }: { variant: 'loan' | 'block' | 'proof' }) {
  return (
    <div className="dark flex h-full flex-col gap-3 bg-background p-4 text-foreground">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>9:41</span>
        <span className="font-semibold text-secondary">KARJMUKT</span>
      </div>
      {variant === 'loan' && (
        <>
          <p className="text-xs text-muted-foreground">loan closed</p>
          <div className="relative mx-auto size-24">
            <svg viewBox="0 0 100 100" className="size-24 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke={darkColors.neutral[200]} strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={darkColors.accent[700]} strokeWidth="8" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="160" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">39%</span>
          </div>
          <div className="rounded-card bg-neutral-100 p-3">
            <p className="text-xs text-muted-foreground">interest saved</p>
            <p className="text-lg font-bold text-accent-700">₹1,61,158</p>
          </div>
          <div className="rounded-card bg-neutral-100 p-3">
            <p className="text-xs text-muted-foreground">next credit</p>
            <p className="text-lg font-bold">+₹3,200</p>
          </div>
        </>
      )}
      {variant === 'block' && (
        <>
          <p className="text-xs text-muted-foreground">block #42 · 640 / 1,000</p>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 64 }, (_, i) => (
              <span key={i} className={cn('aspect-square rounded-pill', i === 27 ? 'bg-secondary' : i < 41 ? 'bg-primary-500' : 'border border-dashed border-neutral-400')} />
            ))}
          </div>
          <div className="rounded-card bg-neutral-100 p-3">
            <p className="text-xs text-muted-foreground">rescued this month</p>
            <p className="text-lg font-bold">22 students</p>
          </div>
        </>
      )}
      {variant === 'proof' && (
        <>
          <p className="text-xs text-muted-foreground">payment proof</p>
          {[3200, 3200, 1500, 3200, 3200].map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-card bg-neutral-100 px-3 py-2 text-xs">
              <span className="font-mono text-muted-foreground">UTR ···{4821 + i}</span>
              <span className={a === 1500 ? 'font-semibold' : 'font-semibold text-accent-700'}>{a === 1500 ? '-' : '+'}₹{a.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function Phone({ variant, className, style }: { variant: 'loan' | 'block' | 'proof'; className?: string; style?: React.ComponentProps<typeof m.div>['style'] }) {
  return (
    <m.div
      style={style}
      className={cn('absolute aspect-[9/19] w-48 overflow-hidden rounded-[2.25rem] border-[6px] border-neutral-800 bg-black shadow-lg ring-1 ring-white/10 md:w-56', className)}
    >
      <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-pill bg-black" />
      <div className="h-full pt-6">
        <PhoneScreen variant={variant} />
      </div>
    </m.div>
  )
}

function Showcase() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const spread = useTransform(scrollYProgress, [0, 1], [0, reduce ? 1 : 1])
  const leftX = useTransform(spread, [0, 1], ['-10%', '-78%'])
  const rightX = useTransform(spread, [0, 1], ['10%', '78%'])
  const sideRotate = useTransform(scrollYProgress, [0, 1], [0, 12])
  const negRotate = useTransform(sideRotate, (r) => -r)
  const centerY = useTransform(scrollYProgress, [0, 1], [80, 0])

  return (
    <section ref={ref} className="relative overflow-hidden py-16" aria-labelledby="showcase-title">
      <div className="container flex flex-col items-center gap-12">
        <div aria-hidden className="relative h-[460px] w-full max-w-md md:h-[540px]">
          <div className="absolute inset-0 flex justify-center">
            <Phone variant="proof" className="top-8 opacity-80" style={{ x: leftX, rotate: negRotate }} />
            <Phone variant="block" className="top-8 opacity-80" style={{ x: rightX, rotate: sideRotate }} />
            <Phone variant="loan" className="z-10 shadow-[0_40px_80px_-20px_rgb(255_183_3/0.35)]" style={{ y: centerY }} />
          </div>
        </div>
        <m.div {...reveal} variants={staggerContainer(0.1)} className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <m.div variants={fadeUp}>
            <Display id="showcase-title" className="text-5xl">
              all that you deserve.
              <br />
              and some more.
            </Display>
          </m.div>
          <m.p variants={fadeUp} className="text-muted-foreground">
            Once you are a member, every month moves your loan closer to zero. Watch your closure ring fill, your block grow and every rupee
            arrive with a UTR you can verify.
          </m.p>
        </m.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 4. Pool ring: a slowly turning segmented ring with the block maths
// ---------------------------------------------------------------------------
const SEGMENTS = 48

function PoolRing() {
  const reduce = useReducedMotion()
  const c = useThemeColors()
  return (
    <section className="relative overflow-hidden py-16" aria-labelledby="ring-title">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <m.div {...reveal} variants={staggerContainer(0.1)} className="flex flex-col gap-4">
          <m.div variants={fadeUp}>
            <Display id="ring-title" className="text-5xl">
              do more with
              <br />
              your loan.
            </Display>
          </m.div>
          <m.p variants={fadeUp} className="max-w-md text-muted-foreground">
            Every month 1,000 members and our CSR partners fill a {formatCompactINR(edu.totalPool)} block. 80% of the CSR money rescues families
            facing auction. The rest goes straight into every member's loan account.
          </m.p>
          <m.dl variants={fadeUp} className="grid max-w-md grid-cols-2 gap-4 pt-2">
            {[
              ['Education block', `+${formatINR(edu.regularPerUser)}/mo`],
              ['Home block', `+${formatINR(home.regularPerUser)}/mo`],
              ['Students rescued', `${edu.rescueCapacity} per block`],
              ['Homes rescued', `${home.rescueCapacity} per block`],
            ].map(([k, v]) => (
              <div key={k} className="border-l-2 border-secondary pl-3">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="text-lg font-semibold tabular">{v}</dd>
              </div>
            ))}
          </m.dl>
        </m.div>
        <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-[18%] rounded-pill bg-[radial-gradient(circle,rgb(255_183_3/0.18),transparent_70%)]" />
          <m.svg viewBox="0 0 200 200" className="absolute inset-0" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const hot = i % 12 < 3
              return (
                <rect
                  key={i}
                  x="97"
                  y="6"
                  width="6"
                  height="26"
                  rx="2"
                  transform={`rotate(${(i * 360) / SEGMENTS} 100 100)`}
                  fill={hot ? (i % 24 < 3 ? '#FFB703' : '#10B981') : c.neutral[300]}
                  opacity={hot ? 1 : 0.7}
                />
              )
            })}
          </m.svg>
          <m.svg viewBox="0 0 200 200" className="absolute inset-[16%]" animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}>
            {Array.from({ length: 36 }, (_, i) => (
              <rect key={i} x="98" y="8" width="4" height="14" rx="2" transform={`rotate(${i * 10} 100 100)`} fill={c.neutral[400]} opacity={0.5} />
            ))}
          </m.svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-semibold">₹1 Cr</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">per block, monthly</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 5. Products: horizontal snap carousel of vivid cards
// ---------------------------------------------------------------------------
interface Product {
  eyebrow: string
  title: string
  icon: LucideIcon
  art: string
  glow: string
}

const PRODUCTS: Product[] = [
  {
    eyebrow: 'education block',
    title: `+${formatINR(edu.regularPerUser)} every month into your education loan`,
    icon: GraduationCap,
    art: 'bg-[radial-gradient(80%_60%_at_50%_100%,#C026D3,#4C0D5C_55%,#0A0A0C)]',
    glow: 'shadow-[0_0_60px_rgb(192_38_211/0.6)]',
  },
  {
    eyebrow: 'home block',
    title: `+${formatINR(home.regularPerUser)} every month into your home loan`,
    icon: HomeIcon,
    art: 'bg-[radial-gradient(80%_60%_at_50%_100%,#7C3AED,#2E1065_55%,#0A0A0C)]',
    glow: 'shadow-[0_0_60px_rgb(124_58_237/0.6)]',
  },
  {
    eyebrow: 'rescue fund',
    title: '80% of CSR money saves families from auction',
    icon: HeartHandshake,
    art: 'bg-[radial-gradient(80%_60%_at_50%_100%,#10B981,#064E3B_55%,#0A0A0C)]',
    glow: 'shadow-[0_0_60px_rgb(16_185_129/0.6)]',
  },
  {
    eyebrow: 'direct to bank',
    title: 'no wallet. every rupee lands with a UTR',
    icon: ReceiptText,
    art: 'bg-[radial-gradient(80%_60%_at_50%_100%,#2563EB,#172554_55%,#0A0A0C)]',
    glow: 'shadow-[0_0_60px_rgb(37_99_235/0.6)]',
  },
  {
    eyebrow: 'diwali draw',
    title: 'one member wins an EMI paid in full',
    icon: Gift,
    art: 'bg-[radial-gradient(80%_60%_at_50%_100%,#F59E0B,#78350F_55%,#0A0A0C)]',
    glow: 'shadow-[0_0_60px_rgb(245_158_11/0.6)]',
  },
]

function Products() {
  return (
    <section className="py-16" aria-labelledby="products-title">
      <div className="container flex flex-col gap-8">
        <m.div {...reveal} variants={fadeUp}>
          <Display id="products-title" className="text-5xl">
            pay it off.
            <br />
            bit by bit.
          </Display>
        </m.div>
      </div>
      <m.ul
        {...reveal}
        variants={staggerContainer(0.1)}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:px-6 xl:px-8 2xl:px-[calc((100vw_-_1440px)/2_+_2rem)]"
        aria-label="What members get"
      >
        {PRODUCTS.map((p, i) => (
          <m.li key={p.eyebrow} variants={fadeUp} className="shrink-0 snap-start">
            <m.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={cn('dark relative flex h-[420px] w-64 flex-col overflow-hidden rounded-modal border border-white/10 p-6 text-foreground md:w-80', p.art)}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                <p.icon className="size-4" aria-hidden /> {p.eyebrow}
              </span>
              <p className="pt-4 text-xl font-semibold leading-snug text-white">{p.title}</p>
              <Link to="/onboard" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-white">
                know more <ArrowRight className="size-3" aria-hidden />
              </Link>
              <m.div {...float(i * 0.4)} className="mt-auto flex justify-center">
                <span className={cn('flex size-24 items-center justify-center rounded-pill border border-white/20 bg-white/10 backdrop-blur-xl', p.glow)}>
                  <p.icon className="size-10 text-white" aria-hidden />
                </span>
              </m.div>
            </m.div>
          </m.li>
        ))}
      </m.ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 6. Rescue: floating spheres + live counters
// ---------------------------------------------------------------------------
const SPHERES = [
  { size: 'size-24 md:size-48', pos: 'left-[-4%] top-[8%]', delay: 0 },
  { size: 'size-16 md:size-24', pos: 'left-[22%] top-[2%]', delay: 0.8 },
  { size: 'size-20 md:size-48', pos: 'right-[-2%] top-[4%]', delay: 0.4 },
  { size: 'size-10 md:size-16', pos: 'right-[24%] top-[18%]', delay: 1.6 },
  { size: 'size-20 md:size-48', pos: 'left-[6%] bottom-[2%]', delay: 1.2 },
  { size: 'size-24 md:size-48', pos: 'right-[4%] bottom-[-6%]', delay: 2 },
]

function Rescue() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, reduce ? 0 : -60])
  const { totals, rescued, paidOut, isLoading } = usePlatformStats()
  const stats = [
    { label: 'members', value: totals.users, fmt: formatCompactNumber, icon: Users },
    { label: 'blocks', value: totals.blocks, fmt: formatNumber, icon: BadgeCheck },
    { label: 'families rescued', value: rescued, fmt: formatNumber, icon: ShieldCheck },
    { label: 'paid to loan accounts', value: paidOut, fmt: formatCompactINR, icon: Landmark },
  ]

  return (
    <section ref={ref} className="relative isolate overflow-hidden py-16" aria-labelledby="rescue-title">
      <m.div aria-hidden style={{ y }} className="pointer-events-none absolute inset-0 -z-10">
        {SPHERES.map((s, i) => (
          <m.span
            key={i}
            {...float(s.delay)}
            className={cn(
              'absolute rounded-pill bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255/0.95),rgb(var(--neutral-400))_35%,rgb(var(--neutral-200))_70%,rgb(var(--neutral-100)))] shadow-lg',
              s.size,
              s.pos,
            )}
          />
        ))}
      </m.div>
      <div className="container flex flex-col items-center gap-8 py-16 text-center">
        <m.div {...reveal} variants={fadeUp}>
          <Display id="rescue-title" className="text-6xl">
            feel the odds fall
            <br />
            in your favour.
          </Display>
        </m.div>
        <m.p {...reveal} variants={fadeUp} className="max-w-lg text-muted-foreground">
          When a member's home or degree is at risk, the block steps in. Every month each block rescues {edu.rescueCapacity} students or{' '}
          {home.rescueCapacity} homes before the bank's deadline.
        </m.p>
        <m.dl {...reveal} variants={staggerContainer(0.08)} className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ label, value, fmt, icon: Icon }) => (
            <m.div key={label} variants={fadeUp} className="flex flex-col items-center gap-2 rounded-modal border border-border/60 bg-glass/70 p-4 backdrop-blur-xl">
              <Icon className="size-5 text-secondary-800" aria-hidden />
              <dd className="order-2">
                {isLoading && isConfigured ? <Skeleton className="h-8 w-20" /> : <SpringCounter value={value} format={fmt} className="font-display text-3xl font-semibold tabular" />}
              </dd>
              <dt className="order-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
            </m.div>
          ))}
        </m.dl>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 7. Security
// ---------------------------------------------------------------------------
function Security() {
  const chips: [LucideIcon, string][] = [
    [Lock, 'AES-256 encryption'],
    [Fingerprint, 'OTP + 2FA on payouts'],
    [ShieldCheck, 'Aadhaar: last 4 digits only'],
    [ReceiptText, 'Audit log on every rupee'],
  ]
  return (
    <section className="py-16" aria-labelledby="security-title">
      <div className="container flex max-w-4xl flex-col items-center gap-8 text-center">
        <m.span
          {...reveal}
          variants={{ hidden: { scale: 0.6, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 18 } } }}
          className="flex size-16 items-center justify-center rounded-modal border border-border bg-card shadow-md"
        >
          <Lock className="size-6 text-secondary-800" aria-hidden />
        </m.span>
        <Eyebrow>
          <span id="security-title">your data isn't our business. keeping it safe is.</span>
        </Eyebrow>
        <ScrollText
          className="justify-center text-2xl leading-snug text-muted-foreground md:text-4xl"
          text="your loan account and aadhaar are encrypted and locked away. no wallet, no middleman, no room for mistakes. money only ever moves to the bank account your bank verified."
        />
        <m.ul {...reveal} variants={staggerContainer(0.06)} className="flex flex-wrap justify-center gap-2">
          {chips.map(([Icon, label]) => (
            <m.li key={label} variants={fadeUp} className="flex items-center gap-2 rounded-pill border border-border px-4 py-2 text-xs font-medium">
              <Icon className="size-4 text-accent-700" aria-hidden /> {label}
            </m.li>
          ))}
        </m.ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 8. Proof: the maths at full scale
// ---------------------------------------------------------------------------
function Proof() {
  const at = calculateTargetTotals()
  const numbers = [
    { value: at.users, fmt: formatCompactNumber, label: 'members at full scale' },
    { value: at.monthlyPool, fmt: formatCompactINR, label: 'pooled every month' },
    { value: at.monthlyRescueCapacity, fmt: formatNumber, label: 'families rescued monthly' },
  ]
  return (
    <section className="border-y border-border/60 py-16" aria-labelledby="proof-title">
      <div className="container grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
        <m.div {...reveal} variants={fadeUp} className="flex flex-col gap-2">
          <Eyebrow>built for 25 lakh members</Eyebrow>
          <Display id="proof-title" className="text-5xl">
            the maths
            <br />
            writes itself.
          </Display>
        </m.div>
        <m.dl {...reveal} variants={staggerContainer(0.1)} className="grid gap-6 sm:grid-cols-3">
          {numbers.map((n) => (
            <m.div key={n.label} variants={fadeUp} className="flex flex-col gap-1">
              <dd className="order-1">
                <SpringCounter value={n.value} format={n.fmt} className="whitespace-nowrap font-display text-4xl font-semibold tabular md:text-5xl" />
              </dd>
              <dt className="order-2 text-xs uppercase tracking-wider text-muted-foreground">{n.label}</dt>
            </m.div>
          ))}
        </m.dl>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 9. Door of light: opens wider as you scroll
// ---------------------------------------------------------------------------
function Door() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const scaleX = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.2, 1])
  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 1])

  return (
    <section ref={ref} className="relative overflow-hidden py-16" aria-labelledby="door-title">
      <div className="container grid items-center gap-12 md:grid-cols-2">
        <div aria-hidden className="relative flex h-[420px] justify-center md:h-[520px]">
          <m.div style={{ opacity: glow }} className="absolute inset-y-0 left-1/2 w-full -translate-x-1/2 bg-[radial-gradient(40%_50%_at_50%_50%,rgb(255_183_3/0.35),transparent)]" />
          <m.div
            style={{ scaleX }}
            className="relative h-full w-24 rounded-t-card bg-gradient-to-b from-white via-secondary-100 to-secondary shadow-[0_0_120px_40px_rgb(255_183_3/0.45)]"
          />
          <div className="absolute bottom-0 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-pill bg-secondary/30 blur-xl" />
        </div>
        <m.div {...reveal} variants={staggerContainer(0.1)} className="flex flex-col gap-4">
          <m.div variants={fadeUp}>
            <Display id="door-title" className="text-6xl">
              not everyone
              <br />
              gets it.
            </Display>
          </m.div>
          <m.p variants={fadeUp} className="max-w-md text-muted-foreground">
            Membership is for borrowers with a verified education or home loan. Once you are in, 999 others and our CSR partners pay your loan down
            with you, every single month.
          </m.p>
          <m.div variants={fadeUp}>
            <Button asChild size="lg" variant="glow" className="rounded-pill">
              <Link to="/onboard">
                Check if you qualify <ArrowRight aria-hidden />
              </Link>
            </Button>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 10. FAQs
// ---------------------------------------------------------------------------
const FAQS: [string, string][] = [
  ['Is there a wallet?', 'No. Every rupee is paid directly into your bank loan account, and every payment carries a UTR you can check with your bank.'],
  [
    'How much do I contribute?',
    `${formatINR(edu.borrowerContributionPerUser)} a month for an education loan and ${formatINR(home.borrowerContributionPerUser)} for a home loan, collected by Razorpay eMandate.`,
  ],
  [
    'How much goes into my loan?',
    `${formatINR(edu.regularPerUser)} a month for education members and ${formatINR(home.regularPerUser)} for home members, on top of your normal EMI.`,
  ],
  [
    'What is a rescue?',
    `80% of CSR money in each block clears members' loans that face auction or default: ${edu.rescueCapacity} students or ${home.rescueCapacity} homes per block, every month.`,
  ],
  ['How is my data protected?', 'Loan account numbers are encrypted with AES-256, we keep only the last 4 digits of Aadhaar, and changing bank details or paying out needs OTP plus two-factor verification.'],
  ['Who can join?', 'Anyone with an education or home loan from a bank that we can verify. Your block appears on the dashboard once verification is done.'],
]

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-16" aria-labelledby="faq-title">
      <div className="container flex max-w-3xl flex-col gap-8">
        <m.div {...reveal} variants={fadeUp}>
          <Display id="faq-title" className="text-5xl">
            questions,
            <br />
            answered.
          </Display>
        </m.div>
        <m.div {...reveal} variants={fadeUp}>
          <Accordion type="single" collapsible>
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-lg">{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </m.div>
      </div>
    </section>
  )
}
