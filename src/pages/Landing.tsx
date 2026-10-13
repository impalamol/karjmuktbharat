import { Link } from 'react-router-dom'
import { m, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  GraduationCap,
  HeartHandshake,
  Home as HomeIcon,
  Lock,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SpringCounter } from '@/components/brand/SpringCounter'
import { FloatingShapes, Topography } from '@/features/landing/Backdrop'
import { MiniToggle, PhoneTrio } from '@/features/landing/PhoneMockups'
import { BLOCK_RULES, CRORE, calculateBlockBreakdown, calculatePooledRescueCapacity, calculateTypeTotals } from '@/lib/calculations'
import { formatCompactINR, formatINR, formatNumber } from '@/lib/format'
import { fadeUp, reveal, staggerContainer } from '@/lib/motion'
import { cn, scrollToSection } from '@/lib/utils'

const edu = calculateBlockBreakdown('education')
const home = calculateBlockBreakdown('home')
const homeTotals = calculateTypeTotals('home', BLOCK_RULES.home.targetUsers)
const houses = calculatePooledRescueCapacity('home', BLOCK_RULES.home.targetUsers)
const students = calculatePooledRescueCapacity('education', BLOCK_RULES.education.targetUsers)

/**
 * One-page landing in the app's design language: black topographic hero with floating
 * pastel shapes and three phone mockups, then a bento grid of 32px-radius cards.
 */
export default function Landing() {
  return (
    <div className="-mt-14 md:-mt-16">
      <Hero />
      <Numbers />
      <HowItWorks />
      <Faq />
      <GetApp />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
function Bento({ className, children, ...props }: React.ComponentProps<typeof m.div>) {
  return (
    <m.div variants={fadeUp} className={cn('relative overflow-hidden rounded-bento p-6 md:p-8', className)} {...props}>
      {children}
    </m.div>
  )
}

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <m.div {...reveal} variants={fadeUp} className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h2 id={id} className="text-5xl font-bold tracking-tight">
        {title}
      </h2>
    </m.div>
  )
}

/** White pill with a black circle arrow: the app's primary button. */
function GetStarted() {
  return (
    <Link
      to="/onboard"
      className="group inline-flex h-14 items-center gap-4 rounded-pill border border-white bg-white pl-6 pr-2 text-base font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95"
    >
      Get Started
      <span className="flex size-10 items-center justify-center rounded-pill bg-black text-white transition-transform group-hover:translate-x-1">
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  )
}

