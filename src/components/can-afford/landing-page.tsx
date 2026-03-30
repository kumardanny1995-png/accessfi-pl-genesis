import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CreditCard, Plane, Smartphone, TrendingUp } from "lucide-react";

import { MarketingFooter, MarketingHeader } from "@/components/can-afford/route-shells";

const scenarios = [
  {
    title: "iPhone on EMI",
    description: "See the real cost on your monthly cash and emergency runway.",
    icon: Smartphone,
    tone: "text-[#adc6ff] bg-[#adc6ff]/10"
  },
  {
    title: "Goa Trip",
    description: "Check whether the trip is fun now without becoming stress later.",
    icon: Plane,
    tone: "text-[#4fdbc8] bg-[#4fdbc8]/10"
  },
  {
    title: "Move to Another City",
    description: "Model rent, one-time move cost, and salary change before you jump.",
    icon: BriefcaseBusiness,
    tone: "text-[#e0c1a3] bg-[#e0c1a3]/10"
  },
  {
    title: "Increase SIP",
    description: "Understand whether more investing helps your future or strains your runway.",
    icon: TrendingUp,
    tone: "text-[#25fea8] bg-[#25fea8]/10"
  }
];

const steps = [
  {
    title: "Set your baseline",
    description: "Add salary, cash, obligations, and financial goals in a guided four-step flow."
  },
  {
    title: "Ask a decision",
    description: "Type a natural-language question or fill in the amount, EMI, timing, and duration."
  },
  {
    title: "See the future",
    description: "Get a deterministic verdict based on free cash, obligations, runway, and goal impact."
  }
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e1320] text-[#dee2f4]">
      <MarketingHeader />
      <main className="pb-24 pt-24">
        <section className="mx-auto grid max-w-7xl gap-16 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <h1 className="font-[var(--font-newsreader)] text-5xl italic leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[5rem]">
              Before you spend,
              <br />
              ask your future.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-9 text-white/68 sm:text-xl">
              Can I Afford It helps salaried users in India understand what a purchase, EMI, trip, move, or money choice will
              actually do to their future, not just their balance today.
            </p>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#4fdbc8] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#003731] transition hover:opacity-95"
              >
                Start Now
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/6 hover:text-white"
              >
                See the Engine
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#adc6ff]/10 blur-[100px]" />
            <div className="rounded-[2rem] border border-white/8 bg-[#1a1f2c]/70 p-6 shadow-[0_24px_80px_rgba(8,15,28,0.28)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4fdbc8]">Decision Engine</span>
                <span className="text-white/36">•••</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-[1.4rem] bg-white/5 px-4 py-4">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#adc6ff]/10 text-[#adc6ff]">
                    <Smartphone size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">Purchase Intention</p>
                    <p className="truncate text-white">iPhone 16 Pro on EMI</p>
                  </div>
                  <span className="font-[var(--font-newsreader)] text-2xl italic text-white">₹12,900</span>
                </div>
                <div className="rounded-[1.4rem] border-l-2 border-[#4fdbc8] bg-[#090e1a] px-5 py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">The Verdict</p>
                  <h2 className="mt-2 font-[var(--font-newsreader)] text-3xl italic text-[#4fdbc8]">Proceed with caution.</h2>
                  <p className="mt-3 text-sm leading-7 text-white/66">
                    Monthly free cash drops by ₹12,900, your runway softens, and your Europe goal slips by around 45 days.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.3rem] bg-white/5 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Free Cash</p>
                    <p className="mt-2 text-xl font-semibold text-white">₹31,200</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-white/5 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Runway</p>
                    <p className="mt-2 text-xl font-semibold text-white">5.4 mo</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-white/5 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Goal Delay</p>
                    <p className="mt-2 text-xl font-semibold text-white">45 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="engine" className="bg-[#1a1f2c] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e0c1a3]">The Gap</span>
              <h2 className="mt-5 font-[var(--font-newsreader)] text-4xl italic tracking-tight text-white sm:text-5xl">
                Stop looking backward.
              </h2>
              <p className="mt-6 text-lg leading-9 text-white/66">
                Budget apps tell you where money went. Can I Afford It is built for a different question: what does this next choice
                do to your buffer, your obligations, and your goals if you say yes right now?
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <div className="rounded-[2rem] border border-white/6 bg-[#252a37] p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#adc6ff]">Past tracking</h3>
                <p className="mt-4 text-sm leading-7 text-white/62">Categorizing yesterday does not tell you whether an EMI is safe for next month.</p>
              </div>
              <div className="rounded-[2rem] border border-white/6 bg-[#252a37] p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4fdbc8]">Future projection</h3>
                <p className="mt-4 text-sm leading-7 text-white/62">We calculate free cash, total obligations, emergency runway, and goal delay before you commit.</p>
              </div>
              <div className="rounded-[2rem] border border-white/6 bg-[#252a37] p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e0c1a3]">Plain language</h3>
                <p className="mt-4 text-sm leading-7 text-white/62">The verdict is deterministic. AI is used only to explain the outcome after the math is done.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="verdict" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="text-center">
            <h2 className="font-[var(--font-newsreader)] text-4xl italic tracking-tight text-white sm:text-5xl">Three steps to clarity.</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center rounded-[2rem] border border-white/6 bg-[#161b28] px-6 py-8 text-center">
                <span className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-[#252a37] text-[#adc6ff]">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="decisions" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-[var(--font-newsreader)] text-4xl italic tracking-tight text-white sm:text-5xl">Decisions we simplify.</h2>
              <p className="mt-4 text-base leading-8 text-white/62">
                The product is built for real decisions salaried users in India face every month, not generic budgeting charts.
              </p>
            </div>
            <Link href="/signup" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#adc6ff]">
              Explore in the app
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <div key={scenario.title} className="rounded-[2rem] bg-[#161b28] p-7 transition hover:bg-[#252a37]">
                  <span className={`flex size-12 items-center justify-center rounded-2xl ${scenario.tone}`}>
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-white">{scenario.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{scenario.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[2.5rem] border border-white/8 bg-[linear-gradient(135deg,#041329_0%,#112036_52%,#0d1c32_100%)] px-6 py-10 text-center shadow-[0_24px_80px_rgba(8,15,28,0.28)] sm:px-10">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4fdbc8]">
                <CreditCard size={14} />
                Built for real money choices
              </span>
              <h2 className="mt-6 font-[var(--font-newsreader)] text-4xl italic tracking-tight text-white sm:text-5xl">
                See whether the next decision protects your future or squeezes it.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/64">
                Start with onboarding, run a sample scenario, and move from gut feel to a clear verdict.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/76"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
