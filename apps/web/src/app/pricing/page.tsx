import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - AirHunt",
  description: "Simple, transparent pricing for every airdrop hunter.",
};

const tiers = [
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
    limits: {
      airdrops: "5",
      wallets: "1",
      sybilScore: false,
      portfolioDashboard: false,
      priorityNotifications: false,
      apiAccess: false,
      customAlerts: false,
      earlyAccess: false,
    },
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
    limits: {
      airdrops: "Unlimited",
      wallets: "10",
      sybilScore: true,
      portfolioDashboard: true,
      priorityNotifications: true,
      apiAccess: false,
      customAlerts: false,
      earlyAccess: false,
    },
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
    limits: {
      airdrops: "Unlimited",
      wallets: "Unlimited",
      sybilScore: true,
      portfolioDashboard: true,
      priorityNotifications: true,
      apiAccess: true,
      customAlerts: true,
      earlyAccess: true,
    },
    cta: "Go Unlimited",
    href: "/signup?plan=unlimited",
    highlighted: false,
  },
];

const comparisonFeatures = [
  { name: "Airdrop tracking", key: "airdrops" as const },
  { name: "Wallet connections", key: "wallets" as const },
  { name: "Sybil risk score", key: "sybilScore" as const },
  { name: "Portfolio dashboard", key: "portfolioDashboard" as const },
  { name: "Priority notifications", key: "priorityNotifications" as const },
  { name: "API access", key: "apiAccess" as const },
  { name: "Custom alerts", key: "customAlerts" as const },
  { name: "Early access to features", key: "earlyAccess" as const },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <main className="flex-1">
      {/* Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              AirHunt
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
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
                <h2 className="text-xl font-semibold">{tier.name}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{tier.description}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckIcon />
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

      {/* Feature Comparison Table */}
      <section className="py-20 sm:py-28 bg-surface/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Feature comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-4 text-left text-sm font-semibold">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.name} className="py-4 px-4 text-center text-sm font-semibold">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.key} className="border-b border-border">
                    <td className="py-4 px-4 text-sm">{feature.name}</td>
                    {tiers.map((tier) => {
                      const value = tier.limits[feature.key];
                      return (
                        <td key={tier.name} className="py-4 px-4 text-center">
                          {typeof value === "string" ? (
                            <span className="text-sm">{value}</span>
                          ) : value ? (
                            <span className="inline-flex justify-center"><CheckIcon /></span>
                          ) : (
                            <span className="inline-flex justify-center"><XIcon /></span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted text-center">
            DYOR: AirHunt is an informational tool. Not financial advice.
          </p>
          <p className="mt-2 text-xs text-muted text-center">
            &copy; {new Date().getFullYear()} AirHunt. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
