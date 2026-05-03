import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PricingSection } from "@/components/pricing-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing | WaveWatch",
  description:
    "WaveWatch pricing for personal ocean briefings, serious marine users, and operator-grade water decisions.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Pricing
              </p>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance md:text-5xl">
                Configure the ocean number around how often you actually use it.
              </h1>
              <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
                Start with a personal text ritual. Upgrade when WaveWatch is
                watching more water, answering more follow-ups, and carrying
                more of your planning loop.
              </p>
              <div className="flex flex-wrap gap-3">
                <form action="/api/billing/checkout" method="post">
                  <input type="hidden" name="planKey" value="pro" />
                  <input type="hidden" name="cadence" value="monthly" />
                  <Button type="submit" size="lg">
                    Start with Pro
                  </Button>
                </form>
                <Button asChild variant="outline" size="lg">
                  <Link href="/app">Open the app</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />

        <section className="border-b border-border bg-muted/20">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Stage 0
                </p>
                <h2 className="mb-3 text-xl font-semibold">Founder launch</h2>
                <p className="text-sm text-muted-foreground">
                  Offer a simple annual founder pass while the product loop is
                  being tuned. Keep the buyer decision easy and gather real
                  usage data before over-optimizing packaging.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Stage 1
                </p>
                <h2 className="mb-3 text-xl font-semibold">Core and Pro</h2>
                <p className="text-sm text-muted-foreground">
                  Public self-serve launch with $15 Core and $50 Pro. Checkout,
                  onboarding, and entitlement gates should all read from the
                  same plan keys.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Stage 2
                </p>
                <h2 className="mb-3 text-xl font-semibold">Operator</h2>
                <p className="text-sm text-muted-foreground">
                  Add $99 Operator when there is enough delivery and usage
                  evidence to support guide, charter, and crew workflows without
                  custom quoting every account.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