/** App store badges. The apps are in testing, so they say so instead of linking to a store. */
function StoreBadges() {
  const stores: [string, string][] = [
    ['App Store', 'iPhone'],
    ['Google Play', 'Android'],
  ]
  return (
    <ul className="flex flex-wrap gap-3" aria-label="Mobile apps">
      {stores.map(([store, os]) => (
        <li key={store} className="flex h-14 items-center gap-3 rounded-modal border border-white/30 bg-white/5 px-4 text-white backdrop-blur-xl">
          <Smartphone className="size-5" aria-hidden />
          <span className="flex flex-col leading-tight">
            <span className="text-xs text-white/60">{os} app · coming soon</span>
            <span className="text-sm font-semibold">{store}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black pt-16 text-white" aria-labelledby="hero-title">
      <Topography />
      <FloatingShapes />
      <div className="container relative grid min-h-dvh items-center gap-12 py-16 lg:grid-cols-2">
        <m.div className="flex flex-col gap-6" initial="hidden" animate="show" variants={staggerContainer(0.1, 0.1)}>
          <m.p variants={fadeUp} className="text-sm font-semibold text-pastel-mintStrong">
            कर्ज से मुक्ति, भारत की प्रगति
          </m.p>
          <m.h1 variants={fadeUp} id="hero-title" className="text-6xl font-bold uppercase tracking-tight xl:text-7xl">
            Karj se mukti, Bharat ki pragati.
          </m.h1>
          <m.p variants={fadeUp} className="max-w-md text-base text-white/70 md:text-lg">
            Join a block of 1,000 verified borrowers. With CSR partners, we pay up to {formatINR(home.regularPerUser)} extra into your loan every
            month, and rescue members facing auction.
          </m.p>
          <m.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <GetStarted />
            <a href="#how" onClick={(e) => scrollToSection(e, 'how')} className="inline-flex h-14 items-center rounded-pill border border-white/30 px-6 text-base font-semibold hover:bg-white/10">
              How it works
            </a>
          </m.div>
          <m.div variants={fadeUp}>
            <StoreBadges />
          </m.div>
        </m.div>
        <PhoneTrio />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 2. Numbers bento
// ---------------------------------------------------------------------------
const CANDLES = [30, 44, 38, 56, 50, 64, 58, 72, 66, 80, 74, 88]

function RescueCandles() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 240 100" className="h-24 w-full" aria-hidden>
      {CANDLES.map((v, i) => {
        const prev = CANDLES[i - 1] ?? v - 8
        const up = v >= prev
        const top = 100 - Math.max(v, prev)
        return (
          <m.rect
            key={i}
            x={i * 20 + 5}
            y={top}
            width={10}
            height={Math.abs(v - prev) + 4}
            rx={2}
            fill={up ? '#A8E6CF' : '#6B7280'}
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
            style={{ originY: 1 }}
          />
        )
      })}
      <m.path
        d={CANDLES.map((v, i) => `${i ? 'L' : 'M'}${i * 20 + 10},${100 - v - 6}`).join(' ')}
        fill="none"
        stroke="white"
        strokeOpacity={0.5}
        strokeWidth={1.5}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 1.6, ease: 'easeInOut' }}
      />
    </svg>
  )
}

const RESCUES: [LucideIcon, string, string, string, string][] = [
  [HomeIcon, 'Sunita T.', 'Ghar Vachavle · Nashik', '₹5.2L', 'bg-pastel-beigeStrong'],
  [GraduationCap, 'Amol S.', 'NPA Vachavla · Pune', '₹3L', 'bg-pastel-lavender'],
  [HomeIcon, 'Kavita J.', 'Ghar Vachavle · Nagpur', '₹4.8L', 'bg-pastel-beigeStrong'],
]

const SECURITY: [LucideIcon, string][] = [
  [Lock, 'AES-256 encryption'],
  [Fingerprint, 'Face ID + 2FA on changes'],
  [ShieldCheck, 'Aadhaar: last 4 only'],
  [ReceiptText, 'Audit log on every rupee'],
]

function Numbers() {
  return (
    <section id="story" className="scroll-mt-16 py-16" aria-labelledby="numbers-title">
      <div className="container flex flex-col gap-8">
        <SectionTitle eyebrow="your block, your numbers" title="The maths, in plain rupees." id="numbers-title" />
        <m.div {...reveal} variants={staggerContainer(0.1)} className="grid gap-4 md:grid-cols-6">
          <Bento className="flex flex-col gap-6 bg-pastel-mint text-pastel-ink md:col-span-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Total Karj Mukti</p>
                <p className="flex flex-wrap items-baseline gap-2">
                  <SpringCounter value={home.regularPerUser} format={formatINR} className="text-6xl font-bold tracking-tight tabular" />
                  <span className="text-base font-semibold text-black/60">Extra/mo</span>
                </p>
              </div>
              <span className="whitespace-nowrap rounded-pill bg-white/70 px-3 py-1 text-xs font-semibold">Home loan</span>
            </div>
            <p className="max-w-lg text-sm text-black/70">
              Paid straight into your bank loan account on top of your EMI, every month. Education members get {formatINR(edu.regularPerUser)}. No
              wallet, and every rupee carries a UTR.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['Borrower Pool', home.borrowerPool, 'Auto-pay', 'bg-white/70'],
                  ['CSR Pool', home.csrPool, 'Rescue alerts', 'bg-pastel-beige'],
                ] as const
              ).map(([title, amt, meta, bg]) => (
                <div key={title} className={cn('flex items-center gap-4 rounded-bento p-4', bg)}>
                  <div className="flex-1">
                    <p className="flex justify-between text-sm font-semibold">
                      {title} <span className="font-bold">{formatCompactINR(amt)}</span>
                    </p>
                    <p className="flex justify-between text-xs text-black/60">
                      <span className="tracking-widest">****9292</span> {meta}
                    </p>
                  </div>
                  <MiniToggle />
                </div>
              ))}
            </div>
          </Bento>

          <Bento className="flex flex-col justify-between gap-4 bg-black text-white md:col-span-2">
            <div>
              <p className="text-sm text-white/60">Rescue Pool / Month</p>
              <p className="text-5xl font-bold tracking-tight">₹{formatNumber(homeTotals.rescuePool / CRORE)}Cr</p>
              <p className="text-xs text-white/50">home loans at {formatNumber(BLOCK_RULES.home.targetUsers)} members</p>
            </div>
            <RescueCandles />
          </Bento>

          <Bento className="flex flex-col gap-4 bg-pastel-beige text-pastel-ink md:col-span-2">
            <p className="text-sm font-semibold">One block</p>
            <p className="text-4xl font-bold tracking-tight">1,000 members = {formatCompactINR(home.totalPool)}/mo</p>
            <div className="flex h-3 overflow-hidden rounded-pill bg-white/70" aria-hidden>
              <m.span className="bg-pastel-ink" initial={{ width: 0 }} whileInView={{ width: '30%' }} viewport={{ once: true }} transition={{ duration: 1 }} />
              <m.span className="bg-pastel-mintStrong" initial={{ width: 0 }} whileInView={{ width: '70%' }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} />
            </div>
            <p className="text-xs text-black/60">
              Borrowers {formatCompactINR(home.borrowerPool)} + CSR {formatCompactINR(home.csrPool)}. 80% of CSR funds rescues; the rest joins the regular
              pool.
            </p>
          </Bento>

          <Bento className="flex flex-col justify-between gap-6 bg-pastel-sky text-pastel-ink md:col-span-2">
            <span className="flex size-12 items-center justify-center rounded-modal bg-white">
              <HomeIcon className="size-6" aria-hidden />
            </span>
            <div>
              <SpringCounter value={houses} format={formatNumber} className="text-5xl font-bold tracking-tight tabular" />
              <p className="text-sm font-semibold">Houses saved every month</p>
            </div>
          </Bento>

          <Bento className="flex flex-col justify-between gap-6 bg-pastel-lavender text-pastel-ink md:col-span-2">
            <span className="flex size-12 items-center justify-center rounded-modal bg-white">
              <GraduationCap className="size-6" aria-hidden />
            </span>
            <div>
              <SpringCounter value={students} format={formatNumber} className="text-5xl font-bold tracking-tight tabular" />
              <p className="text-sm font-semibold">Students saved every month</p>
            </div>
          </Bento>

          <Bento className="flex flex-col gap-2 border border-border bg-card md:col-span-3">
            <p className="text-2xl font-bold tracking-tight">Rescue Wall</p>
            <ul className="flex flex-col">
              {RESCUES.map(([Icon, name, line, amt, bg]) => (
                <li key={name} className="flex items-center gap-4 py-3">
                  <span className={cn('flex size-12 items-center justify-center rounded-modal text-black', bg)}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-semibold">{name}</span>
                    <span className="text-xs text-muted-foreground">{line}</span>
                  </span>
                  <span className="font-bold text-accent-700">{amt}</span>
                </li>
              ))}
            </ul>
          </Bento>

          <Bento className="flex flex-col gap-4 bg-black text-white md:col-span-3">
            <Topography className="opacity-60" />
            <span className="relative flex size-12 items-center justify-center rounded-modal bg-pastel-mintStrong text-black">
              <Lock className="size-5" aria-hidden />
            </span>
            <p className="relative text-2xl font-bold tracking-tight">Your data isn&apos;t our business. Keeping it safe is.</p>
            <ul className="relative flex flex-wrap gap-2">
              {SECURITY.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2 rounded-pill border border-white/20 px-3 py-2 text-xs">
                  <Icon className="size-4 text-pastel-mintStrong" aria-hidden /> {label}
                </li>
              ))}
            </ul>
          </Bento>
        </m.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 3. How it works
