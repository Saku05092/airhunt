import Link from "next/link";

const features = [
  {
    title: "Track Airdrops",
    description:
      "Discover and track upcoming airdrops across all major chains. Get notified before deadlines so you never miss an opportunity.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.84 2.58m0 0a14.926 14.926 0 01-5.96-2.58" />
      </svg>
    ),
  },
  {
    title: "Task Management",
    description:
      "Organize airdrop tasks with checklists, reminders, and progress tracking. Stay on top of every requirement.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Sybil Risk Score",
    description:
      "Monitor your wallet's sybil risk score in real-time. Get actionable recommendations to improve your eligibility.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: "Portfolio Dashboard",
    description:
      "View all your airdrop positions, estimated values, and claim statuses in one unified dashboard.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic airdrop tracking.",
    features: [
      "Track up to 5 airdrops",
      "Basic task management",
      "1 wallet connection",
      "Community support",
    ],
    cta: "Get Started",
    href: "/signup?plan=free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious airdrop hunters who want an edge.",
    features: [
      "Unlimited airdrop tracking",
      "Advanced task management",
      "Up to 10 wallets",
      "Sybil risk score",
      "Priority notifications",
      "Email support",
    ],
    cta: "Start Pro Trial",
    href: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Unlimited",
    price: "$49",
    period: "/month",
    description: "Maximum power for professional operators.",
    features: [
      "Everything in Pro",
      "Unlimited wallets",
      "Portfolio analytics",
      "API access",
      "Custom alerts",
      "Priority support",
      "Early access to features",
    ],
    cta: "Go Unlimited",
    href: "/signup?plan=unlimited",
    highlighted: false,
  },
];

const steps = [
  { step: "01", title: "Sign Up", description: "Create your account in seconds with email or wallet." },
  { step: "02", title: "Choose Plan", description: "Pick the plan that fits your airdrop hunting style." },
  { step: "03", title: "Download App", description: "Get the mobile app for iOS or Android." },
  { step: "04", title: "Start Tracking", description: "Connect wallets, track airdrops, and never miss a drop." },
];

const faqs = [
  {
    question: "What is AirHunt?",
    answer:
      "AirHunt is an airdrop activity manager that helps you discover, track, and complete airdrop tasks across multiple chains and protocols.",
  },
  {
    question: "How does the sybil risk score work?",
    answer:
      "Our algorithm analyzes your wallet activity patterns, transaction diversity, and on-chain behavior to estimate how likely your wallet is to be flagged as sybil. Higher scores mean lower risk.",
  },
  {
    question: "Is my wallet data secure?",
    answer:
      "We only read public on-chain data. We never ask for or store your private keys. All connections are read-only.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel anytime. Your subscription will remain active until the end of the billing period.",
  },
  {
    question: "Which chains are supported?",
    answer:
      "We support Ethereum, Arbitrum, Optimism, Base, zkSync, Starknet, Scroll, Linea, and more. New chains are added regularly.",
  },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">AirHunt</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#how-it-works" className="text-sm text-muted hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#faq" className="text-sm text-muted hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[128px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            <span className="text-primary">AirHunt</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-muted max-w-2xl mx-auto">
            Never miss a drop.
          </p>
          <p className="mt-4 text-base text-muted max-w-xl mx-auto">
            Track airdrops, manage tasks, monitor sybil risk, and optimize your
            portfolio -- all in one app.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-light transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://discord.gg/airhunt"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-light transition-colors"
            >
              Join Discord
            </a>
          </div>

          {/* App Store Badges */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-6 py-3 hover:bg-surface-light transition-colors"
            >
              <svg className="w-8 h-8 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-muted">Download on the</div>
                <div className="text-sm font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-6 py-3 hover:bg-surface-light transition-colors"
            >
              <svg className="w-8 h-8 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-3.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-muted">Get it on</div>
                <div className="text-sm font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* Screenshot Mockup */}
          <div className="mt-16 mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-primary/5">
              <div className="rounded-lg bg-background aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 text-primary font-bold">AirHunt</div>
                  <p className="text-muted text-sm">App screenshot coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to hunt airdrops
            </h2>
            <p className="mt-4 text-muted max-w-2xl mx-auto">
              A complete toolkit for discovering, tracking, and completing
              airdrop tasks across the entire crypto ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-8 hover:border-primary/50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-8 flex flex-col ${
                  tier.highlighted
                    ? "border-primary bg-surface shadow-lg shadow-primary/10 scale-105"
                    : "border-border bg-surface"
                }`}
              >
                {tier.highlighted && (
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{tier.description}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg
                        className="w-5 h-5 text-primary shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors ${
                    tier.highlighted
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "border border-border text-foreground hover:bg-surface-light"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-muted max-w-2xl mx-auto">
              Get started in minutes. Four simple steps to airdrop mastery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-surface/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <span className="text-lg font-bold text-primary">AirHunt</span>
              <p className="mt-2 text-sm text-muted">
                The ultimate airdrop activity manager.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="https://discord.gg/airhunt" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="https://x.com/mochi_d3fi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter/X</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted text-center">
              DYOR: AirHunt is an informational tool. We do not guarantee airdrop
              eligibility, token values, or outcomes. Always do your own research
              before interacting with any protocol. Not financial advice.
            </p>
            <p className="mt-4 text-xs text-muted text-center">
              &copy; {new Date().getFullYear()} AirHunt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
