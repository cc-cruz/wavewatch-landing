"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Prompt chip component
function PromptChip({
  text,
  onClick,
  isActive,
}: {
  text: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm text-left border transition-colors ${
        isActive
          ? "bg-foreground text-background border-foreground"
          : "bg-card border-border hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {text}
    </button>
  );
}

type MarineResponse = {
  summary: string;
  window: string;
  risk: string;
  why: string;
  confidence: string;
};

const examplePrompts = [
  "Is Ocean Beach good at first light tomorrow?",
  "Can I run a small boat out of Bodega at 6am?",
  "Will north wind kill viz this afternoon?",
  "Best spearfishing window this weekend?",
];

const loadingMessages = [
  "Processing",
  "asking the buoys what changed",
  "reading the swell picture",
  "comparing tide windows",
  "looking for the clean hour",
  "checking when the wind turns",
  "checking bar conditions",
  "looking for the fishable gap",
  "building the go/no-go call",
];

function buildFallbackResponse(summary: string, why = "Pickaxe API request failed."): MarineResponse {
  return {
    summary,
    window: "Unavailable",
    risk: "Unavailable",
    why,
    confidence: "Unknown",
  };
}

// Demo interface component
function DemoInterface() {
  const userIdRef = useRef(`wavewatch-demo-${Math.random().toString(36).slice(2)}`);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [response, setResponse] = useState<MarineResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setLoadingText("");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const tick = () => {
      const currentMessage = loadingMessages[messageIndex];

      if (isDeleting) {
        charIndex -= 1;
        setLoadingText(currentMessage.slice(0, Math.max(0, charIndex)));

        if (charIndex <= 0) {
          isDeleting = false;
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          timeoutId = setTimeout(tick, 120);
          return;
        }

        timeoutId = setTimeout(tick, 16);
        return;
      }

      charIndex += 1;
      setLoadingText(currentMessage.slice(0, charIndex));

      if (charIndex >= currentMessage.length) {
        isDeleting = true;
        timeoutId = setTimeout(tick, messageIndex === 0 ? 450 : 900);
        return;
      }

      timeoutId = setTimeout(tick, 32);
    };

    tick();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isTyping]);

  const handlePromptClick = async (prompt: string) => {
    const requestId = ++requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSelectedPrompt(prompt);
    setResponse(null);
    setIsTyping(true);
    try {
      const apiResponse = await fetch("/api/pickaxe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          userId: userIdRef.current,
        }),
        signal: controller.signal,
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data?.error || "Pickaxe request failed.");
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResponse(data.structured);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setResponse(
        buildFallbackResponse(
          "The live preview is temporarily unavailable.",
          error instanceof Error ? error.message : "Pickaxe request failed.",
        ),
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="border border-border bg-card">
      {/* Terminal header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Marine Query Interface</span>
        </div>
        <span className="text-xs text-muted-foreground">v0.9.2</span>
      </div>

      {/* Prompt chips */}
      <div className="p-4 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Example queries</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <PromptChip
              key={prompt}
              text={prompt}
              onClick={() => handlePromptClick(prompt)}
              isActive={selectedPrompt === prompt}
            />
          ))}
        </div>
      </div>

      {/* Response area */}
      <div className="p-4 min-h-[200px]">
        {!selectedPrompt && (
          <p className="text-muted-foreground text-sm">Select a query above to see response format</p>
        )}

        {selectedPrompt && !response && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Query</p>
              <p className="text-foreground">{selectedPrompt}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{loadingText}</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        )}

        {isTyping && !selectedPrompt && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{loadingText}</span>
            <span className="animate-pulse">_</span>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Query</p>
              <p className="text-foreground">{selectedPrompt}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                <p className="text-sm text-foreground">{response.summary}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Window</p>
                <p className="text-sm text-foreground font-medium">{response.window}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Primary Risk</p>
                <p className="text-sm text-foreground">{response.risk}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why</p>
                <p className="text-sm text-foreground">{response.why}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-sm text-foreground">{response.confidence}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Use case card
function UseCaseCard({ title, query, description }: { title: string; query: string; description: string }) {
  return (
    <div className="border border-border p-6 bg-card hover:bg-accent/50 transition-colors">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <p className="text-foreground font-medium mb-3">&quot;{query}&quot;</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Feature block
function FeatureBlock({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs text-muted-foreground font-medium">{number}</span>
      <div>
        <h4 className="text-foreground font-medium mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Grid background pattern
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// Animated wave lines for hero
function WaveLines() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-10">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
        <path
          d="M0,60 C150,90 350,30 600,60 C850,90 1050,30 1200,60 L1200,120 L0,120 Z"
          fill="currentColor"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-border">
          <GridPattern />
          <WaveLines />
          <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Marine Intelligence Platform</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
                Ask the ocean a question.
                <br />
                <span className="text-muted-foreground">Get a real answer.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl text-pretty">
                WaveWatch turns swell, wind, tide, weather, and local context into actionable
                guidance for surfers, fishermen, divers, sailors, and coastal operators.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="px-6">
                  Try it live
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  Deploy for your team
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Interface Preview</p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">What you can ask</h2>
            {mounted && <DemoInterface />}
          </div>
        </section>

        {/* Problem Section */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-2xl mb-12">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">The Problem</p>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Marine forecasting is fragmented.</h2>
              <p className="text-muted-foreground">
                People planning around the water are forced to bounce between charts, buoy feeds, tide tables, weather
                models, cams, and gut feel—then translate all of it into a call.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-border p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">01</p>
                <h3 className="text-foreground font-medium mb-2">Too many sources</h3>
                <p className="text-sm text-muted-foreground">
                  Forecasts live across too many tools. Surfline. NOAA. Windy. Buoys. Tide charts. Cams. WhatsApp threads.
                </p>
              </div>
              <div className="border border-border p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">02</p>
                <h3 className="text-foreground font-medium mb-2">Too much interpretation</h3>
                <p className="text-sm text-muted-foreground">
                  Raw conditions don&apos;t tell you whether it&apos;s actually worth going. You still have to do the
                  math.
                </p>
              </div>
              <div className="border border-border p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">03</p>
                <h3 className="text-foreground font-medium mb-2">Too little context</h3>
                <p className="text-sm text-muted-foreground">
                  Surfable, fishable, divable, or safe depends on the activity, spot, timing, and user. Charts
                  don&apos;t know any of that.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">The Solution</p>
                <h2 className="text-2xl md:text-3xl font-semibold mb-4">One interface. Real marine context.</h2>
                <p className="text-muted-foreground mb-8">
                  Ask in plain language. Get answers shaped around the activity, the window, and the conditions that
                  actually matter.
                </p>
              </div>

              <div className="space-y-6">
                <FeatureBlock
                  number="01"
                  title="Ask naturally"
                  description="Query conditions in everyday language instead of decoding charts and cross-referencing data."
                />
                <FeatureBlock
                  number="02"
                  title="Cross-signal reasoning"
                  description="Swell, period, wind, tide, weather, and spot context synthesized together."
                />
                <FeatureBlock
                  number="03"
                  title="Activity-aware answers"
                  description="Surfing, fishing, diving, boating, sailing—responses adapt to what you&apos;re actually trying to do."
                />
                <FeatureBlock
                  number="04"
                  title="Window-based recommendations"
                  description="Not just conditions—timing, tradeoffs, and confidence levels."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Use Cases</p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">Built for people who make decisions on the water.</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <UseCaseCard
                title="Surfers"
                query="Is there a clean dawn patrol window before the wind turns?"
                description="Get swell direction, period, tide, and wind windows synthesized into a simple call."
              />
              <UseCaseCard
                title="Fishermen"
                query="Can I get out safely, and is this actually worth burning fuel for?"
                description="Bar conditions, offshore forecast, and return window calculated together."
              />
              <UseCaseCard
                title="Divers / Spearos"
                query="When will viz, current, and swell line up enough to dive?"
                description="Visibility, surge, and current risk factored against your target window."
              />
              <UseCaseCard
                title="Sailors / Boaters"
                query="What&apos;s the cleanest transit window, and what deteriorates first?"
                description="Passage planning with wind shifts, swell changes, and weather windows."
              />
              <UseCaseCard
                title="Guides / Charters"
                query="Is tomorrow&apos;s trip viable, or do I need to reschedule clients?"
                description="Decision support for client-facing operations with safety margins built in."
              />
              <UseCaseCard
                title="Coastal Teams"
                query="Standardize marine intel for staff, clients, and operations."
                description="Shared workflows and consistent condition interpretation across your crew."
              />
            </div>
          </div>
        </section>

        {/* Differentiation Section */}
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Why It&apos;s Different</p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-12">More than a forecast app.</h2>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <p className="text-foreground font-medium mb-1">It doesn&apos;t just show conditions</p>
                <p className="text-sm text-muted-foreground">It interprets them—fast.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">It doesn&apos;t just answer generally</p>
                <p className="text-sm text-muted-foreground">It answers in context of your activity.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">It doesn&apos;t just serve individuals</p>
                <p className="text-sm text-muted-foreground">It can be deployed for crews, operators, and guides.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">It doesn&apos;t just expose raw models</p>
                <p className="text-sm text-muted-foreground">It creates decision support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Section */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">For Teams</p>
                <h2 className="text-2xl md:text-3xl font-semibold mb-4">Deployable for specialized operations.</h2>
                <p className="text-muted-foreground mb-6">
                  Need a marine intelligence layer tuned to your coastline, fleet, customer base, or operating model? This
                  system can be configured around custom geographies, data sources, response logic, and workflows.
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by a forward-deployed OpenClaw runtime for domain-specific reasoning and configurable
                  deployment.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-border p-4 flex items-start gap-3">
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm text-foreground">Regional deployments tuned to local conditions</p>
                </div>
                <div className="border border-border p-4 flex items-start gap-3">
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm text-foreground">Custom prompt and policy layer</p>
                </div>
                <div className="border border-border p-4 flex items-start gap-3">
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm text-foreground">Proprietary knowledge integration</p>
                </div>
                <div className="border border-border p-4 flex items-start gap-3">
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm text-foreground">Private operational environments</p>
                </div>
                <div className="border border-border p-4 flex items-start gap-3">
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm text-foreground">Team usage and shared workflows</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-2xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Philosophy</p>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Built for informed decisions, not blind trust.</h2>
              <p className="text-muted-foreground mb-6">
                The platform is designed to help interpret marine conditions faster and more clearly. It should support
                judgment—not replace seamanship, local knowledge, or safety procedures.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="border border-border px-3 py-1">Forecast confidence indicators</span>
                <span className="border border-border px-3 py-1">Source transparency</span>
                <span className="border border-border px-3 py-1">Uncertainty acknowledgement</span>
                <span className="border border-border px-3 py-1">Local variability disclaimers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative">
          <GridPattern />
          <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-balance">
                Spend less time decoding forecasts.
                <br />
                <span className="text-muted-foreground">More time making the call.</span>
              </h2>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button size="lg" className="px-6">
                  Try the live demo
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  Talk to us about deployment
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
