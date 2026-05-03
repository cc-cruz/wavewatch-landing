import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Compass,
  MessageSquareText,
  Phone,
  Radio,
  Send,
  Settings2,
  Sparkles,
  Waves,
} from "lucide-react";
import { UserButton } from "@neondatabase/auth/react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDefaultMarineRegion } from "@/lib/marine-regions";
import { cn } from "@/lib/utils";

const callDetails = [
  {
    label: "Best window",
    value: "5:55-8:20 AM",
    detail: "Clean before the tide bottoms out.",
  },
  {
    label: "Primary risk",
    value: "Fast tide drop",
    detail: "Expect the inside to get messy after 8:30.",
  },
  {
    label: "Confidence",
    value: "High enough",
    detail: "Wind and period agree. Tide is the swing factor.",
  },
];

const rituals = [
  {
    title: "Dawn patrol text",
    time: "5:35 AM daily",
    mode: "Only if there is a real window",
    status: "Ready",
  },
  {
    title: "Weekend lookahead",
    time: "Thursday at 6:00 PM",
    mode: "Surf, fishing, and harbor calls",
    status: "Draft",
  },
  {
    title: "Hazard watch",
    time: "Anytime",
    mode: "Big swell, bar, wind, and lightning alerts",
    status: "On",
  },
];

const memory = [
  "You prefer clean wind over size.",
  "Do not text for marginal dawn windows.",
  "Fishing calls should mention return-window risk first.",
  "Keep weekdays concise unless there is a hazard.",
];

const onboardingSteps = [
  {
    icon: Phone,
    title: "Connect your number",
    detail: "The briefing relationship starts in text.",
    state: "Next",
  },
  {
    icon: Waves,
    title: "Save your water",
    detail: "Home break, harbor, fishing ground, or dive zone.",
    state: "Seeded",
  },
  {
    icon: CalendarClock,
    title: "Pick rituals",
    detail: "Dawn brief, weekend lookahead, and hazard watch.",
    state: "Draft",
  },
  {
    icon: Settings2,
    title: "Tune your taste",
    detail: "Risk tolerance, message length, and quiet hours.",
    state: "Draft",
  },
];

function AppSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card", className)}>
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ConsumerAppShell() {
  const region = getDefaultMarineRegion();
  const primarySpots = [
    region.spots.surf,
    region.spots.fishing,
    region.spots.diving,
    region.spots.boating,
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/wavewatch-logo-light.png"
              alt="WaveWatch"
              width={34}
              height={34}
              className="h-9 w-auto"
              priority
            />
            <div>
              <p className="text-sm font-semibold tracking-tight">WaveWatch</p>
              <p className="text-[11px] text-muted-foreground">
                Elite ocean briefings
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/settings">Account</Link>
            </Button>
            <Button size="sm">
              Text me now
              <Send className="size-4" />
            </Button>
            <UserButton size="icon" />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-black hover:bg-emerald-500">
                  Go
                </Badge>
                <Badge variant="outline" className="border-sky-500/60 text-sky-300">
                  {region.label}
                </Badge>
                <Badge variant="outline" className="border-amber-500/60 text-amber-300">
                  Dawn brief
                </Badge>
              </div>

              <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Today's call
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                There is a real morning window. Go early and do not chase it late.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                WaveWatch would text this as a decisive surf-first call: clean
                wind, enough period to matter, and a tide window that closes
                fast. The expert judgment stays built in. You tune when and how
                it reaches you.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button>
                  Text this briefing
                  <Phone className="size-4" />
                </Button>
                <Button variant="outline">
                  Ask a follow-up
                  <MessageSquareText className="size-4" />
                </Button>
              </div>
            </div>

            <div className="border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Next text
              </p>
              <p className="mt-2 text-2xl font-semibold">Tomorrow 5:35 AM</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Only sends if the call is materially useful. Quiet hours stay
                respected unless there is a safety-class alert.
              </p>
              <div className="mt-6 space-y-3">
                {callDetails.map((item) => (
                  <div key={item.label} className="border-t border-border pt-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 font-medium">{item.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AppSection
          eyebrow="Setup"
          title="Teach WaveWatch your water life"
          description="The user configures the relationship. WaveWatch keeps the marine judgment expert out of the box."
        >
          <div className="divide-y divide-border">
            {onboardingSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="flex gap-4 px-5 py-4">
                  <div className="mt-1 flex size-9 shrink-0 items-center justify-center border border-border bg-background">
                    <Icon className="size-4 text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{step.title}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {step.state}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AppSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppSection
            eyebrow="My water"
            title="Saved spots"
            description="Seeded from the current regional model. Later this becomes the user's persisted profile."
          >
            <div className="divide-y divide-border">
              {primarySpots.map((spot) => (
                <div
                  key={`${spot.activity}-${spot.label}`}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{spot.label}</p>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      {spot.activity}
                    </p>
                  </div>
                  <Compass className="size-4 text-emerald-300" />
                </div>
              ))}
            </div>
          </AppSection>

          <AppSection
            eyebrow="Text rituals"
            title="How WaveWatch reaches you"
            description="User-facing automations should feel like ocean habits, not scheduled jobs."
          >
            <div className="divide-y divide-border">
              {rituals.map((ritual) => (
                <div key={ritual.title} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ritual.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ritual.time}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        ritual.status === "On" &&
                          "border-emerald-500/60 text-emerald-300",
                        ritual.status === "Ready" &&
                          "border-sky-500/60 text-sky-300",
                      )}
                    >
                      {ritual.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {ritual.mode}
                  </p>
                </div>
              ))}
            </div>
          </AppSection>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppSection
            eyebrow="Ask"
            title="Same brain as the number"
            description="The app should support follow-ups, but text remains the core product loop."
          >
            <div className="space-y-4 px-5 py-5">
              <div className="border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-amber-300" />
                  WaveWatch
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Ask about a plan, not a metric. Example: "Is Ocean Beach
                  worth it before work tomorrow if I only have an hour?"
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  aria-label="Ask WaveWatch"
                  placeholder="Ask about a spot, window, or trip..."
                  className="h-10"
                />
                <Button aria-label="Send question" size="icon">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </AppSection>

          <AppSection
            eyebrow="Memory"
            title="What WaveWatch knows"
            description="This is where the relationship becomes better than a static forecast app."
          >
            <div className="divide-y divide-border">
              {memory.map((item) => (
                <div key={item} className="flex gap-3 px-5 py-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </AppSection>
        </div>

        <section className="border border-border bg-muted/20 lg:col-span-2">
          <div className="grid gap-0 md:grid-cols-3">
            <div className="border-b border-border p-5 md:border-b-0 md:border-r">
              <Radio className="size-5 text-sky-300" />
              <p className="mt-4 font-medium">Expert by default</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The user does not build the forecaster. They calibrate the
                delivery around their spots and habits.
              </p>
            </div>
            <div className="border-b border-border p-5 md:border-b-0 md:border-r">
              <Bell className="size-5 text-amber-300" />
              <p className="mt-4 font-medium">Proactive when useful</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Text rituals should suppress noise and surface only meaningful
                water decisions.
              </p>
            </div>
            <div className="p-5">
              <AlertTriangle className="size-5 text-rose-300" />
              <p className="mt-4 font-medium">Serious when it matters</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hazard language, confidence, and what-breaks-the-call stay
                visible in every important briefing.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