// ---------------------------------------------------------------------------
const STEPS: [LucideIcon, string, string, string][] = [
  [BadgeCheck, 'Verify your loan', 'Add your education or home loan. We check it with your bank in a few days.', 'bg-pastel-mint'],
  [
    Users,
    'Get a seat in a block',
    `Your seat sits in a block of 1,000 members. You contribute ${formatINR(edu.borrowerContributionPerUser)} or ${formatINR(home.borrowerContributionPerUser)} a month by eMandate.`,
    'bg-pastel-beige',
  ],
  [HeartHandshake, 'Repay years earlier', 'Every month the pool pays extra into your loan, and rescues members who are about to lose a home or default.', 'bg-pastel-sky'],
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 py-16" aria-labelledby="how-title">
      <div className="container flex flex-col gap-8">
        <SectionTitle eyebrow="three steps" title="How it works." id="how-title" />
        <m.ol {...reveal} variants={staggerContainer(0.1)} className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([Icon, title, body, bg], i) => (
            <m.li key={title} variants={fadeUp} className={cn('flex flex-col gap-6 rounded-bento p-6 text-pastel-ink md:p-8', bg)}>
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-modal bg-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="text-5xl font-bold text-black/20">0{i + 1}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                <p className="text-sm text-black/70">{body}</p>
              </div>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 4. FAQs
// ---------------------------------------------------------------------------
const FAQS: [string, string][] = [
  ['Is there a wallet?', 'No. Every rupee is paid directly into your bank loan account, and every payment carries a UTR you can check in the app.'],
  [
    'How much do I contribute?',
    `${formatINR(edu.borrowerContributionPerUser)} a month for an education loan and ${formatINR(home.borrowerContributionPerUser)} for a home loan, collected by Razorpay eMandate.`,
  ],
  ['How much goes into my loan?', `${formatINR(edu.regularPerUser)} a month for education members and ${formatINR(home.regularPerUser)} for home members, on top of your normal EMI.`],
  [
    'What is a rescue?',
    `80% of CSR money clears members' loans that face auction or default. At full scale that is ${formatNumber(houses)} homes and ${formatNumber(students)} students every month.`,
  ],
  [
    'How is my data protected?',
    'Loan account numbers are encrypted with AES-256, we keep only the last 4 digits of Aadhaar, and changing bank details needs Face ID plus two-factor verification.',
  ],
  ['Who can join?', 'Anyone with an education or home loan from a bank that we can verify. Your block appears in the app once verification is done.'],
]

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-16" aria-labelledby="faq-title">
      <div className="container grid gap-8 lg:grid-cols-3">
        <SectionTitle eyebrow="faq" title="Questions, answered." id="faq-title" />
        <m.div {...reveal} variants={fadeUp} className="rounded-bento border border-border bg-card px-6 md:px-8 lg:col-span-2">
          <Accordion type="single" collapsible>
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q} className="last:border-b-0">
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

// ---------------------------------------------------------------------------
// 5. Get the app
// ---------------------------------------------------------------------------
function GetApp() {
  return (
    <section className="pb-16" aria-labelledby="get-title">
      <div className="container">
        <m.div {...reveal} variants={fadeUp} className="relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-bento bg-black p-8 text-white md:p-16">
          <Topography />
          <FloatingShapes className="opacity-80" />
          <h2 id="get-title" className="relative max-w-2xl text-6xl font-bold tracking-tight">
            Not everyone gets it.
          </h2>
          <p className="relative max-w-md text-white/70">
            Membership is for borrowers with a verified education or home loan. Once you are in, 999 others and our CSR partners pay your loan down
            with you.
          </p>
          <div className="relative flex flex-col items-start gap-6">
            <GetStarted />
            <StoreBadges />
          </div>
        </m.div>
      </div>
    </section>
  )
}
