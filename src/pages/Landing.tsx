import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowRight, BadgeCheck, GraduationCap, HeartHandshake, Home as HomeIcon, Landmark, Lock, ShieldCheck, Smartphone, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SpringCounter } from '@/components/brand/SpringCounter'
import { ErrorState } from '@/components/states/ErrorState'
import { usePlatformStats } from '@/hooks/queries'
import { useT } from '@/i18n'
import { calculateBlockBreakdown, calculateRegularPerUser, calculateTargetTotals, type BlockType } from '@/lib/calculations'
import { formatCompactINR, formatCompactNumber, formatINR, formatNumber } from '@/lib/format'
import { fadeUp, float, reveal, staggerContainer } from '@/lib/motion'
import { isConfigured } from '@/lib/env'

const HERO_YEARS = 7

export default function Landing() {
  return (
    <>
      <Hero />
      <LivePool />
      <HowItWorks />
      <TrustBadges />
    </>
  )
}

// ---------------------------------------------------------------------------
// Hero: animated gradient mesh (20s drift) + parallax + staggered copy + floating cards + spring counter
// ---------------------------------------------------------------------------
function GradientMesh() {
  const reduce = useReducedMotion()
  const drift = (x: string[], y: string[]) =>
    reduce ? {} : { animate: { x, y }, transition: { duration: 20, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' } }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <m.div
        className="absolute -left-1/4 -top-1/4 size-[70vmax] rounded-pill opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #1D4A91 0%, transparent 60%)' }}
        {...drift(['0%', '20%', '-5%'], ['0%', '10%', '25%'])}
      />
      <m.div
        className="absolute -right-1/4 top-0 size-[55vmax] rounded-pill opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FFB703 0%, transparent 60%)' }}
        {...drift(['0%', '-25%', '-10%'], ['0%', '20%', '5%'])}
      />
      <m.div
        className="absolute -bottom-1/3 left-1/4 size-[50vmax] rounded-pill opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #059669 0%, transparent 60%)' }}
        {...drift(['0%', '15%', '-20%'], ['0%', '-15%', '-5%'])}
      />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  )
}

function FloatingLoanCard({ icon: Icon, title, value, sub, delay, className }: { icon: typeof GraduationCap; title: string; value: string; sub: string; delay: number; className?: string }) {
  return (
    <m.div {...float(delay)} className={className}>
      <div className="flex w-56 flex-col gap-2 rounded-modal border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-lg backdrop-blur-xl [transform:perspective(800px)_rotateY(-8deg)_rotateX(4deg)]">
        <div className="flex items-center gap-2 text-sm text-primary-100">
          <span className="flex size-8 items-center justify-center rounded-pill bg-secondary text-secondary-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          {title}
        </div>
        <p className="text-2xl font-bold tabular">{value}</p>
        <p className="text-xs text-primary-100">{sub}</p>
      </div>
    </m.div>
  )
}

function Hero() {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']) // background moves slower than content
  const fgY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])

  const eduExtra = calculateRegularPerUser('education')
  const homeExtra = calculateRegularPerUser('home')
  const heroTotal = eduExtra * 12 * HERO_YEARS
  const edu = calculateBlockBreakdown('education')
  const home = calculateBlockBreakdown('home')

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <m.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <GradientMesh />
      </m.div>
      <m.div style={{ y: fgY }} className="container grid items-center gap-12 py-12 md:py-16 lg:grid-cols-2 lg:py-20">
        <m.div initial="hidden" animate="show" variants={staggerContainer(0.1, 0.1)} className="flex flex-col gap-6">
          <m.div variants={fadeUp}>
            <Badge variant="secondary" className="w-fit">
              <Sparkles aria-hidden /> {t('motto')}
            </Badge>
          </m.div>
          <m.h1 variants={fadeUp} className="text-4xl font-bold leading-tight tracking-tight">
            {t('hero_title')}
          </m.h1>
          <m.p variants={fadeUp} className="text-lg text-primary-100 lg:max-w-xl">
            {t('hero_sub')}
          </m.p>
          <m.div variants={fadeUp} className="flex flex-col gap-1">
            <SpringCounter value={heroTotal} format={formatINR} className="text-4xl font-bold tabular text-secondary" />
            <span className="text-sm text-primary-100">
              {formatINR(eduExtra)}
              {t('card_per_month')} × 12 × {HERO_YEARS} {t('yr')} · {t('edu_title')}
            </span>
          </m.div>
          <m.p variants={fadeUp} className="font-devanagari text-base font-medium text-secondary">
            {t('tagline')}
          </m.p>
          <m.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="glow" className="w-full sm:w-auto">
              <Link to="/onboard">
                {t('hero_cta')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full text-primary-foreground hover:bg-white/10 sm:w-auto">
              <a href="#how">{t('hero_secondary')}</a>
            </Button>
          </m.div>
        </m.div>

        {/* Mobile: one floating card. sm+: three cards in a floating composition. */}
        <div className="flex justify-center sm:hidden" aria-hidden>
          <FloatingLoanCard icon={GraduationCap} title={t('edu_title')} value={`+${formatINR(eduExtra)}`} sub={`${t('card_per_month')} · ${edu.rescueCapacity} ${t('card_students')}`} delay={0} />
        </div>
        <div className="relative hidden h-80 sm:block lg:h-[28rem]" aria-hidden>
          <FloatingLoanCard icon={GraduationCap} title={t('edu_title')} value={`+${formatINR(eduExtra)}`} sub={`${t('card_per_month')} · ${edu.rescueCapacity} ${t('card_students')}`} delay={0} className="absolute left-0 top-0 lg:left-8" />
          <FloatingLoanCard icon={HomeIcon} title={t('home_title')} value={`+${formatINR(homeExtra)}`} sub={`${t('card_per_month')} · ${home.rescueCapacity} ${t('card_houses')}`} delay={1.2} className="absolute right-0 top-16 lg:right-8 lg:top-20" />
          <FloatingLoanCard icon={HeartHandshake} title={t('live_rescued')} value={formatCompactINR(edu.rescuePool)} sub={`80% CSR · ${t('block')}`} delay={2.4} className="absolute bottom-0 left-12 lg:left-20" />
        </div>
      </m.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Live Pool: bento grid (2 large + 4 small), glass cards, numbers count up on view
// ---------------------------------------------------------------------------
function LivePool() {
  const t = useT()
  const { totals, rescued, paidOut, isLoading, isError, error, refetch, isRefetching } = usePlatformStats()

  const stats = [
    { label: t('live_members'), value: totals.users, fmt: formatCompactNumber, icon: Users },
    { label: t('live_blocks'), value: totals.blocks, fmt: formatNumber, icon: BadgeCheck },
    { label: t('live_rescued'), value: rescued, fmt: formatNumber, icon: ShieldCheck },
    { label: t('live_paid'), value: paidOut, fmt: formatCompactINR, icon: Landmark },
  ]

  return (
    <section className="relative overflow-hidden py-12 md:py-16" aria-labelledby="live-pool">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_0%,rgb(15_44_97/0.08),transparent),radial-gradient(40%_40%_at_90%_30%,rgb(255_183_3/0.12),transparent)]" />
      <div className="container flex flex-col gap-8">
        <m.div {...reveal} variants={fadeUp} className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-pill bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-pill bg-accent" />
            </span>
            {t('live_label')}
          </span>
          <h2 id="live-pool" className="text-3xl font-bold tracking-tight text-primary">
            {t('edu_title')} + {t('home_title')}
          </h2>
        </m.div>

        {isError ? (
          <Card variant="glass">
            <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
          </Card>
        ) : (
          <m.div {...reveal} variants={staggerContainer(0.08)} className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <m.div variants={fadeUp} className="md:col-span-1 lg:col-span-2">
              <LoanTypeCard type="education" />
            </m.div>
            <m.div variants={fadeUp} className="md:col-span-1 lg:col-span-2">
              <LoanTypeCard type="home" />
            </m.div>
            {stats.map(({ label, value, fmt, icon: Icon }) => (
              <m.div key={label} variants={fadeUp}>
                <Card variant="glass" className="flex h-full flex-col gap-2 p-4 md:p-6">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex size-8 items-center justify-center rounded-pill bg-primary-50 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {label}
                  </span>
                  {isLoading && isConfigured ? <Skeleton className="h-8 w-24" /> : <SpringCounter value={value} format={fmt} className="text-3xl font-bold tabular text-primary" />}
                </Card>
              </m.div>
            ))}
          </m.div>
        )}
      </div>
    </section>
  )
}

