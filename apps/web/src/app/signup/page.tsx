"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const plans = [
  { id: "free", name: "Free", price: "$0/forever" },
  { id: "pro", name: "Pro", price: "$19/month" },
  { id: "unlimited", name: "Unlimited", price: "$49/month" },
];

function SignupForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "free";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Supabase auth integration
    // const { data, error } = await supabase.auth.signUp({ email, password })

    // TODO: For paid plans, redirect to Stripe checkout
    // if (selectedPlan !== "free") {
    //   const checkoutUrl = await createCheckoutSession(selectedPlan)
    //   window.location.href = checkoutUrl
    // }

    // Placeholder: just log for now
    // eslint-disable-next-line no-console
    console.log("Signup:", { email, selectedPlan });
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Select plan
        </label>
        <div className="grid grid-cols-3 gap-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-semibold">{plan.name}</div>
              <div className="text-xs text-muted mt-1">{plan.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-xs text-muted text-center">
        By signing up, you agree to our{" "}
        <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              AirHunt
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-muted">
              Start tracking airdrops in minutes.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-8">
            <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
