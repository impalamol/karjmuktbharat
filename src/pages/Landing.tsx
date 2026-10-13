import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRight, BadgeCheck, GraduationCap, Home as HomeIcon, Landmark, Lock, ShieldCheck, Smartphone, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/brand/AnimatedNumber'
import { ErrorState } from '@/components/states/ErrorState'
import { usePlatformStats } from '@/hooks/queries'
import { useT } from '@/i18n'
import { BLOCK_RULES, calculateBlockBreakdown, calculateTargetTotals, type BlockType } from '@/lib/calculations'
import { formatCompactINR, formatCompactNumber, formatINR, formatNumber } from '@/lib/format'
import { motion as motionTokens } from '@/lib/design-tokens'
import { isConfigured } from '@/lib/env'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.slow, ease: motionTokens.ease } },
}

export default function Landing() {
  const t = useT()
  return (
    <>
      <Hero />
      <section className="container -mt-12 relative z-10 md:-mt-16">
        <LiveCounters />
      </section>
      <section className="container py-12 md:py-16" aria-labelledby="loan-types">
        <h2 id="loan-types" className="sr-only">{t('edu_title')} / {t('home_title')}</h2>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <LoanTypeCard type="education" />
          <LoanTypeCard type="home" />
        </div>
      </section>
      <HowItWorks />
      <TrustBadges />
    </>
  )
}

function Hero() {
  const t = useT()
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-70 rounded-pill bg-secondary/20 blur-3xl md:size-[28rem]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 size-70 rounded-pill bg-accent/20 blur-3xl" />
      <div className="container relative flex flex-col gap-6 pb-20 pt-12 md:pt-16 lg:max-w-4xl lg:items-center lg:text-center xl:pt-20">
        <m.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col gap-4 lg:items-center">
          <Badge variant="secondary" className="w-fit">
            {t('motto')}
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">{t('hero_title')}</h1>
          <p className="text-lg text-primary-100 md:max-w-2xl">{t('hero_sub')}</p>
          <p className="font-devanagari text-base font-medium text-secondary">{t('tagline')}</p>
        </m.div>
        <m.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link to="/onboard">
              {t('hero_cta')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full text-primary-foreground hover:bg-primary-600 sm:w-auto">
            <a href="#how">{t('hero_secondary')}</a>
          </Button>
        </m.div>
      </div>
    </section>
  )
}

function LiveCounters() {
  const t = useT()
  const { totals, rescued, paidOut, isLoading, isError, error, refetch, isRefetching } = usePlatformStats()

  if (isError) {
    return (
      <Card>
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      </Card>
    )
  }

  const items = [
    { label: t('live_members'), value: totals.users, fmt: formatCompactNumber, icon: Users },
    { label: t('live_blocks'), value: totals.blocks, fmt: formatNumber, icon: BadgeCheck },
    { label: t('live_rescued'), value: rescued, fmt: formatNumber, icon: ShieldCheck },
    { label: t('live_paid'), value: paidOut, fmt: formatCompactINR, icon: Landmark },
  ]

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-pill bg-accent opacity-75" />
          <span className="relative inline-flex size-2 rounded-pill bg-accent" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">{t('live_label')}</span>
      </div>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map(({ label, value, fmt, icon: Icon }) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="size-4 text-primary" aria-hidden />
              {label}
            </dt>
            <dd className="text-2xl font-bold tabular text-primary">
              {isLoading && isConfigured ? <Skeleton className="h-8 w-24" /> : <AnimatedNumber value={value} format={fmt} />}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function LoanTypeCard({ type }: { type: BlockType }) {
  const t = useT()
  const b = calculateBlockBreakdown(type)
  const target = calculateTargetTotals().byType[type]
  const isEdu = type === 'education'
  const Icon = isEdu ? GraduationCap : HomeIcon

  const rows = [
    { label: t('card_you_pay'), value: `${formatINR(b.borrowerContributionPerUser)}${t('card_per_month')}` },
    { label: t('card_you_get'), value: `${formatINR(b.regularPerUser)}${t('card_per_month')}`, highlight: true },
    { label: t('card_rescues'), value: `${b.rescueCapacity} ${isEdu ? t('card_students') : t('card_houses')}` },
    { label: t('card_target'), value: formatCompactNumber(BLOCK_RULES[type].targetUsers) },
  ]

  return (
    <m.div initial="hidden" animate="show" variants={fadeUp}>
      <Card className="h-full overflow-hidden">
        <CardHeader className="flex-row items-center gap-4">
          <div className={isEdu ? 'flex size-12 items-center justify-center rounded-card bg-primary-50 text-primary' : 'flex size-12 items-center justify-center rounded-card bg-secondary-50 text-secondary-700'}>
            <Icon className="size-6" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{isEdu ? t('edu_title') : t('home_title')}</CardTitle>
            <CardDescription className="font-devanagari">{isEdu ? t('edu_sub') : t('home_sub')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex h-3 w-full overflow-hidden rounded-pill" role="img" aria-label={`Borrower ${formatCompactINR(b.borrowerPool)}, CSR ${formatCompactINR(b.csrPool)}`}>
            <div className="bg-primary" style={{ width: `${(b.borrowerPool / b.totalPool) * 100}%` }} />
            <div className="bg-secondary" style={{ width: `${(b.csrPool / b.totalPool) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Borrower {formatCompactINR(b.borrowerPool)}</span>
            <span>CSR {formatCompactINR(b.csrPool)}</span>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {rows.map((r) => (
              <div key={r.label} className={r.highlight ? 'rounded-card bg-accent-50 p-3' : 'rounded-card bg-muted p-3'}>
                <dt className="text-xs text-muted-foreground">{r.label}</dt>
                <dd className={r.highlight ? 'text-lg font-bold tabular text-accent-700' : 'text-lg font-semibold tabular'}>{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            1 block = 1,000 users = {formatCompactINR(b.totalPool)}/month · 80% CSR ({formatCompactINR(b.rescuePool)}) rescue · At{' '}
            {formatCompactNumber(target.users)} users: {formatNumber(target.rescueCapacity)} rescues/month
          </p>
        </CardContent>
      </Card>
    </m.div>
  )
}

function HowItWorks() {
  const t = useT()
  const steps = [
    { title: t('how_1_t'), desc: t('how_1_d'), icon: BadgeCheck },
    { title: t('how_2_t'), desc: t('how_2_d'), icon: Users },
    { title: t('how_3_t'), desc: t('how_3_d'), icon: Landmark },
  ]
  return (
    <section id="how" className="scroll-mt-16 bg-card py-12 md:py-16" aria-labelledby="how-title">
      <div className="container flex flex-col gap-8">
        <h2 id="how-title" className="text-3xl font-bold tracking-tight md:text-center">{t('how_title')}</h2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <m.li key={s.title} initial="hidden" animate="show" variants={fadeUp}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-pill bg-secondary text-sm font-bold text-secondary-foreground">{i + 1}</span>
                    <s.icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="pt-2">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            </m.li>
          ))}
        </ol>
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
    <section className="container py-12 md:py-16" aria-label="Trust">
      <div className="grid gap-4 sm:grid-cols-3">
        {badges.map((b) => (
          <Card key={b.title} className="flex items-start gap-3 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent-50 text-accent">
              <b.icon className="size-6" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{b.title}</p>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
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