function LoanTypeCard({ type }: { type: BlockType }) {
  const t = useT()
  const b = calculateBlockBreakdown(type)
  const target = calculateTargetTotals().byType[type]
  const isEdu = type === 'education'
  const Icon = isEdu ? GraduationCap : HomeIcon

  const rows = [
    { label: t('card_you_pay'), value: b.borrowerContributionPerUser, suffix: t('card_per_month'), fmt: formatINR },
    { label: t('card_you_get'), value: b.regularPerUser, suffix: t('card_per_month'), fmt: formatINR, highlight: true },
    { label: t('card_rescues'), value: b.rescueCapacity, suffix: ` ${isEdu ? t('card_students') : t('card_houses')}`, fmt: formatNumber },
    { label: t('card_target'), value: target.users, suffix: '', fmt: formatCompactNumber },
  ]

  return (
    <Card variant="glass" className="h-full overflow-hidden">
      <CardHeader className="flex-row items-center gap-4">
        <div className={isEdu ? 'flex size-12 items-center justify-center rounded-modal bg-primary text-secondary shadow-md' : 'flex size-12 items-center justify-center rounded-modal bg-secondary text-primary shadow-md'}>
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{isEdu ? t('edu_title') : t('home_title')}</CardTitle>
          <CardDescription className="font-devanagari">{isEdu ? t('edu_sub') : t('home_sub')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-3 w-full overflow-hidden rounded-pill bg-muted" role="img" aria-label={`Borrower ${formatCompactINR(b.borrowerPool)}, CSR ${formatCompactINR(b.csrPool)}`}>
          <m.div className="bg-primary" initial={{ width: 0 }} whileInView={{ width: `${(b.borrowerPool / b.totalPool) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
          <m.div className="bg-secondary" initial={{ width: 0 }} whileInView={{ width: `${(b.csrPool / b.totalPool) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Borrower {formatCompactINR(b.borrowerPool)}</span>
          <span>CSR {formatCompactINR(b.csrPool)}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className={r.highlight ? 'rounded-card bg-accent-50 p-3' : 'rounded-card bg-neutral-100/80 p-3'}>
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className={r.highlight ? 'text-lg font-bold tabular text-accent-700' : 'text-lg font-semibold tabular'}>
                <SpringCounter value={r.value} format={r.fmt} />
                {r.suffix}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          1 {t('block')} = 1,000 · {formatCompactINR(b.totalPool)}{t('card_per_month')} · 80% CSR ({formatCompactINR(b.rescuePool)}) → {b.rescueCapacity}{' '}
          {isEdu ? t('card_students') : t('card_houses')} · {formatCompactNumber(target.users)}: {formatNumber(target.rescueCapacity)}
          {t('card_per_month')}
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// How it works: scroll-triggered stagger
// ---------------------------------------------------------------------------
function HowItWorks() {
  const t = useT()
  const steps = [
    { title: t('how_1_t'), desc: t('how_1_d'), icon: BadgeCheck },
    { title: t('how_2_t'), desc: t('how_2_d'), icon: Users },
    { title: t('how_3_t'), desc: t('how_3_d'), icon: Landmark },
  ]
  return (
    <section id="how" className="scroll-mt-16 bg-card py-12 md:py-16" aria-labelledby="how-title">
      <div className="container flex flex-col gap-8 md:gap-12">
        <m.h2 {...reveal} variants={fadeUp} id="how-title" className="text-3xl font-bold tracking-tight text-primary md:text-center">
          {t('how_title')}
        </m.h2>
        <m.ol {...reveal} variants={staggerContainer(0.15)} className="relative grid gap-4 md:grid-cols-3 md:gap-6">
          <m.span
            aria-hidden
            className="absolute left-8 right-8 top-12 hidden h-px origin-left bg-gradient-to-r from-primary via-secondary to-accent md:block"
            variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.2, ease: 'easeInOut' } } }}
          />
          {steps.map((s, i) => (
            <m.li key={s.title} variants={fadeUp} className="relative">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-pill bg-primary text-lg font-bold text-secondary shadow-md">{i + 1}</span>
                    <s.icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="pt-2">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  )
}

function TrustBadges() {
  const t = useT()
  const badges = [
    { title: t('trust_direct'), desc: t('trust_direct_d'), icon: Landmark },
    { title: t('trust_secure'), desc: t('trust_secure_d'), icon: Lock },
    { title: t('trust_pwa'), desc: t('trust_pwa_d'), icon: Smartphone },
  ]
  return (
    <section className="container flex flex-col gap-8 py-12 md:py-16" aria-label="Trust">
      <m.div {...reveal} variants={staggerContainer(0.1)} className="grid gap-4 sm:grid-cols-3">
        {badges.map((b) => (
          <m.div key={b.title} variants={fadeUp}>
            <Card className="flex h-full items-start gap-3 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent-50 text-accent-700">
                <b.icon className="size-6" aria-hidden />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{b.title}</p>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </Card>
          </m.div>
        ))}
      </m.div>
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link to="/onboard">
            {t('hero_cta')}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  )
}
