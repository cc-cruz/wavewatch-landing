import { CalendarClock, Phone, Settings2, Waves } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Phone,
    title: "Connect your number",
    description: "Choose the phone that receives daily briefings and alerts.",
  },
  {
    icon: Waves,
    title: "Save your water",
    description: "Add your home break, harbor, fishing zone, or dive spot.",
  },
  {
    icon: CalendarClock,
    title: "Pick text rituals",
    description: "Set the dawn brief, weekend lookahead, and hazard watches.",
  },
  {
    icon: Settings2,
    title: "Tune the judgment",
    description: "Set risk tolerance, quiet hours, and message length.",
  },
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Onboarding
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Set up the ocean number around your water.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Checkout is done. The next product pass turns these setup cards into
            saved profile, spot, ritual, and phone flows.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="border border-border bg-card p-5">
                <div className="mb-4 flex size-10 items-center justify-center border border-border bg-background">
                  <Icon className="size-5 text-sky-300" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-medium">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/app">Open WaveWatch</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/settings">Manage account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
